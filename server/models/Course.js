const { client } = require('../config/db');

const SAFE_COLUMNS = `
    c.id, c.teacher_id, c.title, c.description, c.language, c.level, c.thumbnail, c.status,
    c.duration, c.days, c.time, c.price_extern, c.price_intern, c.is_open_for_enrollment,
    c.created_at, c.updated_at, u.name AS teacher_name
`;

class Course {
    constructor(teacher_id, title, description, language, level, thumbnail, status,
                duration, days, time, price_extern, price_intern, is_open_for_enrollment) {
        this.teacher_id = teacher_id;
        this.title = title;
        this.description = description;
        this.language = language;
        this.level = level;
        this.thumbnail = thumbnail;
        this.status = status;
        this.duration = duration;
        this.days = days;
        this.time = time;
        this.price_extern = price_extern;
        this.price_intern = price_intern;
        this.is_open_for_enrollment = is_open_for_enrollment;
    }

    // create table if not exists
    static async initTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                teacher_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                language VARCHAR(255) NOT NULL,
                level VARCHAR(50) NOT NULL,
                thumbnail VARCHAR(255),
                status VARCHAR(50) NOT NULL,
                duration INT,
                days VARCHAR(255),
                time VARCHAR(255),
                price_extern NUMERIC(10, 2),
                price_intern NUMERIC(10, 2),
                is_open_for_enrollment BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await client.query(query);
        console.log('Courses table initialized successfully.');
    }

    // Idempotently add the extra columns to tables created before they existed.
    static async migrate() {
        const columns = [
            'duration INT',
            'days VARCHAR(255)',
            'time VARCHAR(255)',
            'price_extern NUMERIC(10, 2)',
            'price_intern NUMERIC(10, 2)',
            'is_open_for_enrollment BOOLEAN NOT NULL DEFAULT TRUE',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        ];
        for (const column of columns) {
            await client.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS ${column}`);
        }
    }

    // Insert a new course
    async save() {
        const query = `
            INSERT INTO courses (teacher_id, title, description, language, level, thumbnail, status,
                duration, days, time, price_extern, price_intern, is_open_for_enrollment)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, teacher_id, title, description, language, level, thumbnail, status,
                duration, days, time, price_extern, price_intern, is_open_for_enrollment;
        `;
        const values = [
            this.teacher_id, this.title, this.description, this.language, this.level,
            this.thumbnail, this.status, this.duration, this.days, this.time,
            this.price_extern, this.price_intern, this.is_open_for_enrollment,
        ];
        const res = await client.query(query, values);
        return res.rows[0];
    }

    // get all courses (with teacher name)
    static async getAllCourses({ onlyActive = false } = {}) {
        const where = onlyActive ? "WHERE c.status = 'active'" : '';
        const res = await client.query(
            `SELECT ${SAFE_COLUMNS} FROM courses c
             JOIN users u ON u.id = c.teacher_id
             ${where}
             ORDER BY c.id`
        );
        return res.rows;
    }

    // get course by id
    static async getCourse(id) {
        const res = await client.query(
            `SELECT ${SAFE_COLUMNS} FROM courses c
             JOIN users u ON u.id = c.teacher_id
             WHERE c.id = $1`,
            [id]
        );
        return res.rows[0];
    }

    // update any subset of fields
    static async update(id, fields) {
        const columnMap = {
            teacher_id: 'teacher_id',
            title: 'title',
            description: 'description',
            language: 'language',
            level: 'level',
            thumbnail: 'thumbnail',
            status: 'status',
            duration: 'duration',
            days: 'days',
            time: 'time',
            price_extern: 'price_extern',
            price_intern: 'price_intern',
            is_open_for_enrollment: 'is_open_for_enrollment',
        };
        const updates = [];
        const values = [];
        let idx = 1;
        for (const [key, column] of Object.entries(columnMap)) {
            if (fields[key] !== undefined) {
                updates.push(`${column} = $${idx}`);
                values.push(fields[key]);
                idx++;
            }
        }
        if (updates.length) {
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            await client.query(`UPDATE courses SET ${updates.join(', ')} WHERE id = $${idx}`, values);
        }
        return this.getCourse(id);
    }

    static async deleteById(id) {
        await client.query(`DELETE FROM courses WHERE id = $1`, [id]);
    }
}

module.exports = Course;
