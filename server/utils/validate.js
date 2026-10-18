const { z } = require('zod');

const email = z.string().trim().toLowerCase().email().max(100);
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);
const name = z.string().trim().min(1).max(100);
const ROLES = ['student', 'teacher', 'admin'];
const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const COURSE_STATUSES = ['active', 'inactive'];
const slug = z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers and dashes');

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
    createPage: z.object({
        title: z.string().trim().min(1).max(255),
        slug,
        content: z.string().min(1).max(100000),
        show_in_nav: z.boolean().default(true),
        order: z.number().int().min(0).max(1000).default(0),
    }),
    updatePage: z.object({
        title: z.string().trim().min(1).max(255).optional(),
        slug: slug.optional(),
        content: z.string().min(1).max(100000).optional(),
        show_in_nav: z.boolean().optional(),
        order: z.number().int().min(0).max(1000).optional(),
    }),
    createCourse: z.object({
        teacher_id: z.number().int().positive(),
        title: z.string().trim().min(1).max(255),
        description: z.string().min(1).max(5000),
        language: z.string().trim().min(1).max(255),
        level: z.enum(COURSE_LEVELS),
        status: z.enum(COURSE_STATUSES).default('active'),
        thumbnail: z.string().url().max(255).nullable().optional(),
        duration: z.number().int().min(1).max(60).nullable().optional(),
        days: z.string().max(255).nullable().optional(),
        time: z.string().max(255).nullable().optional(),
        price_extern: z.number().nonnegative().max(100000).nullable().optional(),
        price_intern: z.number().nonnegative().max(100000).nullable().optional(),
        is_open_for_enrollment: z.boolean().default(true),
    }),
    updateCourse: z.object({
        teacher_id: z.number().int().positive().optional(),
        title: z.string().trim().min(1).max(255).optional(),
        description: z.string().min(1).max(5000).optional(),
        language: z.string().trim().min(1).max(255).optional(),
        level: z.enum(COURSE_LEVELS).optional(),
        status: z.enum(COURSE_STATUSES).optional(),
        thumbnail: z.string().url().max(255).nullable().optional(),
        duration: z.number().int().min(1).max(60).nullable().optional(),
        days: z.string().max(255).nullable().optional(),
        time: z.string().max(255).nullable().optional(),
        price_extern: z.number().nonnegative().max(100000).nullable().optional(),
        price_intern: z.number().nonnegative().max(100000).nullable().optional(),
        is_open_for_enrollment: z.boolean().optional(),
    }),
};

// Middleware factory: validates req.body against a schema.
// Replaces req.body with the parsed (trimmed/normalized) value on success.
function validate(schema) {
    return (req, res, next) => {
        const body = req.body;
        if (Array.isArray(body) || typeof body !== 'object' || body === null) {
            return res.status(400).json({
                message: 'Request body must be a JSON object, e.g. {"email":"...","password":"..."}',
            });
        }
        const result = schema.safeParse(body);
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
