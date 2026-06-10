# FITNESS GUIDE

A modern, comprehensive fitness tracking web application with interactive workout sessions, BMI calculator, progress monitoring, and admin management system.

## Key Features

### Core Functionality
- Interactive Workout Sessions - Guided video workouts with real-time timer and voice instructions
- BMI Calculator & Health Metrics - Track body mass index with smart recommendations
- Progress Tracking - Comprehensive fitness journey monitoring with detailed statistics
- User Authentication - Secure JWT-based login system with profile management
- Admin Dashboard - Complete user management with workout analytics and contact system
- Responsive Design - Optimized for desktop, tablet, and mobile devices

### Workout Features
- **5 Interactive Workout Sessions**: Abs, Arms, Chest, Legs, Shoulders & Back
- **5 Workout Overview Pages**: Static workout information and guidance
- **Real-time Timer** - Accurate workout duration tracking with voice guidance
- **Exercise Videos** - 26 demonstration videos for proper form
- **Progress Visualization** - Exercise completion tracking and celebration
- **Workout History** - Personal fitness timeline and statistics

### Analytics & Tracking
- Total Workout Time - Cumulative fitness activity tracking
- Last Activity Monitoring - User engagement insights
- BMI Trend Analysis - Health progress over time
- Admin Insights - User statistics and engagement metrics

## Quick Setup

### Prerequisites
- Node.js (v14.0.0 or higher)
- MySQL (v8.0 or higher)
- npm (v6.0.0 or higher)

### Installation Steps

1. Clone & Install
   ```bash
   git clone <repository-url>
   cd fitness-guide
   npm install
   ```

2. Database Setup
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE fitness_guide;"
   
   # Setup tables
   mysql -u root -p fitness_guide < setup_database.sql
   ```

3. Environment Configuration
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your settings:
   # DB_HOST=localhost
   # DB_USER=root
   # DB_PASSWORD=your_password
   # DB_NAME=fitness_guide
   # JWT_SECRET=your_jwt_secret_key
   ```

4. Start Application
   ```bash
   npm start
   ```

5. Access Application
   - Main App: https://fitness-guide-howq.onrender.com
   - Admin Panel: http://localhost:3000/admin-login.html

## Project Architecture

```
fitness-guide/
├── assets/                    # Frontend Assets
│   ├── css/                      # Stylesheets
│   │   ├── style.css            # Main styles
│   │   ├── sections.css         # Section-specific styles
│   │   └── workout-styles.css   # Workout page styles
│   ├── js/                      # JavaScript modules
│   │   ├── script.js            # Main application logic
│   │   ├── theme-manager.js     # Theme switching
│   │   ├── workout-timer.js     # Workout timing system
│   │   ├── workout-engine.js    # Workout management
│   │   └── workout-data-manager.js # Data persistence
│   └── images/                  # Static images
│
├── config/                   # Configuration
│   ├── database.js             # Database connection & setup
│   └── database_sqlite.js      # SQLite fallback (unused)
│
├── middleware/               # Express Middleware
│   ├── auth.js                 # JWT authentication
│   ├── errorHandler.js         # Error handling
│   └── validation.js           # Input validation
│
├── routes/                   # API Routes
│   ├── auth.js                 # Authentication endpoints
│   ├── workouts.js             # Workout management
│   ├── reports.js              # Analytics & reports
│   ├── contact.js              # Contact form handling
│   └── admin.js                # Admin panel APIs
│
├── sub-workout/              # Workout Pages & Media
│   ├── Videos/              # Workout exercise videos (26 files)
│   ├── Images/              # Exercise demonstration images (13 files)
│   ├── Abs-Workout.html        # Interactive abs workout session
│   ├── Arm-workout.html        # Interactive arms workout session
│   ├── Chest-Workout.html      # Interactive chest workout session
│   ├── Leg-workout.html        # Interactive legs workout session
│   ├── Shoulder-workout.html   # Interactive shoulders & back workout session
│   ├── abs.html                # Abs workout overview page
│   ├── arm.html                # Arms workout overview page
│   ├── back.html               # Back workout overview page
│   ├── chest.html              # Chest workout overview page
│   ├── leg.html                # Legs workout overview page
│   ├── Diet-guide.html         # Nutrition guidance
│   ├── Product Recommendation.html # Fitness products
│   ├── diet-styles.css         # Diet page styling
│   ├── product-styles.css      # Product page styling
│   └── workout-styles.css      # Workout pages styling
│
├── Core Pages
│   ├── login.html              # User authentication
│   ├── signup.html             # User registration
│   ├── Home.html               # Dashboard & statistics
│   ├── main.html               # Workout selection
│   ├── about.html              # About page
│   ├── contact.html            # Contact form
│   ├── admin-login.html        # Admin authentication
│   ├── admin-dashboard.html    # Admin management panel
│   ├── forgot-password.html    # Password recovery
│   └── reset-password.html     # Password reset
│
├── Configuration Files
│   ├── server.js               # Express server setup
│   ├── package.json            # Dependencies & scripts
│   ├── .env.example            # Environment template
│   ├── .gitignore              # Git ignore rules
│   └── setup_database.sql      # Database schema
│
└── Documentation
    └── README.md               # This file
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js (v14+)
- **Framework**: Express.js
- **Database**: MySQL with connection pooling
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, CORS, Rate limiting
- **Environment**: dotenv configuration

### Frontend
- **Core**: HTML5, CSS3, ES6+ JavaScript
- **Styling**: Custom CSS with responsive design
- **Features**: Local storage, Fetch API, Web Speech API
- **Media**: MP4 videos, WebP/JPG images

### Database Schema
- **users** - User accounts and authentication
- **user_profiles** - BMI, health metrics, preferences
- **workouts** - Exercise sessions and duration tracking
- **contact_us** - Contact form submissions
- **password_resets** - Password recovery tokens

## 🎮 Usage Guide

### For Users
1. **Register/Login** - Create account or sign in
2. **Select Workout** - Choose from workout categories
3. **Follow Session** - Interactive guided workout with timer
4. **Track Progress** - View statistics on Home dashboard
5. **Monitor Health** - Use BMI calculator for health metrics

### For Admins
1. **Admin Login** - Access admin panel at `/admin-login.html`
2. **User Management** - View all users, workout stats, BMI data
3. **Analytics** - Monitor total workout time, user engagement
4. **Contact Management** - Handle user inquiries and feedback

## 🔧 Development

### Available Scripts
```bash
npm start          # Production server
npm run dev        # Development with nodemon
```

### Environment Variables
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fitness_guide
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key

# Server Configuration
PORT=3000
NODE_ENV=development

# Application Settings
APP_NAME=FITNESS GUIDE
APP_URL=http://localhost:3000
```

## 🔐 Admin Password Reset Guide

### Current System (Simple)
The current admin system uses localStorage authentication. If you forget admin access:

1. **Browser Method** (Quick Fix):
   ```javascript
   // Open browser console (F12) on admin-login page
   localStorage.setItem('isAdmin', 'true');
   // Then refresh the page or go to /admin-dashboard.html
   ```

2. **Clear Browser Data**:
   - Clear localStorage/cookies for the site
   - Admin login will reset to default state

### Recommended Security Upgrade
For production use, implement proper admin authentication:

1. **Create Admin User in Database**:
   ```sql
   INSERT INTO users (name, email, password, is_admin) 
   VALUES ('Admin', 'admin@fitness-guide.com', 'hashed_password', 1);
   ```

2. **Add Admin Column to Users Table**:
   ```sql
   ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
   ```

3. **Reset Admin Password via Database**:
   ```sql
   -- Update admin password (use bcrypt hash)
   UPDATE users 
   SET password = '$2a$10$your_new_hashed_password' 
   WHERE email = 'admin@fitness-guide.com';
   ```

### Emergency Admin Access
If completely locked out:

1. **Direct Database Access**:
   ```sql
   -- Create emergency admin account
   INSERT INTO users (name, email, password, is_admin) 
   VALUES ('Emergency Admin', 'emergency@fitness-guide.com', 
           '$2a$10$emergency_hash', 1);
   ```

2. **Modify Admin Login File**:
   - Temporarily add a backdoor in `admin-login.html`
   - Remove after regaining access

## 🚨 Important Notes

- **Database Required**: MySQL must be running and configured
- **Environment Setup**: Copy `.env.example` to `.env` and configure
- **Media Files**: Workout videos and images are included in sub-workout folder
- **Admin Access**: Current system uses localStorage (upgrade recommended)
- **Security**: Change default JWT_SECRET in production
- **Admin Reset**: Use browser console method for current system

## 📱 Browser Support

- **Chrome** 80+ (Recommended)
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🏋️‍♂️ Start your fitness journey today with FITNESS GUIDE!**
