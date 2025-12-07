const { client } = require('../config/db');

class Course {
    constructor(teacher_id, title, description, language, level, thumbnail, status) {
        this.teacher_id = teacher_id;
        this.title = title;
        this.description = description;
        this.language = language;
        this.level = level;
        this.thumbnail = thumbnail;
        this.status = status;
    }

    // create table if not exists
    static async initTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS courses (
                                                   id SERIAL PRIMARY KEY,
                                                   teacher_id INT NOT NULL,
                                                   title VARCHAR(255) NOT NULL,
                description VARCHAR(255) NOT NULL,
                language VARCHAR(255) NOT NULL,
                level VARCHAR(255) NOT NULL,
                thumbnail VARCHAR(255) NOT NULL,
                status VARCHAR(255) NOT NULL
                );
        `;
        await client.query(query);
        console.log('Courses table initialized successfully.');
    }

    // Insert a new course
    async save() {
        const query = `
            INSERT INTO courses (teacher_id, title, description, language, level, thumbnail, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
        `;
        const values = [this.teacher_id, this.title, this.description, this.language, this.level, this.thumbnail, this.status];
        const res = await client.query(query, values);
        return res.rows[0];
    }

    // get all courses
    static async getAllCourses() {
        const res = await client.query(`SELECT * FROM courses`);
        return res.rows;
    }

    // get course by id
    static async getCourse(id) {
        const res = await client.query(`SELECT * FROM courses WHERE id = $1`, [id]);
        return res.rows[0];
    }


}

module.exports = Course;
