const { client } = require('../config/db');

class Enrollment {
    constructor(student_id, course_id, progress = 0) {
        this.student_id = student_id;
        this.course_id = course_id;
        this.progress = progress;
    }

    static async initTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS enrollments (
                id SERIAL PRIMARY KEY,
                student_id INT NOT NULL,
                course_id INT NOT NULL,
                progress INT DEFAULT 0
            );
        `;
        await client.query(query);
        console.log('Enrollments table initialized successfully.');
    }

    async save() {
        const query = `
            INSERT INTO enrollments (student_id, course_id, progress)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [this.student_id, this.course_id, this.progress];
        const res = await client.query(query, values);
        return res.rows[0];
    }

    static async getEnrollmentsByStudent(student_id) {
        const res = await client.query(`SELECT * FROM enrollments WHERE student_id = $1`, [student_id]);
        return res.rows;
    }

    static async getEnrollmentsByCourse(course_id) {
        const res = await client.query(`SELECT * FROM enrollments WHERE course_id = $1`, [course_id]);
        return res.rows;
    }
}

module.exports = Enrollment;
