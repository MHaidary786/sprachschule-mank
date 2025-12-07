const express = require('express');
const bodyParser = require('body-parser');
const { client } = require('./config/db'); // your PostgreSQL client

// Import route files (create later)
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const adminRoutes = require('./routes/adminRoutes');

const initDB = require('./initDB');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// // Middleware
// app.use(cors());
// app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('Language Learning Platform API is running');
});

// Start server + connect to DB
async function startServer() {
    try {
        // Connect to PostgreSQL
        await client.connect();
        console.log('Database connected successfully.');

        // Initialize all tables
        await initDB();
        console.log('Tables initialized.');

        // Optionally initialize tables here if you don't run initDB.js separately
        // const User = require('./models/Users');
        // const Course = require('./models/Courses');
        // ...call User.initTable(), Course.initTable(), etc.

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
    }
}

startServer();
