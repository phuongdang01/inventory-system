const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const importRoutes = require('./routes/imports');
const exportRoutes = require('./routes/exports');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const alertRoutes = require('./routes/alerts');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date()
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy route' 
    });
});

// Start server
const startServer = async () => {
    try {
        // Initialize database
        await initDatabase();
        console.log('Database initialized successfully');
        
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    const { closeConnection } = require('./config/database');
    await closeConnection();
    process.exit(0);
});
