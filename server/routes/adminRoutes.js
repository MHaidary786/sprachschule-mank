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
router.patch('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

module.exports = router;
