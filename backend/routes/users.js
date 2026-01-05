const express = require('express');
const router = express.Router();
const { executeQuery, runQuery } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Lấy danh sách người dùng
router.get('/', authMiddleware, async (req, res) => {
    try {
        const sql = `
            SELECT UserID, Username, FullName, Email, Phone, Role, IsActive, LastLogin, CreatedAt
            FROM Users
            ORDER BY CreatedAt DESC
        `;
        const users = await executeQuery(sql);
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tạo người dùng mới
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { Username, Password, FullName, Email, Phone, Role } = req.body;
        
        // Check if username exists
        const existing = await executeQuery('SELECT UserID FROM Users WHERE Username = ?', [Username]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
        }

        const sql = `
            INSERT INTO Users (Username, Password, FullName, Email, Phone, Role, IsActive)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `;
        
        // Note: Password should be hashed in production
        await runQuery(sql, [Username, Password, FullName, Email, Phone, Role]);
        
        res.status(201).json({ success: true, message: 'Tạo người dùng thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Cập nhật người dùng
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { FullName, Email, Phone, Role, IsActive, Password } = req.body;
        
        let sql, params;
        if (Password) {
            sql = `
                UPDATE Users 
                SET FullName = ?, Email = ?, Phone = ?, Role = ?, IsActive = ?, Password = ?, UpdatedAt = CURRENT_TIMESTAMP
                WHERE UserID = ?
            `;
            params = [FullName, Email, Phone, Role, IsActive, Password, req.params.id];
        } else {
            sql = `
                UPDATE Users 
                SET FullName = ?, Email = ?, Phone = ?, Role = ?, IsActive = ?, UpdatedAt = CURRENT_TIMESTAMP
                WHERE UserID = ?
            `;
            params = [FullName, Email, Phone, Role, IsActive, req.params.id];
        }
        
        await runQuery(sql, params);
        
        res.json({ success: true, message: 'Cập nhật người dùng thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Xóa người dùng (Soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Prevent deleting self
        if (req.user.userId == req.params.id) {
            return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản đang đăng nhập' });
        }

        // Check if user has related data (e.g. created orders)
        // If so, soft delete. If not, hard delete could be an option, but soft delete is safer.
        
        await runQuery('UPDATE Users SET IsActive = 0 WHERE UserID = ?', [req.params.id]);
        
        res.json({ success: true, message: 'Đã vô hiệu hóa người dùng' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
