const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Thống kê tổng quan dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        // Tổng sản phẩm
        const products = await executeQuery('SELECT COUNT(*) as count FROM Products WHERE IsActive = 1');
        
        // Tổng kho
        const warehouses = await executeQuery('SELECT COUNT(*) as count FROM Warehouses WHERE IsActive = 1');

        // Phiếu nhập chờ
        const pendingImports = await executeQuery("SELECT COUNT(*) as count FROM ImportOrders WHERE Status = 'Pending'");

        // Phiếu xuất chờ
        const pendingExports = await executeQuery("SELECT COUNT(*) as count FROM ExportOrders WHERE Status = 'Pending'");
        
        // Tổng giá trị tồn kho
        const inventoryValue = await executeQuery(`
            SELECT SUM(i.Quantity * p.UnitPrice) as total 
            FROM Inventory i
            JOIN Products p ON i.ProductID = p.ProductID
        `);
        
        // Sản phẩm sắp hết hàng
        const lowStock = await executeQuery(`
            SELECT 
                p.ProductCode,
                p.ProductName,
                w.WarehouseName,
                i.Quantity,
                p.MinStockLevel,
                p.Unit
            FROM Inventory i
            JOIN Products p ON i.ProductID = p.ProductID
            JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
            WHERE i.Quantity <= p.MinStockLevel
            LIMIT 5
        `);

        // Hoạt động gần đây
        const recentActivities = await executeQuery(`
            SELECT 
                CASE 
                    WHEN th.TransactionType = 'IN' THEN 'Import'
                    WHEN th.TransactionType = 'OUT' THEN 'Export'
                    ELSE th.TransactionType 
                END as TransactionType,
                th.TransactionDate,
                p.ProductName,
                w.WarehouseName,
                th.Quantity,
                u.FullName as PerformedBy
            FROM TransactionHistory th
            JOIN Products p ON th.ProductID = p.ProductID
            JOIN Warehouses w ON th.WarehouseID = w.WarehouseID
            JOIN Users u ON th.CreatedBy = u.UserID
            ORDER BY th.TransactionDate DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                stats: {
                    TotalProducts: products[0].count,
                    TotalWarehouses: warehouses[0].count,
                    PendingImports: pendingImports[0].count,
                    PendingExports: pendingExports[0].count
                },
                inventoryValue: {
                    TotalInventoryValue: inventoryValue[0].total || 0
                },
                lowStock: lowStock,
                recentActivities: recentActivities
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Báo cáo tồn kho
router.get('/inventory', authMiddleware, async (req, res) => {
    try {
        const { warehouseId } = req.query;
        
        let sql = `
            SELECT 
                p.ProductCode,
                p.ProductName,
                w.WarehouseName,
                i.Quantity,
                p.Unit,
                p.UnitPrice,
                (i.Quantity * p.UnitPrice) as TotalValue,
                CASE 
                    WHEN i.Quantity <= p.MinStockLevel THEN 'Thấp'
                    WHEN i.Quantity >= p.MaxStockLevel THEN 'Cao'
                    ELSE 'Bình thường'
                END as StockStatus
            FROM Inventory i
            JOIN Products p ON i.ProductID = p.ProductID
            JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
            WHERE 1=1
        `;
        
        const params = [];
        if (warehouseId) {
            sql += ` AND i.WarehouseID = ?`;
            params.push(warehouseId);
        }
        
        sql += ` ORDER BY p.ProductName`;
        
        const report = await executeQuery(sql, params);
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Báo cáo nhập xuất tồn (Movement Report)
router.get('/movement', authMiddleware, async (req, res) => {
    try {
        const { productId, warehouseId, fromDate, toDate } = req.query;
        
        let sql = `
            SELECT 
                th.*,
                p.ProductCode,
                p.ProductName,
                w.WarehouseName,
                u.FullName as CreatorName
            FROM TransactionHistory th
            JOIN Products p ON th.ProductID = p.ProductID
            JOIN Warehouses w ON th.WarehouseID = w.WarehouseID
            JOIN Users u ON th.CreatedBy = u.UserID
            WHERE 1=1
        `;
        
        const params = [];
        
        if (productId) {
            sql += ` AND th.ProductID = ?`;
            params.push(productId);
        }
        
        if (warehouseId) {
            sql += ` AND th.WarehouseID = ?`;
            params.push(warehouseId);
        }
        
        if (fromDate) {
            sql += ` AND th.TransactionDate >= ?`;
            params.push(fromDate);
        }
        
        if (toDate) {
            sql += ` AND th.TransactionDate <= ?`;
            params.push(toDate + ' 23:59:59');
        }
        
        sql += ` ORDER BY th.TransactionDate DESC`;
        
        const report = await executeQuery(sql, params);
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Thống kê (Statistics)
router.get('/statistics', authMiddleware, async (req, res) => {
    try {
        // Top 5 sản phẩm nhập nhiều nhất
        const topImport = await executeQuery(`
            SELECT p.ProductName, SUM(iod.Quantity) as TotalQuantity
            FROM ImportOrderDetails iod
            JOIN Products p ON iod.ProductID = p.ProductID
            GROUP BY p.ProductID
            ORDER BY TotalQuantity DESC
            LIMIT 5
        `);

        // Top 5 sản phẩm xuất nhiều nhất
        const topExport = await executeQuery(`
            SELECT p.ProductName, SUM(eod.Quantity) as TotalQuantity
            FROM ExportOrderDetails eod
            JOIN Products p ON eod.ProductID = p.ProductID
            GROUP BY p.ProductID
            ORDER BY TotalQuantity DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                topImport,
                topExport
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;