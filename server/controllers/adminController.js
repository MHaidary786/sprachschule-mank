const crypto = require('crypto');
const User = require('../models/User');
const Page = require('../models/Page');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const BookingRequest = require('../models/BookingRequest');
const Event = require('../models/Event');
const ContactMessage = require('../models/ContactMessage');
const { client } = require('../config/db');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, parsePagination, schemas } = require('../utils/validate');

const requireAuth = [authenticate, authorize('admin')];

// Small param guard reused by the :id routes below.
const idParam = (param) => (req, res, next) => {
    const id = Number(req.params[param]);
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid id' });
    req.params[param] = id;
    next();
};

// GET /api/admin/dashboard
exports.dashboard = [...requireAuth, async (req, res, next) => {
    try {
        const admin = await User.getById(req.user.sub);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        return res.json({ message: `Welcome to the Admin dashboard, ${admin.name}` });
    } catch (err) {
        return next(err);
    }
}];

// GET /api/admin/users
exports.manageUsers = [...requireAuth, async (req, res, next) => {
    try {
        const { limit, offset } = parsePagination(req.query);
        const users = await User.getAll({ limit, offset });
        return res.json(users);
    } catch (err) {
        return next(err);
    }
}];

// POST /api/admin/users
exports.createUser = [...requireAuth, validate(schemas.createUser), async (req, res, next) => {
    try {
        const { name, email, password, role, avatar } = req.body;

        const existing = await User.getByEmail(email);
        if (existing) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const user = await new User(name, email, password, role, avatar).save();
        return res.status(201).json({ message: 'User created successfully', user });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Email already in use' });
        }
        return next(err);
    }
}];

// PATCH /api/admin/users/:id
exports.updateUser = [...requireAuth,
    (req, res, next) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid user id' });
        req.params.id = id;
        next();
    },
    validate(schemas.updateUser), async (req, res, next) => {
        try {
            const id = req.params.id;
            const target = await User.getById(id);
            if (!target) return res.status(404).json({ message: 'User not found' });

            const { name, email, avatar, password, role } = req.body;
            const updates = [];
            const values = [];
            let idx = 1;

            if (name !== undefined) { updates.push(`name = $${idx}`); values.push(name); idx++; }
            if (email !== undefined) {
                const clash = await User.getByEmail(email);
                if (clash && clash.id !== id) return res.status(409).json({ message: 'Email already in use' });
                updates.push(`email = $${idx}`); values.push(email); idx++;
            }
            if (avatar !== undefined) { updates.push(`avatar = $${idx}`); values.push(avatar); idx++; }

            // Role changes: guard against locking the last admin out.
            if (role !== undefined && role !== target.role) {
                if (target.role === 'admin' && role !== 'admin' && (await User.countByRole('admin')) <= 1) {
                    return res.status(400).json({ message: 'The last admin cannot be demoted' });
                }
                updates.push(`role = $${idx}`); values.push(role); idx++;
            }

            if (updates.length) {
                values.push(id);
                await client.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
            }
            if (password !== undefined) {
                await User.updatePassword(id, password);
            }

            const updated = await User.getById(id);
            return res.json({ message: 'User updated', user: updated });
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ message: 'Email already in use' });
            }
            return next(err);
        }
    }];

// DELETE /api/admin/users/:id
exports.deleteUser = [...requireAuth,
    (req, res, next) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid user id' });
        req.params.id = id;
        next();
    }, async (req, res, next) => {
        try {
            const id = req.params.id;
            if (id === req.user.sub) {
                return res.status(400).json({ message: 'You cannot delete your own account' });
            }
            const target = await User.getById(id);
            if (!target) return res.status(404).json({ message: 'User not found' });
            // Never delete the last remaining admin.
            if (target.role === 'admin' && (await User.countByRole('admin')) <= 1) {
                return res.status(400).json({ message: 'The last admin cannot be deleted' });
            }
            await User.deleteById(id);
            return res.json({ message: 'User deleted successfully' });
        } catch (err) {
            return next(err);
        }
    }];

// GET /api/admin/pages
exports.listPages = [...requireAuth, async (req, res, next) => {
    try {
        const pages = await Page.getAll();
        return res.json(pages);
    } catch (err) {
        return next(err);
    }
}];

// POST /api/admin/pages
exports.createPage = [...requireAuth, validate(schemas.createPage), async (req, res, next) => {
    try {
        const { title, slug, content, show_in_nav, order } = req.body;
        const existing = await Page.getBySlug(slug);
        if (existing) return res.status(409).json({ message: 'Eine Seite mit diesem Slug existiert bereits' });
        const page = await new Page(title, slug, content, show_in_nav, order).save();
        return res.status(201).json({ message: 'Page created successfully', page });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Eine Seite mit diesem Slug existiert bereits' });
        }
        return next(err);
    }
}];

// PATCH /api/admin/pages/:id
exports.updatePage = [...requireAuth,
    (req, res, next) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid page id' });
        req.params.id = id;
        next();
    },
    validate(schemas.updatePage), async (req, res, next) => {
        try {
            const id = req.params.id;
            const target = await Page.getById(id);
            if (!target) return res.status(404).json({ message: 'Page not found' });

            const { title, slug, content, show_in_nav, order } = req.body;
            if (slug && slug !== target.slug) {
                const clash = await Page.getBySlug(slug);
                if (clash && clash.id !== id) {
                    return res.status(409).json({ message: 'Eine Seite mit diesem Slug existiert bereits' });
                }
            }
            const updated = await Page.update(id, { title, slug, content, showInNav: show_in_nav, order });
            return res.json({ message: 'Page updated', page: updated });
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ message: 'Eine Seite mit diesem Slug existiert bereits' });
            }
            return next(err);
        }
    }];

// DELETE /api/admin/pages/:id
exports.deletePage = [...requireAuth, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid page id' });
        const target = await Page.getById(id);
        if (!target) return res.status(404).json({ message: 'Page not found' });
        await Page.deleteById(id);
        return res.json({ message: 'Page deleted successfully' });
    } catch (err) {
        return next(err);
    }
}];

// GET /api/admin/courses
exports.listCourses = [...requireAuth, async (req, res, next) => {
    try {
        const courses = await Course.getAllCourses();
        return res.json(courses);
    } catch (err) {
        return next(err);
    }
}];

// POST /api/admin/courses
exports.createCourse = [...requireAuth, validate(schemas.createCourse), async (req, res, next) => {
    try {
        const teacher = await User.getById(req.body.teacher_id);
        if (!teacher || teacher.role === 'student') {
            return res.status(400).json({ message: 'Lehrkraft nicht gefunden' });
        }
        const { teacher_id, title, description, language, level, thumbnail, status,
            duration, days, time, price_extern, price_intern, is_open_for_enrollment } = req.body;
        const course = await new Course(
            teacher_id, title, description, language, level,
            thumbnail ?? null, status,
            duration ?? null, days ?? null, time ?? null,
            price_extern ?? null, price_intern ?? null, is_open_for_enrollment
        ).save();
        return res.status(201).json({ message: 'Course created successfully', course });
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ message: 'Lehrkraft nicht gefunden' });
        }
        return next(err);
    }
}];

// PATCH /api/admin/courses/:id
exports.updateCourse = [...requireAuth,
    (req, res, next) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid course id' });
        req.params.id = id;
        next();
    },
    validate(schemas.updateCourse), async (req, res, next) => {
        try {
            const id = req.params.id;
            const target = await Course.getCourse(id);
            if (!target) return res.status(404).json({ message: 'Course not found' });
            if (req.body.teacher_id !== undefined) {
                const teacher = await User.getById(req.body.teacher_id);
                if (!teacher || teacher.role === 'student') {
                    return res.status(400).json({ message: 'Lehrkraft nicht gefunden' });
                }
            }
            const updated = await Course.update(id, req.body);
            return res.json({ message: 'Course updated', course: updated });
        } catch (err) {
            if (err.code === '23503') {
                return res.status(400).json({ message: 'Lehrkraft nicht gefunden' });
            }
            return next(err);
        }
    }];

// DELETE /api/admin/courses/:id
exports.deleteCourse = [...requireAuth, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid course id' });
        const target = await Course.getCourse(id);
        if (!target) return res.status(404).json({ message: 'Course not found' });
        await Course.deleteById(id);
        return res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        return next(err);
    }
}];

// GET /api/admin/courses/:courseId/students
exports.listCourseStudents = [...requireAuth, async (req, res, next) => {
    try {
        const id = Number(req.params.courseId);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid course id' });
        const target = await Course.getCourse(id);
        if (!target) return res.status(404).json({ message: 'Course not found' });
        const students = await Enrollment.getCourseStudents(id);
        return res.json(students);
    } catch (err) {
        return next(err);
    }
}];

// POST /api/admin/courses/:courseId/students  { student_id }
exports.enrollStudent = [...requireAuth, async (req, res, next) => {
    try {
        const courseId = Number(req.params.courseId);
        const studentId = Number(req.body?.student_id);
        if (!Number.isInteger(courseId)) return res.status(400).json({ message: 'Invalid course id' });
        if (!Number.isInteger(studentId)) return res.status(400).json({ message: 'Invalid student id' });

        const course = await Course.getCourse(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        const student = await User.getById(studentId);
        if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

        const added = await Enrollment.add(studentId, courseId);
        if (!added) return res.status(409).json({ message: 'Student is already enrolled in this course' });
        return res.status(201).json({ message: 'Student enrolled' });
    } catch (err) {
        if (err.code === '23503') return res.status(400).json({ message: 'Student not found' });
        return next(err);
    }
}];

// DELETE /api/admin/courses/:courseId/students/:studentId
exports.removeStudent = [...requireAuth, async (req, res, next) => {
    try {
        const courseId = Number(req.params.courseId);
        const studentId = Number(req.params.studentId);
        if (!Number.isInteger(courseId)) return res.status(400).json({ message: 'Invalid course id' });
        if (!Number.isInteger(studentId)) return res.status(400).json({ message: 'Invalid student id' });

        const course = await Course.getCourse(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        const removed = await Enrollment.remove(studentId, courseId);
        if (!removed) return res.status(404).json({ message: 'Student is not enrolled in this course' });
        return res.json({ message: 'Student removed' });
    } catch (err) {
        return next(err);
    }
}];

// ---------------------------------------------------------------------------
// Booking requests
// ---------------------------------------------------------------------------

// GET /api/admin/bookings  (?status=)
exports.listBookings = [...requireAuth, async (req, res, next) => {
    try {
        const status = req.query.status;
        if (status && !['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const bookings = await BookingRequest.listAll({ status });
        return res.json(bookings);
    } catch (err) {
        return next(err);
    }
}];

// POST /api/admin/bookings/:id/approve  (atomic: user + enrollment + status)
exports.approveBooking = [...requireAuth, idParam('id'), async (req, res, next) => {
    try {
        const id = req.params.id;
        const booking = await BookingRequest.getByIdOn(id);
        if (!booking) return res.status(404).json({ message: 'Buchungsanfrage nicht gefunden' });
        if (booking.status === 'approved') {
            return res.status(409).json({ message: 'Diese Buchungsanfrage wurde bereits freigegeben' });
        }

        // The whole approve flow is one transaction: resolve/reuse the student,
        // set the status + student_id, then enroll. Roll back on any failure.
        await client.query('BEGIN');
        try {
            let student = null;
            if (booking.student_id) {
                const s = await client.query(
                    `SELECT id, name, email, role, avatar, created_at FROM users WHERE id = $1`,
                    [booking.student_id]
                );
                student = s.rows[0] || null;
            }
            if (!student) {
                const byEmail = await client.query(
                    `SELECT id, name, email, role, avatar, created_at FROM users WHERE email = $1`,
                    [booking.email]
                );
                student = byEmail.rows[0] || null;
            }
            if (!student) {
                student = await BookingRequest.createStudentUser(booking.name, booking.email);
            }

            await BookingRequest.updateStatus(id, {
                status: 'approved',
                admin_note: null,
                student_id: student.id,
            });
            // Enrollment.add is idempotent (ON CONFLICT DO NOTHING).
            await Enrollment.add(student.id, booking.course_id);
            await client.query('COMMIT');
            // Return the joined row (course_title, student_name, ...) for the admin UI.
            const updated = await BookingRequest.getById(id);
            return res.status(201).json({ message: 'Buchung freigegeben und Student zum Kurs angemeldet', booking: updated });
        } catch (txErr) {
            await client.query('ROLLBACK');
            throw txErr;
        }
    } catch (err) {
        return next(err);
    }
}];

// POST /api/admin/bookings/:id/reject  { admin_note? }
exports.rejectBooking = [...requireAuth, idParam('id'), async (req, res, next) => {
    try {
        const id = req.params.id;
        const booking = await BookingRequest.getByIdOn(id);
        if (!booking) return res.status(404).json({ message: 'Buchungsanfrage nicht gefunden' });
        if (booking.status === 'approved') {
            return res.status(409).json({ message: 'Diese Buchungsanfrage wurde bereits freigegeben' });
        }
        const updated = await BookingRequest.updateStatus(id, {
            status: 'rejected',
            admin_note: (req.body && req.body.admin_note) ?? null,
            student_id: null,
        });
        return res.json({ message: 'Buchungsanfrage abgelehnt', booking: updated });
    } catch (err) {
        return next(err);
    }
}];

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

// GET /api/admin/events
exports.listEvents = [...requireAuth, async (req, res, next) => {
    try {
        const events = await Event.getAllEvents();
        return res.json(events);
    } catch (err) {
        return next(err);
    }
}];

// POST /api/admin/events
exports.createEvent = [...requireAuth, validate(schemas.createEvent), async (req, res, next) => {
    try {
        const { title, slug, description, event_date, cover_image, is_public, order, photos } = req.body;
        const clash = await Event.slugExists(slug);
        if (clash) return res.status(409).json({ message: 'Ein Event mit diesem Slug existiert bereits' });
        const event = await Event.createEvent({
            title, slug,
            description: description ?? null,
            event_date: event_date || null,
            cover_image: cover_image ?? null,
            is_public, order, photos,
        });
        return res.status(201).json({ message: 'Event erstellt', event });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Ein Event mit diesem Slug existiert bereits' });
        }
        return next(err);
    }
}];

// PATCH /api/admin/events/:id
exports.updateEvent = [...requireAuth, idParam('id'), validate(schemas.updateEvent), async (req, res, next) => {
    try {
        const id = req.params.id;
        const target = await Event.getEventById(id);
        if (!target) return res.status(404).json({ message: 'Event nicht gefunden' });
        const { title, slug, description, event_date, cover_image, is_public, order, photos } = req.body;
        if (slug && slug !== target.slug) {
            const clash = await Event.slugExists(slug, id);
            if (clash) return res.status(409).json({ message: 'Ein Event mit diesem Slug existiert bereits' });
        }
        const updated = await Event.updateEvent(id, {
            title, slug,
            description,
            event_date: event_date !== undefined ? (event_date || null) : undefined,
            cover_image: cover_image !== undefined ? (cover_image ?? null) : undefined,
            is_public, order, photos,
        });
        return res.json({ message: 'Event aktualisiert', event: updated });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Ein Event mit diesem Slug existiert bereits' });
        }
        return next(err);
    }
}];

// DELETE /api/admin/events/:id
exports.deleteEvent = [...requireAuth, idParam('id'), async (req, res, next) => {
    try {
        const id = req.params.id;
        const target = await Event.getEventById(id);
        if (!target) return res.status(404).json({ message: 'Event nicht gefunden' });
        await Event.deleteEvent(id);
        return res.json({ message: 'Event gelöscht' });
    } catch (err) {
        return next(err);
    }
}];

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

// GET /api/admin/contact  (?unread=true)
exports.listContact = [...requireAuth, async (req, res, next) => {
    try {
        const unread = req.query.unread === 'true';
        const messages = await ContactMessage.listAll({ unread });
        return res.json(messages);
    } catch (err) {
        return next(err);
    }
}];

// PATCH /api/admin/contact/:id  (mark read)
exports.markContactRead = [...requireAuth, idParam('id'), async (req, res, next) => {
    try {
        const id = req.params.id;
        const existing = await ContactMessage.getById(id);
        if (!existing) return res.status(404).json({ message: 'Nachricht nicht gefunden' });
        const updated = await ContactMessage.markRead(id);
        return res.json({ message: 'Nachricht als gelesen markiert', message: updated });
    } catch (err) {
        return next(err);
    }
}];
