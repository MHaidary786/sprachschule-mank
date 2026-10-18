const User = require('../models/User');
const Page = require('../models/Page');
const Course = require('../models/Course');
const { client } = require('../config/db');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, parsePagination, schemas } = require('../utils/validate');

const requireAuth = [authenticate, authorize('admin')];

// GET /api/admin/dashboard
exports.dashboard = [...requireAuth, async (req, res, next) => {
    try {
        const admin = await User.getById(req.user.sub);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        return res.json({ message: `Welcome to the Admin dashboard, ${admin.name}` });
    } catch (err) {
        return next(err);
    }
}];

// GET /api/admin/users
exports.manageUsers = [...requireAuth, async (req, res, next) => {
    try {
        const { limit, offset } = parsePagination(req.query);
        const users = await User.getAll({ limit, offset });
        return res.json(users);
    } catch (err) {
        return next(err);
    }
}];

// POST /api/admin/users
exports.createUser = [...requireAuth, validate(schemas.createUser), async (req, res, next) => {
    try {
        const { name, email, password, role, avatar } = req.body;

        const existing = await User.getByEmail(email);
        if (existing) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const user = await new User(name, email, password, role, avatar).save();
        return res.status(201).json({ message: 'User created successfully', user });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Email already in use' });
        }
        return next(err);
    }
}];

// PATCH /api/admin/users/:id
exports.updateUser = [...requireAuth,
    (req, res, next) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid user id' });
        req.params.id = id;
        next();
    },
    validate(schemas.updateUser), async (req, res, next) => {
        try {
            const id = req.params.id;
            const target = await User.getById(id);
            if (!target) return res.status(404).json({ message: 'User not found' });

            const { name, email, avatar, password, role } = req.body;
            const updates = [];
            const values = [];
            let idx = 1;

            if (name !== undefined) { updates.push(`name = $${idx}`); values.push(name); idx++; }
            if (email !== undefined) {
                const clash = await User.getByEmail(email);
                if (clash && clash.id !== id) return res.status(409).json({ message: 'Email already in use' });
                updates.push(`email = $${idx}`); values.push(email); idx++;
            }
            if (avatar !== undefined) { updates.push(`avatar = $${idx}`); values.push(avatar); idx++; }
            if (role !== undefined) { updates.push(`role = $${idx}`); values.push(role); idx++; }
            if (updates.length) {
                values.push(id);
                await require('../config/db').client.query(
                    `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values
                );
            }
            if (password !== undefined) {
                await User.updatePassword(id, password);
            }

            const updated = await User.getById(id);
            return res.json({ message: 'User updated', user: updated });
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ message: 'Email already in use' });
            }
            return next(err);
        }
    }];

// DELETE /api/admin/users/:id
exports.deleteUser = [...requireAuth,
    (req, res, next) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid user id' });
        req.params.id = id;
        next();
    }, async (req, res, next) => {
        try {
            const id = req.params.id;
            if (id === req.user.sub) {
                return res.status(400).json({ message: 'You cannot delete your own account' });
            }
            await User.deleteById(id);
            return res.json({ message: 'User deleted successfully' });
        } catch (err) {
            return next(err);
        }
    }];

// GET /api/admin/pages
exports.listPages = [...requireAuth, async (req, res, next) => {
    try {
        const pages = await Page.getAll();
        return res.json(pages);
    } catch (err) {
        return next(err);
    }
}];

// POST /api/admin/pages
exports.createPage = [...requireAuth, validate(schemas.createPage), async (req, res, next) => {
    try {
        const { title, slug, content, show_in_nav, order } = req.body;
        const existing = await Page.getBySlug(slug);
        if (existing) return res.status(409).json({ message: 'Eine Seite mit diesem Slug existiert bereits' });
        const page = await new Page(title, slug, content, show_in_nav, order).save();
        return res.status(201).json({ message: 'Page created successfully', page });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Eine Seite mit diesem Slug existiert bereits' });
        }
        return next(err);
    }
}];

// PATCH /api/admin/pages/:id
exports.updatePage = [...requireAuth,
    (req, res, next) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid page id' });
        req.params.id = id;
        next();
    },
    validate(schemas.updatePage), async (req, res, next) => {
        try {
            const id = req.params.id;
            const target = await Page.getById(id);
            if (!target) return res.status(404).json({ message: 'Page not found' });

            const { title, slug, content, show_in_nav, order } = req.body;
            if (slug && slug !== target.slug) {
                const clash = await Page.getBySlug(slug);
                if (clash && clash.id !== id) {
                    return res.status(409).json({ message: 'Eine Seite mit diesem Slug existiert bereits' });
                }
            }
            const updated = await Page.update(id, { title, slug, content, showInNav: show_in_nav, order });
            return res.json({ message: 'Page updated', page: updated });
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ message: 'Eine Seite mit diesem Slug existiert bereits' });
            }
            return next(err);
        }
    }];

// DELETE /api/admin/pages/:id
exports.deletePage = [...requireAuth, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid page id' });
        const target = await Page.getById(id);
        if (!target) return res.status(404).json({ message: 'Page not found' });
        await Page.deleteById(id);
        return res.json({ message: 'Page deleted successfully' });
    } catch (err) {
        return next(err);
    }
}];

// GET /api/admin/courses
exports.listCourses = [...requireAuth, async (req, res, next) => {
    try {
        const courses = await Course.getAllCourses();
        return res.json(courses);
    } catch (err) {
        return next(err);
    }
}];

// POST /api/admin/courses
exports.createCourse = [...requireAuth, validate(schemas.createCourse), async (req, res, next) => {
    try {
        const teacher = await User.getById(req.body.teacher_id);
        if (!teacher || teacher.role === 'student') {
            return res.status(400).json({ message: 'Lehrkraft nicht gefunden' });
        }
        const { teacher_id, title, description, language, level, thumbnail, status,
            duration, days, time, price_extern, price_intern, is_open_for_enrollment } = req.body;
        const course = await new Course(
            teacher_id, title, description, language, level,
            thumbnail ?? null, status,
            duration ?? null, days ?? null, time ?? null,
            price_extern ?? null, price_intern ?? null, is_open_for_enrollment
        ).save();
        return res.status(201).json({ message: 'Course created successfully', course });
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ message: 'Lehrkraft nicht gefunden' });
        }
        return next(err);
    }
}];

// PATCH /api/admin/courses/:id
exports.updateCourse = [...requireAuth,
    (req, res, next) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid course id' });
        req.params.id = id;
        next();
    },
    validate(schemas.updateCourse), async (req, res, next) => {
        try {
            const id = req.params.id;
            const target = await Course.getCourse(id);
            if (!target) return res.status(404).json({ message: 'Course not found' });
            if (req.body.teacher_id !== undefined) {
                const teacher = await User.getById(req.body.teacher_id);
                if (!teacher || teacher.role === 'student') {
                    return res.status(400).json({ message: 'Lehrkraft nicht gefunden' });
                }
            }
            const updated = await Course.update(id, req.body);
            return res.json({ message: 'Course updated', course: updated });
        } catch (err) {
            if (err.code === '23503') {
                return res.status(400).json({ message: 'Lehrkraft nicht gefunden' });
            }
            return next(err);
        }
    }];

// DELETE /api/admin/courses/:id
exports.deleteCourse = [...requireAuth, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid course id' });
        const target = await Course.getCourse(id);
        if (!target) return res.status(404).json({ message: 'Course not found' });
        await Course.deleteById(id);
        return res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        return next(err);
    }
}];
