const { client } = require('../config/db');

class Assignment {
    constructor(lesson_id, instructions, file_url = null) {
        this.lesson_id = lesson_id;
        this.instructions = instructions;
        this.file_url = file_url;
    }

    static async initTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS assignments (
                id SERIAL PRIMARY KEY,
                lesson_id INT NOT NULL,
                instructions TEXT NOT NULL,
                file_url VARCHAR(255)
            );
        `;
        await client.query(query);
        console.log('Assignments table initialized successfully.');
    }

    async save() {
        const query = `
            INSERT INTO assignments (lesson_id, instructions, file_url)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [this.lesson_id, this.instructions, this.file_url];
        const res = await client.query(query, values);
        return res.rows[0];
    }

    static async getAssignmentsByLesson(lesson_id) {
        const res = await client.query(`SELECT * FROM assignments WHERE lesson_id = $1`, [lesson_id]);
        return res.rows;
    }
}

module.exports = Assignment;
