const express = require('express');
const passport = require('passport');
const router = express.Router();

// GitLab OAuth
router.get('/auth/gitlab', passport.authenticate('gitlab', { scope: ['read_user'] }));

router.get('/auth/gitlab/callback',
    passport.authenticate('gitlab', { failureRedirect: '/?error=User not found, please register first' }),
    (req, res) => {
        if (req.user) {
            return res.redirect('/profile');
        }
    }
);

module.exports = router;
