(function() {
    'use strict';

    let currentUnit = 'metric';
    let userBMIHistory = [];

    function initializeBMICalculator() {
        console.log('🔧 Initializing BMI Calculator...');

        // Migrate legacy BMI data to user-specific storage
        migrateLegacyBMIData();

        // Load saved BMI data on page load
        loadSavedBMIData();

        // Setup event listeners
        setupBMIEventListeners();

        console.log('✅ BMI Calculator initialized successfully');
    }

    function migrateLegacyBMIData() {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                console.log('⚠️ No user logged in, skipping BMI data migration');
                return;
            }

            // Check if legacy data exists
            const legacyProfile = localStorage.getItem('userBMIProfile');
            const legacyHistory = localStorage.getItem('userBMIHistory');

            if (legacyProfile || legacyHistory) {
                console.log('🔄 Migrating legacy BMI data to user-specific storage for user', userId);

                // Migrate profile data
                if (legacyProfile) {
                    try {
                        const profile = JSON.parse(legacyProfile);
                        profile.userId = userId; // Add user ID to the data
                        
                        const userSpecificKey = getUserSpecificKey('userBMIProfile');
                        localStorage.setItem(userSpecificKey, JSON.stringify(profile));
                        
                        console.log('✅ Migrated BMI profile data');
                    } catch (error) {
                        console.error('❌ Error migrating BMI profile:', error);
                    }
                }

                // Migrate history data
                if (legacyHistory) {
                    try {
                        const history = JSON.parse(legacyHistory);
                        const userSpecificKey = getUserSpecificKey('userBMIHistory');
                        localStorage.setItem(userSpecificKey, JSON.stringify(history));
                        
                        console.log('✅ Migrated BMI history data');
                    } catch (error) {
                        console.error('❌ Error migrating BMI history:', error);
                    }
                }

                // Clean up legacy data after successful migration
                localStorage.removeItem('userBMIProfile');
                localStorage.removeItem('userBMIHistory');
                
                console.log('✅ Legacy BMI data migration completed and cleaned up');
            }
        } catch (error) {
            console.error('❌ Error during BMI data migration:', error);
        }
    }

    function setupBMIEventListeners() {
        // Wait for DOM elements to be available
        const checkElements = () => {
            const metricBtn = document.getElementById('metricBtn');
            const mixedBtn = document.getElementById('mixedBtn');
            const imperialBtn = document.getElementById('imperialBtn');
            const calculateBtn = document.getElementById('calculateBMI');
            const saveBtn = document.getElementById('saveBMI');

            console.log('🔍 Checking BMI elements:', {
                metricBtn: !!metricBtn,
                mixedBtn: !!mixedBtn,
                imperialBtn: !!imperialBtn,
                calculateBtn: !!calculateBtn,
                saveBtn: !!saveBtn
            });

            if (metricBtn && mixedBtn && imperialBtn && calculateBtn && saveBtn) {
                // All elements are available, set up event listeners
                console.log('🎯 BMI calculator elements found, setting up event listeners');

                metricBtn.addEventListener('click', () => switchUnit('metric'));
                mixedBtn.addEventListener('click', () => switchUnit('mixed'));
                imperialBtn.addEventListener('click', () => switchUnit('imperial'));

                calculateBtn.addEventListener('click', calculateBMI);

                saveBtn.addEventListener('click', async function() {
                    console.log('💾 Save BMI button clicked');
                    await saveBMIToLocalStorage();
                });

                console.log('✅ BMI calculator event listeners attached');
            } else {
                console.log('⏳ BMI calculator elements not ready, retrying...');
                setTimeout(checkElements, 100);
            }
        };

        checkElements();
    }

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

    function getUserSpecificKey(baseKey) {
        const userId = getCurrentUserId();
        return userId ? `${baseKey}_user_${userId}` : baseKey;
    }

    function loadSavedBMIData() {
        console.log('💾 Loading saved BMI data from local storage');

        // Wait for DOM elements to be available
        const checkElementsForData = () => {
            const heightInput = document.getElementById('height');
            const weightInput = document.getElementById('weight');

            if (heightInput && weightInput) {
                // Elements are available, load data
                loadData();
            } else {
                setTimeout(checkElementsForData, 100);
            }
        };

        const loadData = () => {
            try {
                const userId = getCurrentUserId();
                if (!userId) {
                    console.log('⚠️ No user logged in, skipping BMI data load');
                    return;
                }

                const userSpecificKey = getUserSpecificKey('userBMIProfile');
                const savedProfile = localStorage.getItem(userSpecificKey);
                
                if (savedProfile) {
                    const profile = JSON.parse(savedProfile);
                    console.log('📊 Found saved profile for user', userId, ':', profile);

                    // Get elements directly in this function
                    const heightInput = document.getElementById('height');
                    const weightInput = document.getElementById('weight');

                    // Fill form with saved data
                    if (heightInput && profile.height) {
                        heightInput.value = profile.height;
                    }
                    if (weightInput && profile.weight) {
                        weightInput.value = profile.weight;
                    }

                    console.log('✅ BMI data loaded and displayed for user', userId);
                } else {
                    console.log('ℹ No saved BMI data found for user', userId);
                }
            } catch (error) {
                console.error('❌ Error loading saved BMI data:', error);
            }
        };

        checkElementsForData();
    }

    function testLocalStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            console.log('✅ localStorage is working');
            return true;
        } catch (error) {
            console.error('❌ localStorage is not working:', error);
            return false;
        }
    }

    async function saveBMIToLocalStorage() {
        console.log('🔧 saveBMIToLocalStorage function called');

        // Check if user is logged in
        const userId = getCurrentUserId();
        if (!userId) {
            alert('Please log in to save your BMI data.');
            return;
        }

        // Test localStorage first
        if (!testLocalStorage()) {
            alert('localStorage is not available. Please check your browser settings.');
            return;
        }

        const inputs = getCurrentInputs();
        console.log('📊 Current inputs:', inputs);
        console.log('🔧 Current unit:', currentUnit);

        if (!validateInputs(inputs.height, inputs.weight, currentUnit)) {
            console.error('❌ Input validation failed for:', { height: inputs.height, weight: inputs.weight, unit: currentUnit });
            return;
        }

        console.log('✅ Input validation passed');

        const bmi = calculateBMIValue(inputs.height, inputs.weight, currentUnit);
        const category = getBMICategory(bmi);

        console.log('💾 Saving BMI to local storage for user', userId, ':', { inputs, bmi, category });

        try {
            const profileData = {
                userId: userId,
                height: inputs.height,
                weight: inputs.weight,
                bmi: bmi,
                category: category,
                unit: currentUnit,
                savedAt: new Date().toISOString()
            };

            // Use user-specific keys
            const profileKey = getUserSpecificKey('userBMIProfile');
            const historyKey = getUserSpecificKey('userBMIHistory');

            localStorage.setItem(profileKey, JSON.stringify(profileData));

            // Load existing history for this user
            let userHistory = [];
            try {
                const existingHistory = localStorage.getItem(historyKey);
                if (existingHistory) {
                    userHistory = JSON.parse(existingHistory);
                }
            } catch (error) {
                console.warn('Error loading existing BMI history:', error);
            }

            // Update BMI history
            userHistory.unshift({
                date: new Date().toISOString(),
                bmi: bmi,
                category: category,
                height: inputs.height,
                weight: inputs.weight,
                unit: currentUnit
            });

            // Keep only last 10 entries
            userHistory = userHistory.slice(0, 10);
            localStorage.setItem(historyKey, JSON.stringify(userHistory));

            alert('BMI data saved successfully!');
            console.log('✅ BMI data saved to local storage for user', userId);

            // Trigger BMI update on home page if we're on the home page
            if (window.location.pathname.includes('Home.html') || window.location.pathname.endsWith('/')) {
                // Update the current BMI display immediately
                const currentBMIElement = document.getElementById('currentBMI');
                if (currentBMIElement && typeof window.animateNumber === 'function') {
                    window.animateNumber('currentBMI', bmi, 1);
                    console.log('🔄 Updated current BMI display on home page');
                }
            }

            // Save to database as well (always send metric: height cm, weight kg)
            let dbHeightCm = inputs.height;
            let dbWeightKg = inputs.weight;
            if (currentUnit === 'mixed') {
                // height in inches -> cm; weight already kg
                dbHeightCm = Math.round((inputs.height * 2.54) * 10) / 10;
            } else if (currentUnit === 'imperial') {
                // height in inches -> cm; weight in lbs -> kg
                dbHeightCm = Math.round((inputs.height * 2.54) * 10) / 10;
                dbWeightKg = Math.round((inputs.weight * 0.453592) * 10) / 10;
            }
            await saveBMIToDatabase(dbHeightCm, dbWeightKg, bmi);

            // Dispatch custom event for other pages that might be listening
            window.dispatchEvent(new CustomEvent('bmiSaved', {
                detail: { bmi: bmi, category: category, savedAt: new Date().toISOString(), userId: userId }
            }));

        } catch (error) {
            console.error('❌ Local storage save failed:', error);
            alert('Failed to save BMI data. Please check your browser settings.');
        }
    }

    async function saveBMIToDatabase(height, weight, bmi) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('⚠️ No token available, skipping database save');
                return;
            }

            console.log('💾 Saving BMI to database:', { height, weight, bmi });

            const response = await fetch('http://localhost:3000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    height: height,
                    weight: weight,
                    bmi: bmi
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ BMI saved to database successfully');
            } else {
                console.warn('⚠️ Failed to save BMI to database:', response.status);
            }
        } catch (error) {
            console.error('❌ Error saving BMI to database:', error);
        }
    }

    function switchUnit(unit) {
        currentUnit = unit;

        // Update button states
        const metricBtn = document.getElementById('metricBtn');
        const mixedBtn = document.getElementById('mixedBtn');
        const imperialBtn = document.getElementById('imperialBtn');

        if (metricBtn) metricBtn.classList.toggle('active', unit === 'metric');
        if (mixedBtn) mixedBtn.classList.toggle('active', unit === 'mixed');
        if (imperialBtn) imperialBtn.classList.toggle('active', unit === 'imperial');

        // Update UI elements
        updateUIForUnit(unit);

        // Clear any previous results
        const bmiResult = document.getElementById('bmiResult');
        const saveBtn = document.getElementById('saveBMI');
        if (bmiResult) bmiResult.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'none';
    }

    function updateUIForUnit(unit) {
        const heightLabel = document.querySelector('label[for="height"]');
        const weightLabel = document.querySelector('label[for="weight"]');
        const heightUnit = document.getElementById('heightUnit');
        const weightUnit = document.getElementById('weightUnit');
        const heightInput = document.getElementById('height');
        const weightInput = document.getElementById('weight');
        const heightFeetInput = document.getElementById('heightFeet');
        const heightInchesInput = document.getElementById('heightInches');

        if (unit === 'metric') {
            if (heightLabel) heightLabel.textContent = 'Height (cm)';
            if (weightLabel) weightLabel.textContent = 'Weight (kg)';
            if (heightUnit) heightUnit.textContent = 'cm';
            if (weightUnit) weightUnit.textContent = 'kg';

            // Show metric inputs, hide imperial
            if (heightInput) heightInput.style.display = 'block';
            if (heightFeetInput) heightFeetInput.style.display = 'none';
            if (heightUnit) heightUnit.style.display = 'inline';
            if (heightInchesInput) heightInchesInput.style.display = 'none';

            // Update placeholders and ranges
            if (heightInput) {
                heightInput.placeholder = '170';
                heightInput.min = '50';
                heightInput.max = '250';
            }
            if (weightInput) {
                weightInput.placeholder = '70';
                weightInput.min = '20';
                weightInput.max = '300';
            }
        } else if (unit === 'mixed') {
            if (heightLabel) heightLabel.textContent = 'Height (ft/in)';
            if (weightLabel) weightLabel.textContent = 'Weight (kg)';
            if (heightUnit) heightUnit.style.display = 'none';
            if (weightUnit) weightUnit.textContent = 'kg';

            // Show imperial height inputs, metric weight
            if (heightInput) heightInput.style.display = 'none';
            if (heightFeetInput) heightFeetInput.style.display = 'inline-block';
            if (heightInchesInput) heightInchesInput.style.display = 'inline-block';

            // Update placeholders and ranges
            if (heightFeetInput) heightFeetInput.placeholder = '5';
            if (heightInchesInput) heightInchesInput.placeholder = '8';
            if (weightInput) {
                weightInput.placeholder = '70';
                weightInput.min = '20';
                weightInput.max = '300';
            }
        } else {
            if (heightLabel) heightLabel.textContent = 'Height (ft/in)';
            if (weightLabel) weightLabel.textContent = 'Weight (lbs)';
            if (heightUnit) heightUnit.style.display = 'none';
            if (weightUnit) weightUnit.textContent = 'lbs';

            // Show imperial inputs
            if (heightInput) heightInput.style.display = 'none';
            if (heightFeetInput) heightFeetInput.style.display = 'inline-block';
            if (heightInchesInput) heightInchesInput.style.display = 'inline-block';

            // Update placeholders and ranges
            if (heightFeetInput) heightFeetInput.placeholder = '5';
            if (heightInchesInput) heightInchesInput.placeholder = '8';
            if (weightInput) {
                weightInput.placeholder = '150';
                weightInput.min = '50';
                weightInput.max = '600';
            }
        }
    }

    function getCurrentInputs() {
        if (currentUnit === 'metric') {
            return {
                height: parseFloat(document.getElementById('height')?.value) || 0,
                weight: parseFloat(document.getElementById('weight')?.value) || 0
            };
        } else {
            const feet = parseFloat(document.getElementById('heightFeet')?.value) || 0;
            const inches = parseFloat(document.getElementById('heightInches')?.value) || 0;
            const totalInches = (feet * 12) + inches;
            return {
                height: totalInches,
                weight: parseFloat(document.getElementById('weight')?.value) || 0
            };
        }
    }

    function validateInputs(height, weight, unit) {
        if (unit === 'metric') {
            if (!height || height < 50 || height > 250) {
                alert('Please enter a valid height between 50-250 cm');
                return false;
            }
            if (!weight || weight < 20 || weight > 300) {
                alert('Please enter a valid weight between 20-300 kg');
                return false;
            }
        } else if (unit === 'mixed') {
            // Mixed: height in inches, weight in kg
            if (!height || height < 48 || height > 96) {
                alert('Please enter a valid height between 4-8 feet');
                return false;
            }
            if (!weight || weight < 20 || weight > 300) {
                alert('Please enter a valid weight between 20-300 kg');
                return false;
            }
        } else {
            // Imperial: height in inches, weight in pounds
            if (!height || height < 48 || height > 96) {
                alert('Please enter a valid height between 4-8 feet');
                return false;
            }
            if (!weight || weight < 50 || weight > 600) {
                alert('Please enter a valid weight between 50-600 lbs');
                return false;
            }
        }
        return true;
    }

    async function calculateBMI() {
        const inputs = getCurrentInputs();
        if (!validateInputs(inputs.height, inputs.weight, currentUnit)) {
            return;
        }

        const bmi = calculateBMIValue(inputs.height, inputs.weight, currentUnit);
        const category = getBMICategory(bmi);
        const description = getBMIDescription(category);

        displayBMIResult(bmi, category, description);

        console.log(`🧮 BMI Calculated: ${bmi.toFixed(1)} (${category})`);
    }

    function calculateBMIValue(height, weight, unit) {
        let heightInMeters, weightInKg;

        if (unit === 'metric') {
            // Height in cm, weight in kg
            heightInMeters = height / 100;
            weightInKg = weight;
        } else if (unit === 'mixed') {
            // Height in inches, weight in kg
            heightInMeters = height * 0.0254; // inches to meters
            weightInKg = weight; // already in kg
        } else {
            // Height in inches, weight in pounds - convert to metric
            heightInMeters = height * 0.0254; // inches to meters
            weightInKg = weight * 0.453592; // pounds to kg
        }

        return weightInKg / (heightInMeters * heightInMeters);
    }

    function getBMICategory(bmi) {
        if (bmi < 18.5) return 'underweight';
        if (bmi < 25) return 'normal';
        if (bmi < 30) return 'overweight';
        return 'obese';
    }

    function getBMIDescription(category) {
        const descriptions = {
            underweight: 'You are underweight. Consider consulting a healthcare professional for personalized advice.',
            normal: 'Your BMI is within the normal range. Maintain a healthy lifestyle!',
            overweight: 'You are overweight. Focus on balanced nutrition and regular exercise.',
            obese: 'Your BMI indicates obesity. Consult a healthcare professional for guidance.'
        };
        return descriptions[category] || '';
    }

    function displayBMIResult(bmi, category, description) {
        const bmiResult = document.getElementById('bmiResult');
        const bmiValue = document.getElementById('bmiValue');
        const bmiCategory = document.getElementById('bmiCategory');
        const bmiDescription = document.getElementById('bmiDescription');
        const saveBtn = document.getElementById('saveBMI');

        if (bmiValue) bmiValue.textContent = bmi.toFixed(1);
        if (bmiCategory) {
            bmiCategory.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            bmiCategory.className = `bmi-category bmi-${category}`;
        }
        if (bmiDescription) bmiDescription.textContent = description;

        if (bmiResult) bmiResult.style.display = 'block';
        if (saveBtn) saveBtn.style.display = 'inline-block';

        // Animate the result
        if (bmiResult) {
            bmiResult.style.animation = 'none';
            setTimeout(() => {
                bmiResult.style.animation = 'fadeInUp 0.5s ease-out';
            }, 10);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeBMICalculator);
    } else {
        initializeBMICalculator();
    }

})();
