// Global Theme Management System for FITNESS GUIDE
class ThemeManager {
    constructor() {
        this.themeKey = 'theme';
        this.initialized = false;

        // Prevent multiple initializations
        if (window.themeManager && window.themeManager.initialized) {
            console.log('🎨 Theme manager already initialized, skipping...');
            return;
        }

        console.log('🎨 ThemeManager constructor called');
        this.init();
    }

    init() {
        console.log('🎨 ThemeManager init() called');
        try {
            // Apply saved theme on page load
            this.applySavedTheme();

            // Set up theme toggle listeners
            this.setupThemeToggle();

            this.initialized = true;
            console.log('✅ Theme manager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing theme manager:', error);
        }
    }

    applySavedTheme() {
        try {
            const savedTheme = localStorage.getItem(this.themeKey);
            console.log('💾 Saved theme from localStorage:', savedTheme);

            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
                this.updateThemeIcons('dark');
                console.log('🌙 Applied dark theme');
            } else {
                document.body.classList.remove('dark-mode');
                this.updateThemeIcons('light');
                console.log('☀️ Applied light theme');
            }

            // Force re-application of theme styles
            this.forceThemeUpdate();
        } catch (error) {
            console.error('❌ Error applying saved theme:', error);
        }
    }

    forceThemeUpdate() {
        // Force update all theme-dependent elements
        const workoutLayout = document.querySelector('.workout-layout');
        const workoutSidebar = document.querySelector('.workout-sidebar');
        const workoutMain = document.querySelector('.workout-main');
        const videoSection = document.querySelector('.video-section');

        if (workoutLayout) workoutLayout.style.display = 'flex';
        if (workoutSidebar) workoutSidebar.style.display = 'flex';
        if (workoutMain) workoutMain.style.display = 'flex';
        if (videoSection) videoSection.style.display = 'flex';

        console.log('🔄 Forced theme update applied');
    }

    toggleTheme() {
        try {
            const isDarkMode = document.body.classList.contains('dark-mode');
            const newTheme = isDarkMode ? 'light' : 'dark';
            console.log(`🎨 Toggling theme from ${isDarkMode ? 'dark' : 'light'} to ${newTheme}`);

            if (isDarkMode) {
                document.body.classList.remove('dark-mode');
            } else {
                document.body.classList.add('dark-mode');
            }

            localStorage.setItem(this.themeKey, newTheme);
            this.updateThemeIcons(newTheme);

            // Force re-application of theme styles to workout elements
            this.forceThemeUpdate();

            // Dispatch custom event for other scripts to listen to
            window.dispatchEvent(new CustomEvent('themeChanged', {
                detail: { theme: newTheme }
            }));

            console.log(`✅ Theme toggled to: ${newTheme}`);
        } catch (error) {
            console.error('❌ Error toggling theme:', error);
        }
    }

    updateThemeIcons(theme) {
        try {
            const themeIcons = document.querySelectorAll('[id*="themeIcon"]');
            console.log(`🎨 Found ${themeIcons.length} theme icons`);

            themeIcons.forEach(icon => {
                if (theme === 'dark') {
                    icon.textContent = '☀️';
                } else {
                    icon.textContent = '🌙';
                }
            });

            // Also update theme text elements
            const themeTexts = document.querySelectorAll('[id*="themeText"]');
            console.log(`🎨 Found ${themeTexts.length} theme text elements`);

            themeTexts.forEach(text => {
                if (theme === 'dark') {
                    text.textContent = 'Light Mode';
                } else {
                    text.textContent = 'Dark Mode';
                }
            });

            console.log(`✅ Theme icons updated to ${theme} mode`);
        } catch (error) {
            console.error('❌ Error updating theme icons:', error);
        }
    }

    setupThemeToggle() {
        try {
            console.log('🎨 Setting up theme toggle buttons...');

            // Use a more direct approach - look for buttons by their specific IDs first
            const possibleButtons = [
                'themeToggleNav',
                'themeToggle',
                'theme-toggle'
            ];

            let buttonsFound = [];

            possibleButtons.forEach(buttonId => {
                const button = document.getElementById(buttonId);
                if (button && !buttonsFound.includes(button)) {
                    buttonsFound.push(button);
                    console.log(`✅ Found theme button: ${buttonId}`);
                } else if (button) {
                    console.log(`⚠️ Button ${buttonId} already processed`);
                } else {
                    console.log(`❌ Theme button not found: ${buttonId}`);
                }
            });

            // Also look for buttons by class name (but avoid duplicates)
            const classButtons = document.querySelectorAll('button[class*="theme"]');
            classButtons.forEach(button => {
                if (!buttonsFound.includes(button) && !button.hasAttribute('data-theme-setup')) {
                    buttonsFound.push(button);
                    console.log(`✅ Found theme button by class: ${button.className}`);
                }
            });

            console.log(`🎨 Total unique theme buttons found: ${buttonsFound.length}`);

            if (buttonsFound.length > 0) {
                buttonsFound.forEach((toggle, index) => {
                    console.log(`🎨 Setting up theme toggle button ${index + 1}:`, toggle.id || toggle.className);

                    // Mark as setup to prevent duplicates
                    toggle.setAttribute('data-theme-setup', 'true');

                    // Remove any existing event listeners for this specific handler
                    toggle.removeEventListener('click', this.handleThemeClick);

                    // Add new event listener with a unique handler method
                    toggle.addEventListener('click', this.handleThemeClick.bind(this));

                    console.log(`✅ Theme toggle button ${toggle.id || 'unnamed'} setup complete`);
                });
                console.log('✅ All theme toggle buttons setup complete');
            } else {
                console.log('⏳ No theme toggle buttons found, will retry in 500ms...');
                // Retry after a longer delay
                setTimeout(() => this.setupThemeToggle(), 500);
            }
        } catch (error) {
            console.error('❌ Error setting up theme toggle:', error);
        }
    }

    // Separate handler method to avoid conflicts
    handleThemeClick(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎨 Theme toggle clicked!');
        this.toggleTheme();
        return false;
    }

    getCurrentTheme() {
        return document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    }
}

// Initialize theme manager
let themeManagerInstance = null;

try {
    console.log('🎨 Initializing global theme manager...');

    // Initialize immediately if DOM is ready
    if (document.readyState !== 'loading') {
        console.log('🎨 DOM ready, initializing theme manager...');
        themeManagerInstance = new ThemeManager();
        window.themeManager = themeManagerInstance;
    } else {
        console.log('🎨 DOM loading, setting up event listener...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🎨 DOMContentLoaded fired, initializing theme manager...');
            // Prevent multiple initializations
            if (!themeManagerInstance) {
                themeManagerInstance = new ThemeManager();
                window.themeManager = themeManagerInstance;
            }
        });
    }

    console.log('✅ Theme manager initialization setup complete');
} catch (error) {
    console.error('❌ Error setting up theme manager initialization:', error);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
