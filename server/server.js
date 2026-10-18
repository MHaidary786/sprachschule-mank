const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { client } = require('./config/db');
const initDB = require('./initDB');
const { authenticate } = require('./middlewares/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Security middleware -------------------------------------------------
app.use(helmet());

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Allow non-browser clients (no Origin header, e.g. curl/mobile)
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// General API rate limit
app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later' },
}));

// --- Routes --------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);

// Unknown /api paths -> plain 404 (all real routes are defined above and
// protect themselves; don't demand a token for a path that doesn't exist)
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'Not found' });
});

app.get('/', (req, res) => {
    res.send('Language Learning Platform API is running');
});

// --- 404 + global error handler (no stack traces to the client) ----------
app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Invalid JSON body' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Payload too large' });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({ message: 'Server error' });
});

// --- Startup -------------------------------------------------------------
async function startServer() {
    try {
        await client.connect();
        console.log('Database connected successfully.');
        await initDB();
        console.log('Tables initialized.');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
}

// Exported for testing
module.exports = { app, startServer };

// Only start the server when run directly (not when required by tests)
if (require.main === module) {
    startServer();
}
