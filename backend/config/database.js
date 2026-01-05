const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', 'inventory.db');
let db = null;
let SQL = null;

const getConnection = async () => {
    if (!db) {
        SQL = await initSqlJs();
        
        // Tải database nếu đã tồn tại
        if (fs.existsSync(dbPath)) {
            const buffer = fs.readFileSync(dbPath);
            db = new SQL.Database(buffer);
            console.log('✅ Database loaded successfully!');
        } else {
            db = new SQL.Database();
            console.log('✅ Database created, initializing schema...');
            
            // Load schema
            const schemaPath = path.join(__dirname, '..', '..', 'database', 'sqlite-schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                db.run(schema);
                console.log('✅ Schema initialized!');
            }
            
            saveDatabase();
            console.log('✅ Database saved!');
        }
    }
    return db;
};

const saveDatabase = () => {
    if (db) {
        try {
            const data = db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(dbPath, buffer);
        } catch (err) {
            console.error('Failed to save database:', err);
        }
    }
};

// Initialize database - just calls getConnection
const initDatabase = async () => {
    await getConnection();
};

const closeConnection = () => {
    if (db) {
        saveDatabase();
        db.close();
        db = null;
    }
};

// Helper để chạy query SELECT và trả về array objects
const executeQuery = async (sql, params = []) => {
    const database = await getConnection();
    try {
        const stmt = database.prepare(sql);
        stmt.bind(params);
        
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    } catch (error) {
        console.error('Query Error:', error);
        throw error;
    }
};

// Helper để chạy INSERT, UPDATE, DELETE
const runQuery = async (sql, params = []) => {
    const database = await getConnection();
    try {
        database.run(sql, params);
        saveDatabase(); // Lưu file ngay sau khi thay đổi
        return true;
    } catch (error) {
        console.error('Run Error:', error);
        throw error;
    }
};

module.exports = {
    getConnection,
    saveDatabase,
    closeConnection,
    initDatabase,
    executeQuery,
    runQuery
};
