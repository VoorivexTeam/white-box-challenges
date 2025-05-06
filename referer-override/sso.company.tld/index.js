const express = require('express');
const OAuth2Server = require('./oauth2-server');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Parse application/json
app.use(bodyParser.json());

// In-memory data store
const users = [{
  id: '1',
  username: 'user',
  firstName: 'John',
  lastName: 'Doe',
  email: 'user@voorivex.team',
  password: 'password'
}];

const clients = [{ 
  id: 'client1', 
  clientSecret: 'secret',
  redirectUris: ['http://company.tld:3001/callback'],
  grants: ['authorization_code', 'refresh_token']
}];
const authorizationCodes = [];
const tokens = [];

// OAuth2 model implementation
const model = {
  // Get client for authentication
  getClient: (clientId, clientSecret) => {
    console.log(clientId, clientSecret);
    const client = clients.find(client => client.id === clientId);
    if (!client || (clientSecret && client.clientSecret !== clientSecret)) {
      return false;
    }
    return client;
  },

  // Save authorization code
  saveAuthorizationCode: (code, client, user) => {
    const authCode = {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      client: client,
      user: user
    };
    authorizationCodes.push(authCode);
    return authCode;
  },

  // Get authorization code
  getAuthorizationCode: (authorizationCode) => {
    return authorizationCodes.find(code => 
      code.authorizationCode === authorizationCode
    );
  },

  // Revoke authorization code
  revokeAuthorizationCode: (code) => {
    const index = authorizationCodes.findIndex(c => 
      c.authorizationCode === code.authorizationCode
    );
    if (index !== -1) {
      authorizationCodes.splice(index, 1);
      return true;
    }
    return false;
  },

  // Save token
  saveToken: (token, client, user) => {
    const accessToken = {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      client: client,
      user: user
    };
    tokens.push(accessToken);
    return accessToken;
  },

  // Get access token
  getAccessToken: (accessToken) => {
    return tokens.find(token => token.accessToken === accessToken);
  },

  // Get refresh token
  getRefreshToken: (refreshToken) => {
    return tokens.find(token => token.refreshToken === refreshToken);
  },

  // Revoke token
  revokeToken: (token) => {
    const index = tokens.findIndex(t => t.refreshToken === token.refreshToken);
    if (index !== -1) {
      tokens.splice(index, 1);
      return true;
    }
    return false;
  },

  // Get user by username and password
  getUser: (username, password) => {
    const user = users.find(user => 
      user.username === username && user.password === password
    );
    return user || false;
  },

  // Validate scope
  validateScope: (user, client, scope) => {
    return user.scope === client.scope
  },

  // Verify scope
  verifyScope: (token, scope) => {
    if (!token.scope) {
      return false;
    }
    const requestedScopes = scope.split(' ');
    const authorizedScopes = token.scope.split(' ');
    return requestedScopes.every(s => authorizedScopes.includes(s));
  }
};

// Initialize OAuth server
const oauth = new OAuth2Server({
  model: model,
  accessTokenLifetime: 60 * 60, // 1 hour
  allowBearerTokensInQueryString: true
});

// GET /authorize - Show login form
app.get('/authorize', async (req, res) => {
  res.render('login', {
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri,
    response_type: req.query.response_type,
    state: req.query.state || '',
    scope: req.query.scope || '',
    error: null
  });
});

// POST /authorize - Handle login form submission
app.post('/authorize', async (req, res) => {
  const { username, password, client_id, redirect_uri, response_type, state, scope } = req.body;

  try {
    // Authenticate user
    const user = await model.getUser(username, password);
    if (!user) {
      return res.render('login', {
        client_id,
        redirect_uri,
        response_type,
        state,
        scope,
        error: 'Invalid username or password'
      });
    }

    // Create request and response objects for OAuth server
    const request = new OAuth2Server.Request({
      method: 'POST',
      query: {
        response_type,
        client_id,
        redirect_uri,
        state,
        scope
      },
      headers: req.headers,
      body: { username, password }
    });

    const response = new OAuth2Server.Response(res);

    // Authorize
    await oauth.authorize(request, response, {
      authenticateHandler: {
        handle: () => user
      }
    });

    // Redirect handled by OAuth2 server
    return res.set(response.headers).status(response.status).send(response.body);
  } catch (error) {
    console.error('OAuth error:', error);
    return res.render('login', {
      client_id,
      redirect_uri,
      response_type,
      state,
      scope,
      error: error.message || 'An error occurred during authorization'
    });
  }
});

// Token endpoint
app.post('/token', async (req, res) => {
  try {
    const request = new OAuth2Server.Request(req);
    const response = new OAuth2Server.Response(res);

    const token = await oauth.token(request, response);
    return res.set(response.headers).status(response.status).json(token);
  } catch (error) {
    console.error('Token error:', error);
    return res.status(error.code || 500).json(error);
  }
});


// Start the provider server
app.listen(3000, () => {
  console.log('OAuth2 Provider server listening on port 3000');
});

