const { client } = require('../config/db');

const STUDENT_COURSE_SELECT = `
    c.id AS course_id, c.title AS course_title, c.level AS course_level, c.language AS course_language,
    c.teacher_id, u.name AS teacher_name, e.progress AS progress
`;

class Enrollment {
    constructor(student_id, course_id, progress = 0) {
        this.student_id = student_id;
        this.course_id = course_id;
        this.progress = progress;
    }

    // Enroll a student in a course. Returns the row on success, null if already enrolled.
    static async add(student_id, course_id) {
        const res = await client.query(
            `INSERT INTO enrollments (student_id, course_id)
             VALUES ($1, $2)
             ON CONFLICT (student_id, course_id) DO NOTHING
             RETURNING id`,
            [student_id, course_id]
        );
        return res.rowCount > 0;
    }

    // Remove an enrollment. Returns true if a row was actually deleted.
    static async remove(student_id, course_id) {
        const res = await client.query(
            `DELETE FROM enrollments WHERE student_id = $1 AND course_id = $2`,
            [student_id, course_id]
        );
        return res.rowCount > 0;
    }

    // All students enrolled in a given course (safe user columns).
    static async getCourseStudents(course_id) {
        const res = await client.query(
            `SELECT u.id, u.name, u.email, u.avatar, u.created_at
             FROM enrollments e
             JOIN users u ON u.id = e.student_id
             WHERE e.course_id = $1
             ORDER BY u.id`,
            [course_id]
        );
        return res.rows;
    }

    // A single student's enrollments with course + teacher details (for the student dashboard).
    static async getByStudent(student_id) {
        const res = await client.query(
            `SELECT ${STUDENT_COURSE_SELECT}
             FROM enrollments e
             JOIN courses c ON c.id = e.course_id
             JOIN users u ON u.id = c.teacher_id
             WHERE e.student_id = $1
             ORDER BY c.id`,
            [student_id]
        );
        return res.rows;
    }

    // A teacher's courses with the number of enrolled students each.
    static async getTeacherCourses(teacher_id) {
        const res = await client.query(
            `SELECT c.id, c.title, c.description, c.language, c.level, c.thumbnail, c.status,
                    c.duration, c.days, c.time, c.price_extern, c.price_intern, c.is_open_for_enrollment,
                    u.name AS teacher_name,
                    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id)::int AS student_count
             FROM courses c
             JOIN users u ON u.id = c.teacher_id
             WHERE c.teacher_id = $1
             ORDER BY c.id`,
            [teacher_id]
        );
        return res.rows;
    }

    // A teacher's own student roster: every student enrolled in any of the teacher's courses.
    static async getTeacherStudents(teacher_id) {
        const res = await client.query(
            `SELECT DISTINCT u.id, u.name, u.email, u.avatar, u.created_at
             FROM enrollments e
             JOIN courses c ON c.id = e.course_id
             JOIN users u ON u.id = e.student_id
             WHERE c.teacher_id = $1
             ORDER BY u.id`,
            [teacher_id]
        );
        return res.rows;
    }
}

module.exports = Enrollment;
