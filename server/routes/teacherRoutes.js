const express = require('express');
const teacherController = require('../controllers/teacherController');

const router = express.Router();

router.get('/dashboard', teacherController.dashboard);
router.get('/courses', teacherController.listCourses);
router.get('/courses/:courseId/students', teacherController.listCourseStudents);
router.post('/courses/:courseId/students', teacherController.enrollStudent);
router.delete('/courses/:courseId/students/:studentId', teacherController.removeStudent);
router.get('/students', teacherController.listStudents);
router.get('/students/:id', teacherController.getStudent);

module.exports = router;
