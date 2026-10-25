// One-off: dump current DB state (users + courses + enrollments) for debugging.
require('dotenv').config();
const { Client } = require('pg');

(async () => {
    const c = new Client({
        user: process.env.CLIENT_USERNAME,
        host: process.env.CLIENT_HOST,
        database: process.env.CLIENT_DATABASE,
        password: process.env.CLIENT_PASSWORD,
        port: Number(process.env.CLIENT_PORT) || 5432,
    });
    await c.connect();
    const u = await c.query('SELECT id, name, email, role FROM users ORDER BY id');
    const co = await c.query('SELECT id, teacher_id, title, status, is_open_for_enrollment FROM courses ORDER BY id');
    const en = await c.query('SELECT id, student_id, course_id FROM enrollments ORDER BY id');
    console.log('USERS:', JSON.stringify(u.rows, null, 1));
    console.log('COURSES:', JSON.stringify(co.rows, null, 1));
    console.log('ENROLLMENTS:', JSON.stringify(en.rows, null, 1));
    await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
