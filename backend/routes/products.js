const express = require('express');
const router = express.Router();
const { executeQuery, runQuery } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Lấy danh sách sản phẩm
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search, categoryId, isActive } = req.query;
        
        let sql = `
            SELECT 
                p.*,
                c.CategoryName,
                IFNULL((SELECT SUM(Quantity) FROM Inventory WHERE ProductID = p.ProductID), 0) AS TotalStock
            FROM Products p
            LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
            WHERE 1=1
        `;
        
        const params = [];
        
        if (search) {
            sql += ` AND (p.ProductCode LIKE '%' || ? || '%' OR p.ProductName LIKE '%' || ? || '%')`;
            params.push(search, search);
        }

        if (categoryId) {
            sql += ` AND p.CategoryID = ?`;
            params.push(categoryId);
        }

        if (isActive !== undefined) {
            sql += ` AND p.IsActive = ?`;
            params.push(isActive === 'true' ? 1 : 0);
        }

        sql += ' ORDER BY p.ProductName';

        const products = await executeQuery(sql, params);
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Lấy chi tiết sản phẩm
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const sql = `
            SELECT p.*, c.CategoryName
            FROM Products p
            LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
            WHERE p.ProductID = ?
        `;
        const products = await executeQuery(sql, [req.params.id]);
        
        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
        
        const product = products[0];
        
        // Lấy tồn kho chi tiết theo kho
        const inventorySql = `
            SELECT i.*, w.WarehouseName
            FROM Inventory i
            JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
            WHERE i.ProductID = ?
        `;
        product.Inventory = await executeQuery(inventorySql, [req.params.id]);
        
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tạo sản phẩm mới
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { ProductName, CategoryID, Unit, Description, MinStockLevel, MaxStockLevel, ReorderPoint, UnitPrice, Image } = req.body;
        
        // Auto generate ProductCode
        const lastProduct = await executeQuery('SELECT ProductCode FROM Products ORDER BY ProductID DESC LIMIT 1');
        let nextCode = 'SP001';
        
        if (lastProduct.length > 0) {
            const lastCode = lastProduct[0].ProductCode;
            const numberPart = parseInt(lastCode.replace('SP', ''));
            if (!isNaN(numberPart)) {
                nextCode = `SP${String(numberPart + 1).padStart(3, '0')}`;
            }
        }

        const sql = `
            INSERT INTO Products (ProductCode, ProductName, CategoryID, Unit, Description, MinStockLevel, MaxStockLevel, ReorderPoint, UnitPrice, Image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await runQuery(sql, [
            nextCode, 
            ProductName, 
            CategoryID, 
            Unit, 
            Description || null, 
            MinStockLevel || 0, 
            MaxStockLevel || 0, 
            ReorderPoint || 0, 
            UnitPrice || 0, 
            Image || null
        ]);
        
        res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', data: { ProductCode: nextCode } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Cập nhật sản phẩm
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { ProductName, CategoryID, Unit, Description, MinStockLevel, MaxStockLevel, ReorderPoint, UnitPrice, Image, IsActive } = req.body;
        
        const sql = `
            UPDATE Products 
            SET ProductName = ?, CategoryID = ?, Unit = ?, Description = ?, 
                MinStockLevel = ?, MaxStockLevel = ?, ReorderPoint = ?, UnitPrice = ?, 
                Image = ?, IsActive = ?, UpdatedAt = CURRENT_TIMESTAMP
            WHERE ProductID = ?
        `;
        
        await runQuery(sql, [
            ProductName, 
            CategoryID, 
            Unit, 
            Description || null, 
            MinStockLevel || 0, 
            MaxStockLevel || 0, 
            ReorderPoint || 0, 
            UnitPrice || 0, 
            Image || null, 
            IsActive, 
            req.params.id
        ]);
        
        res.json({ success: true, message: 'Cập nhật sản phẩm thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Xóa sản phẩm (Soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Check inventory
        const inventory = await executeQuery('SELECT SUM(Quantity) as Total FROM Inventory WHERE ProductID = ?', [req.params.id]);
        if (inventory[0].Total > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa sản phẩm còn tồn kho' });
        }
        
        // Check transactions
        const transactions = await executeQuery('SELECT COUNT(*) as count FROM TransactionHistory WHERE ProductID = ?', [req.params.id]);
        if (transactions[0].count > 0) {
            // Soft delete
            await runQuery('UPDATE Products SET IsActive = 0 WHERE ProductID = ?', [req.params.id]);
            return res.json({ success: true, message: 'Đã vô hiệu hóa sản phẩm (do có lịch sử giao dịch)' });
        }
        
        // Hard delete if no history
        await runQuery('DELETE FROM Inventory WHERE ProductID = ?', [req.params.id]);
        await runQuery('DELETE FROM Products WHERE ProductID = ?', [req.params.id]);
        
        res.json({ success: true, message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;