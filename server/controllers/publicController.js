const Page = require('../models/Page');
const Course = require('../models/Course');
const Event = require('../models/Event');
const BookingRequest = require('../models/BookingRequest');
const ContactMessage = require('../models/ContactMessage');
const { validate, schemas } = require('../utils/validate');

// GET /api/public/pages
exports.listPages = async (req, res, next) => {
    try {
        const pages = await Page.getAll();
        return res.json(pages);
    } catch (err) {
        return next(err);
    }
};

// GET /api/public/pages/:slug
exports.getPage = async (req, res, next) => {
    try {
        const page = await Page.getBySlug(req.params.slug);
        if (!page) return res.status(404).json({ message: 'Page not found' });
        return res.json(page);
    } catch (err) {
        return next(err);
    }
};

// GET /api/public/courses
exports.listCourses = async (req, res, next) => {
    try {
        const courses = await Course.getAllCourses({ onlyActive: true });
        return res.json(courses);
    } catch (err) {
        return next(err);
    }
};

// GET /api/public/courses/:id
exports.getCourse = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid course id' });
        const course = await Course.getCourse(id);
        // Only active courses are public; inactive ones are hidden like the list endpoint.
        if (!course || course.status !== 'active') return res.status(404).json({ message: 'Course not found' });
        return res.json(course);
    } catch (err) {
        return next(err);
    }
};

// GET /api/public/events
exports.listEvents = async (req, res, next) => {
    try {
        const events = await Event.getPublicEvents();
        return res.json(events);
    } catch (err) {
        return next(err);
    }
};

// GET /api/public/events/:slug
exports.getEvent = async (req, res, next) => {
    try {
        const event = await Event.getPublicEventBySlug(req.params.slug);
        if (!event) return res.status(404).json({ message: 'Veranstaltung nicht gefunden' });
        return res.json(event);
    } catch (err) {
        return next(err);
    }
};

// POST /api/public/bookings
exports.createBooking = [validate(schemas.createBooking), async (req, res, next) => {
    try {
        const { course_id, name, email, phone, message } = req.body;
        const course = await Course.getCourse(course_id);
        if (!course || course.status !== 'active') {
            return res.status(404).json({ message: 'Der angegebene Kurs wurde nicht gefunden' });
        }
        if (!course.is_open_for_enrollment) {
            return res.status(400).json({ message: 'Dieser Kurs nimmt keine neuen Anmeldungen an' });
        }
        await new BookingRequest(course_id, name, email, phone ?? null, message ?? null).save();
        return res.status(201).json({ message: 'Ihre Buchungsanfrage wurde erfolgreich übermittelt. Wir melden uns in Kürze bei Ihnen.' });
    } catch (err) {
        return next(err);
    }
}];

// POST /api/public/contact
exports.createContact = [validate(schemas.createContact), async (req, res, next) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        await new ContactMessage(name, email, phone ?? null, subject ?? null, message).save();
        return res.status(201).json({ message: 'Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.' });
    } catch (err) {
        return next(err);
    }
}];
