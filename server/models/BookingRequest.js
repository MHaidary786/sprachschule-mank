const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { client } = require('../config/db');

const DETAIL_SELECT = `
    b.id, b.course_id, c.title AS course_title, c.level,
    b.name, b.email, b.phone, b.message, b.status, b.admin_note,
    b.student_id, u.name AS student_name, b.created_at, b.updated_at
`;

class BookingRequest {
    constructor(course_id, name, email, phone, message) {
        this.course_id = course_id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.message = message;
    }

    // create table if not exists
    static async initTable() {
        await client.query(`
            CREATE TABLE IF NOT EXISTS booking_requests (
                id SERIAL PRIMARY KEY,
                course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                message TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                student_id INT REFERENCES users(id) ON DELETE SET NULL,
                admin_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Booking requests table initialized');
    }

    // insert a new pending booking request
    async save() {
        const res = await client.query(
            `INSERT INTO booking_requests (course_id, name, email, phone, message)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, course_id, name, email, phone, message, status, created_at`,
            [this.course_id, this.name, this.email, this.phone, this.message]
        );
        return res.rows[0];
    }

    // all booking requests joined with course + student (optional status filter)
    static async listAll({ status } = {}) {
        const where = status ? 'WHERE b.status = $1' : '';
        const values = status ? [status] : [];
        const res = await client.query(
            `SELECT ${DETAIL_SELECT}
             FROM booking_requests b
             JOIN courses c ON c.id = b.course_id
             LEFT JOIN users u ON u.id = b.student_id
             ${where}
             ORDER BY b.created_at DESC, b.id DESC`,
            values
        );
        return res.rows;
    }

    static async getById(id) {
        const res = await client.query(
            `SELECT ${DETAIL_SELECT}
             FROM booking_requests b
             JOIN courses c ON c.id = b.course_id
             LEFT JOIN users u ON u.id = b.student_id
             WHERE b.id = $1`,
            [id]
        );
        return res.rows[0];
    }

    // fetch a single row by id on the given (possibly transactional) client
    static async getByIdOn(id, dbClient = client) {
        const res = await dbClient.query(
            `SELECT id, course_id, name, email, phone, message, status, admin_note, student_id,
                    created_at, updated_at
             FROM booking_requests WHERE id = $1`,
            [id]
        );
        return res.rows[0];
    }

    // count users with a given email (used for duplicate detection in the
    // approve flow, on the given client)
    static async countUserByEmail(email, dbClient = client) {
        const res = await dbClient.query(`SELECT COUNT(*)::int AS count FROM users WHERE email = $1`, [email]);
        return res.rows[0].count;
    }

    // create a new student user with a crypto-random password.
    // Returns the safe (no-password) row.
    static async createStudentUser(name, email, dbClient = client) {
        const password = crypto.randomBytes(16).toString('hex').slice(0, 16); // 16-char crypto-random
        const hash = await bcrypt.hash(password, 12);
        const res = await dbClient.query(
            `INSERT INTO users (name, email, password, role)
             VALUES ($1, $2, $3, 'student')
             RETURNING id, name, email, role, avatar, created_at`,
            [name, email, hash]
        );
        return res.rows[0];
    }

    // status transitions (approve/reject) always bump updated_at
    static async updateStatus(id, { status, admin_note, student_id }, dbClient = client) {
        const res = await dbClient.query(
            `UPDATE booking_requests
             SET status = $1, admin_note = $2, student_id = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING id, course_id, name, email, phone, message, status, admin_note, student_id,
                     created_at, updated_at`,
            [status, admin_note ?? null, student_id ?? null, id]
        );
        return res.rows[0];
    }
}

module.exports = BookingRequest;
