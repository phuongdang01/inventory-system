const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config();

// Cấu hình kết nối
const config = {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT) || 1433,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function runSQLFile(pool, filePath) {
    console.log(`\n📄 Đang chạy file: ${path.basename(filePath)}`);
    
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Tách các batch bằng GO
    const batches = sqlContent
        .split(/^\s*GO\s*$/gim)
        .filter(batch => batch.trim().length > 0);
    
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i].trim();
        if (batch) {
            try {
                await pool.request().query(batch);
                process.stdout.write('.');
            } catch (error) {
                console.error(`\n❌ Lỗi ở batch ${i + 1}:`, error.message);
            }
        }
    }
    console.log('\n✅ Hoàn thành!');
}

async function setupDatabase() {
    console.log('🚀 BẮT ĐẦU CÀI ĐẶT DATABASE...\n');
    console.log('📋 Thông tin kết nối:');
    console.log(`   Server: ${config.server}:${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log('');

    let pool;

    try {
        // Kết nối đến master database
        console.log('🔌 Đang kết nối đến SQL Server...');
        pool = await sql.connect({
            ...config,
            database: 'master'
        });
        console.log('✅ Kết nối thành công!\n');

        // Chạy các file SQL
        const sqlFiles = [
            '../database/schema.sql',
            '../database/stored_procedures.sql',
            '../database/sample_data.sql'
        ];

        for (const file of sqlFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                await runSQLFile(pool, filePath);
            } else {
                console.log(`⚠️  Không tìm thấy file: ${file}`);
            }
        }

        console.log('\n✨ CÀI ĐẶT DATABASE HOÀN TẤT!\n');
        console.log('🎉 Bạn có thể chạy server bằng lệnh: npm start\n');

    } catch (error) {
        console.error('\n❌ LỖI:', error.message);
        console.log('\n💡 Kiểm tra lại:');
        console.log('   1. SQL Server đã chạy chưa?');
        console.log('   2. Thông tin trong file .env đúng chưa?');
        console.log('   3. User có quyền tạo database không?\n');
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

// Chạy setup
setupDatabase();
