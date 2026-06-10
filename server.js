const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const reportRoutes = require('./routes/reports');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'forgot-password.html'));
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'Home.html'));
});

// Friendly routes for common pages
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/help', (req, res) => {
    res.sendFile(path.join(__dirname, 'Help.html'));
});

// Backward-compatible alias
app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'Help.html'));
});

app.get('/admin/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-contact.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Extensionless route support: "/about" -> "about.html" if it exists
app.use((req, res, next) => {
    try {
        if (req.method === 'GET' && !req.path.startsWith('/api/') && !path.extname(req.path)) {
            const candidate = path.join(__dirname, req.path + '.html');
            if (fs.existsSync(candidate)) {
                return res.sendFile(candidate);
            }
        }
    } catch (e) {
        // fall through to next handler
    }
    next();
});

// 404 handler (API vs non-API)
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'Route not found' });
    }
    // For non-API unknown routes, serve login for a friendly fallback
    return res.status(404).sendFile(path.join(__dirname, 'login.html'));
});

app.listen(PORT, () => {
    console.log(`FITNESS GUIDE running on http://localhost:${PORT}`);
});
