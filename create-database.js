const mysql = require('mysql2');
require('dotenv').config();

console.log('🗄️  Creating FITNESS GUIDE database...\n');

async function createDatabase() {
    // Connect without specifying database first
    const connection = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Connecting to MySQL server...');
        
        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'fitness_guide';
        await new Promise((resolve, reject) => {
            connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        
        console.log(`✅ Database '${dbName}' created successfully!`);
        
        // Create user if specified and different from root
        const dbUser = process.env.DB_USER;
        if (dbUser && dbUser !== 'root') {
            try {
                await new Promise((resolve, reject) => {
                    const createUserQuery = `CREATE USER IF NOT EXISTS '${dbUser}'@'localhost' IDENTIFIED BY '${process.env.DB_PASSWORD}'`;
                    connection.query(createUserQuery, (err, result) => {
                        if (err && err.code !== 'ER_CANNOT_USER') reject(err);
                        else resolve(result);
                    });
                });
                
                await new Promise((resolve, reject) => {
                    const grantQuery = `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'localhost'`;
                    connection.query(grantQuery, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
                
                await new Promise((resolve, reject) => {
                    connection.query('FLUSH PRIVILEGES', (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
                
                console.log(`✅ User '${dbUser}' created and granted permissions!`);
            } catch (userErr) {
                console.log(`⚠️  User creation skipped: ${userErr.message}`);
            }
        }
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('You can now run: node server.js');
        
    } catch (err) {
        console.error('❌ Database setup failed:', err.message);
        console.log('\n💡 Troubleshooting tips:');
        console.log('1. Make sure MySQL server is running');
        console.log('2. Check your database credentials in .env file');
        console.log('3. Ensure you have permission to create databases');
    } finally {
        connection.end();
    }
}

createDatabase();
