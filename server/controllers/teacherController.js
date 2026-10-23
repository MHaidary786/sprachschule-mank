const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { parsePagination } = require('../utils/validate');

// Admins can also be teachers, so they get access to the teacher area too.
const teacherRoles = ['teacher', 'admin'];
const teacherAuth = [authenticate, authorize(...teacherRoles)];

// GET /api/teacher/dashboard
exports.dashboard = [...teacherAuth, async (req, res, next) => {
    try {
        const teacher = await User.getById(req.user.sub);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        const courses = await Enrollment.getTeacherCourses(teacher.id);
        const students = await Enrollment.getTeacherStudents(teacher.id);
        return res.json({
            message: `Welcome to your dashboard, ${teacher.name}`,
            teacher,
            courses,
            students,
            course_count: courses.length,
            student_count: students.length,
        });
    } catch (err) {
        return next(err);
    }
}];

// GET /api/teacher/courses
// The classes this teacher (or admin) is in charge of.
exports.listCourses = [...teacherAuth, async (req, res, next) => {
    try {
        const courses = await Enrollment.getTeacherCourses(req.user.sub);
        return res.json(courses);
    } catch (err) {
        return next(err);
    }
}];

// GET /api/teacher/students
// All students enrolled in any of the teacher's classes.
exports.listStudents = [...teacherAuth, async (req, res, next) => {
    try {
        const students = await Enrollment.getTeacherStudents(req.user.sub);
        return res.json(students);
    } catch (err) {
        return next(err);
    }
}];

// GET /api/teacher/courses/:courseId/students
// The students enrolled in one specific class.
exports.listCourseStudents = [...teacherAuth, async (req, res, next) => {
    try {
        const id = Number(req.params.courseId);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid course id' });
        const course = await Course.getCourse(id);
        if (!course || course.teacher_id !== req.user.sub) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const students = await Enrollment.getCourseStudents(id);
        return res.json(students);
    } catch (err) {
        return next(err);
    }
}];

// POST /api/teacher/courses/:courseId/students  { student_id }
// Enroll (assign) a student into one of the teacher's classes.
exports.enrollStudent = [...teacherAuth, async (req, res, next) => {
    try {
        const courseId = Number(req.params.courseId);
        const studentId = Number(req.body?.student_id);
        if (!Number.isInteger(courseId)) return res.status(400).json({ message: 'Invalid course id' });
        if (!Number.isInteger(studentId)) return res.status(400).json({ message: 'Invalid student id' });

        const course = await Course.getCourse(courseId);
        if (!course || course.teacher_id !== req.user.sub) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const student = await User.getById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found' });
        }
        const added = await Enrollment.add(studentId, courseId);
        if (!added) return res.status(409).json({ message: 'Student is already enrolled in this course' });
        return res.status(201).json({ message: 'Student enrolled' });
    } catch (err) {
        if (err.code === '23503') return res.status(400).json({ message: 'Student not found' });
        return next(err);
    }
}];

// DELETE /api/teacher/courses/:courseId/students/:studentId
// Remove a student from one of the teacher's classes.
exports.removeStudent = [...teacherAuth, async (req, res, next) => {
    try {
        const courseId = Number(req.params.courseId);
        const studentId = Number(req.params.studentId);
        if (!Number.isInteger(courseId)) return res.status(400).json({ message: 'Invalid course id' });
        if (!Number.isInteger(studentId)) return res.status(400).json({ message: 'Invalid student id' });

        const course = await Course.getCourse(courseId);
        if (!course || course.teacher_id !== req.user.sub) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const removed = await Enrollment.remove(studentId, courseId);
        if (!removed) return res.status(404).json({ message: 'Student is not enrolled in this course' });
        return res.json({ message: 'Student removed' });
    } catch (err) {
        return next(err);
    }
}];

// GET /api/teacher/students/:id
exports.getStudent = [...teacherAuth, async (req, res, next) => {
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
