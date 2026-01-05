const { getConnection, saveDatabase } = require('./config/database');

async function migrate() {
    try {
        console.log('Starting migration...');
        const db = await getConnection();
        
        // Check if column exists
        try {
            db.exec('SELECT LastLogin FROM Users LIMIT 1');
            console.log('Column LastLogin already exists.');
        } catch (error) {
            console.log('Column LastLogin does not exist. Adding it...');
            db.run('ALTER TABLE Users ADD COLUMN LastLogin DATETIME');
            console.log('Column LastLogin added successfully.');
            saveDatabase();
        }
        
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
