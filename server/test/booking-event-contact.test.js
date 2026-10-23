const assert = require('node:assert');
const { test, before } = require('node:test');

process.env.JWT_SECRET = 'test-secret-for-ci';
process.env.JWT_EXPIRES_IN = '1h';

// ---------------------------------------------------------------------------
// Stubs (same require-cache technique as api.test.js):
//   - the pg client (in-memory fake below)
//   - express-rate-limit (passthrough, so many POSTs in one run don't 429)
// ---------------------------------------------------------------------------
const rlPath = require.resolve('express-rate-limit');
require.cache[rlPath] = {
    id: rlPath,
    filename: rlPath,
    loaded: true,
    exports: () => (req, res, next) => next(),
};

const dbPath = require.resolve('../config/db');

const users = [];
const courses = [];
const enrollments = [];
const events = [];
const eventPhotos = [];
const bookings = [];
const contacts = [];
let nextUserId = 1;
let nextCourseId = 1;
let nextEventId = 1;
let nextEventPhotoId = 1;
let nextBookingId = 1;
let nextContactId = 1;

function safeUser(u) {
    const { password, ...pub } = u;
    return pub;
}

function joinBooking(b) {
    return {
        ...b,
        course_title: (courses.find((c) => c.id === b.course_id) || {}).title,
        level: (courses.find((c) => c.id === b.course_id) || {}).level,
        student_name: (users.find((u) => u.id === b.student_id) || {}).name || null,
    };
}

const fakeClient = {
    connect: async () => {},
    end: async () => {},
    async query(sql, values = []) {
        const q = sql.replace(/\s+/g, ' ').trim();

        // ---- transaction control (approve flow) ----
        if (q === 'BEGIN' || q === 'COMMIT' || q === 'ROLLBACK') return { rows: [] };

        // ---- users (subset) ----
        if (q.startsWith('INSERT INTO users')) {
            const row = {
                id: nextUserId++,
                name: values[0],
                email: values[1],
                password: values[2],
                // role is a $4 param in User.save() but a literal 'student' in
                // BookingRequest.createStudentUser — default like the SQL does.
                role: values[3] || 'student',
                avatar: null,
                created_at: new Date(),
            };
            users.push(row);
            return { rows: [safeUser(row)], rowCount: 1 };
        }
        if (q.startsWith('SELECT * FROM users WHERE email = $1')) {
            const row = users.find((u) => u.email === values[0]);
            return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
        }
        if (q.startsWith('SELECT id, name, email, role, avatar, created_at FROM users WHERE email = $1')) {
            const row = users.find((u) => u.email === values[0]);
            return { rows: row ? [safeUser(row)] : [], rowCount: row ? 1 : 0 };
        }
        if (q.startsWith('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = $1')) {
            const row = users.find((u) => u.id === Number(values[0]));
            return { rows: row ? [safeUser(row)] : [], rowCount: row ? 1 : 0 };
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
            return { rows: users.slice(Number(values[1]), Number(values[1]) + Number(values[0])).map(safeUser) };
        }
        if (q.startsWith('UPDATE users SET password = $1 WHERE id = $2')) {
            const u = users.find((x) => x.id === Number(values[1]));
            if (u) u.password = values[0];
            return { rows: [] };
        }
        if (q.startsWith('UPDATE users SET') && q.includes('WHERE id =')) {
            const setPart = q.split(' SET ')[1].split(' WHERE id = ')[0];
            const idIdx = Number(q.split('WHERE id = $')[1]);
            const target = users.find((u) => u.id === Number(values[idIdx - 1]));
            if (target) {
                for (const pair of setPart.split(', ')) {
                    if (pair.includes('CURRENT_TIMESTAMP')) continue;
                    const [col, ref] = pair.split(' = ');
                    target[col.replace(/"/g, '')] = values[Number(ref.replace('$', '')) - 1];
                }
            }
            return { rows: [] };
        }
        if (q.startsWith('DELETE FROM users WHERE id = $1')) {
            const i = users.findIndex((u) => u.id === Number(values[0]));
            if (i >= 0) users.splice(i, 1);
            return { rows: [], rowCount: i >= 0 ? 1 : 0 };
        }

        // ---- courses (subset) ----
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
            };
            courses.push(row);
            return { rows: [row], rowCount: 1 };
        }
        if (q.includes('FROM courses c') && q.includes('JOIN users u ON u.id = c.teacher_id') && q.includes('WHERE c.id = $1')) {
            const row = courses.find((c) => c.id === Number(values[0]));
            if (!row) return { rows: [], rowCount: 0 };
            const t = users.find((u) => u.id === row.teacher_id);
            return { rows: [{ ...row, teacher_name: t ? t.name : null }], rowCount: 1 };
        }

        // ---- enrollments ----
        if (q.startsWith('INSERT INTO enrollments')) {
            const exists = enrollments.some((e) => e.student_id === values[0] && e.course_id === values[1]);
            if (!exists) enrollments.push({ id: enrollments.length + 1, student_id: values[0], course_id: values[1], progress: 0 });
            return { rows: [{ id: enrollments.length }], rowCount: 1 };
        }

        // ---- booking_requests ----
        if (q.startsWith('INSERT INTO booking_requests')) {
            const row = {
                id: nextBookingId++,
                course_id: values[0],
                name: values[1],
                email: values[2],
                phone: values[3],
                message: values[4],
                status: 'pending',
                student_id: null,
                admin_note: null,
                created_at: new Date(),
                updated_at: new Date(),
            };
            bookings.push(row);
            return { rows: [row], rowCount: 1 };
        }
        // getByIdOn (raw row, used inside the approve transaction)
        if (q.startsWith('SELECT id, course_id, name, email, phone, message, status') && q.includes('FROM booking_requests WHERE id = $1')) {
            const row = bookings.find((b) => b.id === Number(values[0]));
            return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
        }
        // getById / listAll (joined)
        if (q.startsWith('SELECT b.id')) {
            if (q.includes('WHERE b.id = $1')) {
                const row = bookings.find((b) => b.id === Number(values[0]));
                return { rows: row ? [joinBooking(row)] : [], rowCount: row ? 1 : 0 };
            }
            const status = values.length ? values[0] : null;
            const rows = bookings.filter((b) => !status || b.status === status).map(joinBooking);
            return { rows, rowCount: rows.length };
        }
        if (q.startsWith('UPDATE booking_requests SET status = $1')) {
            const b = bookings.find((x) => x.id === Number(values[3]));
            if (b) {
                b.status = values[0];
                b.admin_note = values[1];
                b.student_id = values[2];
                b.updated_at = new Date();
            }
            return { rows: b ? [b] : [], rowCount: b ? 1 : 0 };
        }

        // ---- events ----
        if (q.startsWith('INSERT INTO events')) {
            const row = {
                id: nextEventId++,
                title: values[0],
                slug: values[1],
                description: values[2],
                event_date: values[3],
                cover_image: values[4],
                is_public: values[5],
                order: values[6],
                created_at: new Date(),
                updated_at: new Date(),
            };
            events.push(row);
            return { rows: [row], rowCount: 1 };
        }
        if (q.startsWith('INSERT INTO event_photos')) {
            const row = { id: nextEventPhotoId++, event_id: values[0], url: values[1], caption: values[2], order: values[3] };
            eventPhotos.push(row);
            return { rows: [row], rowCount: 1 };
        }
        if (q.startsWith('SELECT id, url, caption, "order" FROM event_photos WHERE event_id = $1')) {
            const rows = eventPhotos.filter((p) => p.event_id === Number(values[0])).map((p) => ({ ...p }));
            return { rows, rowCount: rows.length };
        }
        if (q.startsWith('DELETE FROM event_photos WHERE event_id = $1')) {
            const before = eventPhotos.length;
            for (let i = eventPhotos.length - 1; i >= 0; i--) {
                if (eventPhotos[i].event_id === Number(values[0])) eventPhotos.splice(i, 1);
            }
            return { rows: [], rowCount: before - eventPhotos.length };
        }
        if (q.startsWith('SELECT id, title, slug, description, event_date, cover_image, is_public, "order", created_at, updated_at FROM events WHERE id = $1')) {
            const row = events.find((e) => e.id === Number(values[0]));
            if (!row) return { rows: [], rowCount: 0 };
            const photos = eventPhotos.filter((p) => p.event_id === row.id).map((p) => ({ ...p }));
            return { rows: [{ ...row, photos }], rowCount: 1 };
        }
        if (q.startsWith('SELECT e.* FROM events e WHERE e.slug = $1')) {
            const row = events.find((e) => e.slug === values[0] && e.is_public === true);
            return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
        }
        if (q.startsWith('SELECT COUNT(*)::int AS count FROM events')) {
            return { rows: [{ count: events.length }] };
        }
        if (q.startsWith('SELECT e.*') && q.includes('WHERE e.is_public = TRUE')) {
            const rows = events
                .filter((e) => e.is_public)
                .map((e) => {
                    const all = eventPhotos.filter((p) => p.event_id === e.id);
                    const top3 = all.slice(0, 3).map((p) => ({ url: p.url, caption: p.caption }));
                    return { ...e, photo_count: all.length, photos: top3 };
                });
            return { rows, rowCount: rows.length };
        }
        if (q.startsWith('SELECT id FROM events WHERE slug = $1 AND id <> $2')) {
            const row = events.find((e) => e.slug === values[0] && e.id !== Number(values[1]));
            return { rows: row ? [{ id: row.id }] : [], rowCount: row ? 1 : 0 };
        }
        if (q.startsWith('SELECT id FROM events WHERE slug = $1')) {
            const row = events.find((e) => e.slug === values[0]);
            return { rows: row ? [{ id: row.id }] : [], rowCount: row ? 1 : 0 };
        }
        if (q.startsWith('SELECT id, title, slug, description, event_date, cover_image, is_public, "order", created_at, updated_at FROM events ORDER BY')) {
            return { rows: events.map((e) => ({ ...e })), rowCount: events.length };
        }
        if (q.startsWith('DELETE FROM events WHERE id = $1')) {
            const target = events.find((e) => e.id === Number(values[0]));
            if (target) {
                events.splice(events.indexOf(target), 1);
                for (let i = eventPhotos.length - 1; i >= 0; i--) {
                    if (eventPhotos[i].event_id === target.id) eventPhotos.splice(i, 1);
                }
            }
            return { rows: [], rowCount: target ? 1 : 0 };
        }
        if (q.startsWith('UPDATE events SET') && q.includes('WHERE id =')) {
            const setPart = q.split(' SET ')[1].split(' WHERE id = ')[0];
            const idIdx = Number(q.split('WHERE id = $')[1]);
            const target = events.find((e) => e.id === Number(values[idIdx - 1]));
            if (target) {
                for (const pair of setPart.split(', ')) {
                    if (pair.includes('CURRENT_TIMESTAMP')) continue;
                    const [col, ref] = pair.split(' = ');
                    target[col.replace(/"/g, '').trim()] = values[Number(ref.replace('$', '')) - 1];
                }
            }
            return { rows: [], rowCount: target ? 1 : 0 };
        }

        // ---- contact_messages ----
        if (q.startsWith('INSERT INTO contact_messages')) {
            const row = {
                id: nextContactId++,
                name: values[0],
                email: values[1],
                phone: values[2],
                subject: values[3],
                message: values[4],
                is_read: false,
                created_at: new Date(),
            };
            contacts.push(row);
            return { rows: [row], rowCount: 1 };
        }
        if (q.startsWith('UPDATE contact_messages SET is_read = TRUE WHERE id = $1')) {
            const c = contacts.find((x) => x.id === Number(values[0]));
            if (c) c.is_read = true;
            return { rows: c ? [c] : [], rowCount: c ? 1 : 0 };
        }
        if (q.startsWith('SELECT id, name, email, phone, subject, message, is_read, created_at FROM contact_messages WHERE id = $1')) {
            const c = contacts.find((x) => x.id === Number(values[0]));
            return { rows: c ? [c] : [], rowCount: c ? 1 : 0 };
        }
        if (q.startsWith('SELECT id, name, email, phone, subject, message, is_read, created_at FROM contact_messages')) {
            const onlyUnread = q.includes('WHERE is_read = FALSE');
            const rows = contacts.filter((c) => !onlyUnread || !c.is_read);
            return { rows, rowCount: rows.length };
        }

        // ---- auth: login select (used by existing app tests path) ----
        if (q.startsWith('SELECT * FROM users WHERE email = $1') && !values.length) return { rows: [], rowCount: 0 };

        return { rows: [], rowCount: 0 };
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

const authed = (token) => ({ Authorization: `Bearer ${token}` });

let adminId;
before(async () => {
    adminId = nextUserId++;
    users.push({
        id: adminId,
        name: 'Admin',
        email: 'admin@test.de',
        password: await bcrypt.hash('AdminPass123', 12),
        role: 'admin',
        avatar: null,
        created_at: new Date(),
    });
    const teacherId = nextUserId++;
    users.push({
        id: teacherId, name: 'Teacher', email: 'teacher@test.de',
        password: await bcrypt.hash('TeacherPass123', 12), role: 'teacher',
        avatar: null, created_at: new Date(),
    });
});

function seedCourse(status = 'active', open = true) {
    const teacher = users.find((u) => u.role === 'teacher');
    const id = nextCourseId++;
    courses.push({
        id, teacher_id: teacher.id, title: `Course ${id}`, description: 'd', language: 'Deutsch',
        level: 'Beginner', thumbnail: null, status, duration: 1, days: 'Montag', time: '10:00',
        price_extern: 100, price_intern: 80, is_open_for_enrollment: open,
        teacher_name: teacher ? teacher.name : null,
    });
    return id;
}

let cachedAdminToken;
async function adminToken() {
    if (cachedAdminToken) return cachedAdminToken;
    const res = await request(app).post('/api/auth/login')
        .send({ email: 'admin@test.de', password: 'AdminPass123' });
    assert.strictEqual(res.status, 200, res.text);
    cachedAdminToken = res.body.token;
    return cachedAdminToken;
}

async function newBooking(courseId, email, name = 'Test Gast') {
    const res = await request(app).post('/api/public/bookings').send({ course_id: courseId, name, email });
    assert.strictEqual(res.status, 201, `booking should be created: ${res.text}`);
    return bookings[bookings.length - 1];
}

// --- Booking requests -------------------------------------------------------

test('public can create a booking for an open active course (201)', async () => {
    const courseId = seedCourse('active', true);
    const res = await request(app).post('/api/public/bookings').send({
        course_id: courseId, name: 'Test Gast', email: 'gast@test.de', phone: '0123 456', message: 'Hallo',
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.message);
    assert.ok(bookings.some((b) => b.course_id === courseId && b.status === 'pending'));
});

test('booking for unknown course is rejected (404)', async () => {
    const res = await request(app).post('/api/public/bookings').send({
        course_id: 99999, name: 'Gast', email: 'gast2@test.de',
    });
    assert.strictEqual(res.status, 404);
});

test('booking for a closed course is rejected (400)', async () => {
    const courseId = seedCourse('active', false);
    const res = await request(app).post('/api/public/bookings').send({
        course_id: courseId, name: 'Gast', email: 'gast3@test.de',
    });
    assert.strictEqual(res.status, 400);
});

test('booking for an inactive course is rejected (404)', async () => {
    const courseId = seedCourse('inactive', true);
    const res = await request(app).post('/api/public/bookings').send({
        course_id: courseId, name: 'Gast', email: 'gast4@test.de',
    });
    assert.strictEqual(res.status, 404);
});

test('booking body is validated (400 on bad email)', async () => {
    const courseId = seedCourse('active', true);
    const res = await request(app).post('/api/public/bookings').send({
        course_id: courseId, name: 'Gast', email: 'not-an-email',
    });
    assert.strictEqual(res.status, 400);
});

test('admin approve creates a new student, sets student_id, enrolls (201)', async () => {
    const courseId = seedCourse('active', true);
    const booking = await newBooking(courseId, 'neu@approve.de', 'Neu Student');
    const token = await adminToken();
    const res = await request(app).post(`/api/admin/bookings/${booking.id}/approve`).set(authed(token));
    assert.strictEqual(res.status, 201, res.text);
    const b = bookings.find((x) => x.id === booking.id);
    assert.strictEqual(b.status, 'approved');
    assert.ok(b.student_id);
    const student = users.find((u) => u.id === b.student_id);
    assert.strictEqual(student.email, 'neu@approve.de');
    assert.strictEqual(student.role, 'student');
    assert.ok(res.body.booking.student_name);
    assert.strictEqual(res.body.booking.student_name, 'Neu Student');
    assert.strictEqual(res.body.booking.course_title, `Course ${courseId}`);
    assert.ok(enrollments.some((e) => e.student_id === b.student_id && e.course_id === courseId));
});

test('approve reuses an existing user with the same email (no duplicate)', async () => {
    const courseId = seedCourse('active', true);
    const existing = users.find((u) => u.email === 'neu@approve.de');
    const booking = await newBooking(courseId, 'neu@approve.de', 'Neu Student');
    const token = await adminToken();
    const res = await request(app).post(`/api/admin/bookings/${booking.id}/approve`).set(authed(token));
    assert.strictEqual(res.status, 201, res.text);
    const b = bookings.find((x) => x.id === booking.id);
    assert.strictEqual(b.student_id, existing.id, 'must reuse the existing user, not create a duplicate');
});

test('approving an already-approved booking is a 409', async () => {
    const token = await adminToken();
    const approved = bookings.find((b) => b.status === 'approved');
    const res = await request(app).post(`/api/admin/bookings/${approved.id}/approve`).set(authed(token));
    assert.strictEqual(res.status, 409);
});

test('approving a nonexistent booking is a 404', async () => {
    const token = await adminToken();
    const res = await request(app).post('/api/admin/bookings/99999/approve').set(authed(token));
    assert.strictEqual(res.status, 404);
});

test('reject sets status rejected with an admin note', async () => {
    const courseId = seedCourse('active', true);
    const booking = await newBooking(courseId, 'reject@test.de', 'Zu ablehnen');
    const token = await adminToken();
    const res = await request(app)
        .post(`/api/admin/bookings/${booking.id}/reject`)
        .set(authed(token))
        .send({ admin_note: 'Kurs voll' });
    assert.strictEqual(res.status, 200, res.text);
    const b = bookings.find((x) => x.id === booking.id);
    assert.strictEqual(b.status, 'rejected');
    assert.strictEqual(b.admin_note, 'Kurs voll');
});

test('rejecting an already-approved booking is a 409', async () => {
    const token = await adminToken();
    const approved = bookings.find((b) => b.status === 'approved');
    const res = await request(app).post(`/api/admin/bookings/${approved.id}/reject`).set(authed(token));
    assert.strictEqual(res.status, 409);
});

test('admin can list bookings (with course title join + status filter)', async () => {
    const token = await adminToken();
    const res = await request(app).get('/api/admin/bookings').set(authed(token));
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.length >= 1);
    for (const b of res.body) {
        assert.ok(b.course_title !== undefined);
        assert.strictEqual(b.password, undefined);
    }
    const filtered = await request(app).get('/api/admin/bookings?status=pending').set(authed(token));
    assert.strictEqual(filtered.status, 200);
    for (const b of filtered.body) assert.strictEqual(b.status, 'pending');
});

test('teacher cannot access admin bookings (403)', async () => {
    const login = await request(app).post('/api/auth/login')
        .send({ email: 'teacher@test.de', password: 'TeacherPass123' });
    const res = await request(app).get('/api/admin/bookings').set(authed(login.body.token));
    assert.strictEqual(res.status, 403);
});

test('admin bookings requires a token (401)', async () => {
    const res = await request(app).get('/api/admin/bookings');
    assert.strictEqual(res.status, 401);
});

// --- Events -----------------------------------------------------------------

async function adminCreateEvent(extra = {}) {
    const token = await adminToken();
    return request(app).post('/api/admin/events').set(authed(token)).send({
        title: 'Test Event',
        slug: `test-event-${nextEventId}`,
        event_date: '2026-01-01',
        cover_image: 'https://images.unsplash.com/photo-1?auto=format&fit=crop&w=800&q=80',
        is_public: true,
        order: 1,
        photos: [
            { url: 'https://images.unsplash.com/photo-1?auto=format&fit=crop&w=800&q=80', caption: 'a' },
            { url: 'https://images.unsplash.com/photo-2?auto=format&fit=crop&w=800&q=80', caption: 'b' },
        ],
        ...extra,
    });
}

test('admin create event stores photos; public list + detail work', async () => {
    const created = await adminCreateEvent();
    assert.strictEqual(created.status, 201, created.text);
    const slug = created.body.event.slug;

    const list = await request(app).get('/api/public/events');
    assert.strictEqual(list.status, 200);
    const ev = list.body.find((e) => e.slug === slug);
    assert.ok(ev);
    assert.strictEqual(ev.photo_count, 2);
    assert.ok(Array.isArray(ev.photos) && ev.photos.length === 2);

    const detail = await request(app).get(`/api/public/events/${slug}`);
    assert.strictEqual(detail.status, 200);
    assert.strictEqual(detail.body.slug, slug);
    assert.ok(Array.isArray(detail.body.photos) && detail.body.photos.length === 2);
});

test('public event with unknown slug is 404', async () => {
    const res = await request(app).get('/api/public/events/does-not-exist');
    assert.strictEqual(res.status, 404);
});

test('hidden (is_public=false) event is not public', async () => {
    const created = await adminCreateEvent({ is_public: false, title: 'Hidden' });
    assert.strictEqual(created.status, 201, created.text);
    const slug = created.body.event.slug;
    const detail = await request(app).get(`/api/public/events/${slug}`);
    assert.strictEqual(detail.status, 404);
    const list = await request(app).get('/api/public/events');
    assert.ok(!list.body.some((e) => e.slug === slug));
});

test('creating an event with a duplicate slug is 409', async () => {
    const token = await adminToken();
    const slug = events[0].slug;
    const res = await request(app).post('/api/admin/events').set(authed(token)).send({ title: 'Dup', slug });
    assert.strictEqual(res.status, 409);
});

test('event photo url must be http(s) (400 otherwise)', async () => {
    const res = await adminCreateEvent({ slug: 'bad-photo', photos: [{ url: 'ftp://not-allowed/x.png' }] });
    assert.strictEqual(res.status, 400);
});

test('event slug must match the slug format (400)', async () => {
    const res = await adminCreateEvent({ slug: 'Bad Slug!' });
    assert.strictEqual(res.status, 400);
});

test('admin update event replaces the photo set', async () => {
    const token = await adminToken();
    const id = events.find((e) => e.photos === undefined && e.is_public).id;
    const ev = events.find((e) => e.id === id);
    const res = await request(app).patch(`/api/admin/events/${id}`).set(authed(token)).send({
        title: 'Test Event 2',
        photos: [{ url: 'https://images.unsplash.com/photo-3?auto=format&fit=crop&w=800&q=80', caption: 'c' }],
    });
    assert.strictEqual(res.status, 200, res.text);
    assert.strictEqual(res.body.event.title, 'Test Event 2');
    assert.strictEqual(res.body.event.photos.length, 1);
    assert.strictEqual(res.body.event.photos[0].caption, 'c');
});

test('admin update of a missing event is 404', async () => {
    const token = await adminToken();
    const res = await request(app).patch('/api/admin/events/99999').set(authed(token)).send({ title: 'X' });
    assert.strictEqual(res.status, 404);
});

test('admin can delete an event', async () => {
    const token = await adminToken();
    const id = events[events.length - 1].id;
    const slug = events[events.length - 1].slug;
    const res = await request(app).delete(`/api/admin/events/${id}`).set(authed(token));
    assert.strictEqual(res.status, 200);
    assert.ok(!events.some((e) => e.id === id));
    assert.ok(!eventPhotos.some((p) => p.event_id === id));
    const after = await request(app).get(`/api/public/events/${slug}`);
    assert.strictEqual(after.status, 404);
});

test('events admin endpoints require a token (401)', async () => {
    const res = await request(app).get('/api/admin/events');
    assert.strictEqual(res.status, 401);
});

// --- Contact messages -------------------------------------------------------

test('public contact form returns 201 and stores the message', async () => {
    const res = await request(app).post('/api/public/contact').send({
        name: 'Schreiber', email: 'schreiber@test.de', subject: 'Frage', message: 'Ist noch Platz frei?',
    });
    assert.strictEqual(res.status, 201);
    assert.ok(contacts.some((c) => c.email === 'schreiber@test.de' && c.is_read === false));
});

test('contact form validates (400 on empty message / bad email)', async () => {
    const res = await request(app).post('/api/public/contact').send({
        name: 'X', email: 'x@test.de', message: '',
    });
    assert.strictEqual(res.status, 400);
    const res2 = await request(app).post('/api/public/contact').send({
        name: 'X', email: 'kein-email', message: 'Hallo',
    });
    assert.strictEqual(res2.status, 400);
});

test('admin can list and mark-read contact messages', async () => {
    const token = await adminToken();
    const list = await request(app).get('/api/admin/contact').set(authed(token));
    assert.strictEqual(list.status, 200);
    assert.ok(list.body.length >= 1);

    const unread = await request(app).get('/api/admin/contact?unread=true').set(authed(token));
    assert.strictEqual(unread.status, 200);
    for (const c of unread.body) assert.strictEqual(c.is_read, false);

    const id = contacts[contacts.length - 1].id;
    const res = await request(app).patch(`/api/admin/contact/${id}`).set(authed(token));
    assert.strictEqual(res.status, 200);
    assert.strictEqual(contacts.find((c) => c.id === id).is_read, true);
    assert.strictEqual(res.body.message.is_read, true);
});

test('marking a nonexistent message read is 404', async () => {
    const token = await adminToken();
    const res = await request(app).patch('/api/admin/contact/99999').set(authed(token));
    assert.strictEqual(res.status, 404);
});

test('contact admin endpoints require a token (401)', async () => {
    const res = await request(app).get('/api/admin/contact');
    assert.strictEqual(res.status, 401);
});
