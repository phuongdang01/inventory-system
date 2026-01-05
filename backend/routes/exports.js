const express = require('express');
const router = express.Router();
const { executeQuery, runQuery, getConnection, saveDatabase } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Lấy danh sách phiếu xuất
router.get('/', authMiddleware, async (req, res) => {
    try {
        const sql = `
            SELECT 
                eo.*,
                w.WarehouseName,
                c.CustomerName,
                u.FullName as CreatorName
            FROM ExportOrders eo
            JOIN Warehouses w ON eo.WarehouseID = w.WarehouseID
            JOIN Customers c ON eo.CustomerID = c.CustomerID
            JOIN Users u ON eo.CreatedBy = u.UserID
            ORDER BY eo.ExportDate DESC
        `;
        const orders = await executeQuery(sql);
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Lấy chi tiết phiếu xuất
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const sql = `
            SELECT 
                eo.*,
                w.WarehouseName,
                c.CustomerName,
                u.FullName as CreatorName
            FROM ExportOrders eo
            JOIN Warehouses w ON eo.WarehouseID = w.WarehouseID
            JOIN Customers c ON eo.CustomerID = c.CustomerID
            JOIN Users u ON eo.CreatedBy = u.UserID
            WHERE eo.ExportOrderID = ?
        `;
        const orders = await executeQuery(sql, [req.params.id]);
        
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu xuất' });
        }
        
        const order = orders[0];
        
        const detailsSql = `
            SELECT 
                eod.*,
                p.ProductCode,
                p.ProductName,
                p.Unit
            FROM ExportOrderDetails eod
            JOIN Products p ON eod.ProductID = p.ProductID
            WHERE eod.ExportOrderID = ?
        `;
        order.Details = await executeQuery(detailsSql, [req.params.id]);
        
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tạo phiếu xuất mới
router.post('/', authMiddleware, async (req, res) => {
    const db = await getConnection();
    try {
        const { WarehouseID, CustomerID, ExportDate, Notes, Details } = req.body;
        const CreatedBy = req.user.userId;
        
        // Check stock first
        for (const item of Details) {
            const stockRes = db.exec(`SELECT Quantity FROM Inventory WHERE ProductID = ${item.ProductID} AND WarehouseID = ${WarehouseID}`);
            const currentStock = (stockRes[0]?.values[0]?.[0]) || 0;
            
            if (currentStock < item.Quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Sản phẩm ID ${item.ProductID} không đủ tồn kho (Hiện có: ${currentStock}, Cần: ${item.Quantity})` 
                });
            }
        }

        // Calculate total amount
        const TotalAmount = Details.reduce((sum, item) => sum + (item.Quantity * item.UnitPrice), 0);
        
        // Auto generate ExportOrderCode
        const lastOrderRes = db.exec("SELECT ExportOrderCode FROM ExportOrders ORDER BY ExportOrderID DESC LIMIT 1");
        let ExportOrderCode = 'PX001';
        
        if (lastOrderRes.length > 0 && lastOrderRes[0].values.length > 0) {
            const lastCode = lastOrderRes[0].values[0][0];
            const numberPart = parseInt(lastCode.replace('PX', ''));
            if (!isNaN(numberPart)) {
                ExportOrderCode = `PX${String(numberPart + 1).padStart(3, '0')}`;
            }
        }

        // Insert Order
        db.run(`
            INSERT INTO ExportOrders (ExportOrderCode, WarehouseID, CustomerID, ExportDate, TotalAmount, Notes, CreatedBy, Status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
        `, [ExportOrderCode, WarehouseID, CustomerID, ExportDate, TotalAmount, Notes || null, CreatedBy]);
        
        // Get ID
        const result = db.exec('SELECT last_insert_rowid() as id');
        const ExportOrderID = result[0].values[0][0];

        // Insert Details ONLY (No Inventory Update yet)
        const insertDetailStmt = db.prepare(`
            INSERT INTO ExportOrderDetails (ExportOrderID, ProductID, Quantity, UnitPrice)
            VALUES (?, ?, ?, ?)
        `);
        
        for (const item of Details) {
            // Insert Detail
            insertDetailStmt.run([ExportOrderID, item.ProductID, item.Quantity, item.UnitPrice]);
        }

        insertDetailStmt.free();

        saveDatabase(); // Save all changes
        
        res.status(201).json({ success: true, message: 'Tạo phiếu xuất thành công (Chờ duyệt)', ExportOrderID });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Duyệt phiếu xuất (Manager/Admin)
router.put('/:id/approve', authMiddleware, async (req, res) => {
    if (!['Admin', 'Manager'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Không có quyền duyệt phiếu' });
    }

    try {
        await runQuery('UPDATE ExportOrders SET Status = "Approved", ApprovedBy = ? WHERE ExportOrderID = ? AND Status = "Pending"', [req.user.userId, req.params.id]);
        res.json({ success: true, message: 'Đã duyệt phiếu xuất' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Hủy phiếu xuất (Manager/Admin)
router.put('/:id/cancel', authMiddleware, async (req, res) => {
    if (!['Admin', 'Manager'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Không có quyền hủy phiếu' });
    }

    try {
        await runQuery('UPDATE ExportOrders SET Status = "Cancelled" WHERE ExportOrderID = ? AND Status = "Pending"', [req.params.id]);
        res.json({ success: true, message: 'Đã hủy phiếu xuất' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Hoàn thành phiếu xuất (Staff/Manager/Admin) - Cập nhật tồn kho
router.put('/:id/complete', authMiddleware, async (req, res) => {
    const db = await getConnection();
    try {
        // Check status
        const orderRes = db.exec('SELECT Status, WarehouseID FROM ExportOrders WHERE ExportOrderID = ?', [req.params.id]);
        if (orderRes.length === 0 || orderRes[0].values.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu xuất' });
        }
        
        const status = orderRes[0].values[0][0];
        const warehouseId = orderRes[0].values[0][1];
        
        if (status !== 'Approved') {
            return res.status(400).json({ success: false, message: 'Phiếu xuất phải được duyệt trước khi hoàn thành' });
        }

        // Get details
        const detailsRes = db.exec('SELECT ProductID, Quantity FROM ExportOrderDetails WHERE ExportOrderID = ?', [req.params.id]);
        if (detailsRes.length === 0) {
            return res.status(400).json({ success: false, message: 'Phiếu xuất không có chi tiết' });
        }

        const details = detailsRes[0].values;

        // Check stock again before completing
        for (const item of details) {
            const productId = item[0];
            const quantity = item[1];
            const stockRes = db.exec(`SELECT Quantity FROM Inventory WHERE ProductID = ${productId} AND WarehouseID = ${warehouseId}`);
            const currentStock = (stockRes[0]?.values[0]?.[0]) || 0;
            
            if (currentStock < quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Sản phẩm ID ${productId} không đủ tồn kho để xuất (Hiện có: ${currentStock}, Cần: ${quantity})` 
                });
            }
        }

        // Update Inventory & History
        const updateInventoryStmt = db.prepare(`
            UPDATE Inventory 
            SET Quantity = Quantity - ?, LastUpdated = CURRENT_TIMESTAMP
            WHERE ProductID = ? AND WarehouseID = ?
        `);

        const insertHistoryStmt = db.prepare(`
            INSERT INTO TransactionHistory (ProductID, WarehouseID, TransactionType, Quantity, ReferenceID, CreatedBy)
            VALUES (?, ?, 'OUT', ?, ?, ?)
        `);

        for (const item of details) {
            const productId = item[0];
            const quantity = item[1];

            // Update Inventory
            updateInventoryStmt.run([quantity, productId, warehouseId]);
            
            // Insert History
            insertHistoryStmt.run([productId, warehouseId, quantity, req.params.id, req.user.userId]);

            // Check for Low Stock Alert
            const newStockRes = db.exec(`SELECT Quantity FROM Inventory WHERE ProductID = ${productId} AND WarehouseID = ${warehouseId}`);
            const newStock = newStockRes[0]?.values[0]?.[0] || 0;
            
            if (newStock <= 10) {
                // Check if alert already exists and is not resolved
                const existingAlert = db.exec(`SELECT AlertID FROM StockAlerts WHERE ProductID = ${productId} AND WarehouseID = ${warehouseId} AND AlertType = 'LowStock' AND IsResolved = 0`);
                
                if (existingAlert.length === 0) {
                    db.run(`
                        INSERT INTO StockAlerts (ProductID, WarehouseID, AlertType, AlertMessage)
                        VALUES (?, ?, 'LowStock', ?)
                    `, [productId, warehouseId, `Sản phẩm sắp hết hàng (Còn: ${newStock})`]);
                }
            }
        }

        updateInventoryStmt.free();
        insertHistoryStmt.free();

        // Update Status
        db.run('UPDATE ExportOrders SET Status = "Completed" WHERE ExportOrderID = ?', [req.params.id]);
        
        saveDatabase();
        
        res.json({ success: true, message: 'Đã hoàn thành xuất kho' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;