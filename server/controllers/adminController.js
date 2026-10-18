const User = require('../models/User');
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
