const { Client } = require('pg');
require('dotenv').config();

function buildClient(overrides = {}) {
    return new Client({
        user: process.env.CLIENT_USERNAME,
        host: process.env.CLIENT_HOST,
        database: process.env.CLIENT_DATABASE,
        password: process.env.CLIENT_PASSWORD,
        port: Number(process.env.CLIENT_PORT) || 5432,
        ...overrides,
    });
}

const client = buildClient();

const connectDB = async () => {
    try {
        await client.connect();
        console.log('Connected to PostgreSQL');
    } catch (err) {
        console.error('Database connection error:', err);
        throw err;
    }
};

module.exports = { client, buildClient, connectDB };
