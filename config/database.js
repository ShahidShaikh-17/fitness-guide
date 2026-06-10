const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fitness_guide',
    port: process.env.DB_PORT || 3306,
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Create connection pool with retry mechanism
const createPool = () => {
    const pool = mysql.createPool(dbConfig);
    
    // Add error handling for the pool
    pool.on('error', (err) => {
        console.error('Unexpected error on idle connection', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed. Attempting to reconnect...');
            setTimeout(createPool, 2000);
        }
    });

    return pool;
};

const pool = createPool();

// Test database connection with retry
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

const testConnection = async (retries = 0) => {
    try {
        const connection = await pool.promise().getConnection();
        console.log('✅ Database connected');
        connection.release();
    } catch (err) {
        if (retries < MAX_RETRIES) {
            setTimeout(() => testConnection(retries + 1), RETRY_DELAY);
        } else {
            console.error('❌ Database connection failed');
        }
    }
};

testConnection();

// Create tables if they don't exist
const createTables = async () => {
    try {
        const connection = await pool.promise().getConnection();
        
        try {
            // Always run idempotent table creation to ensure full schema is present
            // Create users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create workouts table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS workouts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                workout_type VARCHAR(100) NOT NULL,
                exercise_name VARCHAR(255) NOT NULL,
                sets INT DEFAULT 0,
                reps INT DEFAULT 0,
                duration INT DEFAULT 0,
                weight DECIMAL(5,2) DEFAULT 0,
                calories_burned INT DEFAULT 0,
                notes TEXT,
                workout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create user_profiles table for BMI and other data
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                height DECIMAL(5,2) DEFAULT 0,
                weight DECIMAL(5,2) DEFAULT 0,
                age INT DEFAULT 0,
                gender ENUM('male', 'female', 'other') DEFAULT 'other',
                activity_level ENUM('sedentary', 'light', 'moderate', 'active', 'very_active') DEFAULT 'moderate',
                bmi DECIMAL(4,2) DEFAULT 0,
                bmr DECIMAL(8,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create password_resets table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create contact_us table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS contact_us (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(500),
                message TEXT NOT NULL,
                phone VARCHAR(20),
                status ENUM('new', 'read', 'replied', 'resolved') DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

            // Add time tracking columns if they don't exist
            const [userColumns] = await connection.execute(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'users' 
                AND COLUMN_NAME = 'total_workout_time'
            `);
            
            if (userColumns.length === 0) {
                await connection.execute(`
                    ALTER TABLE users 
                    ADD COLUMN total_workout_time INT DEFAULT 0
                `);
            }
            
            const [workoutColumns] = await connection.execute(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'workouts' 
                AND COLUMN_NAME = 'duration_seconds'
            `);
            
            if (workoutColumns.length === 0) {
                await connection.execute(`
                    ALTER TABLE workouts 
                    ADD COLUMN duration_seconds INT DEFAULT 0
                `);
            }
            
            // Migrate existing data silently
            try {
                await connection.execute(`
                    UPDATE workouts 
                    SET duration_seconds = duration * 60 
                    WHERE duration_seconds = 0 AND duration > 0
                `);
            } catch (err) {
                // Silent migration
            }
            
            try {
                await connection.execute(`
                    UPDATE users u
                    SET total_workout_time = (
                        SELECT COALESCE(SUM(duration_seconds), 0)
                        FROM workouts w
                        WHERE w.user_id = u.id
                    )
                    WHERE total_workout_time = 0
                `);
            } catch (err) {
                // Silent calculation
            }
            
        } catch (error) {
            console.error('Error creating tables:', error);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.warn('Could not connect to database to create tables:', error.message);
    }
};

// Initialize database
createTables();

module.exports = pool;
