const express = require('express');
const rateLimit = require('express-rate-limit');
const publicController = require('../controllers/publicController');

const router = express.Router();

// Stricter limiters for the public write endpoints (anti-spam on top of the
// general /api limit).
const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Zu viele Anfragen, bitte versuchen Sie es später erneut' },
});
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Zu viele Anfragen, bitte versuchen Sie es später erneut' },
});

router.get('/pages', publicController.listPages);
router.get('/pages/:slug', publicController.getPage);
router.get('/courses', publicController.listCourses);
router.get('/courses/:id', publicController.getCourse);
router.get('/events', publicController.listEvents);
router.get('/events/:slug', publicController.getEvent);
router.post('/bookings', bookingLimiter, publicController.createBooking);
router.post('/contact', contactLimiter, publicController.createContact);

module.exports = router;
