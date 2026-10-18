const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate, authorize, JWT_SECRET } = require('../middlewares/authMiddleware');
const { schemas, validate } = require('../utils/validate');

// POST /api/auth/login
exports.login = [validate(schemas.login), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.getByEmail(email);

        // Constant-shape response: same status/message whether the user exists or not.
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { sub: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        return res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        });
    } catch (err) {
        return next(err);
    }
}];

// POST /api/auth/create-user  (admin only)
exports.createUser = [authenticate, authorize('admin'), validate(schemas.createUser), async (req, res, next) => {
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

// GET /api/auth/me
exports.me = [authenticate, async (req, res, next) => {
    try {
        const user = await User.getById(req.user.sub);
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.json(user);
    } catch (err) {
        return next(err);
    }
}];

// POST /api/auth/change-password  (authenticated user changes own password)
exports.changePassword = [validate(schemas.changePassword), authenticate, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.getByEmail(req.user.email);
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        await User.updatePassword(user.id, newPassword);
        return res.json({ message: 'Password updated' });
    } catch (err) {
        return next(err);
    }
}];
