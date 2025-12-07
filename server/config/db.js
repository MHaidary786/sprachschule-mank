const mongoose = require('mongoose');
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    user: process.env.CLIENT_USERNAME,
    host: process.env.CLIENT_HOST,
    database: process.env.CLIENT_DATABASE,
    password: process.env.CLIENT_PASSWORD,
    port: Number(process.env.CLIENT_PORT) || 5432,
});

const connectDB = async () => {
    try {
        await client.connect();
        console.log('Connected to PostgreSQL');
    } catch (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
}

module.exports = {connectDB, client};




