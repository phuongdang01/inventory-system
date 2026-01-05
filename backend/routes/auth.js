const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection, saveDatabase } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng nhập đầy đủ thông tin' 
            });
        }

        const db = await getConnection();
        const result = db.exec('SELECT * FROM Users WHERE Username = ? AND IsActive = 1', [username]);

        if (!result[0] || result[0].values.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Tên đăng nhập hoặc mật khẩu không đúng' 
            });
        }

        const columns = result[0].columns;
        const row = result[0].values[0];
        const user = {};
        columns.forEach((col, i) => {
            user[col] = row[i];
        });

        // Trong production, nên hash password
        const isValidPassword = password === user.Password;

        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Tên đăng nhập hoặc mật khẩu không đúng' 
            });
        }

        const token = jwt.sign(
            { 
                userId: user.UserID, 
                username: user.Username, 
                role: user.Role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Update LastLogin
        await db.run('UPDATE Users SET LastLogin = CURRENT_TIMESTAMP WHERE UserID = ?', [user.UserID]);
        saveDatabase();

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                token,
                user: {
                    userId: user.UserID,
                    username: user.Username,
                    fullName: user.FullName,
                    email: user.Email,
                    role: user.Role
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi đăng nhập',
            error: error.message 
        });
    }
});

// Lấy thông tin user hiện tại
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const db = await getConnection();
        const result = db.exec('SELECT UserID, Username, FullName, Email, Phone, Role FROM Users WHERE UserID = ?', [req.user.userId]);

        if (!result[0] || result[0].values.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy người dùng' 
            });
        }

        const columns = result[0].columns;
        const row = result[0].values[0];
        const user = {};
        columns.forEach((col, i) => {
            user[col] = row[i];
        });

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi lấy thông tin người dùng',
            error: error.message 
        });
    }
});

module.exports = router;
