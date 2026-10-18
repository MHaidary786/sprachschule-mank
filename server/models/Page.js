const { client } = require('../config/db');

const COLUMNS = 'id, title, slug, content, show_in_nav, "order", created_at, updated_at';

class Page {
    constructor(title, slug, content, showInNav = true, order = 0) {
        this.title = title;
        this.slug = slug;
        this.content = content;
        this.showInNav = showInNav;
        this.order = order;
    }

    // create table if not exists
    static async initTable() {
        await client.query(`
            CREATE TABLE IF NOT EXISTS pages (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                content TEXT NOT NULL,
                show_in_nav BOOLEAN NOT NULL DEFAULT TRUE,
                "order" INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Pages table initialized');
    }

    // insert a new page
    async save() {
        const query = `
            INSERT INTO pages (title, slug, content, show_in_nav, "order")
            VALUES ($1, $2, $3, $4, $5)
            RETURNING ${COLUMNS};
        `;
        const values = [this.title, this.slug, this.content, this.showInNav, this.order];
        const res = await client.query(query, values);
        return res.rows[0];
    }

    // all pages, in navigation order
    static async getAll() {
        const res = await client.query(`SELECT ${COLUMNS} FROM pages ORDER BY "order" ASC, id ASC`);
        return res.rows;
    }

    static async getById(id) {
        const res = await client.query(`SELECT ${COLUMNS} FROM pages WHERE id = $1`, [id]);
        return res.rows[0];
    }

    static async getBySlug(slug) {
        const res = await client.query(`SELECT ${COLUMNS} FROM pages WHERE slug = $1`, [slug]);
        return res.rows[0];
    }

    // update any subset of fields
    static async update(id, fields) {
        const columnMap = {
            title: 'title',
            slug: 'slug',
            content: 'content',
            showInNav: 'show_in_nav',
            order: '"order"',
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
            await client.query(`UPDATE pages SET ${updates.join(', ')} WHERE id = $${idx}`, values);
        }
        return this.getById(id);
    }

    static async deleteById(id) {
        await client.query(`DELETE FROM pages WHERE id = $1`, [id]);
    }
}

module.exports = Page;
