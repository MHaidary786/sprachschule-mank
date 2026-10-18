const Page = require('../models/Page');
const Course = require('../models/Course');

// GET /api/public/pages
exports.listPages = async (req, res, next) => {
    try {
        const pages = await Page.getAll();
        return res.json(pages);
    } catch (err) {
        return next(err);
    }
};

// GET /api/public/pages/:slug
exports.getPage = async (req, res, next) => {
    try {
        const page = await Page.getBySlug(req.params.slug);
        if (!page) return res.status(404).json({ message: 'Page not found' });
        return res.json(page);
    } catch (err) {
        return next(err);
    }
};

// GET /api/public/courses
exports.listCourses = async (req, res, next) => {
    try {
        const courses = await Course.getAllCourses({ onlyActive: true });
        return res.json(courses);
    } catch (err) {
        return next(err);
    }
};

// GET /api/public/courses/:id
exports.getCourse = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid course id' });
        const course = await Course.getCourse(id);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        return res.json(course);
    } catch (err) {
        return next(err);
    }
};
