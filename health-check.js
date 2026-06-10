const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

console.log('🏥 FITNESS GUIDE Server Health Check\n');

// Load environment variables
require('dotenv').config();

async function checkEnvironment() {
    console.log('🔧 Checking environment configuration...');
    
    const requiredVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
    let envOk = true;
    
    requiredVars.forEach(varName => {
        if (!process.env[varName] || process.env[varName].includes('your_') || process.env[varName].includes('_here')) {
            console.log(`❌ ${varName}: Not configured properly`);
            envOk = false;
        } else {
            console.log(`✅ ${varName}: OK`);
        }
    });
    
    return envOk;
}

async function checkDatabase() {
    console.log('\n🗄️  Checking database connection...');
    
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fitness_guide',
        port: process.env.DB_PORT || 3306,
        connectTimeout: 5000
    };
    
    try {
        const connection = mysql.createConnection(dbConfig);
        
        await new Promise((resolve, reject) => {
            connection.connect((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✅ Database connection: OK');
        
        // Check if tables exist
        const tables = ['users', 'workouts', 'user_profiles', 'contact_us'];
        for (const table of tables) {
            try {
                await new Promise((resolve, reject) => {
                    connection.query(`SELECT 1 FROM ${table} LIMIT 1`, (err) => {
                        if (err && err.code === 'ER_NO_SUCH_TABLE') {
                            console.log(`⚠️  Table '${table}': Missing (will be created on server start)`);
                        } else if (err) {
                            reject(err);
                        } else {
                            console.log(`✅ Table '${table}': OK`);
                        }
                        resolve();
                    });
                });
            } catch (err) {
                console.log(`❌ Table '${table}': Error - ${err.message}`);
            }
        }
        
        connection.end();
        return true;
    } catch (err) {
        console.log(`❌ Database connection: Failed - ${err.message}`);
        console.log('💡 Make sure MySQL is running and credentials are correct');
        return false;
    }
}

async function checkFiles() {
    console.log('\n📁 Checking critical files...');
    
    const criticalFiles = [
        'server.js',
        'package.json',
        '.env',
        'routes/auth.js',
        'routes/workouts.js',
        'routes/reports.js',
        'routes/contact.js',
        'config/database.js',
        'middleware/auth.js'
    ];
    
    let filesOk = true;
    
    criticalFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file}: OK`);
        } else {
            console.log(`❌ ${file}: Missing`);
            filesOk = false;
        }
    });
    
    return filesOk;
}

async function checkDependencies() {
    console.log('\n📦 Checking dependencies...');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredDeps = [
            'express', 'mysql2', 'bcryptjs', 'jsonwebtoken', 
            'dotenv', 'cors', 'body-parser', 'uuid', 'nodemailer'
        ];
        
        let depsOk = true;
        
        requiredDeps.forEach(dep => {
            if (packageJson.dependencies && packageJson.dependencies[dep]) {
                console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
            } else {
                console.log(`❌ ${dep}: Missing`);
                depsOk = false;
            }
        });
        
        // Check if node_modules exists
        if (fs.existsSync('node_modules')) {
            console.log('✅ node_modules: OK');
        } else {
            console.log('⚠️  node_modules: Missing - Run "npm install"');
            depsOk = false;
        }
        
        return depsOk;
    } catch (err) {
        console.log('❌ package.json: Could not read');
        return false;
    }
}

async function runHealthCheck() {
    const envOk = await checkEnvironment();
    const filesOk = await checkFiles();
    const depsOk = await checkDependencies();
    const dbOk = await checkDatabase();
    
    console.log('\n📊 Health Check Summary:');
    console.log(`Environment: ${envOk ? '✅ OK' : '❌ Issues'}`);
    console.log(`Files: ${filesOk ? '✅ OK' : '❌ Issues'}`);
    console.log(`Dependencies: ${depsOk ? '✅ OK' : '❌ Issues'}`);
    console.log(`Database: ${dbOk ? '✅ OK' : '❌ Issues'}`);
    
    if (envOk && filesOk && depsOk && dbOk) {
        console.log('\n🎉 All systems are GO! Your server should work perfectly.');
        console.log('Run: npm start');
    } else {
        console.log('\n⚠️  Some issues found. Please fix them before starting the server.');
        
        if (!depsOk) {
            console.log('💡 Run: npm install');
        }
        if (!envOk) {
            console.log('💡 Run: node setup-env.js');
        }
        if (!dbOk) {
            console.log('💡 Check your MySQL server and .env database settings');
        }
    }
}

runHealthCheck().catch(console.error);
