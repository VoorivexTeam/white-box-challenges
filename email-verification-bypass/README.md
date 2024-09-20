# Email Verification Bypass
Can you reach the administration panel?
```javascript
const express = require('express');
const Joi = require('joi');
const sequelize = require('./db');
const User = require('./models/User.model');
const authMiddleware = require('./middlewares/auth.middleware');
const jwt = require('jsonwebtoken');
const sendMail = require('./sendMail');  

const app = express();
app.use(express.json());

// This example focuses on the core functionality for the challenge; the full application includes additional routes.

app.put('/user/profile', authMiddleware, async (req, res) => {
    const { error } = Joi.object({
        email: Joi.string().email().optional(),
        name: Joi.string().max(100).optional(),
    }).validate(req.body);

    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, name } = req.body;
    try {
        const user = await User.findOne({ where: { id: req.userId } });
        if (email && (await User.findOne({ where: { email } }))) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        await User.update({ 
            email: email || user.email, 
            name: name || user?.name, 
            emailVerified: email ? false : user.emailVerified 
        }, { where: { id: req.userId } });

        if (email) {
            const token = jwt.sign({ userId: req.userId }, process.env.SECRET_KEY, { expiresIn: '1h' });
            await sendMail({ to: email, subject: 'Verify your email', text: `Verify: https://company.tld/verify-email?token=${token}` });
        }

        res.json({ message: 'Profile updated' });
    } catch {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

app.get('/verify-email', async (req, res) => {
    const { error } = Joi.object({
        token: Joi.string().required(),
    }).validate(req.query);
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        const { userId } = jwt.verify(req.query.token, process.env.SECRET_KEY);
        await User.update({ emailVerified: true }, { where: { id: userId } });
        res.json({ message: 'Email verified' });
    } catch {
        res.status(400).json({ message: 'Invalid/expired token' });
    }
});

sequelize.sync().then(() => app.listen(3000, () => console.log('Server running')));
```
<details>
  <summary>Toggle to see the solution</summary>

  This bug occurs when the token binds only to the user, not the email. To bypass email verification:
  1. Change to your accessible email, get the link (don’t verify)
  2. Change your email again to anything you want.
  3. Open the token link, and you’re done!

</details>