const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all admin routes
router.use(authMiddleware.verifyAdminToken);

// Admin dashboard
router.get('/dashboard', adminController.dashboard);

// Manage users (teachers/students)
router.get('/manage-users', adminController.manageUsers);

module.exports = router;
