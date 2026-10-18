const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, parsePagination, schemas } = require('../utils/validate');

// Self-service registration: always creates a student, never a teacher/admin.
// POST /api/student/register
exports.register = [validate(schemas.createUser), async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const existing = await User.getByEmail(email);
        if (existing) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const user = await new User(name, email, password, 'student').save();
        return res.status(201).json({ message: 'Student registered successfully', user });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Email already in use' });
        }
        return next(err);
    }
}];

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
