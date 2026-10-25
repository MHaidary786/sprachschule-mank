// One-off: terminate the dev server's Postgres backends to simulate an
// admin-command disconnect, then verify the API auto-recovers.
require('dotenv').config();
const { Client } = require('pg');

const conf = {
    user: process.env.CLIENT_USERNAME,
    host: process.env.CLIENT_HOST,
    database: process.env.CLIENT_DATABASE,
    password: process.env.CLIENT_PASSWORD,
    port: Number(process.env.CLIENT_PORT) || 5432,
};

async function apiCheck(label) {
    try {
        const res = await fetch('http://localhost:5000/api/public/events');
        const body = await res.json();
        console.log(`${label}: HTTP ${res.status}, ${Array.isArray(body) ? body.length : '?'} events`);
        return res.status === 200;
    } catch (e) {
        console.log(`${label}: ${e.message}`);
        return false;
    }
}

(async () => {
    const before = await apiCheck('BEFORE terminate');
    if (!before) { console.log('Server not reachable; aborting'); process.exit(1); }

    const admin = new Client(conf);
    await admin.connect();
    const r = await admin.query(
        'SELECT pid FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
        [conf.database]
    );
    const pids = r.rows.map((x) => x.pid);
    console.log('terminating backends:', pids.join(', ') || '(none found)');
    for (const p of pids) {
        await admin.query('SELECT pg_terminate_backend($1)', [p]);
    }
    await admin.end();

    // Give the error handler a moment to fire + start reconnecting.
    await new Promise((res) => setTimeout(res, 1500));
    const after = await apiCheck('AFTER terminate (+1.5s)');
    if (!after) {
        // Reconnect may need another beat.
        await new Promise((res) => setTimeout(res, 2000));
        const retry = await apiCheck('AFTER terminate (+3.5s)');
        if (!retry) { console.log('FAIL: server did not auto-recover'); process.exit(1); }
    }
    console.log('OK: server auto-recovered after Postgres terminated its connection');
    process.exit(0);
})().catch((e) => { console.error('test-reconnect error:', e); process.exit(1); });
