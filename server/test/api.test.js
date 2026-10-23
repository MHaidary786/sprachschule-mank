const path = require('path');
const assert = require('node:assert');
const { test, before } = require('node:test');

process.env.JWT_SECRET = 'test-secret-for-ci';
process.env.JWT_EXPIRES_IN = '1h';

// ---------------------------------------------------------------------------
// In-memory fake of the pg client (stubbed via require cache BEFORE the app
// and models load, since models destructure { client } at require time).
// ---------------------------------------------------------------------------
const dbPath = require.resolve('../config/db');
const users = [];
const courses = [];
const enrollments = [];
let nextUserId = 1;
let nextCourseId = 1;

function safeUser(u) {
    const { password, ...pub } = u;
    return pub;
}

const fakeClient = {
    connect: async () => {},
    end: async () => {},
    async query(sql, values = []) {
        const q = sql.replace(/\s+/g, ' ').trim();

        // ---- users ----
        if (q.startsWith('INSERT INTO users')) {
            const row = {
                id: nextUserId++,
                name: values[0],
                email: values[1],
                password: values[2],
                role: values[3],
                avatar: values[4] || null,
                created_at: new Date(),
            };
            users.push(row);
            return { rows: [safeUser(row)], rowCount: 1 };
        }
        if (q.startsWith('SELECT * FROM users WHERE email = $1')) {
            const row = users.find((u) => u.email === values[0]);
            return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
        }
        if (q.startsWith('SELECT id FROM users WHERE email = $1')) {
            const row = users.find((u) => u.email === values[0]);
            return { rows: row ? [{ id: row.id }] : [], rowCount: row ? 1 : 0 };
        }
        if (q.startsWith('SELECT password FROM users WHERE id = $1')) {
            const row = users.find((u) => u.id === Number(values[0]));
            return { rows: row ? [{ password: row.password }] : [] };
        }
        if (/^SELECT COUNT\(\*\).*FROM users WHERE role = \$1/.test(q)) {
            return { rows: [{ count: users.filter((u) => u.role === values[0]).length }] };
        }
        if (q.startsWith('SELECT id, name') && q.includes('WHERE id = $1')) {
            const row = users.find((u) => u.id === Number(values[0]));
            return { rows: row ? [safeUser(row)] : [] };
        }
        if (q.includes('FROM users ORDER BY id')) {
            const limit = Number(values[0]);
            const offset = Number(values[1]);
            return { rows: users.slice(offset, offset + limit).map(safeUser) };
        }
        if (q.startsWith('UPDATE users SET password = $1 WHERE id = $2')) {
            const u = users.find((x) => x.id === Number(values[1]));
            if (u) u.password = values[0];
            return { rows: [] };
        }
        if (q.startsWith('UPDATE users SET') && q.includes('WHERE id =')) {
            // Generic dynamic update: parse "col = $k" pairs, then id = $last.
            const setPart = q.split(' SET ')[1].split(' WHERE id = ')[0];
            const idIdx = Number(q.split('WHERE id = $')[1]);
            const id = Number(values[idIdx - 1]);
            const target = users.find((u) => u.id === id);
            if (target) {
                for (const pair of setPart.split(', ')) {
                    const [col, ref] = pair.split(' = ');
                    const idx = Number(ref.replace('$', ''));
                    target[col] = values[idx - 1];
                }
            }
            return { rows: [] };
        }
        if (q.startsWith('DELETE FROM users WHERE id = $1')) {
            const i = users.findIndex((u) => u.id === Number(values[0]));
            if (i >= 0) users.splice(i, 1);
            return { rows: [], rowCount: i >= 0 ? 1 : 0 };
        }

        // ---- courses ----
        if (q.startsWith('INSERT INTO courses')) {
            const row = {
                id: nextCourseId++,
                teacher_id: values[0],
                title: values[1],
                description: values[2],
                language: values[3],
                level: values[4],
                thumbnail: values[5],
                status: values[6],
                duration: values[7],
                days: values[8],
                time: values[9],
                price_extern: values[10],
                price_intern: values[11],
                is_open_for_enrollment: values[12],
                teacher_name: (users.find((u) => u.id === values[0]) || {}).name || null,
            };
            courses.push(row);
            return { rows: [row], rowCount: 1 };
        }
        if (q.startsWith('SELECT id FROM courses')) {
            const row = courses.find((c) => c.teacher_id === values[0] && c.title === values[1]);
            return { rows: row ? [{ id: row.id }] : [], rowCount: row ? 1 : 0 };
        }
        if (q.includes('FROM courses c') && q.includes('JOIN users u') && q.includes('WHERE c.id = $1')) {
            const row = courses.find((c) => c.id === Number(values[0]));
            return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
        }
        if (q.includes('FROM courses c') && q.includes('JOIN users u') && q.includes("WHERE c.status = 'active'")) {
            return { rows: courses.filter((c) => c.status === 'active') };
        }
        if (q.includes('FROM courses c') && q.includes('JOIN users u') && q.includes('ORDER BY c.id')) {
            return { rows: courses };
        }
        // Teacher courses (with student_count)
        if (q.includes('AS student_count') && q.includes('WHERE c.teacher_id = $1')) {
            const rows = courses
                .filter((c) => c.teacher_id === Number(values[0]))
                .map((c) => ({
                    ...c,
                    teacher_name: (users.find((u) => u.id === c.teacher_id) || {}).name || null,
                    student_count: enrollments.filter((e) => e.course_id === c.id).length,
                }));
            return { rows };
        }

        // ---- enrollments ----
        if (q.startsWith('INSERT INTO enrollments')) {
            if (q.includes('ON CONFLICT')) {
                const exists = enrollments.some((e) => e.student_id === values[0] && e.course_id === values[1]);
                if (exists) return { rows: [], rowCount: 0 };
                enrollments.push({ id: enrollments.length + 1, student_id: values[0], course_id: values[1], progress: 0 });
                return { rows: [{ id: enrollments[enrollments.length - 1].id }], rowCount: 1 };
            }
            const exists = enrollments.some((e) => e.student_id === values[0] && e.course_id === values[1]);
            if (exists) return { rows: [], rowCount: 0 };
            enrollments.push({ id: enrollments.length + 1, student_id: values[0], course_id: values[1], progress: 0 });
            return { rows: [], rowCount: 1 };
        }
        if (q.startsWith('SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2')) {
            const row = enrollments.find((e) => e.student_id === values[0] && e.course_id === values[1]);
            return { rows: row ? [{ id: row.id }] : [], rowCount: row ? 1 : 0 };
        }
        if (q.startsWith('DELETE FROM enrollments WHERE student_id = $1 AND course_id = $2')) {
            const i = enrollments.findIndex((e) => e.student_id === values[0] && e.course_id === values[1]);
            if (i >= 0) enrollments.splice(i, 1);
            return { rows: [], rowCount: i >= 0 ? 1 : 0 };
        }
        // Students in a course
        if (q.includes('FROM enrollments e') && q.includes('JOIN users u ON u.id = e.student_id') && q.includes('WHERE e.course_id = $1')) {
            const rows = enrollments
                .filter((e) => e.course_id === Number(values[0]))
                .map((e) => {
                    const u = users.find((x) => x.id === e.student_id);
                    return u ? safeUser(u) : null;
                })
                .filter(Boolean);
            return { rows };
        }
        // Student's own courses + teacher
        if (q.includes('FROM enrollments e') && q.includes('JOIN courses c ON c.id = e.course_id') && q.includes('JOIN users u ON u.id = c.teacher_id') && q.includes('WHERE e.student_id = $1')) {
            const rows = enrollments
                .filter((e) => e.student_id === Number(values[0]))
                .map((e) => {
                    const c = courses.find((x) => x.id === e.course_id);
                    if (!c) return null;
                    const t = users.find((u) => u.id === c.teacher_id);
                    return {
                        course_id: c.id, course_title: c.title, course_level: c.level,
                        course_language: c.language, teacher_id: c.teacher_id,
                        teacher_name: t ? t.name : null, progress: e.progress,
                    };
                })
                .filter(Boolean);
            return { rows };
        }
        // Teacher's own student roster
        if (q.includes('SELECT DISTINCT') && q.includes('WHERE c.teacher_id = $1')) {
            const myCourseIds = new Set(courses.filter((c) => c.teacher_id === Number(values[0])).map((c) => c.id));
            const ids = new Set(enrollments.filter((e) => myCourseIds.has(e.course_id)).map((e) => e.student_id));
            const rows = [...ids].map((id) => {
                const u = users.find((x) => x.id === id);
                return u ? safeUser(u) : null;
            }).filter(Boolean);
            return { rows };
        }

        return { rows: [] };
    },
};

require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
        client: fakeClient,
        buildClient: () => fakeClient,
        connectDB: async () => {},
    },
};

const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app } = require('../server');

// ---------------------------------------------------------------------------
const mkUser = (email, password, role, name = email.split('@')[0]) => ({
    email, password, role, name,
});

const login = (body) => request(app).post('/api/auth/login').send(body);

async function seedUser(email, password, role, name) {
    const id = nextUserId++;
    users.push({
        id,
        name: name || email.split('@')[0],
        email,
        password: await bcrypt.hash(password, 12),
        role,
        avatar: null,
        created_at: new Date(),
    });
    return id;
}

async function seedCourse(teacherId, title, status = 'active') {
    const id = nextCourseId++;
    const teacher = users.find((u) => u.id === teacherId);
    courses.push({
        id, teacher_id: teacherId, title, description: 'd', language: 'Deutsch', level: 'Beginner',
        thumbnail: null, status, duration: 1, days: 'Montag', time: '10:00',
        price_extern: 100, price_intern: 80, is_open_for_enrollment: true,
        teacher_name: teacher ? teacher.name : null,
    });
    return id;
}

function enroll(studentId, courseId) {
    if (!enrollments.some((e) => e.student_id === studentId && e.course_id === courseId)) {
        enrollments.push({ id: enrollments.length + 1, student_id: studentId, course_id: courseId, progress: 0 });
    }
}

const tokenCache = new Map();
async function getToken(email, password) {
    if (tokenCache.has(email)) return tokenCache.get(email);
    const res = await login({ email, password });
    assert.strictEqual(res.status, 200, `login for ${email} should succeed: ${res.text}`);
    tokenCache.set(email, res.body.token);
    return res.body.token;
}

let adminId, teacherId, studentId;
before(async () => {
    adminId = await seedUser('admin@test.de', 'AdminPass123', 'admin', 'Admin');
    teacherId = await seedUser('teacher@test.de', 'TeacherPass123', 'teacher', 'Herr Mueller');
    studentId = await seedUser('student@test.de', 'StudentPass123', 'student', 'Anna');
    const course1 = await seedCourse(teacherId, 'German A1');
    const course2 = await seedCourse(teacherId, 'German A2');
    enroll(studentId, course1);
});

const authed = (token) => ({ Authorization: `Bearer ${token}` });

// --- No public self-registration (accounts only created by admin) ----------

test('public self-registration endpoint no longer exists', async () => {
    const res = await request(app).post('/api/student/register').send(mkUser('new@test.de', 'SecretPass123', 'student', 'New'));
    assert.strictEqual(res.status, 404);
    assert.ok(!users.some((u) => u.email === 'new@test.de'));
});

// --- Authentication enforcement --------------------------------------------

test('login returns a signed JWT and a safe user payload', async () => {
    const res = await login({ email: 'student@test.de', password: 'StudentPass123' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.role, 'student');
    assert.strictEqual(res.body.user.password, undefined);
});

test('login uses a constant response for unknown user and wrong password', async () => {
    const a = await login({ email: 'ghost@test.de', password: 'Whatever123' });
    const b = await login({ email: 'student@test.de', password: 'WrongPass123' });
    assert.strictEqual(a.status, 401);
    assert.strictEqual(b.status, 401);
    assert.strictEqual(a.body.message, b.body.message);
});

test('protected routes are rejected without a token', async () => {
    for (const url of ['/api/student', '/api/student/1', '/api/auth/me', '/api/admin/users', '/api/teacher/students']) {
        const res = await request(app).get(url);
        assert.strictEqual(res.status, 401, `${url} should require auth`);
    }
});

// --- Authorization (role) enforcement --------------------------------------

test('student cannot list students (teacher/admin only)', async () => {
    const token = await getToken('student@test.de', 'StudentPass123');
    const res = await request(app).get('/api/student').set(authed(token));
    assert.strictEqual(res.status, 403);
});

test('student cannot open the teacher or admin areas', async () => {
    const token = await getToken('student@test.de', 'StudentPass123');
    assert.strictEqual((await request(app).get('/api/teacher/dashboard').set(authed(token))).status, 403);
    assert.strictEqual((await request(app).get('/api/admin/users').set(authed(token))).status, 403);
});

test('teacher cannot access admin endpoints', async () => {
    const token = await getToken('teacher@test.de', 'TeacherPass123');
    assert.strictEqual((await request(app).get('/api/admin/users').set(authed(token))).status, 403);
});

// --- Teacher: class-scoped students ----------------------------------------

test('teacher sees only students enrolled in their own classes', async () => {
    const token = await getToken('teacher@test.de', 'TeacherPass123');
    const res = await request(app).get('/api/teacher/students').set(authed(token));
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.map((s) => s.id).sort(), [studentId]);
    for (const s of res.body) assert.strictEqual(s.password, undefined);
});

test('teacher dashboard reports their own class + student counts', async () => {
    const token = await getToken('teacher@test.de', 'TeacherPass123');
    const res = await request(app).get('/api/teacher/dashboard').set(authed(token));
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.course_count, 2);
    assert.strictEqual(res.body.student_count, 1);
});

test('teacher can enroll a student into their own class', async () => {
    const token = await getToken('teacher@test.de', 'TeacherPass123');
    const newStudent = await seedUser('s2@test.de', 'StudentPass123', 'student', 'Bella');
    const courseId = courses.find((c) => c.title === 'German A2').id;
    const res = await request(app)
        .post(`/api/teacher/courses/${courseId}/students`)
        .set(authed(token))
        .send({ student_id: newStudent });
    assert.strictEqual(res.status, 201);

    // Listing that class now includes the new student.
    const list = await request(app).get(`/api/teacher/courses/${courseId}/students`).set(authed(token));
    assert.ok(list.body.some((s) => s.id === newStudent));
});

test('teacher cannot manage a class they do not teach', async () => {
    const token = await getToken('teacher@test.de', 'TeacherPass123');
    const foreignCourse = await seedCourse(adminId, 'Admin Class');
    const res = await request(app).get(`/api/teacher/courses/${foreignCourse}/students`).set(authed(token));
    assert.strictEqual(res.status, 404);
});

// --- Student: own courses + teacher ----------------------------------------

test('student can see their own courses and teacher, not other students', async () => {
    const token = await getToken('student@test.de', 'StudentPass123');
    const res = await request(app).get('/api/student/me/courses').set(authed(token));
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].course_title, 'German A1');
    assert.strictEqual(res.body[0].teacher_name, 'Herr Mueller');
});

test('student can read own profile but not another student', async () => {
    const token = await getToken('student@test.de', 'StudentPass123');
    const own = await request(app).get(`/api/student/${studentId}`).set(authed(token));
    assert.strictEqual(own.status, 200);
    const other = await seedUser('s3@test.de', 'StudentPass123', 'student', 'Cleo');
    const res = await request(app).get(`/api/student/${other}`).set(authed(token));
    assert.strictEqual(res.status, 403);
});

// --- Admin: user CRUD + role changes ---------------------------------------

test('admin can list all users (no password leak)', async () => {
    const token = await getToken('admin@test.de', 'AdminPass123');
    const res = await request(app).get('/api/admin/users').set(authed(token));
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.length >= 3);
    for (const u of res.body) assert.strictEqual(u.password, undefined);
});

test('admin can create users of any role', async () => {
    const token = await getToken('admin@test.de', 'AdminPass123');
    const res = await request(app)
        .post('/api/admin/users')
        .set(authed(token))
        .send(mkUser('t2@test.de', 'TeacherPass123', 'teacher', 'Frau Berger'));
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.user.role, 'teacher');
});

test('admin can change a user role via PATCH', async () => {
    const token = await getToken('admin@test.de', 'AdminPass123');
    const target = await seedUser('promote@test.de', 'SecretPass123', 'student', 'Promote');
    const res = await request(app)
        .patch(`/api/admin/users/${target}`)
        .set(authed(token))
        .send({ role: 'teacher' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.role, 'teacher');
});

test('the last admin cannot be demoted (admin count can never reach zero)', async () => {
    // Add a second admin so the guard is not trivially the self-demotion case,
    // then confirm demoting the *last* remaining admin is blocked.
    const admin2 = await seedUser('admin2@test.de', 'AdminPass123', 'admin', 'Admin2');
    const token = await getToken('admin@test.de', 'AdminPass123');

    // With two admins, demoting one to teacher is fine (one admin remains).
    const ok = await request(app)
        .patch(`/api/admin/users/${admin2}`)
        .set(authed(token))
        .send({ role: 'teacher' });
    assert.strictEqual(ok.status, 200);
    assert.strictEqual(ok.body.user.role, 'teacher');

    // Now admin@test.de is the ONLY admin. Demoting themselves is blocked.
    const demote = await request(app)
        .patch(`/api/admin/users/${adminId}`)
        .set(authed(token))
        .send({ role: 'teacher' });
    assert.strictEqual(demote.status, 400);
    assert.strictEqual(demote.body.message, 'The last admin cannot be demoted');
});

test('admin cannot delete their own account', async () => {
    const token = await getToken('admin@test.de', 'AdminPass123');
    const res = await request(app).delete(`/api/admin/users/${adminId}`).set(authed(token));
    assert.strictEqual(res.status, 400);
});

// --- Public: content + courses ---------------------------------------------

test('public course detail does not leak inactive courses', async () => {
    const inactive = await seedCourse(adminId, 'Hidden Course', 'inactive');
    const res = await request(app).get(`/api/public/courses/${inactive}`);
    assert.strictEqual(res.status, 404);
});

test('public course list only returns active courses', async () => {
    const res = await request(app).get('/api/public/courses');
    assert.strictEqual(res.status, 200);
    for (const c of res.body) assert.strictEqual(c.status, 'active');
});

test('admin can manage enrollments for any class', async () => {
    const token = await getToken('admin@test.de', 'AdminPass123');
    const courseId = courses.find((c) => c.title === 'German A1').id;
    const res = await request(app).get(`/api/admin/courses/${courseId}/students`).set(authed(token));
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.some((s) => s.id === studentId));
});

// --- Security regression ----------------------------------------------------

test('tampered/forged tokens are rejected', async () => {
    const forged = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJhZG1pbiJ9.badsignature';
    const res = await request(app).get('/api/admin/users').set(authed(forged));
    assert.strictEqual(res.status, 401);
});

test('change-password verifies the current password against the token user', async () => {
    const token = await getToken('student@test.de', 'StudentPass123');
    const wrong = await request(app)
        .post('/api/auth/change-password')
        .set(authed(token))
        .send({ currentPassword: 'WrongCurrent123', newPassword: 'NewSecret123' });
    assert.strictEqual(wrong.status, 401);
});
