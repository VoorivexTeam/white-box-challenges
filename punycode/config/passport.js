require('dotenv').config();
const passport = require('passport');
const GitLabStrategy = require('passport-gitlab2').Strategy;
const pool = require('./db');

passport.use(new GitLabStrategy({
    clientID: process.env.GITLAB_CLIENT_ID,
    clientSecret: process.env.GITLAB_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value || '';
        if (!email) return done(new Error('No email provided by GitLab'));

        const conn = await pool.getConnection();
        const [rows] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);

        conn.release();

        if (rows.length === 0) {
            return done(null, false, { message: 'No such user in the database, please register first.' });
        }

        const user = rows[0];
        return done(null, {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at
        });
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
