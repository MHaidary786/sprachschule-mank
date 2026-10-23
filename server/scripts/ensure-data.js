// Idempotent startup seeding. Runs on every server boot and only creates data
// that does not already exist:
//   - the initial admin account (from .env) — required so the app is usable out
//     of the box.
//   - a demo teacher + demo student + a demo class they teach, with the student
//     enrolled, so the role-based areas can be tried immediately.
// Nothing here ever overwrites or updates existing rows.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { client } = require('../config/db');

async function upsertUser(name, email, password, role) {
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) return { id: existing.rows[0].id, created: false };
    const hash = await bcrypt.hash(password, 12);
    const res = await client.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, email, hash, role]
    );
    return { id: res.rows[0].id, created: true };
}

async function ensureAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Admin';
    if (!email || !password) {
        console.warn('ensure-data: ADMIN_EMAIL / ADMIN_PASSWORD not set in .env, skipping admin seed');
        return null;
    }
    if (password.length < 8) {
        console.warn('ensure-data: ADMIN_PASSWORD must be at least 8 characters, skipping admin seed');
        return null;
    }
    const { id, created } = await upsertUser(name, email, password, 'admin');
    if (created) console.log(`ensure-data: created initial admin ${name} <${email}>`);
    else console.log(`ensure-data: admin ${email} already exists`);
    return id;
}

async function ensureDemo() {
    // A demo teacher owns a demo class; a demo student is enrolled in it.
    const teacher = await upsertUser(
        process.env.TEACHER_NAME || 'Demo Lehrkraft',
        process.env.TEACHER_EMAIL || 'teacher@sprachschule-mank.de',
        process.env.TEACHER_PASSWORD || 'TeacherPass123',
        'teacher'
    );

    const title = process.env.DEMO_COURSE_TITLE || 'Deutsch A1 (Demo)';
    const existingCourse = await client.query(
        'SELECT id FROM courses WHERE teacher_id = $1 AND title = $2',
        [teacher.id, title]
    );
    let courseId = existingCourse.rows[0]?.id;
    if (!courseId) {
        const res = await client.query(
            `INSERT INTO courses
               (teacher_id, title, description, language, level, thumbnail, status,
                duration, days, time, price_extern, price_intern, is_open_for_enrollment)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)
             RETURNING id`,
            [teacher.id, title, 'Beispielkurs zum Ausprobieren der Plattform', 'Deutsch',
             'Beginner', null, 'active', 1, 'Montag', '18:00 - 19:30', 120, 80]
        );
        courseId = res.rows[0].id;
        console.log(`ensure-data: created demo course "${title}" (id ${courseId})`);
    }

    const student = await upsertUser(
        process.env.STUDENT_NAME || 'Demo Student',
        process.env.STUDENT_EMAIL || 'student@sprachschule-mank.de',
        process.env.STUDENT_PASSWORD || 'StudentPass123',
        'student'
    );

    const existingEnroll = await client.query(
        'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [student.id, courseId]
    );
    if (existingEnroll.rowCount === 0) {
        await client.query(
            'INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2)',
            [student.id, courseId]
        );
        console.log(`ensure-data: enrolled demo student in "${title}"`);
    }

    console.log('ensure-data: demo teacher  → teacher@sprachschule-mank.de / TeacherPass123');
    console.log('ensure-data: demo student  → student@sprachschule-mank.de / StudentPass123');
}

async function ensureData() {
    try {
        await ensureAdmin();
        await ensureDemo();
    } catch (err) {
        // Seeding is best-effort; a failed seed must not take the server down,
        // but we do surface it for debugging.
        console.error('ensure-data: seeding failed:', err.message);
    }
}

module.exports = ensureData;
