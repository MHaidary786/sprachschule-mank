const { client } = require('./config/db');

const User = require('./models/User');
const Course = require('./models/Course');
const Page = require('./models/Page');
const BookingRequest = require('./models/BookingRequest');
const Event = require('./models/Event');
const ContactMessage = require('./models/ContactMessage');
const seedContent = require('./scripts/seed-content');

async function initDB() {
    // 1️⃣ Users first (no dependencies)
    await User.initTable();

    // 2️⃣ Courses (depends on User for teacher_id)
    await Course.initTable();
    await Course.migrate();

    // 3️⃣ Public site pages (admin-managed content)
    await Page.initTable();

    // 4️⃣ Lessons (depends on Course)
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

    // 5️⃣ Quizzes (depends on Lesson)
    await client.query(`
        CREATE TABLE IF NOT EXISTS quizzes (
            id SERIAL PRIMARY KEY,
            lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            question TEXT NOT NULL,
            options JSONB NOT NULL,
            correct_answer VARCHAR(255) NOT NULL
        );
    `);

    // 6️⃣ Assignments (depends on Lesson)
    await client.query(`
        CREATE TABLE IF NOT EXISTS assignments (
            id SERIAL PRIMARY KEY,
            lesson_id INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            instructions TEXT NOT NULL,
            file_url VARCHAR(255)
        );
    `);

    // 7️⃣ Submissions (depends on Assignment and User)
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

    // 8️⃣ Enrollments (depends on Course and User)
    await client.query(`
        CREATE TABLE IF NOT EXISTS enrollments (
            id SERIAL PRIMARY KEY,
            student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            progress INT DEFAULT 0,
            UNIQUE (student_id, course_id)
        );
    `);

    // Idempotent backfill for databases created before the UNIQUE constraint
    await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS uniq_enrollment_student_course
        ON enrollments (student_id, course_id);
    `);

    // 9️⃣ Booking requests (guest books a course; admin approves)
    await BookingRequest.initTable();

    // 🔟 Events + event photos (public gallery by event)
    await Event.initTable();

    // 1️⃣1️⃣ Contact messages (public contact form)
    await ContactMessage.initTable();

    // 1️⃣2️⃣ Seed default public site pages + sample courses/events (only on first run)
    await seedContent();

    console.log('All tables initialized successfully!');
}

module.exports = initDB;
