const { client } = require('../config/db');

const COLUMNS = 'id, name, email, phone, subject, message, is_read, created_at';

class ContactMessage {
    constructor(name, email, phone, subject, message) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.subject = subject;
        this.message = message;
    }

    // create table if not exists
    static async initTable() {
        await client.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                subject VARCHAR(255),
                message TEXT NOT NULL,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Contact messages table initialized');
    }

    // insert a new contact message
    async save() {
        const res = await client.query(
            `INSERT INTO contact_messages (name, email, phone, subject, message)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING ${COLUMNS}`,
            [this.name, this.email, this.phone ?? null, this.subject ?? null, this.message]
        );
        return res.rows[0];
    }

    // all messages, newest first (optional unread-only filter)
    static async listAll({ unread = false } = {}) {
        const where = unread ? 'WHERE is_read = FALSE' : '';
        const res = await client.query(
            `SELECT ${COLUMNS} FROM contact_messages ${where} ORDER BY created_at DESC, id DESC`
        );
        return res.rows;
    }

    static async getById(id) {
        const res = await client.query(`SELECT ${COLUMNS} FROM contact_messages WHERE id = $1`, [id]);
        return res.rows[0];
    }

    // mark a message as read
    static async markRead(id) {
        const res = await client.query(
            `UPDATE contact_messages SET is_read = TRUE WHERE id = $1 RETURNING ${COLUMNS}`,
            [id]
        );
        return res.rows[0];
    }
}

module.exports = ContactMessage;
