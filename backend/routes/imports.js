const express = require('express');
const router = express.Router();
const { executeQuery, runQuery, getConnection, saveDatabase } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Lấy danh sách phiếu nhập
router.get('/', authMiddleware, async (req, res) => {
    try {
        const sql = `
            SELECT 
                io.*,
                w.WarehouseName,
                s.SupplierName,
                u.FullName as CreatorName
            FROM ImportOrders io
            JOIN Warehouses w ON io.WarehouseID = w.WarehouseID
            JOIN Suppliers s ON io.SupplierID = s.SupplierID
            JOIN Users u ON io.CreatedBy = u.UserID
            ORDER BY io.ImportDate DESC
        `;
        const orders = await executeQuery(sql);
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Lấy chi tiết phiếu nhập
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const sql = `
            SELECT 
                io.*,
                w.WarehouseName,
                s.SupplierName,
                u.FullName as CreatorName
            FROM ImportOrders io
            JOIN Warehouses w ON io.WarehouseID = w.WarehouseID
            JOIN Suppliers s ON io.SupplierID = s.SupplierID
            JOIN Users u ON io.CreatedBy = u.UserID
            WHERE io.ImportOrderID = ?
        `;
        const orders = await executeQuery(sql, [req.params.id]);
        
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập' });
        }
        
        const order = orders[0];
        
        const detailsSql = `
            SELECT 
                iod.*,
                p.ProductCode,
                p.ProductName,
                p.Unit
            FROM ImportOrderDetails iod
            JOIN Products p ON iod.ProductID = p.ProductID
            WHERE iod.ImportOrderID = ?
        `;
        order.Details = await executeQuery(detailsSql, [req.params.id]);
        
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tạo phiếu nhập mới
router.post('/', authMiddleware, async (req, res) => {
    const db = await getConnection();
    try {
        const { WarehouseID, SupplierID, ImportDate, Notes, Details } = req.body;
        const CreatedBy = req.user.userId;
        
        // Calculate total amount
        const TotalAmount = Details.reduce((sum, item) => sum + (item.Quantity * item.UnitPrice), 0);
        
        // Auto generate ImportOrderCode
        const lastOrderRes = db.exec("SELECT ImportOrderCode FROM ImportOrders ORDER BY ImportOrderID DESC LIMIT 1");
        let ImportOrderCode = 'PN001';
        
        if (lastOrderRes.length > 0 && lastOrderRes[0].values.length > 0) {
            const lastCode = lastOrderRes[0].values[0][0];
            const numberPart = parseInt(lastCode.replace('PN', ''));
            if (!isNaN(numberPart)) {
                ImportOrderCode = `PN${String(numberPart + 1).padStart(3, '0')}`;
            }
        }

        // Start transaction manually (conceptually)
        // Insert Order
        db.run(`
            INSERT INTO ImportOrders (ImportOrderCode, WarehouseID, SupplierID, ImportDate, TotalAmount, Notes, CreatedBy, Status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
        `, [ImportOrderCode, WarehouseID, SupplierID, ImportDate, TotalAmount, Notes || null, CreatedBy]);
        
        // Get ID
        const result = db.exec('SELECT last_insert_rowid() as id');
        const ImportOrderID = result[0].values[0][0];

        // Insert Details ONLY (No Inventory Update yet)
        const insertDetailStmt = db.prepare(`
            INSERT INTO ImportOrderDetails (ImportOrderID, ProductID, Quantity, UnitPrice)
            VALUES (?, ?, ?, ?)
        `);
        
        for (const item of Details) {
            // Insert Detail
            insertDetailStmt.run([ImportOrderID, item.ProductID, item.Quantity, item.UnitPrice]);
        }

        insertDetailStmt.free();

        saveDatabase(); // Save all changes
        
        res.status(201).json({ success: true, message: 'Tạo phiếu nhập thành công (Chờ duyệt)', ImportOrderID });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Duyệt phiếu nhập (Manager/Admin)
router.put('/:id/approve', authMiddleware, async (req, res) => {
    if (!['Admin', 'Manager'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Không có quyền duyệt phiếu' });
    }

    try {
        await runQuery('UPDATE ImportOrders SET Status = "Approved", ApprovedBy = ? WHERE ImportOrderID = ? AND Status = "Pending"', [req.user.userId, req.params.id]);
        res.json({ success: true, message: 'Đã duyệt phiếu nhập' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Hủy phiếu nhập (Manager/Admin)
router.put('/:id/cancel', authMiddleware, async (req, res) => {
    if (!['Admin', 'Manager'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Không có quyền hủy phiếu' });
    }

    try {
        await runQuery('UPDATE ImportOrders SET Status = "Cancelled" WHERE ImportOrderID = ? AND Status = "Pending"', [req.params.id]);
        res.json({ success: true, message: 'Đã hủy phiếu nhập' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Hoàn thành phiếu nhập (Staff/Manager/Admin) - Cập nhật tồn kho
router.put('/:id/complete', authMiddleware, async (req, res) => {
    const db = await getConnection();
    try {
        // Check status
        const orderRes = db.exec('SELECT Status, WarehouseID FROM ImportOrders WHERE ImportOrderID = ?', [req.params.id]);
        if (orderRes.length === 0 || orderRes[0].values.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập' });
        }
        
        const status = orderRes[0].values[0][0];
        const warehouseId = orderRes[0].values[0][1];
        
        if (status !== 'Approved') {
            return res.status(400).json({ success: false, message: 'Phiếu nhập phải được duyệt trước khi hoàn thành' });
        }

        // Get details
        const detailsRes = db.exec('SELECT ProductID, Quantity FROM ImportOrderDetails WHERE ImportOrderID = ?', [req.params.id]);
        if (detailsRes.length === 0) {
            return res.status(400).json({ success: false, message: 'Phiếu nhập không có chi tiết' });
        }

        const details = detailsRes[0].values;

        // Update Inventory & History
        const updateInventoryStmt = db.prepare(`
            INSERT INTO Inventory (ProductID, WarehouseID, Quantity) 
            VALUES (?, ?, ?)
            ON CONFLICT(ProductID, WarehouseID) 
            DO UPDATE SET Quantity = Quantity + ?, LastUpdated = CURRENT_TIMESTAMP
        `);

        const insertHistoryStmt = db.prepare(`
            INSERT INTO TransactionHistory (ProductID, WarehouseID, TransactionType, Quantity, ReferenceID, CreatedBy)
            VALUES (?, ?, 'IN', ?, ?, ?)
        `);

        for (const item of details) {
            const productId = item[0];
            const quantity = item[1];

            // Update Inventory
            updateInventoryStmt.run([productId, warehouseId, quantity, quantity]);
            
            // Insert History
            insertHistoryStmt.run([productId, warehouseId, quantity, req.params.id, req.user.userId]);
        }

        updateInventoryStmt.free();
        insertHistoryStmt.free();

        // Update Status
        db.run('UPDATE ImportOrders SET Status = "Completed" WHERE ImportOrderID = ?', [req.params.id]);
        
        saveDatabase();
        
        res.json({ success: true, message: 'Đã hoàn thành nhập kho' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;