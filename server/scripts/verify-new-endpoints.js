// Manual end-to-end verification of the new endpoints against a running dev server.
const BASE = 'http://localhost:5000';
let pass = 0;
let fail = 0;

async function req(method, path, { token, body } = {}) {
    const res = await fetch(BASE + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try { json = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, json };
}

function check(label, cond, extra = '') {
    if (cond) { pass++; console.log(`  ok  ${label}`); }
    else { fail++; console.log(`FAIL  ${label} ${extra}`); }
}

(async () => {
    // 1. public events
    const events = await req('GET', '/api/public/events');
    check('GET /api/public/events -> 200', events.status === 200, `got ${events.status}`);
    check('events list has 3 events', events.json.length === 3, `got ${events.json.length}`);
    check('every event has photo_count + photos array',
        events.json.every((e) => typeof e.photo_count === 'number' && Array.isArray(e.photos) && e.photos.length > 0));
    console.log('  seeded slugs:', events.json.map((e) => e.slug).join(', '));

    // 2. public event by slug
    const first = events.json[0];
    const detail = await req('GET', `/api/public/events/${first.slug}`);
    check(`GET /api/public/events/${first.slug} -> 200`, detail.status === 200, `got ${detail.status}`);
    check('event detail has all its photos (5+)',
        Array.isArray(detail.json.photos) && detail.json.photos.length >= 5 && detail.json.photos.length >= first.photo_count,
        `photos=${detail.json.photos?.length} list-photo_count=${first.photo_count}`);

    const missing = await req('GET', '/api/public/events/nope-not-there');
    check('unknown event slug -> 404', missing.status === 404, `got ${missing.status}`);

    // 3. valid course for booking (active + open)
    const courses = await req('GET', '/api/public/courses');
    check('GET /api/public/courses -> 200', courses.status === 200, `got ${courses.status}`);
    const open = courses.json.find((c) => c.status === 'active' && c.is_open_for_enrollment);
    check('found an active + open course', !!open, `courses=${JSON.stringify(courses.json.map((c) => ({ id: c.id, status: c.status, open: c.is_open_for_enrollment })))}`);

    const email = `guest${Date.now()}@example.de`;
    const booking = await req('POST', '/api/public/bookings', {
        body: { course_id: open.id, name: 'Test Gast', email, phone: '0171 234567', message: 'Ich moechte gerne mitmachen' },
    });
    check('POST /api/public/bookings -> 201', booking.status === 201, `got ${booking.status}: ${JSON.stringify(booking.json)}`);

    const badBooking = await req('POST', '/api/public/bookings', {
        body: { course_id: open.id, name: 'X', email: 'kein-email' },
    });
    check('booking with invalid email -> 400', badBooking.status === 400, `got ${badBooking.status}`);

    const ghostBooking = await req('POST', '/api/public/bookings', {
        body: { course_id: 99999, name: 'X', email: 'g@x.de' },
    });
    check('booking for unknown course -> 404', ghostBooking.status === 404, `got ${ghostBooking.status}`);

    // 4. contact
    const contact = await req('POST', '/api/public/contact', {
        body: { name: 'Test Kontakt', email, subject: 'Frage', message: 'Ist noch ein Platz frei?' },
    });
    check('POST /api/public/contact -> 201', contact.status === 201, `got ${contact.status}: ${JSON.stringify(contact.json)}`);

    const badContact = await req('POST', '/api/public/contact', {
        body: { name: 'Test', email: 'bad', message: '' },
    });
    check('contact with invalid email/message -> 400', badContact.status === 400, `got ${badContact.status}`);

    // 5. admin login
    const login = await req('POST', '/api/auth/login', {
        body: { email: 'admin@sprachschule-mank.de', password: 'PTNqS2bQG9C_eRO0T%' },
    });
    check('admin login -> 200 + token', login.status === 200 && !!login.json.token, `got ${login.status}`);
    const token = login.json.token;

    // 6. admin bookings list
    const adminBookings = await req('GET', '/api/admin/bookings', { token });
    check('GET /api/admin/bookings -> 200', adminBookings.status === 200, `got ${adminBookings.status}`);
    const myBooking = adminBookings.json.find((b) => b.email === email && b.status === 'pending');
    check('list includes the new pending booking with course_title',
        !!myBooking && !!myBooking.course_title, JSON.stringify(adminBookings.json[0] || {}));

    const filtered = await req('GET', '/api/admin/bookings?status=pending', { token });
    check('?status=pending filter works', filtered.status === 200 && filtered.json.every((b) => b.status === 'pending'));

    // 7. approve
    const approve = await req('POST', `/api/admin/bookings/${myBooking.id}/approve`, { token });
    check('POST approve -> 201', approve.status === 201, `got ${approve.status}: ${JSON.stringify(approve.json)}`);
    check('approved booking has student_id set', !!approve.json.booking?.student_id);
    check('approved booking has student_name', !!approve.json.booking?.student_name, JSON.stringify(approve.json.booking || {}));

    const approveAgain = await req('POST', `/api/admin/bookings/${myBooking.id}/approve`, { token });
    check('approve again -> 409', approveAgain.status === 409, `got ${approveAgain.status}`);

    const approveGhost = await req('POST', '/api/admin/bookings/99999/approve', { token });
    check('approve missing id -> 404', approveGhost.status === 404, `got ${approveGhost.status}`);

    // 8. reject flow on a fresh booking
    const email2 = `guest2${Date.now()}@example.de`;
    const b2 = await req('POST', '/api/public/bookings', { body: { course_id: open.id, name: 'Zweit Gast', email: email2 } });
    check('second booking created', b2.status === 201);
    const list2 = await req('GET', '/api/admin/bookings', { token });
    const b2id = list2.json.find((x) => x.email === email2)?.id;
    const reject = await req('POST', `/api/admin/bookings/${b2id}/reject`, {
        token, body: { admin_note: 'Kurs ist voll' },
    });
    const rejectStatus = reject.status;
    check('POST reject -> 200 + note stored', rejectStatus === 200 && reject.json.booking?.admin_note === 'Kurs ist voll',
        `got ${rejectStatus}: ${JSON.stringify(reject.json)}`);
    const rejectApproved = await req('POST', `/api/admin/bookings/${myBooking.id}/reject`, { token });
    check('reject an approved booking -> 409', rejectApproved.status === 409, `got ${rejectApproved.status}`);

    // 9. admin contact
    const adminContact = await req('GET', '/api/admin/contact', { token });
    check('GET /api/admin/contact -> 200', adminContact.status === 200, `got ${adminContact.status}`);
    const myMsg = adminContact.json.find((m) => m.email === email);
    check('list includes the contact message (unread)', !!myMsg && myMsg.is_read === false);
    const markRead = await req('PATCH', `/api/admin/contact/${myMsg.id}`, { token });
    check('PATCH contact/:id -> 200 + is_read true', markRead.status === 200 && markRead.json.message?.is_read === true,
        `got ${markRead.status}: ${JSON.stringify(markRead.json)}`);

    // 10. admin events CRUD
    const adminEvents = await req('GET', '/api/admin/events', { token });
    check('GET /api/admin/events -> 200 (all, incl. non-public check)', adminEvents.status === 200 && adminEvents.json.length >= 3,
        `got ${adminEvents.status} len ${adminEvents.json?.length}`);

    const slug = `test-event-${Date.now() % 100000}`;
    const cover = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80';
    const evPhoto = 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80';
    const created = await req('POST', '/api/admin/events', {
        token,
        body: {
            title: 'Veranstaltung Test', slug, description: 'Testevent', event_date: '2026-08-01',
            cover_image: cover, is_public: true, order: 9,
            photos: [
                { url: evPhoto, caption: 'Erstes Foto' },
                { url: cover, caption: 'Zweites Foto' },
            ],
        },
    });
    check('POST /api/admin/events -> 201 with photos', created.status === 201 && created.json.event?.photos?.length === 2,
        `got ${created.status}: ${JSON.stringify(created.json)}`);

    const dup = await req('POST', '/api/admin/events', { token, body: { title: 'Dup', slug } });
    check('duplicate slug -> 409', dup.status === 409, `got ${dup.status}`);

    const badUrl = await req('POST', '/api/admin/events', {
        token, body: { title: 'Bad', slug: 'bad-photo', photos: [{ url: 'ftp://x' }] },
    });
    check('non-http photo url -> 400', badUrl.status === 400, `got ${badUrl.status}`);

    const evId = created.json.event.id;
    const patched = await req('PATCH', `/api/admin/events/${evId}`, {
        token,
        body: { title: 'Veranstaltung Test 2', photos: [{ url: cover, caption: 'Neu' }] },
    });
    check('PATCH /api/admin/events/:id -> 200, photos replaced',
        patched.status === 200 && patched.json.event.title === 'Veranstaltung Test 2' && patched.json.event.photos.length === 1,
        `got ${patched.status}: ${JSON.stringify(patched.json)}`);

    const deleted = await req('DELETE', `/api/admin/events/${evId}`, { token });
    check('DELETE /api/admin/events/:id -> 200', deleted.status === 200, `got ${deleted.status}`);
    const afterDelete = await req('GET', `/api/public/events/${slug}`);
    check('public event gone after delete -> 404', afterDelete.status === 404, `got ${afterDelete.status}`);

    // 11. auth guards
    const noToken = await req('GET', '/api/admin/bookings');
    check('admin bookings without token -> 401', noToken.status === 401, `got ${noToken.status}`);
    const teacherLogin = await req('POST', '/api/auth/login', {
        body: { email: 'teacher@sprachschule-mank.de', password: 'TeacherPass123' },
    });
    const forbidden = await req('GET', '/api/admin/bookings', { token: teacherLogin.json.token });
    check('teacher on admin bookings -> 403', forbidden.status === 403, `got ${forbidden.status}`);

    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
})().catch((err) => { console.error('Verify script error:', err); process.exit(1); });
