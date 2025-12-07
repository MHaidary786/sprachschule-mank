const { client } = require('./config/db');

const User = require('./models/User');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');
const Quiz = require('./models/Quiz');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
const Enrollment = require('./models/Enrollment');

async function initDB() {
    try {

        // 1️⃣ Users first (no dependencies)
        await User.initTable();

        // 2️⃣ Courses (depends on User for teacher_id)
        await client.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                teacher_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                language VARCHAR(255) NOT NULL,
                level VARCHAR(50) NOT NULL,
                thumbnail VARCHAR(255),
                status VARCHAR(50) NOT NULL
            );
        `);
        console.log('Courses table initialized with foreign key.');

        // 3️⃣ Lessons (depends on Course)
        await client.query(`
            CREATE TABLE IF NOT EXISTS lessons (
                id SERIAL PRIMARY KEY,
                course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                video_url VARCHAR(255),
                audio_url VARCHAR(255),
                "order" INT DEFAULT 1
            );
        `);
        console.log('Lessons table initialized with foreign key.');

        // 4️⃣ Quizzes (depends on Lesson)
        await client.query(`
            CREATE TABLE IF NOT EXISTS quizzes (
                id SERIAL PRIMARY KEY,
                lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                question TEXT NOT NULL,
                options JSONB NOT NULL,
                correct_answer VARCHAR(255) NOT NULL
            );
        `);
        console.log('Quizzes table initialized with foreign key.');

        // 5️⃣ Assignments (depends on Lesson)
        await client.query(`
            CREATE TABLE IF NOT EXISTS assignments (
                id SERIAL PRIMARY KEY,
                lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                instructions TEXT NOT NULL,
                file_url VARCHAR(255)
            );
        `);
        console.log('Assignments table initialized with foreign key.');

        // 6️⃣ Submissions (depends on Assignment and User)
        await client.query(`
            CREATE TABLE IF NOT EXISTS submissions (
                id SERIAL PRIMARY KEY,
                assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
                student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                file_url VARCHAR(255),
                grade INT,
                feedback TEXT
            );
        `);
        console.log('Submissions table initialized with foreign keys.');

        // 7️⃣ Enrollments (depends on Course and User)
        await client.query(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id SERIAL PRIMARY KEY,
                student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                progress INT DEFAULT 0
            );
        `);
        console.log('Enrollments table initialized with foreign keys.');

        console.log('All tables initialized successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

initDB();
