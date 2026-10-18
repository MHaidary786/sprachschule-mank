require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { client } = require('../config/db');

async function seedAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Admin';

    if (!email || !password) {
        console.error('ADMIN_EMAIL / ADMIN_PASSWORD are not set in .env');
        process.exit(1);
    }
    if (password.length < 8) {
        console.error('ADMIN_PASSWORD must be at least 8 characters');
        process.exit(1);
    }

    try {
        await client.connect();

        const existing = await client.query(
            'SELECT id, email FROM users WHERE role = $1 LIMIT 1',
            ['admin']
        );
        if (existing.rows.length > 0) {
            console.log(`An admin already exists (${existing.rows[0].email}) — nothing to do.`);
            return;
        }

        const hash = await bcrypt.hash(password, 12);
        await client.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
            [name, email, hash, 'admin']
        );
        console.log(`Admin created: ${name} <${email}> (role=admin)`);
        console.log('Store these credentials securely — they are now the only admin login.');
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

seedAdmin();
