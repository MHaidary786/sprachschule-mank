const { client } = require('../config/db');

const EVENT_COLUMNS = `id, title, slug, description, event_date, cover_image, is_public, "order", created_at, updated_at`;

class Event {
    constructor(title, slug, description, event_date, cover_image, is_public, order) {
        this.title = title;
        this.slug = slug;
        this.description = description;
        this.event_date = event_date;
        this.cover_image = cover_image;
        this.is_public = is_public;
        this.order = order;
    }

    // create tables if not exist
    static async initTable() {
        await client.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                event_date DATE,
                cover_image VARCHAR(500),
                is_public BOOLEAN NOT NULL DEFAULT TRUE,
                "order" INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS event_photos (
                id SERIAL PRIMARY KEY,
                event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                url VARCHAR(500) NOT NULL,
                caption VARCHAR(255),
                "order" INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Events tables initialized');
    }

    // insert a new event plus its photos.
    // `dbClient` may be a transactional client (same interface as the shared one).
    static async createEvent({ title, slug, description, event_date, cover_image, is_public, order, photos = [] }, dbClient = client) {
        const res = await dbClient.query(
            `INSERT INTO events (title, slug, description, event_date, cover_image, is_public, "order")
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING ${EVENT_COLUMNS}`,
            [title, slug, description ?? null, event_date || null, cover_image ?? null,
             is_public ?? true, order ?? 0]
        );
        const event = res.rows[0];
        for (const [i, photo] of (photos || []).entries()) {
            await dbClient.query(
                `INSERT INTO event_photos (event_id, url, caption, "order") VALUES ($1, $2, $3, $4)`,
                [event.id, photo.url, photo.caption ?? null, photo.order ?? i]
            );
        }
        return Event.getEventById(event.id, dbClient);
    }

    // public events ordered by "order" then newest first, each with a photo count
    // and up to 3 photos for the gallery grid.
    static async getPublicEvents() {
        const res = await client.query(
            `SELECT e.*,
                    (SELECT COUNT(*) FROM event_photos ep WHERE ep.event_id = e.id)::int AS photo_count,
                    (SELECT COALESCE(JSONB_AGG(
                        JSONB_BUILD_OBJECT('url', ep.url, 'caption', ep.caption)
                        ORDER BY ep."order" ASC, ep.id ASC
                    ), '[]'::jsonb)
                     FROM (SELECT url, caption, "order", id FROM event_photos ep2
                           WHERE ep2.event_id = e.id
                           ORDER BY ep2."order", ep2.id
                           LIMIT 3) ep
                    ) AS photos
             FROM events e
             WHERE e.is_public = TRUE
             ORDER BY e."order" ASC, e.event_date DESC NULLS LAST, e.id ASC`
        );
        return res.rows;
    }

    // single public event with ALL its photos
    static async getPublicEventBySlug(slug) {
        const res = await client.query(
            `SELECT e.* FROM events e WHERE e.slug = $1 AND e.is_public = TRUE`,
            [slug]
        );
        const event = res.rows[0];
        if (!event) return null;
        return Event.getEventById(event.id);
    }

    static async getAllEvents() {
        const res = await client.query(
            `SELECT ${EVENT_COLUMNS} FROM events ORDER BY "order" ASC, event_date DESC NULLS LAST, id ASC`
        );
        return res.rows;
    }

    static async getEventById(id, dbClient = client) {
        const res = await dbClient.query(
            `SELECT ${EVENT_COLUMNS} FROM events WHERE id = $1`,
            [id]
        );
        const event = res.rows[0];
        if (!event) return null;
        const photosRes = await dbClient.query(
            `SELECT id, url, caption, "order" FROM event_photos WHERE event_id = $1 ORDER BY "order" ASC, id ASC`,
            [id]
        );
        event.photos = photosRes.rows;
        return event;
    }

    // update any subset of scalar fields; when `photos` is provided the full
    // photo set is replaced (delete + re-insert).
    static async updateEvent(id, fields, dbClient = client) {
        const columnMap = {
            title: 'title',
            slug: 'slug',
            description: 'description',
            event_date: 'event_date',
            cover_image: 'cover_image',
            is_public: 'is_public',
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
            await dbClient.query(`UPDATE events SET ${updates.join(', ')} WHERE id = $${idx}`, values);
        }
        if (fields.photos !== undefined) {
            await dbClient.query(`DELETE FROM event_photos WHERE event_id = $1`, [id]);
            for (const [i, photo] of fields.photos.entries()) {
                await dbClient.query(
                    `INSERT INTO event_photos (event_id, url, caption, "order") VALUES ($1, $2, $3, $4)`,
                    [id, photo.url, photo.caption ?? null, photo.order ?? i]
                );
            }
        }
        return Event.getEventById(id, dbClient);
    }

    static async deleteEvent(id) {
        await client.query(`DELETE FROM events WHERE id = $1`, [id]);
    }

    static async slugExists(slug, excludeId = null, dbClient = client) {
        const res = excludeId
            ? await dbClient.query(`SELECT id FROM events WHERE slug = $1 AND id <> $2`, [slug, excludeId])
            : await dbClient.query(`SELECT id FROM events WHERE slug = $1`, [slug]);
        return res.rowCount > 0;
    }
}

module.exports = Event;
