// Called by server.js on every startup to confirm an administrator exists.
//
// This is a *check only*: it never creates, modifies or deletes any account.
// If no administrator is present it logs a clear, actionable warning and lets
// the server keep running (so the public site still works), and tells the
// operator to run `node scripts/create-admin.js` to create one.
//
// It relies on the shared client from config/db, which server.js has already
// connected and migrated (initDB) before calling this.

const { client } = require('../config/db');
const User = require('../models/User');

async function ensureAdmin() {
    // Be defensive: make sure the users table exists before we query it.
    // initDB() already ran, so this is normally a no-op.
    await User.initTable();

    const res = await client.query(
        'SELECT id, email FROM users WHERE role = $1 LIMIT 1',
        ['admin']
    );

    if (res.rows.length > 0) {
        console.log(`Administrator present: ${res.rows[0].email}`);
        return true;
    }

    console.warn('');
    console.warn('==================================================');
    console.warn('  WARNING: No administrator account exists yet.');
    console.warn('  The admin area is unusable until one is created.');
    console.warn('');
    console.warn('  Create the first administrator now:');
    console.warn('      node scripts/create-admin.js');
    console.warn('');
    console.warn('  (The public website keeps running without an admin.)');
    console.warn('==================================================');
    console.warn('');
    return false;
}

module.exports = ensureAdmin;

// Allow running it standalone for a quick manual check:
//   node scripts/ensure-admin.js
if (require.main === module) {
    (async () => {
        try {
            await client.connect();
            const hasAdmin = await ensureAdmin();
            await client.end();
            process.exitCode = hasAdmin ? 0 : 1;
        } catch (err) {
            console.error('ensure-admin error:', err.message);
            process.exitCode = 1;
            await client.end().catch(() => {});
        }
    })();
}
