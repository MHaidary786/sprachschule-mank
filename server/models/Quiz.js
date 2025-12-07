const { client } = require('../config/db');

class Quiz {
    constructor(lesson_id, question, options, correct_answer) {
        this.lesson_id = lesson_id;
        this.question = question;
        this.options = options; // JSON object
        this.correct_answer = correct_answer;
    }

    static async initTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS quizzes (
                id SERIAL PRIMARY KEY,
                lesson_id INT NOT NULL,
                question TEXT NOT NULL,
                options JSONB NOT NULL,
                correct_answer VARCHAR(255) NOT NULL
            );
        `;
        await client.query(query);
        console.log('Quizzes table initialized successfully.');
    }

    async save() {
        const query = `
            INSERT INTO quizzes (lesson_id, question, options, correct_answer)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [this.lesson_id, this.question, JSON.stringify(this.options), this.correct_answer];
        const res = await client.query(query, values);
        return res.rows[0];
    }

    static async getQuizzesByLesson(lesson_id) {
        const res = await client.query(`SELECT * FROM quizzes WHERE lesson_id = $1`, [lesson_id]);
        return res.rows;
    }
}

module.exports = Quiz;
