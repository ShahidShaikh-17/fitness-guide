const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Submit contact us form
router.post('/submit', async (req, res) => {
    try {
        const { name, email, subject, message, phone } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({ 
                message: 'Name, email, and message are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Please provide a valid email address' 
            });
        }

        // Insert contact submission
        const [result] = await db.promise().execute(
            'INSERT INTO contact_us (name, email, subject, message, phone) VALUES (?, ?, ?, ?, ?)',
            [name, email, subject || '', message, phone || '']
        );

        console.log(`New contact submission from ${name} (${email})`);

        res.status(201).json({
            message: 'Thank you for contacting us! We will get back to you soon.',
            submissionId: result.insertId
        });

    } catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all contact submissions (for admin review)
router.get('/submissions', async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT * FROM contact_us';
        let params = [];

        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT ' + parseInt(limit) + ' OFFSET ' + parseInt(offset);

        const [submissions] = await db.promise().execute(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM contact_us';
        let countParams = [];

        if (status) {
            countQuery += ' WHERE status = ?';
            countParams.push(status);
        }

        const [countResult] = await db.promise().execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            submissions,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < total
            }
        });

    } catch (error) {
        console.error('Get contact submissions error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update contact submission status
router.put('/submissions/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['new', 'read', 'replied', 'resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        const [result] = await db.promise().execute(
            'UPDATE contact_us SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Contact submission not found' });
        }

        res.json({ message: 'Status updated successfully' });

    } catch (error) {
        console.error('Update contact status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get contact submission by ID
router.get('/submissions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [submissions] = await db.promise().execute(
            'SELECT * FROM contact_us WHERE id = ?',
            [id]
        );

        if (submissions.length === 0) {
            return res.status(404).json({ message: 'Contact submission not found' });
        }

        res.json(submissions[0]);

    } catch (error) {
        console.error('Get contact submission error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
