const { client } = require('../config/db');

class Lesson {
    constructor(course_id, title, content, video_url = null, audio_url = null, order = 1) {
        this.course_id = course_id;
        this.title = title;
        this.content = content;
        this.video_url = video_url;
        this.audio_url = audio_url;
        this.order = order;
    }

    static async initTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS lessons (
                id SERIAL PRIMARY KEY,
                course_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                video_url VARCHAR(255),
                audio_url VARCHAR(255),
                "order" INT DEFAULT 1
            );
        `;
        await client.query(query);
        console.log('Lessons table initialized successfully.');
    }

    async save() {
        const query = `
            INSERT INTO lessons (course_id, title, content, video_url, audio_url, "order")
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [this.course_id, this.title, this.content, this.video_url, this.audio_url, this.order];
        const res = await client.query(query, values);
        return res.rows[0];
    }

    static async getLessonsByCourse(course_id) {
        const res = await client.query(`SELECT * FROM lessons WHERE course_id = $1 ORDER BY "order"`, [course_id]);
        return res.rows;
    }

    static async getLessonById(id) {
        const res = await client.query(`SELECT * FROM lessons WHERE id = $1`, [id]);
        return res.rows[0];
    }
}

module.exports = Lesson;
