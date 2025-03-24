const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
const prisma = new PrismaClient();
app.use(express.json());



// Admin User Creation (Run Once)
async function createUsers() {
    const randomAdminToken = crypto.randomBytes(32).toString('hex');
    const adminEmail = 'admin@voorivex.com';
    const testEmail = 'test@voorivex.com';

    // Create or update the admin user
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            resetToken: randomAdminToken,
            resetExpires: new Date(Date.now() + 3600000), // 1 hour expiration
        },
        create: {
            email: adminEmail,
            password: await bcrypt.hash('password123', 10),
            resetToken: randomAdminToken,
            resetExpires: new Date(Date.now() + 3600000),
        },
    });

    // Create or update the test user
    await prisma.user.upsert({
        where: { email: testEmail },
        update: {
            resetToken: 'test_token',
            resetExpires: new Date(Date.now() + 3600000), // 1 hour expiration
        },
        create: {
            email: testEmail,
            password: await bcrypt.hash('testpassword123', 10),
            resetToken: 'test_token',
            resetExpires: new Date(Date.now() + 3600000),
        },
    });

    console.log(`Admin user: admin@voorivex.com`);
    console.log(`Test user: test@voorivex.com with token: test_token`);
}


// Reset Password Endpoint
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
        console.error(error);
        res.status(400).json({ error: 'Invalid token' });
    }
});

// Initialize DB and Start Server
async function startServer() {
    await createUsers();
    app.listen(3000, () => console.log('Server running on port 3000'));
}

startServer();
