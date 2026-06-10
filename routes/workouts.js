const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Test endpoint to verify authentication
router.get('/test', authenticateToken, async (req, res) => {
    try {
        res.json({ 
            message: 'Authentication working', 
            userId: req.user.userId,
            email: req.user.email 
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add new workout
router.post('/add', authenticateToken, async (req, res) => {
    try {
        
        const { 
            workout_type, 
            exercise_name, 
            sets, 
            reps, 
            duration, 
            duration_seconds,
            weight, 
            calories_burned, 
            notes 
        } = req.body;

        const userId = req.user.userId;

        // Validate required fields
        if (!workout_type || !exercise_name) {
            return res.status(400).json({ 
                message: 'Workout type and exercise name are required' 
            });
        }

        // Insert workout with duration_seconds
        const [result] = await db.promise().execute(
            `INSERT INTO workouts 
             (user_id, workout_type, exercise_name, sets, reps, duration, duration_seconds, weight, calories_burned, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, workout_type, exercise_name, sets || 0, reps || 0, duration || 0, duration_seconds || 0, weight || 0, calories_burned || 0, notes || '']
        );
        
        // Update user's total workout time if duration_seconds is provided
        if (duration_seconds && duration_seconds > 0) {
            await db.promise().execute(
                `UPDATE users 
                 SET total_workout_time = COALESCE(total_workout_time, 0) + ? 
                 WHERE id = ?`,
                [duration_seconds, userId]
            );
        }

        res.status(201).json({
            message: 'Workout added successfully',
            workoutId: result.insertId
        });

    } catch (error) {
        console.error('Add workout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get user's workouts
router.get('/my-workouts', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10, workout_type, date_from, date_to } = req.query;

        let query = 'SELECT * FROM workouts WHERE user_id = ?';
        let params = [userId];

        // Add filters
        if (workout_type) {
            query += ' AND workout_type = ?';
            params.push(workout_type);
        }

        if (date_from) {
            query += ' AND workout_date >= ?';
            params.push(date_from);
        }

        if (date_to) {
            query += ' AND workout_date <= ?';
            params.push(date_to);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        query += ' ORDER BY workout_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [workouts] = await db.promise().execute(query, params);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM workouts WHERE user_id = ?';
        let countParams = [userId];

        if (workout_type) {
            countQuery += ' AND workout_type = ?';
            countParams.push(workout_type);
        }

        if (date_from) {
            countQuery += ' AND workout_date >= ?';
            countParams.push(date_from);
        }

        if (date_to) {
            countQuery += ' AND workout_date <= ?';
            countParams.push(date_to);
        }

        const [countResult] = await db.promise().execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            workouts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get workouts error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get workout statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { period = '30' } = req.query; // days

        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - parseInt(period));

        // Get workout count by type
        const [workoutTypes] = await db.promise().execute(
            `SELECT workout_type, COUNT(*) as count 
             FROM workouts 
             WHERE user_id = ? AND workout_date >= ? 
             GROUP BY workout_type`,
            [userId, dateFrom]
        );

        // Get total calories burned
        const [caloriesResult] = await db.promise().execute(
            `SELECT SUM(calories_burned) as total_calories 
             FROM workouts 
             WHERE user_id = ? AND workout_date >= ?`,
            [userId, dateFrom]
        );

        // Get total workout time (ALL TIME) - in minutes for compatibility
        const [timeResult] = await db.promise().execute(
            `SELECT SUM(duration) as total_duration 
             FROM workouts 
             WHERE user_id = ?`,
            [userId]
        );
        
        // Get total workout time in seconds from user table
        const [userTimeResult] = await db.promise().execute(
            `SELECT total_workout_time 
             FROM users 
             WHERE id = ?`,
            [userId]
        );

        // Get recent workouts
        const [recentWorkouts] = await db.promise().execute(
            `SELECT * FROM workouts 
             WHERE user_id = ? 
             ORDER BY workout_date DESC 
             LIMIT 5`,
            [userId]
        );

        // Get total workout count (ALL TIME, not just period)
        const [totalWorkoutsResult] = await db.promise().execute(
            `SELECT COUNT(*) as total_workouts 
             FROM workouts 
             WHERE user_id = ?`,
            [userId]
        );

        const statsResponse = {
            workoutTypes,
            totalWorkouts: totalWorkoutsResult[0].total_workouts || 0,
            totalCalories: caloriesResult[0].total_calories || 0,
            totalDuration: timeResult[0].total_duration || 0,
            totalDurationSeconds: userTimeResult[0]?.total_workout_time || 0,
            recentWorkouts
        };

        res.json(statsResponse);

    } catch (error) {
        console.error('Get workout stats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update workout
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const workoutId = req.params.id;
        const userId = req.user.userId;
        const { 
            workout_type, 
            exercise_name, 
            sets, 
            reps, 
            duration, 
            weight, 
            calories_burned, 
            notes 
        } = req.body;

        // Check if workout exists and belongs to user
        const [workouts] = await db.promise().execute(
            'SELECT id FROM workouts WHERE id = ? AND user_id = ?',
            [workoutId, userId]
        );

        if (workouts.length === 0) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        // Update workout
        await db.promise().execute(
            `UPDATE workouts SET 
             workout_type = ?, exercise_name = ?, sets = ?, reps = ?, 
             duration = ?, weight = ?, calories_burned = ?, notes = ? 
             WHERE id = ? AND user_id = ?`,
            [workout_type, exercise_name, sets, reps, duration, weight, calories_burned, notes, workoutId, userId]
        );

        res.json({ message: 'Workout updated successfully' });

    } catch (error) {
        console.error('Update workout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete workout
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const workoutId = req.params.id;
        const userId = req.user.userId;

        // Check if workout exists and belongs to user
        const [workouts] = await db.promise().execute(
            'SELECT id FROM workouts WHERE id = ? AND user_id = ?',
            [workoutId, userId]
        );

        if (workouts.length === 0) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        // Delete workout
        await db.promise().execute(
            'DELETE FROM workouts WHERE id = ? AND user_id = ?',
            [workoutId, userId]
        );

        res.json({ message: 'Workout deleted successfully' });

    } catch (error) {
        console.error('Delete workout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get workout by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const workoutId = req.params.id;
        const userId = req.user.userId;

        const [workouts] = await db.promise().execute(
            'SELECT * FROM workouts WHERE id = ? AND user_id = ?',
            [workoutId, userId]
        );

        if (workouts.length === 0) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        res.json(workouts[0]);

    } catch (error) {
        console.error('Get workout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
