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

// Note: zod 4 matches the protocol part WITHOUT a trailing colon.
const eventPhoto = z.object({
    url: z.string().url({ protocol: /^https?$/ }).max(500),
    caption: z.string().max(255).optional(),
    order: z.number().int().min(0).max(1000).optional(),
});

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
        role: z.enum(ROLES).optional(),
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
    createBooking: z.object({
        course_id: z.number().int().positive(),
        name: name,
        email,
        phone: z.string().trim().max(50).optional(),
        message: z.string().max(2000).optional(),
    }),
    bookingStatus: z.enum(['pending', 'approved', 'rejected']),
    eventPhoto,
    createEvent: z.object({
        title: z.string().trim().min(1).max(255),
        slug,
        description: z.string().max(5000).optional(),
        event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').nullable().optional(),
        cover_image: z.string().url().max(500).nullable().optional(),
        is_public: z.boolean().default(true),
        order: z.number().int().min(0).max(1000).default(0),
        photos: z.array(eventPhoto).max(100).default([]),
    }),
    updateEvent: z.object({
        title: z.string().trim().min(1).max(255).optional(),
        slug: slug.optional(),
        description: z.string().max(5000).nullable().optional(),
        event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').nullable().optional(),
        cover_image: z.string().url().max(500).nullable().optional(),
        is_public: z.boolean().optional(),
        order: z.number().int().min(0).max(1000).optional(),
        photos: z.array(eventPhoto).max(100).optional(),
    }),
    createContact: z.object({
        name,
        email,
        phone: z.string().trim().max(50).optional(),
        subject: z.string().trim().max(255).optional(),
        message: z.string().min(1).max(2000),
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
