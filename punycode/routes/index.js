const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', (req, res) => {
    const { error = null, message = null } = req.query;

    res.render('index', { error, message });
});

router.get('/signup', (req, res) => {
    const { error = null, message = null } = req.query;

    res.render('signup', { error, message });
});

router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    const conn = await pool.getConnection();
    const [rows] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length > 0) {
        conn.release();
        return res.redirect('/signup?error=Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await conn.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

    conn.release();
    res.redirect('/?message=Account created successfully');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const conn = await pool.getConnection();
    const [rows] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
        conn.release();
        return res.redirect('/?error=User not found');
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    conn.release();

    if (!isMatch) {
        return res.redirect('/?error=Invalid password');
    }

    req.login(user, err => {
        if (err) return res.redirect('/?error=Login failed');
        res.redirect('/profile');
    });
});

router.get('/profile', ensureAuthenticated, (req, res) => {
    res.render('profile', { user: req.user });
});

router.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/');
    });
});

module.exports = router;
