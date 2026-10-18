const User = require('../models/User');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { parsePagination } = require('../utils/validate');

// GET /api/teacher/dashboard
exports.dashboard = [authenticate, authorize('teacher'), async (req, res, next) => {
    try {
        const teacher = await User.getById(req.user.sub);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        return res.json({ message: `Welcome to your dashboard, ${teacher.name}`, teacher });
    } catch (err) {
        return next(err);
    }
}];

// GET /api/teacher/students
exports.listStudents = [authenticate, authorize('teacher'), async (req, res, next) => {
    try {
        const { limit, offset } = parsePagination(req.query);
        const students = await User.getAll({ limit, offset });
        return res.json(students.filter((u) => u.role === 'student'));
    } catch (err) {
        return next(err);
    }
}];

// GET /api/teacher/students/:id
exports.getStudent = [authenticate, authorize('teacher'), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid student id' });
        const student = await User.getById(id);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found' });
        }
        return res.json(student);
    } catch (err) {
        return next(err);
    }
}];
