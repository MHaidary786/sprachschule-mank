const express = require('express');
const rateLimit = require('express-rate-limit');
const studentController = require('../controllers/studentController');

const router = express.Router();

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many registrations, please try again later' },
});

router.post('/register', registerLimiter, studentController.register);
router.post('/create', registerLimiter, studentController.register);
router.get('/', studentController.getStudents);
router.get('/:id', studentController.getStudentById);
router.post('/:id/password', studentController.resetPassword);

module.exports = router;
