const express = require('express');
const router = express.Router();
const { executeQuery, runQuery } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Lấy danh sách cảnh báo chưa xử lý
router.get('/', authMiddleware, async (req, res) => {
    try {
        const sql = `
            SELECT 
                sa.*,
                p.ProductCode,
                p.ProductName,
                w.WarehouseName
            FROM StockAlerts sa
            JOIN Products p ON sa.ProductID = p.ProductID
            JOIN Warehouses w ON sa.WarehouseID = w.WarehouseID
            WHERE sa.IsResolved = 0
            ORDER BY sa.CreatedAt DESC
        `;
        const alerts = await executeQuery(sql);
        res.json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Đánh dấu đã xử lý
router.put('/:id/resolve', authMiddleware, async (req, res) => {
    try {
        await runQuery(`
            UPDATE StockAlerts 
            SET IsResolved = 1, ResolvedAt = CURRENT_TIMESTAMP, ResolvedBy = ? 
            WHERE AlertID = ?
        `, [req.user.userId, req.params.id]);
        
        res.json({ success: true, message: 'Đã xử lý cảnh báo' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
