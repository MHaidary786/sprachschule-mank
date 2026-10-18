const express = require('express');
const teacherController = require('../controllers/teacherController');

const router = express.Router();

router.get('/dashboard', teacherController.dashboard);
router.get('/students', teacherController.listStudents);
router.get('/students/:id', teacherController.getStudent);

module.exports = router;
