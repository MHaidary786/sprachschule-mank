const express = require('express');
const studentController = require('../controllers/studentController');

const router = express.Router();

// NOTE: There is intentionally NO public self-registration endpoint.
// Accounts are only created by an admin (POST /api/admin/users) so that no
// one can register themselves from outside the school.

router.get('/me/courses', studentController.myCourses);
router.get('/', studentController.getStudents);
router.get('/:id', studentController.getStudentById);
router.post('/:id/password', studentController.resetPassword);

module.exports = router;
