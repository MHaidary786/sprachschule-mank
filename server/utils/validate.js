const { z } = require('zod');

const email = z.string().trim().toLowerCase().email().max(100);
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);
const name = z.string().trim().min(1).max(100);
const ROLES = ['student', 'teacher', 'admin'];

const schemas = {
    login: z.object({ email, password: z.string().min(1) }),
    createUser: z.object({
        name,
        email,
        password,
        role: z.enum(ROLES),
        avatar: z.string().url().max(255).optional(),
    }),
    changePassword: z.object({ currentPassword: z.string().min(1), newPassword: password }),
    updateUser: z.object({
        name: name.optional(),
        email: email.optional(),
        avatar: z.string().url().max(255).optional(),
        password: password.optional(),
    }),
};

// Middleware factory: validates req.body against a schema.
// Replaces req.body with the parsed (trimmed/normalized) value on success.
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body ?? {});
        if (!result.success) {
            const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
            return res.status(400).json({ message: 'Validation failed', details });
        }
        req.body = result.data;
        return next();
    };
}

function parsePagination(query, defaultLimit = 50, maxLimit = 200) {
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
    const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
    return { limit, offset };
}

module.exports = { schemas, validate, parsePagination };
