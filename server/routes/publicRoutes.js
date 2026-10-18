const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();

router.get('/pages', publicController.listPages);
router.get('/pages/:slug', publicController.getPage);
router.get('/courses', publicController.listCourses);
router.get('/courses/:id', publicController.getCourse);

module.exports = router;
