const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController.js');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all teacher routes
router.use(authMiddleware.verifyTeacherToken);

// Teacher dashboard
router.get('/dashboard', teacherController.dashboard);

// View/manage students
router.get('/students', teacherController.listStudents);

module.exports = router;
