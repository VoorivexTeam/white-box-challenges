const express = require('express');
const app = express();

app.set('query parser', 'extended');

app.get('/', (req, res) => {
  const redirectUri = req.query.redirect_uri;

  if (!redirectUri) {
    return res.send("redirect_uri is required");
  }

  if (redirectUri !== "https://pwnbox.xyz/docs") {
    return res.send("Invalid redirect_uri");
  }

  return res.send(`
    <script>
      location = new URLSearchParams(window.location.search).get("redirect_uri");
    </script>
  `);
});

app.listen(3000, () => console.log('Listening on port 3000'));