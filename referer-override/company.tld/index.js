const express = require('express');
const { AuthorizationCode } = require('simple-oauth2');
const axios = require('axios');
const path = require('path');
const session = require('express-session');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

const config = {
    client: {
        id: 'client1',
        secret: 'secret'
    },
    auth: {
        tokenHost: 'http://sso.company.tld:3000',
        tokenPath: '/token',
        authorizePath: '/authorize'
    }
};

const oauth2Client = new AuthorizationCode(config);

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/');
};

app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/profile');
    }

    const authorizationUri = oauth2Client.authorizeURL({
        redirect_uri: 'http://company.tld:3001/callback',
        response_type: 'code',
        state: 'random-state',
        scope: 'openid profile email'
    });

    res.render('home', { authorizationUri });
});

app.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect('/');
    }

    try {
        const tokenParams = {
            code,
            redirect_uri: 'http://company.tld:3001/callback',
            scope: 'openid profile'
        };

        const result = await oauth2Client.getToken(tokenParams);
        const { token } = result;
        
        req.session.token = token;
        req.session.user = {
            id: token.user.id,
            username: token.user.username,
            email: token.user.email,
            firstName: token.user.firstName,
            lastName: token.user.lastName
        };
        
        res.redirect('/profile');
    } catch (error) {
        console.error('Error getting token:', error.message);
        res.render('error', {
            message: 'Authentication failed: ' + error.message
        });
    }
});

app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { user: req.session.user });
});

app.get('/dompurify', (req, res) => {
    res.render('dompurify');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(3001, () => {
    console.log('OAuth2 Client server listening on port 3001');
});