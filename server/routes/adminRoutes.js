const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/dashboard', adminController.dashboard);

router.get('/users', adminController.manageUsers);
router.post('/users', adminController.createUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/pages', adminController.listPages);
router.post('/pages', adminController.createPage);
router.patch('/pages/:id', adminController.updatePage);
router.delete('/pages/:id', adminController.deletePage);

router.get('/courses', adminController.listCourses);
router.post('/courses', adminController.createCourse);
router.get('/courses/:courseId/students', adminController.listCourseStudents);
router.post('/courses/:courseId/students', adminController.enrollStudent);
router.delete('/courses/:courseId/students/:studentId', adminController.removeStudent);
router.patch('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

router.get('/bookings', adminController.listBookings);
router.post('/bookings/:id/approve', adminController.approveBooking);
router.post('/bookings/:id/reject', adminController.rejectBooking);

router.get('/events', adminController.listEvents);
router.post('/events', adminController.createEvent);
router.patch('/events/:id', adminController.updateEvent);
router.delete('/events/:id', adminController.deleteEvent);

router.get('/contact', adminController.listContact);
router.patch('/contact/:id', adminController.markContactRead);

module.exports = router;
