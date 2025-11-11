const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.post('/create', studentController.createStudent);
router.get('/getallstudents', studentController.getStudents);
router.get('/getstudent/:name', studentController.getStudentByName);

module.exports = router;
