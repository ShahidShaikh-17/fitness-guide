const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get comprehensive fitness report
router.get('/fitness-report', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { period = '30' } = req.query; // days

        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - parseInt(period));

        // Get user profile
        const [profiles] = await db.promise().execute(
            'SELECT * FROM user_profiles WHERE user_id = ?',
            [userId]
        );

        const profile = profiles[0] || {};

        // Get workout statistics
        const [workoutStats] = await db.promise().execute(
            `SELECT 
                COUNT(*) as total_workouts,
                SUM(calories_burned) as total_calories,
                SUM(duration) as total_duration,
                AVG(calories_burned) as avg_calories_per_workout,
                AVG(duration) as avg_duration_per_workout
             FROM workouts 
             WHERE user_id = ? AND workout_date >= ?`,
            [userId, dateFrom]
        );

        // Get workouts by type
        const [workoutsByType] = await db.promise().execute(
            `SELECT 
                workout_type,
                COUNT(*) as count,
                SUM(calories_burned) as total_calories,
                SUM(duration) as total_duration
             FROM workouts 
             WHERE user_id = ? AND workout_date >= ? 
             GROUP BY workout_type 
             ORDER BY count DESC`,
            [userId, dateFrom]
        );

        // Get daily workout data for chart
        const [dailyData] = await db.promise().execute(
            `SELECT 
                DATE(workout_date) as date,
                COUNT(*) as workouts,
                SUM(calories_burned) as calories,
                SUM(duration) as duration
             FROM workouts 
             WHERE user_id = ? AND workout_date >= ? 
             GROUP BY DATE(workout_date) 
             ORDER BY date`,
            [userId, dateFrom]
        );

        // Get recent workouts
        const [recentWorkouts] = await db.promise().execute(
            `SELECT * FROM workouts 
             WHERE user_id = ? 
             ORDER BY workout_date DESC 
             LIMIT 10`,
            [userId]
        );

        // Calculate BMI category
        let bmiCategory = 'Unknown';
        if (profile.bmi) {
            if (profile.bmi < 18.5) {
                bmiCategory = 'Underweight';
            } else if (profile.bmi < 25) {
                bmiCategory = 'Normal weight';
            } else if (profile.bmi < 30) {
                bmiCategory = 'Overweight';
            } else {
                bmiCategory = 'Obese';
            }
        }

        // Calculate recommended daily calories based on BMR and activity level
        let recommendedCalories = 0;
        if (profile.bmr && profile.activity_level) {
            const activityMultipliers = {
                'sedentary': 1.2,
                'light': 1.375,
                'moderate': 1.55,
                'active': 1.725,
                'very_active': 1.9
            };
            recommendedCalories = Math.round(profile.bmr * (activityMultipliers[profile.activity_level] || 1.55));
        }

        res.json({
            profile: {
                ...profile,
                bmiCategory,
                recommendedCalories
            },
            statistics: {
                period: parseInt(period),
                totalWorkouts: workoutStats[0].total_workouts || 0,
                totalCalories: workoutStats[0].total_calories || 0,
                totalDuration: workoutStats[0].total_duration || 0,
                avgCaloriesPerWorkout: Math.round(workoutStats[0].avg_calories_per_workout || 0),
                avgDurationPerWorkout: Math.round(workoutStats[0].avg_duration_per_workout || 0)
            },
            workoutsByType,
            dailyData,
            recentWorkouts
        });

    } catch (error) {
        console.error('Get fitness report error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Calculate BMI
router.post('/calculate-bmi', authenticateToken, async (req, res) => {
    try {
        const { height, weight } = req.body;
        const userId = req.user.userId;

        if (!height || !weight) {
            return res.status(400).json({ message: 'Height and weight are required' });
        }

        // Convert height to meters
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);

        // Determine BMI category
        let category = 'Unknown';
        if (bmi < 18.5) {
            category = 'Underweight';
        } else if (bmi < 25) {
            category = 'Normal weight';
        } else if (bmi < 30) {
            category = 'Overweight';
        } else {
            category = 'Obese';
        }

        // Update user profile
        await db.promise().execute(
            `INSERT INTO user_profiles (user_id, height, weight, bmi) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             height = VALUES(height), 
             weight = VALUES(weight), 
             bmi = VALUES(bmi)`,
            [userId, height, weight, bmi]
        );

        res.json({
            bmi: Math.round(bmi * 100) / 100,
            category,
            height,
            weight
        });

    } catch (error) {
        console.error('Calculate BMI error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get workout progress over time
router.get('/progress', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { period = '90' } = req.query; // days

        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - parseInt(period));

        // Get weekly progress data
        const [weeklyProgress] = await db.promise().execute(
            `SELECT 
                YEAR(workout_date) as year,
                WEEK(workout_date) as week,
                COUNT(*) as workouts,
                SUM(calories_burned) as calories,
                SUM(duration) as duration
             FROM workouts 
             WHERE user_id = ? AND workout_date >= ? 
             GROUP BY YEAR(workout_date), WEEK(workout_date) 
             ORDER BY year, week`,
            [userId, dateFrom]
        );

        // Get monthly progress data
        const [monthlyProgress] = await db.promise().execute(
            `SELECT 
                YEAR(workout_date) as year,
                MONTH(workout_date) as month,
                COUNT(*) as workouts,
                SUM(calories_burned) as calories,
                SUM(duration) as duration
             FROM workouts 
             WHERE user_id = ? AND workout_date >= ? 
             GROUP BY YEAR(workout_date), MONTH(workout_date) 
             ORDER BY year, month`,
            [userId, dateFrom]
        );

        res.json({
            weeklyProgress,
            monthlyProgress
        });

    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get exercise recommendations based on user profile
router.get('/recommendations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get user profile
        const [profiles] = await db.promise().execute(
            'SELECT * FROM user_profiles WHERE user_id = ?',
            [userId]
        );

        const profile = profiles[0] || {};

        // Get user's workout history
        const [workoutHistory] = await db.promise().execute(
            `SELECT workout_type, COUNT(*) as count 
             FROM workouts 
             WHERE user_id = ? 
             GROUP BY workout_type`,
            [userId]
        );

        // Generate recommendations based on BMI and workout history
        let recommendations = [];

        if (profile.bmi) {
            if (profile.bmi < 18.5) {
                recommendations.push({
                    type: 'Strength Training',
                    reason: 'Building muscle mass can help increase weight healthily',
                    exercises: ['Push-ups', 'Squats', 'Planks', 'Lunges']
                });
            } else if (profile.bmi > 25) {
                recommendations.push({
                    type: 'Cardio',
                    reason: 'Cardio exercises can help with weight management',
                    exercises: ['Running', 'Cycling', 'Swimming', 'Jumping Jacks']
                });
            }
        }

        // Add recommendations based on workout history
        const workoutTypes = workoutHistory.map(w => w.workout_type);
        
        if (!workoutTypes.includes('Cardio')) {
            recommendations.push({
                type: 'Cardio',
                reason: 'Add cardio to improve cardiovascular health',
                exercises: ['Running', 'Cycling', 'Swimming', 'Dancing']
            });
        }

        if (!workoutTypes.includes('Strength Training')) {
            recommendations.push({
                type: 'Strength Training',
                reason: 'Strength training helps build muscle and bone density',
                exercises: ['Push-ups', 'Squats', 'Planks', 'Weight Lifting']
            });
        }

        if (!workoutTypes.includes('Flexibility')) {
            recommendations.push({
                type: 'Flexibility',
                reason: 'Flexibility exercises improve range of motion and reduce injury risk',
                exercises: ['Yoga', 'Stretching', 'Pilates', 'Tai Chi']
            });
        }

        res.json({
            profile,
            workoutHistory,
            recommendations
        });

    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
