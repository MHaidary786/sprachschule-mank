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
let nextId = 1;

const fakeClient = {
    connect: async () => {},
    end: async () => {},
    query: async (sql, values = []) => {
        const q = sql.replace(/\s+/g, ' ').trim();

        if (q.startsWith('INSERT INTO users')) {
            const row = {
                id: nextId++,
                name: values[0],
                email: values[1],
                password: values[2],
                role: values[3],
                avatar: values[4] || null,
                created_at: new Date(),
            };
            users.push(row);
            const { password, ...pub } = row;
            return { rows: [pub] };
        }
        if (q.startsWith('SELECT * FROM users WHERE email = $1')) {
            const row = users.find((u) => u.email === values[0]);
            return { rows: row ? [row] : [] };
        }
        if (q.startsWith('SELECT id, name') && q.includes('WHERE id = $1')) {
            const row = users.find((u) => u.id === Number(values[0]));
            return { rows: row ? [{ ...row, password: undefined }] : [] };
        }
        if (q.includes('ORDER BY id')) {
            const limit = Number(values[0]);
            const offset = Number(values[1]);
            return { rows: users.slice(offset, offset + limit).map(({ password, ...pub }) => pub) };
        }
        if (q.startsWith('UPDATE users SET password = $1 WHERE id = $2')) {
            const u = users.find((x) => x.id === Number(values[1]));
            if (u) u.password = values[0];
            return { rows: [] };
        }
        if (q.startsWith('DELETE FROM users WHERE id = $1')) {
            const i = users.findIndex((u) => u.id === Number(values[0]));
            if (i >= 0) users.splice(i, 1);
            return { rows: [] };
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
    email,
    password,
    role,
    name,
});

const register = (body) => request(app).post('/api/student/register').send(body);
const login = (body) => request(app).post('/api/auth/login').send(body);

async function seedUser(email, password, role, name) {
    users.push({
        id: nextId++,
        name: name || email.split('@')[0],
        email,
        password: await bcrypt.hash(password, 12),
        role,
        avatar: null,
        created_at: new Date(),
    });
}

const tokenCache = new Map();
async function getToken(email, password) {
    if (tokenCache.has(email)) return tokenCache.get(email);
    const res = await login({ email, password });
    assert.strictEqual(res.status, 200, `login for ${email} should succeed: ${res.text}`);
    tokenCache.set(email, res.body.token);
    return res.body.token;
}

before(async () => {
    await seedUser('admin@test.de', 'AdminPass123', 'admin', 'Admin');
    await seedUser('teacher@test.de', 'TeacherPass123', 'teacher', 'Herr Mueller');
    await seedUser('student@test.de', 'StudentPass123', 'student', 'Anna');
});

// --- Registration & login --------------------------------------------------

test('student self-registration succeeds and never leaks the password', async () => {
    const res = await register(mkUser('new@test.de', 'SecretPass123', 'student', 'New'));
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.user.email, 'new@test.de');
    assert.strictEqual(res.body.user.role, 'student');
    assert.strictEqual(res.body.user.password, undefined);
});

test('registration rejects a short password with field details', async () => {
    const res = await register(mkUser('weak@test.de', 'short', 'student', 'Weak'));
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.details.some((d) => d.field === 'password'));
});

test('registration rejects a privileged role even if sent by the client', async () => {
    const res = await register(mkUser('hacker@test.de', 'SecretPass123', 'admin', 'Hacker'));
    // role is ignored by the register endpoint; if it were honored this fails
    if (res.status === 201) {
        assert.strictEqual(res.body.user.role, 'student');
    } else {
        assert.strictEqual(res.status, 400);
    }
});

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

// --- Authentication enforcement (regression: routes used to be public) ----

test('GET /api/student is rejected without a token (was public)', async () => {
    const res = await request(app).get('/api/student');
    assert.strictEqual(res.status, 401);
});

test('GET /api/student/:id is rejected without a token', async () => {
    const res = await request(app).get('/api/student/1');
    assert.strictEqual(res.status, 401);
});

test('POST /api/auth/create-user is rejected without a token (was public, allowed role=admin)', async () => {
    const res = await request(app).post('/api/auth/create-user').send(
        mkUser('evil@test.de', 'SecretPass123', 'admin', 'Evil')
    );
    assert.strictEqual(res.status, 401);
    assert.ok(!users.some((u) => u.email === 'evil@test.de'));
});

test('GET /api/auth/me requires a token', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.strictEqual(res.status, 401);
});

// --- Authorization (role) enforcement -------------------------------------

test('student cannot list students (teacher/admin only)', async () => {
    const token = await getToken('student@test.de', 'StudentPass123');
    const res = await request(app).get('/api/student').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 403);
});

test('teacher can list students, password never included', async () => {
    const token = await getToken('teacher@test.de', 'TeacherPass123');
    const res = await request(app).get('/api/student').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.length >= 2);
    for (const s of res.body) {
        assert.strictEqual(s.role, 'student');
        assert.strictEqual(s.password, undefined);
    }
});

test('student cannot open the teacher dashboard', async () => {
    const token = await getToken('student@test.de', 'StudentPass123');
    const res = await request(app).get('/api/teacher/dashboard').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 403);
});

test('student can read own profile but not another student\'s', async () => {
    const token = await getToken('student@test.de', 'StudentPass123');
    const ownId = users.find((u) => u.email === 'student@test.de').id;
    const otherId = users.find((u) => u.email === 'new@test.de')?.id;

    const own = await request(app).get(`/api/student/${ownId}`).set('Authorization', `Bearer ${token}`);
    assert.strictEqual(own.status, 200);

    if (otherId) {
        const other = await request(app).get(`/api/student/${otherId}`).set('Authorization', `Bearer ${token}`);
        assert.strictEqual(other.status, 403);
    }
});

// --- Admin ------------------------------------------------------------------

test('admin can list all users (no password leak)', async () => {
    const token = await getToken('admin@test.de', 'AdminPass123');
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.length >= 3);
    for (const u of res.body) assert.strictEqual(u.password, undefined);
});

test('admin can create users of any role', async () => {
    const token = await getToken('admin@test.de', 'AdminPass123');
    const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .send(mkUser('t2@test.de', 'TeacherPass123', 'teacher', 'Frau Berger'));
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.user.role, 'teacher');
});

test('teacher cannot access admin endpoints', async () => {
    const token = await getToken('teacher@test.de', 'TeacherPass123');
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 403);
});

test('admin cannot delete their own account', async () => {
    const token = await getToken('admin@test.de', 'AdminPass123');
    const adminId = users.find((u) => u.email === 'admin@test.de').id;
    const res = await request(app)
        .delete(`/api/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 400);
});

test('tampered/forged tokens are rejected', async () => {
    const forged = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJhZG1pbiJ9.badsignature';
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${forged}`);
    assert.strictEqual(res.status, 401);
});
