const { client } = require('../config/db');

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

    // Insert a new user
    async save() {
        const query = `
            INSERT INTO users (name, email, password, role, avatar)
            VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
        `;
        const values = [this.name, this.email, this.password, this.role, this.avatar];

        const res = await client.query(query, values);
        return res.rows[0];
    }

    // Get all users
    static async getAll() {
        const res = await client.query('SELECT * FROM users;');
        return res.rows;
    }

    // get user by id
    static async getById(id) {
        const res = await client.query(`SELECT * FROM users WHERE id = $1`, [id]);
        return res.rows[0];
    }

    // get user by email
    static async getByEmail(email) {
        const res = await client.query(`SELECT * FROM users WHERE email = $1`, [email]);
        return res.rows[0];
    }
}

module.exports = User;
