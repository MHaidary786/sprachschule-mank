const bcrypt = require('bcryptjs');
const { client } = require('../config/db');

const SAFE_COLUMNS = 'id, name, email, role, avatar, created_at';

class User {
    constructor(name, email, password, role, avatar) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.avatar = avatar;
    }

    // Create table if not exists
    static async initTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'student',
                avatar VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`;
        await client.query(query);
        console.log('Users table initialized');
    }

    // Insert a new user (password is hashed before storage)
    async save() {
        const hash = await bcrypt.hash(this.password, 12);
        const query = `
            INSERT INTO users (name, email, password, role, avatar)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING ${SAFE_COLUMNS};
        `;
        const values = [this.name, this.email, hash, this.role, this.avatar];
        const res = await client.query(query, values);
        return res.rows[0];
    }

    // Get all users (password never selected)
    static async getAll({ limit = 50, offset = 0 } = {}) {
        const res = await client.query(
            `SELECT ${SAFE_COLUMNS} FROM users ORDER BY id LIMIT $1 OFFSET $2`,
            [Number(limit), Number(offset)]
        );
        return res.rows;
    }

    // get user by id
    static async getById(id) {
        const res = await client.query(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1`, [id]);
        return res.rows[0];
    }

    // count users by role (used for last-admin protection)
    static async countByRole(role) {
        const res = await client.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = $1`, [role]);
        return res.rows[0].count;
    }

    // Verify a password against the stored hash for a user id.
    static async verifyPassword(id, plainPassword) {
        const res = await client.query(`SELECT password FROM users WHERE id = $1`, [id]);
        const hash = res.rows[0]?.password;
        if (!hash) return false;
        return bcrypt.compare(plainPassword, hash);
    }

    // get user by email (includes password hash, for auth only)
    static async getByEmail(email) {
        const res = await client.query(`SELECT * FROM users WHERE email = $1`, [email]);
        return res.rows[0];
    }

    static async updatePassword(id, newPassword) {
        const hash = await bcrypt.hash(newPassword, 12);
        await client.query(`UPDATE users SET password = $1 WHERE id = $2`, [hash, id]);
    }

    static async deleteById(id) {
        await client.query(`DELETE FROM users WHERE id = $1`, [id]);
    }
}

module.exports = User;
