const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const router = express.Router();

// Strict limit on login to slow brute-force attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many login attempts, please try again later' },
});

router.post('/login', loginLimiter, authController.login);
router.post('/create-user', authController.createUser);
router.get('/me', authController.me);
router.post('/change-password', authController.changePassword);

module.exports = router;
