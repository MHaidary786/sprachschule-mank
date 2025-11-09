const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');


// Login route
router.post('/login', authController.login);

// Example route for creating users (admin/teacher)
router.post('/create-user', authController.createUser);

module.exports = router;
