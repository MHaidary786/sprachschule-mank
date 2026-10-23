const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, parsePagination, schemas } = require('../utils/validate');

// GET /api/student
exports.getStudents = [authenticate, authorize('teacher', 'admin'), async (req, res, next) => {
    try {
        const { limit, offset } = parsePagination(req.query);
        const students = await User.getAll({ limit, offset });
        return res.json(students.filter((u) => u.role === 'student'));
    } catch (err) {
        return next(err);
    }
}];

// GET /api/student/me/courses
// The current student's own courses and their teachers.
exports.myCourses = [authenticate, authorize('student'), async (req, res, next) => {
    try {
        const courses = await Enrollment.getByStudent(req.user.sub);
        return res.json(courses);
    } catch (err) {
        return next(err);
    }
}];

// GET /api/student/:id
exports.getStudentById = [authenticate, authorize('teacher', 'admin', 'student'), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid student id' });

        const student = await User.getById(id);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Students may only view their own profile
        if (student.role === 'student' && req.user.role === 'student' && req.user.sub !== student.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        return res.json(student);
    } catch (err) {
        return next(err);
    }
}];

// POST /api/student/:id/password  (admin/teacher reset, or student self-service)
exports.resetPassword = [authenticate, authorize('teacher', 'admin', 'student'),
    validate(schemas.changePassword.pick({ newPassword: true })), async (req, res, next) => {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid student id' });

            const student = await User.getById(id);
            if (!student || student.role !== 'student') {
                return res.status(404).json({ message: 'Student not found' });
            }
            if (req.user.role === 'student' && req.user.sub !== id) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            await User.updatePassword(id, req.body.newPassword);
            return res.json({ message: 'Password updated' });
        } catch (err) {
            return next(err);
        }
    }];
