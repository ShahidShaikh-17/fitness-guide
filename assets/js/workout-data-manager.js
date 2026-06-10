/**
 * Workout Data Manager - Handles user-specific workout data storage
 * Provides utilities for saving and loading workout data with proper user isolation
 */

(function() {
    'use strict';

    // Get current user ID from localStorage
    function getCurrentUserId() {
        try {
            const user = localStorage.getItem('user');
            if (user) {
                const userData = JSON.parse(user);
                return userData.id || null;
            }
        } catch (error) {
            console.error('Error getting current user ID:', error);
        }
        return null;
    }

    // Get user-specific key for localStorage
    function getUserSpecificKey(baseKey) {
        const userId = getCurrentUserId();
        return userId ? `${baseKey}_user_${userId}` : baseKey;
    }

    // Save workout data with user isolation
    window.saveUserWorkoutData = function(workoutData) {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                console.warn('⚠️ No user logged in, workout data will be saved as legacy data');
                // Fallback to legacy storage for backward compatibility
                let workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
                workoutHistory.push(workoutData);
                if (workoutHistory.length > 50) {
                    workoutHistory = workoutHistory.slice(-50);
                }
                localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
                return;
            }

            console.log('💾 Saving workout data for user', userId);

            // Get user-specific keys
            const userWorkoutHistoryKey = getUserSpecificKey('workoutHistory');
            
            // Load existing history
            let workoutHistory = JSON.parse(localStorage.getItem(userWorkoutHistoryKey) || '[]');
            
            // Add new workout data
            workoutHistory.push(workoutData);
            
            // Keep only last 50 workouts
            if (workoutHistory.length > 50) {
                workoutHistory = workoutHistory.slice(-50);
            }
            
            // Save back to user-specific storage
            localStorage.setItem(userWorkoutHistoryKey, JSON.stringify(workoutHistory));
            
            console.log('✅ Workout data saved successfully for user', userId);
            
            return workoutHistory;
        } catch (error) {
            console.error('❌ Error saving workout data:', error);
            throw error;
        }
    };

    // Update workout statistics with user isolation
    window.updateUserWorkoutStats = function(workoutData) {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                console.warn('⚠️ No user logged in, using legacy stats update');
                // Fallback to legacy update
                updateLegacyWorkoutStats(workoutData);
                return;
            }

            console.log('📊 Updating workout stats for user', userId);

            const userWorkoutStatsKey = getUserSpecificKey('workoutStats');
            const userWorkoutHistoryKey = getUserSpecificKey('workoutHistory');
            
            // Get current stats and history
            let stats = JSON.parse(localStorage.getItem(userWorkoutStatsKey) || '{}');
            const history = JSON.parse(localStorage.getItem(userWorkoutHistoryKey) || '[]');
            
            // Calculate updated statistics
            const totalWorkouts = history.length;
            
            // Calculate total duration in both minutes and seconds
            let totalDurationMinutes = 0;
            let totalDurationSeconds = 0;
            
            history.forEach(workout => {
                if (workout.durationSeconds) {
                    totalDurationSeconds += workout.durationSeconds;
                } else if (workout.duration) {
                    totalDurationMinutes += workout.duration;
                    totalDurationSeconds += workout.duration * 60; // Convert to seconds
                }
            });
            
            // If we only have minutes data, convert to seconds
            if (totalDurationSeconds === 0 && totalDurationMinutes > 0) {
                totalDurationSeconds = totalDurationMinutes * 60;
            }
            
            // Update statistics
            stats.totalWorkouts = totalWorkouts;
            stats.totalDuration = Math.round(totalDurationSeconds / 60); // Minutes for backward compatibility
            stats.totalDurationSeconds = totalDurationSeconds; // Accurate seconds
            stats.lastUpdated = new Date().toISOString();
            
            // Save updated stats
            localStorage.setItem(userWorkoutStatsKey, JSON.stringify(stats));
            
            console.log('✅ Workout stats updated:', {
                totalWorkouts,
                totalDurationMinutes: stats.totalDuration,
                totalDurationSeconds: stats.totalDurationSeconds
            });
            
            // Trigger stats refresh on home page
            window.dispatchEvent(new CustomEvent('workoutStatsUpdated', {
                detail: { stats, userId }
            }));
            
            return stats;
        } catch (error) {
            console.error('❌ Error updating workout stats:', error);
            throw error;
        }
    };

    // Legacy stats update for backward compatibility
    function updateLegacyWorkoutStats(workoutData) {
        try {
            let stats = JSON.parse(localStorage.getItem('workoutStats') || '{}');
            const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            
            stats.totalWorkouts = history.length;
            
            let totalDuration = 0;
            let totalDurationSeconds = 0;
            
            history.forEach(workout => {
                if (workout.durationSeconds) {
                    totalDurationSeconds += workout.durationSeconds;
                } else if (workout.duration) {
                    totalDuration += workout.duration;
                }
            });
            
            stats.totalDuration = totalDuration;
            stats.totalDurationSeconds = totalDurationSeconds;
            stats.lastUpdated = new Date().toISOString();
            
            localStorage.setItem('workoutStats', JSON.stringify(stats));
            
            console.log('✅ Legacy workout stats updated');
        } catch (error) {
            console.error('❌ Error updating legacy workout stats:', error);
        }
    }

    // Get user-specific workout history
    window.getUserWorkoutHistory = function() {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                console.warn('⚠️ No user logged in, returning legacy history');
                return JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            }

            const userWorkoutHistoryKey = getUserSpecificKey('workoutHistory');
            return JSON.parse(localStorage.getItem(userWorkoutHistoryKey) || '[]');
        } catch (error) {
            console.error('❌ Error getting workout history:', error);
            return [];
        }
    };

    // Get user-specific workout stats
    window.getUserWorkoutStats = function() {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                console.warn('⚠️ No user logged in, returning legacy stats');
                return JSON.parse(localStorage.getItem('workoutStats') || '{}');
            }

            const userWorkoutStatsKey = getUserSpecificKey('workoutStats');
            return JSON.parse(localStorage.getItem(userWorkoutStatsKey) || '{}');
        } catch (error) {
            console.error('❌ Error getting workout stats:', error);
            return {};
        }
    };

    console.log('✅ Workout Data Manager initialized');
})();
