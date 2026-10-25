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

// The app shares one pg Client. A single pg 8.x Client is terminal once its
// connection is dropped: calling connect() again throws "Client has already
// been connected", and an unhandled 'error' event (e.g. Postgres sending a
// 57P01 admin-terminate) crashes the whole process.
//
// This facade keeps the same public surface used everywhere (query/connect/
// end/on) but swaps in a fresh Client behind it whenever the connection is
// lost, so the next query reconnects transparently instead of crashing.
// Query-level errors (constraint violations, etc.) are untouched: they reject
// on the query promise and never reach the 'error' event.
function createReconnectingClient(overrides = {}) {
    let real = buildClient(overrides);
    let connected = false;
    let reconnecting = null; // in-flight connect() promise for a fresh client

    const attach = (c) => {
        c.on('error', (err) => {
            if (c !== real) return; // superseded client, its fate is irrelevant
            if (!connected) return; // connect() rejection already propagates
            // Connection-level error: the socket is dead. Drop this client and
            // stage a fresh one; the next ensureConnection() will connect it.
            console.error('Database connection error (will reconnect):', err.message);
            connected = false;
            const old = real;
            real = buildClient(overrides);
            attach(real);
            console.log('Database connection lost, will reconnect on next query...');
            try { Promise.resolve(old.end()).catch(() => {}); } catch { /* already closed */ }
        });
    };
    attach(real);

    const ensureConnection = () => {
        if (connected) return Promise.resolve();
        if (!reconnecting) {
            reconnecting = real
                .connect()
                .then(() => {
                    connected = true;
                })
                .finally(() => {
                    reconnecting = null;
                });
        }
        return reconnecting;
    };

    return {
        query(text, values) {
            return ensureConnection().then(() => real.query(text, values));
        },
        connect() {
            return ensureConnection();
        },
        async end() {
            if (reconnecting) await reconnecting.catch(() => {});
            connected = false;
            try { await real.end(); } catch { /* already closed */ }
        },
        on(event, listener) {
            real.on(event, listener);
            return this;
        },
        // Escape hatches so scripts/debugging can still reach the live client.
        get rawClient() { return real; },
        buildClient: () => buildClient(overrides),
    };
}

const client = createReconnectingClient();

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
