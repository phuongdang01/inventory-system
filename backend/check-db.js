const { initDatabase, getConnection } = require('./config/database');

async function checkUsers() {
    try {
        await initDatabase();
        const db = await getConnection();
        const result = db.exec("SELECT COUNT(*) as count FROM Users");
        if (result.length > 0) {
            console.log("User count:", result[0].values[0][0]);
        } else {
            console.log("User count: 0");
        }
        
        // Check if admin exists
        const admin = db.exec("SELECT * FROM Users WHERE Username = 'admin'");
        if (admin.length > 0 && admin[0].values.length > 0) {
            console.log("Admin user exists.");
        } else {
            console.log("Admin user DOES NOT exist.");
        }

    } catch (error) {
        console.error("Error checking DB:", error);
    }
}

checkUsers();
