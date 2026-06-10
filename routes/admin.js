const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const [totalUsers] = await db.promise().query('SELECT COUNT(*) as count FROM users');
        const [totalWorkouts] = await db.promise().query('SELECT COUNT(*) as count FROM workouts');
        const [recentUsers] = await db.promise().query(
            'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        );
        const [activeUsers] = await db.promise().query(
            'SELECT COUNT(DISTINCT user_id) as count FROM workouts WHERE workout_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        );
        
        // Get total workout time from all users (in seconds)
        // Try new column first, fallback to calculating from workouts
        let totalTime = 0;
        try {
            const [totalTimeResult] = await db.promise().query(
                'SELECT COALESCE(SUM(total_workout_time), 0) as total_time FROM users'
            );
            totalTime = totalTimeResult[0].total_time;
        } catch (err) {
            // Column doesn't exist, calculate from workouts table
            const [workoutTimeResult] = await db.promise().query(
                'SELECT COALESCE(SUM(duration * 60), 0) as total_time FROM workouts'
            );
            totalTime = workoutTimeResult[0].total_time;
        }

        res.json({
            success: true,
            data: {
                total_users: totalUsers[0].count,
                total_workouts: totalWorkouts[0].count,
                recent_users: recentUsers[0].count,
                active_users: activeUsers[0].count,
                total_workout_time: totalTime
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// Get all users with their profiles
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Try to get users with total_workout_time, fallback if column doesn't exist
        let users;
        try {
            [users] = await db.promise().query(`
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    u.created_at,
                    u.updated_at,
                    COALESCE(u.total_workout_time, 0) as total_workout_time,
                    up.height,
                    up.weight,
                    up.age,
                    up.gender,
                    COALESCE(NULLIF(up.bmi, 0), CASE WHEN up.height IS NOT NULL AND up.weight IS NOT NULL AND up.height > 0 AND up.weight > 0 THEN (up.weight / POWER(up.height/100, 2)) ELSE NULL END) as bmi,
                    up.activity_level,
                    COUNT(w.id) as total_workouts,
                    MAX(w.workout_date) as last_workout
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN workouts w ON u.id = w.user_id
                GROUP BY u.id, u.name, u.email, u.created_at, u.updated_at, u.total_workout_time, up.height, up.weight, up.age, up.gender, up.bmi, up.activity_level
                ORDER BY u.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);
        } catch (err) {
            // Column doesn't exist, calculate workout time from workouts table
            [users] = await db.promise().query(`
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    u.created_at,
                    u.updated_at,
                    COALESCE(SUM(w.duration * 60), 0) as total_workout_time,
                    up.height,
                    up.weight,
                    up.age,
                    up.gender,
                    COALESCE(NULLIF(up.bmi, 0), CASE WHEN up.height IS NOT NULL AND up.weight IS NOT NULL AND up.height > 0 AND up.weight > 0 THEN (up.weight / POWER(up.height/100, 2)) ELSE NULL END) as bmi,
                    up.activity_level,
                    COUNT(w.id) as total_workouts,
                    MAX(w.workout_date) as last_workout
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN workouts w ON u.id = w.user_id
                GROUP BY u.id, u.name, u.email, u.created_at, u.updated_at, up.height, up.weight, up.age, up.gender, up.bmi, up.activity_level
                ORDER BY u.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);
        }

        const [countResult] = await db.promise().query('SELECT COUNT(*) as total FROM users');
        const total = countResult[0].total;

        res.json({
            success: true,
            data: users,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// Get specific user details
router.get('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const [users] = await db.promise().query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.created_at,
                u.updated_at,
                NULLIF(up.height, 0) as height,
                NULLIF(up.weight, 0) as weight,
                up.age,
                up.gender,
                COALESCE(NULLIF(up.bmi, 0), CASE WHEN up.height IS NOT NULL AND up.weight IS NOT NULL AND up.height > 0 AND up.weight > 0 THEN (up.weight / POWER(up.height/100, 2)) ELSE NULL END) as bmi,
                up.bmr,
                up.activity_level
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = ?
        `, [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's workouts with duration_seconds if available
        let workouts;
        try {
            [workouts] = await db.promise().query(`
                SELECT 
                    workout_type,
                    exercise_name,
                    sets,
                    reps,
                    duration,
                    COALESCE(duration_seconds, duration * 60) as duration_seconds,
                    weight,
                    calories_burned,
                    workout_date
                FROM workouts
                WHERE user_id = ?
                ORDER BY workout_date DESC
                LIMIT 10
            `, [userId]);
        } catch (err) {
            // duration_seconds column doesn't exist
            [workouts] = await db.promise().query(`
                SELECT 
                    workout_type,
                    exercise_name,
                    sets,
                    reps,
                    duration,
                    (duration * 60) as duration_seconds,
                    weight,
                    calories_burned,
                    workout_date
                FROM workouts
                WHERE user_id = ?
                ORDER BY workout_date DESC
                LIMIT 10
            `, [userId]);
        }

        res.json({
            success: true,
            data: {
                user: users[0],
                recent_workouts: workouts
            }
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user details',
            error: error.message
        });
    }
});

// Search users
router.get('/users/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        const searchPattern = `%${query}%`;

        // Try to search with total_workout_time, fallback if column doesn't exist
        let users;
        try {
            [users] = await db.promise().query(`
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    u.created_at,
                    COALESCE(u.total_workout_time, 0) as total_workout_time,
                    up.height,
                    up.weight,
                    COALESCE(NULLIF(up.bmi, 0), CASE WHEN up.height IS NOT NULL AND up.weight IS NOT NULL AND up.height > 0 AND up.weight > 0 THEN (up.weight / POWER(up.height/100, 2)) ELSE NULL END) as bmi,
                    COUNT(w.id) as total_workouts,
                    MAX(w.workout_date) as last_workout
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN workouts w ON u.id = w.user_id
                WHERE u.name LIKE ? OR u.email LIKE ?
                GROUP BY u.id, u.name, u.email, u.created_at, u.total_workout_time, up.height, up.weight, up.bmi
                ORDER BY u.created_at DESC
            `, [searchPattern, searchPattern]);
        } catch (err) {
            // Column doesn't exist, calculate from workouts
            [users] = await db.promise().query(`
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    u.created_at,
                    COALESCE(SUM(w.duration * 60), 0) as total_workout_time,
                    up.height,
                    up.weight,
                    COALESCE(NULLIF(up.bmi, 0), CASE WHEN up.height IS NOT NULL AND up.weight IS NOT NULL AND up.height > 0 AND up.weight > 0 THEN (up.weight / POWER(up.height/100, 2)) ELSE NULL END) as bmi,
                    COUNT(w.id) as total_workouts,
                    MAX(w.workout_date) as last_workout
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN workouts w ON u.id = w.user_id
                WHERE u.name LIKE ? OR u.email LIKE ?
                GROUP BY u.id, u.name, u.email, u.created_at, up.height, up.weight, up.bmi
                ORDER BY u.created_at DESC
            `, [searchPattern, searchPattern]);
        }

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching users',
            error: error.message
        });
    }
});

// Get user workouts
router.get('/users/:id/workouts', async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [workouts] = await db.promise().query(`
            SELECT 
                id,
                workout_type,
                exercise_name,
                sets,
                reps,
                duration,
                weight,
                calories_burned,
                notes,
                workout_date
            FROM workouts
            WHERE user_id = ?
            ORDER BY workout_date DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        const [countResult] = await db.promise().query(
            'SELECT COUNT(*) as total FROM workouts WHERE user_id = ?',
            [userId]
        );

        res.json({
            success: true,
            data: workouts,
            pagination: {
                page: page,
                limit: limit,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching user workouts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user workouts',
            error: error.message
        });
    }
});

// Get contact messages
router.get('/contacts', async (req, res) => {
    try {
        const [contacts] = await db.promise().query(`
            SELECT 
                id,
                name,
                email,
                subject,
                message,
                phone,
                status,
                created_at
            FROM contact_us
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            data: contacts
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contacts',
            error: error.message
        });
    }
});

module.exports = router;
