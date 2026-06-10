/**
 * Enhanced Workout Timer System
 * Tracks actual start/end times and prevents data saving on quit
 */

class WorkoutTimer {
    constructor() {
        this.startTime = null;
        this.endTime = null;
        this.pausedTime = 0;
        this.isPaused = false;
        this.isActive = false;
        this.workoutData = null;
    }

    // Start the workout timer
    startWorkout(workoutType, exerciseName) {
        this.startTime = new Date();
        this.isActive = true;
        this.isPaused = false;
        this.pausedTime = 0;
        
        this.workoutData = {
            workout_type: workoutType,
            exercise_name: exerciseName,
            start_time: this.startTime.toISOString(),
            sets: 0,
            reps: 0,
            weight: 0,
            calories_burned: 0,
            notes: ''
        };

        console.log('🏃 Workout started:', this.workoutData);
        this.saveToLocalStorage();
    }

    // Pause the workout
    pauseWorkout() {
        if (this.isActive && !this.isPaused) {
            this.isPaused = true;
            this.pauseStartTime = new Date();
            console.log('⏸️ Workout paused');
        }
    }

    // Resume the workout
    resumeWorkout() {
        if (this.isActive && this.isPaused) {
            this.pausedTime += new Date() - this.pauseStartTime;
            this.isPaused = false;
            console.log('▶️ Workout resumed');
        }
    }

    // End the workout successfully
    endWorkout() {
        if (!this.isActive) {
            console.warn('⚠️ No active workout to end');
            return null;
        }

        this.endTime = new Date();
        const actualDurationSeconds = this.calculateActualDuration();
        const actualDurationMinutes = this.getDurationInMinutes();
        
        this.workoutData.end_time = this.endTime.toISOString();
        this.workoutData.duration = actualDurationMinutes; // For backward compatibility
        this.workoutData.durationSeconds = actualDurationSeconds; // New accurate field
        this.workoutData.durationFormatted = this.formatDuration(actualDurationSeconds);
        this.workoutData.completed = true;

        console.log('✅ Workout completed:', this.workoutData);
        console.log(`⏱️ Duration: ${actualDurationSeconds}s (${this.formatDuration(actualDurationSeconds)})`);
        
        // Store the data before resetting
        const completedWorkoutData = { ...this.workoutData };
        
        // Clear from localStorage since it's completed
        this.clearFromLocalStorage();
        
        // Reset timer
        this.reset();
        
        return completedWorkoutData;
    }

    // Quit workout without saving
    quitWorkout() {
        if (this.isActive) {
            console.log('❌ Workout quit - no data saved');
            this.clearFromLocalStorage();
            this.reset();
            return true;
        }
        return false;
    }

    // Calculate actual workout duration in seconds
    calculateActualDuration() {
        if (!this.startTime || !this.endTime) {
            return 0;
        }

        const totalTime = this.endTime - this.startTime;
        const activeTime = totalTime - this.pausedTime;
        return Math.round(activeTime / 1000); // Return seconds for accuracy
    }

    // Get current workout duration in seconds (for display)
    getCurrentDuration() {
        if (!this.startTime) return 0;
        
        const currentTime = this.isPaused ? this.pauseStartTime : new Date();
        const totalTime = currentTime - this.startTime;
        const activeTime = totalTime - this.pausedTime;
        return Math.round(activeTime / 1000); // Return seconds for accuracy
    }

    // Format duration for display (seconds or minutes based on length)
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }

    // Get duration in minutes for storage compatibility
    getDurationInMinutes() {
        const seconds = this.calculateActualDuration();
        return Math.max(1, Math.round(seconds / 60)); // Minimum 1 minute for storage
    }

    // Update workout data
    updateWorkoutData(updates) {
        if (this.isActive && this.workoutData) {
            Object.assign(this.workoutData, updates);
            this.saveToLocalStorage();
            console.log('📝 Workout data updated:', updates);
        }
    }

    // Save current workout to localStorage (for recovery)
    saveToLocalStorage() {
        if (this.workoutData) {
            localStorage.setItem('activeWorkout', JSON.stringify({
                ...this.workoutData,
                startTime: this.startTime?.toISOString(),
                pausedTime: this.pausedTime,
                isPaused: this.isPaused
            }));
        }
    }

    // Clear workout from localStorage
    clearFromLocalStorage() {
        localStorage.removeItem('activeWorkout');
    }

    // Recover workout from localStorage (on page refresh)
    recoverWorkout() {
        const saved = localStorage.getItem('activeWorkout');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.startTime = new Date(data.startTime);
                this.pausedTime = data.pausedTime || 0;
                this.isPaused = data.isPaused || false;
                this.isActive = true;
                this.workoutData = data;
                
                console.log('🔄 Workout recovered from localStorage');
                return true;
            } catch (error) {
                console.error('❌ Error recovering workout:', error);
                this.clearFromLocalStorage();
            }
        }
        return false;
    }

    // Reset timer
    reset() {
        this.startTime = null;
        this.endTime = null;
        this.pausedTime = 0;
        this.isPaused = false;
        this.isActive = false;
        this.workoutData = null;
    }

    // Get workout status
    getStatus() {
        return {
            isActive: this.isActive,
            isPaused: this.isPaused,
            currentDuration: this.getCurrentDuration(),
            workoutData: this.workoutData
        };
    }
}

// Global workout timer instance
window.workoutTimer = new WorkoutTimer();

// Auto-recovery on page load
document.addEventListener('DOMContentLoaded', function() {
    if (window.workoutTimer) {
        window.workoutTimer.recoverWorkout();
    }
});

// Save workout data before page unload (if workout is active)
window.addEventListener('beforeunload', function(e) {
    if (window.workoutTimer && window.workoutTimer.isActive) {
        window.workoutTimer.saveToLocalStorage();
        
        // Show confirmation dialog for accidental navigation
        const message = 'You have an active workout. Are you sure you want to leave?';
        e.returnValue = message;
        return message;
    }
});

console.log('⏱️ Enhanced Workout Timer System loaded');
