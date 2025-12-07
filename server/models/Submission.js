const { client } = require('../config/db');

class Submission {
    constructor(assignment_id, student_id, file_url, grade = null, feedback = null) {
        this.assignment_id = assignment_id;
        this.student_id = student_id;
        this.file_url = file_url;
        this.grade = grade;
        this.feedback = feedback;
    }

    static async initTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS submissions (
                id SERIAL PRIMARY KEY,
                assignment_id INT NOT NULL,
                student_id INT NOT NULL,
                file_url VARCHAR(255),
                grade INT,
                feedback TEXT
            );
        `;
        await client.query(query);
        console.log('Submissions table initialized successfully.');
    }

    async save() {
        const query = `
            INSERT INTO submissions (assignment_id, student_id, file_url, grade, feedback)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [this.assignment_id, this.student_id, this.file_url, this.grade, this.feedback];
        const res = await client.query(query, values);
        return res.rows[0];
    }

    static async getSubmissionsByAssignment(assignment_id) {
        const res = await client.query(`SELECT * FROM submissions WHERE assignment_id = $1`, [assignment_id]);
        return res.rows;
    }
}

module.exports = Submission;
