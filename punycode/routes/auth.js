const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const router = express.Router();
const transporter = require('../config/mail');

// Forgot password form
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

// Handle forgot password request
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // Token expires in 1 hour

    // Get a connection from the database pool
    const conn = await pool.getConnection();

    try {
        // Update the user record with the reset token and expiration time
        await conn.execute(
            'UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?',
            [token, expires, email]
        );
    } catch (err) {
        console.error('Error updating user record:', err);
        return res.status(500).send('Internal Server Error');
    } finally {
        conn.release();
    }

    // Prepare email options
    const mailOptions = {
        from: 'hhhcv9@gmail.com', // Sender's email
        to: email,                // Recipient's email
        subject: 'Password Reset', // Email subject
        text: `Reset link: http://localhost:3000/reset-password/${token}`, // Reset link
    };

    // Send the password reset email
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Error sending email:', err);
        } else {
            console.log('Email sent:', info.response);
        }
    });

    // Respond to the client indicating that the reset link has been sent
    res.render('forgot-password', { message: 'Reset password link sent!' });
});


// Show form to reset password
router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;

    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
        'SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()',
        [token]
    );
    conn.release();

    if (rows.length === 0) {
        return res.send('Reset link is invalid or expired.');
    }

    res.render('reset-password', { token });
});

// Handle password reset submission
router.post('/reset-password/:token', async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;

    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
        'SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()',
        [token]
    );

    if (rows.length === 0) {
        conn.release();
        return res.send('Invalid or expired token.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.execute(
        'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE reset_token = ?',
        [hashedPassword, token]
    );
    conn.release();

    res.redirect('/?message=Password reset successful. Please log in.');
});

module.exports = router;
