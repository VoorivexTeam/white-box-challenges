const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

const SIMPLE_TYPES = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain', ''];

app.use(express.json({ type: () => true }));
app.use(cookieParser());

app.use((req, res, next) => {
  if (!req.cookies.name)
    res.cookie('name', 'voorivex', { sameSite: 'None', secure: true });
  next();
});

app.use((req, res, next) => {
  const ct = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (req.method === 'POST' && SIMPLE_TYPES.includes(ct))
    return res.status(403).json({ error: 'Forbidden: simple content-type (CSRF)' });
  next();
});

app.get('/profile',  (req, res) => res.json({ name: req.cookies.name || 'voorivex' }));
app.post('/profile', (req, res) => {
  res.cookie('name', req.body.name, { sameSite: 'None', secure: true });
  res.json({ name: req.body.name });
});

app.listen(5555, () => console.log('Running on http://localhost:5555'));
