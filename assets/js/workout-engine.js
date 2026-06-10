/**
 * Enhanced Workout Engine - Modular JavaScript
 * Handles speech synthesis, workout logic, and UI management
 */

class WorkoutEngine {
    constructor(exercises, workoutConfig) {
        this.exercises = exercises;
        this.config = workoutConfig;
        this.currentExercise = 0;
        this.isResting = false;
        this.intervals = {
            countdown: null,
            rest: null
        };
        
        // Initialize speech manager
        this.speechManager = new SpeechManager();
        
        // Initialize UI manager
        this.uiManager = new WorkoutUIManager();
        
        // Bind methods
        this.handleNext = this.handleNext.bind(this);
        this.handleSkip = this.handleSkip.bind(this);
        this.handleBack = this.handleBack.bind(this);
        this.quitWorkout = this.quitWorkout.bind(this);
        
        console.log(`🏋️ Workout Engine initialized for ${this.config.name}`);
    }

    // Main workout flow methods
    startCountdown() {
        console.log('🚀 Starting countdown...');
        
        this.uiManager.updateStatus("Get Ready!");
        this.uiManager.showCountdown(3);
        
        this.speechManager.speak(`Get ready for your ${this.config.name.toLowerCase()}`, true);
        
        let count = 3;
        this.intervals.countdown = setInterval(() => {
            console.log('Countdown:', count);
            
            this.uiManager.updateCountdown(count);
            
            if (count > 0) {
                this.speechManager.speak(count.toString(), false, 0);
            }
            
            count--;
            
            if (count < 0) {
                this.finishCountdown();
            }
        }, 1000);
    }

    finishCountdown() {
        clearInterval(this.intervals.countdown);
        console.log('✅ Starting workout!');
        
        this.uiManager.updateStatus("Workout in Progress");
        this.uiManager.showWorkoutMode();
        
        // Start enhanced workout timer
        if (window.workoutTimer) {
            window.workoutTimer.startWorkout(this.config.type, `${this.config.name} Session`);
        }
        
        this.uiManager.showWorkoutControls();
        
        // Start first exercise with delay
        this.speechManager.speak("Let's go!", true, 500);
        setTimeout(() => this.loadExercise(0), 1000);
    }

    loadExercise(index) {
        this.clearIntervals();
        this.isResting = false;

        if (index >= this.exercises.length) {
            this.endWorkout();
            return;
        }

        this.currentExercise = index;
        const exercise = this.exercises[index];
        
        console.log(`📋 Loading exercise ${index + 1}: ${exercise.name}`);
        
        // Update UI
        this.uiManager.updateExercise(exercise, index, this.exercises.length);
        this.uiManager.hideRest();
        
        // Announce exercise with proper timing
        const exerciseText = exercise.reps ? 
            `${exercise.name}, ${exercise.reps} repetitions` : 
            `${exercise.name}, ${exercise.duration} seconds`;
        
        this.speechManager.speak(exerciseText, false, 800);
    }

    startRest() {
        if (this.currentExercise + 1 >= this.exercises.length) {
            this.endWorkout();
            return;
        }

        console.log('😴 Starting rest period');
        this.isResting = true;
        
        let restTime = 10; // 10 second rest periods
        this.uiManager.showRest(restTime);
        
        // Announce rest period
        this.speechManager.speak("Take a rest", false, 500);
        
        this.intervals.rest = setInterval(() => {
            restTime--;
            this.uiManager.updateRest(restTime);
            
            if (restTime === 3) {
                this.speechManager.speak("Get ready for the next exercise", false, 0);
            }
            
            if (restTime <= 0) {
                this.finishRest();
            }
        }, 1000);
    }

    finishRest() {
        clearInterval(this.intervals.rest);
        this.isResting = false;
        this.loadExercise(this.currentExercise + 1);
    }

    endWorkout() {
        console.log('🎉 Workout completed!');
        
        this.clearIntervals();
        this.speechManager.stop();
        
        // Get workout data from timer
        let workoutTimerData = null;
        if (window.workoutTimer) {
            workoutTimerData = window.workoutTimer.endWorkout();
        }
        
        // Save workout data
        this.saveWorkoutData(workoutTimerData);
        
        // Update UI for completion
        this.uiManager.showCompletion();
        
        // Congratulations message with delay
        setTimeout(() => {
            this.speechManager.speak(`Congratulations! You completed your ${this.config.name.toLowerCase()}!`, true, 0);
        }, 1500);
        
        // Add navigation buttons
        setTimeout(() => {
            this.uiManager.addNavigationButtons();
        }, 3000);
    }

    // Button handlers
    handleNext() {
        if (this.isResting) {
            // Skip rest period
            this.finishRest();
        } else if (this.currentExercise + 1 < this.exercises.length) {
            // Start rest period
            this.startRest();
        } else {
            // End workout
            this.endWorkout();
        }
    }

    handleSkip() {
        if (this.isResting) {
            // Skip rest and go to next exercise
            this.finishRest();
        } else if (this.currentExercise + 1 < this.exercises.length) {
            // Skip current exercise and go to next
            this.loadExercise(this.currentExercise + 1);
        } else {
            // End workout
            this.endWorkout();
        }
    }

    handleBack() {
        if (this.currentExercise > 0) {
            this.clearIntervals();
            this.isResting = false;
            this.loadExercise(this.currentExercise - 1);
        }
    }

    quitWorkout() {
        console.log('❌ Workout quit by user');
        
        this.clearIntervals();
        this.speechManager.stop();
        
        if (window.workoutTimer) {
            window.workoutTimer.quitWorkout();
        }
        
        // Stop celebration video
        const celebrationVideo = document.getElementById("celebration-video");
        if (celebrationVideo) {
            celebrationVideo.pause();
            celebrationVideo.currentTime = 0;
        }
        
        // Reset state
        this.currentExercise = 0;
        this.isResting = false;
        
        window.location.href = '../main.html';
    }

    // Utility methods
    clearIntervals() {
        if (this.intervals.countdown) {
            clearInterval(this.intervals.countdown);
            this.intervals.countdown = null;
        }
        if (this.intervals.rest) {
            clearInterval(this.intervals.rest);
            this.intervals.rest = null;
        }
    }

    calculateWorkoutDuration() {
        const exerciseDuration = 30; // Average exercise duration
        const restDuration = 10; // Rest between exercises
        const totalDuration = (this.exercises.length * exerciseDuration) + ((this.exercises.length - 1) * restDuration);
        return Math.round(totalDuration / 60);
    }

    // Data management
    async saveWorkoutData(timerData = null) {
        try {
            const actualDuration = timerData ? timerData.duration : this.calculateWorkoutDuration();
            const actualDurationSeconds = timerData && typeof timerData.durationSeconds === 'number' ? timerData.durationSeconds : (actualDuration * 60);
            
            const workoutData = {
                workoutType: this.config.name,
                completedDate: new Date().toISOString(),
                exercisesCompleted: this.exercises.length,
                totalExercises: this.exercises.length,
                completionRate: 100,
                duration: actualDuration,
                actualStartTime: timerData ? timerData.start_time : null,
                actualEndTime: timerData ? timerData.end_time : null,
                timestamp: Date.now()
            };

            console.log('💾 Saving workout data:', workoutData);

            // Save to localStorage
            let workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            workoutHistory.push(workoutData);
            if (workoutHistory.length > 50) {
                workoutHistory = workoutHistory.slice(-50);
            }
            localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));

            // Update stats
            this.updateWorkoutStats(workoutData);

            // Save to server if authenticated
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch('http://localhost:3000/api/workouts/add', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            workout_type: this.config.type.toLowerCase(),
                            exercise_name: this.config.name,
                            sets: this.exercises.length,
                            reps: 0,
                            duration: actualDuration, // minutes for backward compatibility
                            duration_seconds: actualDurationSeconds, // accurate seconds
                            weight: 0,
                            calories_burned: 0,
                            notes: `Completed ${this.exercises.length} exercises`
                        })
                    });

                    if (response.ok) {
                        console.log('✅ Workout data saved to server');
                        window.dispatchEvent(new CustomEvent('workoutCompleted', {
                            detail: { workoutType: this.config.type.toLowerCase(), data: workoutData }
                        }));
                    }
                } catch (serverError) {
                    console.warn('⚠️ Server unavailable, but localStorage saved:', serverError);
                }
            }
            
        } catch (error) {
            console.error('❌ Error saving workout data:', error);
        }
    }

    updateWorkoutStats(workoutData) {
        try {
            let stats = JSON.parse(localStorage.getItem('workoutStats') || '{}');
            
            if (!stats.workoutTypes) stats.workoutTypes = {};
            if (!stats.totalWorkouts) stats.totalWorkouts = 0;
            if (!stats.totalDuration) stats.totalDuration = 0;
            if (!stats.recentWorkouts) stats.recentWorkouts = [];
            
            stats.totalWorkouts++;
            stats.totalDuration += workoutData.duration || 0;
            
            const workoutType = workoutData.workoutType || this.config.name;
            if (!stats.workoutTypes[workoutType]) {
                stats.workoutTypes[workoutType] = 0;
            }
            stats.workoutTypes[workoutType]++;
            
            stats.recentWorkouts.unshift({
                type: workoutType,
                date: workoutData.completedDate,
                duration: workoutData.duration
            });
            if (stats.recentWorkouts.length > 10) {
                stats.recentWorkouts = stats.recentWorkouts.slice(0, 10);
            }
            
            localStorage.setItem('workoutStats', JSON.stringify(stats));
            localStorage.setItem('workoutCompleted', 'true');
            
            console.log('📊 Workout stats updated:', stats);
            
        } catch (error) {
            console.error('❌ Error updating workout stats:', error);
        }
    }

    // Event listener setup
    setupEventListeners() {
        document.getElementById("next-btn").addEventListener("click", this.handleNext);
        document.getElementById("skip-btn").addEventListener("click", this.handleSkip);
        document.getElementById("back-btn").addEventListener("click", this.handleBack);

        document.getElementById('quitModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.uiManager.hideQuitModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.uiManager.hideQuitModal();
            }
        });
    }
}

// Enhanced Speech Manager
class SpeechManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.isEnabled = true;
        this.currentUtterance = null;
        this.queue = [];
        this.isSpeaking = false;
        
        // Create speech indicator
        this.createSpeechIndicator();
    }

    createSpeechIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'speech-indicator';
        indicator.className = 'speech-indicator';
        indicator.setAttribute('aria-live', 'polite');
        document.body.appendChild(indicator);
    }

    speak(text, priority = false, delay = 0) {
        if (!this.isEnabled || !this.synthesis) return;

        // Clear queue if priority message
        if (priority) {
            this.clearQueue();
        }

        // Add to queue with delay
        setTimeout(() => {
            this.addToQueue(text);
        }, delay);
    }

    addToQueue(text) {
        const cleanText = text
            .replace(/[^a-zA-Z0-9\s\-]/g, '')
            .replace(/-/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        this.queue.push(cleanText);
        this.processQueue();
    }

    processQueue() {
        if (this.isSpeaking || this.queue.length === 0) return;

        const text = this.queue.shift();
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.currentUtterance = utterance;
            this.showSpeechIndicator(text);
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.hideSpeechIndicator();
            // Process next item in queue after a brief pause
            setTimeout(() => this.processQueue(), 300);
        };
        
        utterance.onerror = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.hideSpeechIndicator();
            setTimeout(() => this.processQueue(), 300);
        };

        this.synthesis.speak(utterance);
    }

    showSpeechIndicator(text) {
        const indicator = document.getElementById('speech-indicator');
        if (indicator) {
            indicator.textContent = `🔊 ${text}`;
            indicator.classList.add('active', 'speaking');
        }
    }

    hideSpeechIndicator() {
        const indicator = document.getElementById('speech-indicator');
        if (indicator) {
            indicator.classList.remove('active', 'speaking');
        }
    }

    clearQueue() {
        this.queue = [];
        if (this.currentUtterance) {
            this.synthesis.cancel();
        }
    }

    stop() {
        this.clearQueue();
        this.synthesis.cancel();
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.hideSpeechIndicator();
    }
}

// Enhanced UI Manager
class WorkoutUIManager {
    constructor() {
        this.elements = this.getElements();
    }

    getElements() {
        return {
            timer: document.getElementById("timer"),
            status: document.getElementById("status"),
            workoutName: document.getElementById("workout-name"),
            workoutCounter: document.getElementById("workout-counter"),
            exerciseDescription: document.getElementById("exercise-description"),
            exerciseTips: document.getElementById("exercise-tips"),
            progressBar: document.getElementById("progress-bar"),
            breakElement: document.getElementById("break"),
            videoSource: document.getElementById("video-source"),
            exerciseVideo: document.getElementById("exercise-video"),
            progressContainer: document.getElementById("progress-container"),
            exerciseInfo: document.getElementById("exercise-info"),
            videoContainer: document.querySelector(".video-container"),
            nextBtn: document.getElementById("next-btn"),
            skipBtn: document.getElementById("skip-btn"),
            backBtn: document.getElementById("back-btn"),
            celebrationContainer: document.getElementById("celebration-container"),
            celebrationVideo: document.getElementById("celebration-video"),
            quitModal: document.getElementById('quitModal')
        };
    }

    updateStatus(status) {
        if (this.elements.status) {
            this.elements.status.innerText = status;
        }
    }

    showCountdown(count) {
        if (this.elements.timer) {
            this.elements.timer.textContent = count;
            this.elements.timer.classList.remove("is-hidden");
            this.elements.timer.classList.add("countdown-active");
        }
    }

    updateCountdown(count) {
        if (this.elements.timer) {
            this.elements.timer.textContent = count;
        }
    }

    showWorkoutMode() {
        if (this.elements.timer) {
            this.elements.timer.classList.remove("countdown-active");
            this.elements.timer.classList.add("workout-active");
            this.elements.timer.textContent = "GO!";
        }
    }

    showWorkoutControls() {
        const elementsToShow = [
            this.elements.progressContainer,
            this.elements.exerciseInfo,
            this.elements.videoContainer,
            this.elements.nextBtn,
            this.elements.skipBtn,
            this.elements.backBtn
        ];

        elementsToShow.forEach(element => {
            if (element) {
                element.classList.remove("is-hidden");
                element.classList.add("slide-in-up");
            }
        });
    }

    updateExercise(exercise, index, totalExercises) {
        // Update video
        if (this.elements.videoSource && this.elements.exerciseVideo) {
            this.elements.videoSource.src = exercise.video;
            this.elements.exerciseVideo.load();
        }

        // Update exercise info
        if (this.elements.workoutName) {
            this.elements.workoutName.innerText = exercise.name;
        }

        // Update counter (only counting actual exercises, not rest periods)
        if (this.elements.workoutCounter) {
            this.elements.workoutCounter.innerText = `Exercise ${index + 1} of ${totalExercises}`;
        }

        if (this.elements.timer) {
            this.elements.timer.innerText = index + 1;
        }

        // Update exercise details
        if (this.elements.exerciseDescription) {
            this.elements.exerciseDescription.innerText = exercise.description;
        }

        if (this.elements.exerciseTips) {
            this.elements.exerciseTips.innerText = exercise.tip;
        }

        // Update progress bar (based on actual exercises only)
        const progressPercentage = ((index + 1) / totalExercises) * 100;
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = progressPercentage + "%";
        }
    }

    showRest(restTime) {
        if (this.elements.breakElement) {
            this.elements.breakElement.classList.remove("is-hidden");
            this.elements.breakElement.innerHTML = `
                <div class="rest-container">
                    <div class="rest-message">Take a Rest</div>
                    <div class="rest-time">${restTime}s</div>
                    <div class="rest-message">Get ready for the next exercise</div>
                </div>
            `;
        }
    }

    updateRest(restTime) {
        const restTimeElement = this.elements.breakElement?.querySelector('.rest-time');
        if (restTimeElement) {
            restTimeElement.textContent = `${restTime}s`;
        }
    }

    hideRest() {
        if (this.elements.breakElement) {
            this.elements.breakElement.classList.add("is-hidden");
        }
    }

    showCompletion() {
        // Hide workout elements
        const elementsToHide = [
            this.elements.videoContainer,
            this.elements.nextBtn,
            this.elements.skipBtn,
            this.elements.backBtn,
            this.elements.breakElement,
            this.elements.progressContainer,
            this.elements.exerciseInfo
        ];

        elementsToHide.forEach(element => {
            if (element) {
                element.classList.add("is-hidden");
            }
        });

        // Show completion
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = "100%";
        }

        if (this.elements.celebrationContainer) {
            this.elements.celebrationContainer.style.display = "flex";
        }

        // Play celebration video
        if (this.elements.celebrationVideo) {
            this.elements.celebrationVideo.play().catch(e => console.log('Video autoplay prevented'));
        }
    }

    addNavigationButtons() {
        if (!this.elements.celebrationContainer || document.getElementById("nav-button")) return;

        const buttonContainer = document.createElement("div");
        buttonContainer.style.cssText = `display: flex; gap: 15px; margin-top: 30px; flex-wrap: wrap; justify-content: center; position: relative; z-index: 20;`;

        const mainButton = document.createElement("button");
        mainButton.id = "nav-button";
        mainButton.innerHTML = "Main Page";
        mainButton.className = "control-btn";
        mainButton.style.cssText = `background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 15px 25px; font-size: 18px; font-weight: 600; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);`;

        const homeButton = document.createElement("button");
        homeButton.innerHTML = "View Stats";
        homeButton.className = "control-btn";
        homeButton.style.cssText = `background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; padding: 15px 25px; font-size: 18px; font-weight: 600; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 20px rgba(40, 167, 69, 0.4);`;

        mainButton.onclick = () => window.location.href = "../main.html";
        homeButton.onclick = () => window.location.href = "../Home.html";

        buttonContainer.appendChild(mainButton);
        buttonContainer.appendChild(homeButton);
        this.elements.celebrationContainer.appendChild(buttonContainer);
    }

    showQuitModal() {
        if (this.elements.quitModal) {
            this.elements.quitModal.style.display = 'flex';
        }
    }

    hideQuitModal() {
        if (this.elements.quitModal) {
            this.elements.quitModal.style.display = 'none';
        }
    }
}

// Export for use in workout pages
window.WorkoutEngine = WorkoutEngine;
window.SpeechManager = SpeechManager;
window.WorkoutUIManager = WorkoutUIManager;
