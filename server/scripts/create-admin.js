
require('dotenv').config({
    path: require('path').join(__dirname, '..', '.env')
});

const bcrypt = require('bcryptjs');
const readline = require('readline');
const { client } = require('../config/db');

const MIN_PASSWORD_LENGTH = 10;

// ---------- Terminal input helpers ----------

function ask(question) {
    // In an unattended context (the start .bat files run this before the server
    // boots, with no terminal) readline would hang forever if a value is missing.
    // Fail fast with an actionable message instead.
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        return Promise.reject(new Error(
            'Interactive input requires a terminal. ' +
            'Run the start .bat file in a console window, or pass --name and --email explicitly.'
        ));
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// Read a password without displaying its characters.
function askPassword(question) {
    return new Promise((resolve, reject) => {
        if (!process.stdin.isTTY || !process.stdin.setRawMode) {
            reject(new Error(
                'Hidden password input requires an interactive terminal. ' +
                'Run the start .bat file, or pass --name, --email and --password explicitly.'
            ));
            return;
        }

        const stdin = process.stdin;
        const stdout = process.stdout;
        let password = '';
        let finished = false;

        stdout.write(question);
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        function cleanup() {
            stdin.removeListener('data', onData);
            stdin.setRawMode(false);
            stdin.pause();
        }

        function onData(key) {
            if (key === '\u0003') {
                cleanup();
                finished = true;
                stdout.write('\n');
                reject(new Error('Operation cancelled.'));
                return;
            }

            if (key === '\r' || key === '\n') {
                cleanup();
                finished = true;
                stdout.write('\n');
                resolve(password);
                return;
            }

            if (key === '\u007f' || key === '\b') {
                password = password.slice(0, -1);
                return;
            }

            if (key >= ' ' && key !== '\u007f') {
                password += key;
            }
        }

        stdin.on('data', onData);
    });
}

// ---------- Command-line arguments ----------

function getArguments() {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (!arg.startsWith('--')) {
            throw new Error(`Unexpected argument: ${arg}`);
        }

        const key = arg.slice(2);

        if (!['email', 'password', 'name'].includes(key)) {
            throw new Error(`Unknown option: ${arg}`);
        }

        if (options[key] !== undefined) {
            throw new Error(`Option specified more than once: ${arg}`);
        }

        if (args[i + 1] === undefined ||
            args[i + 1].startsWith('--')) {
            throw new Error(`Missing value for ${arg}`);
        }

        options[key] = args[++i];
    }

    return options;
}

// ---------- Validation ----------

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return 'Password must contain at least one letter and one number.';
    }

    return null;
}

// ---------- Create the first administrator ----------

// On a true first start the schema may not exist yet. server.js normally runs
// initDB() at boot to create the tables, but on the very first start the batch
// files run create-admin.js *before* `npm run dev` boots the server, so this
// script must guarantee the users table itself exists before it can read it.
// We reuse User.initTable() so the schema stays identical to the rest of the app.
const User = require('../models/User');

async function ensureUsersTable() {
    await User.initTable();
}

async function createAdmin() {
    let connected = false;

    try {
        const options = getArguments();

        await client.connect();
        connected = true;

        await ensureUsersTable();

        // Never modify an existing administrator.
        const existingAdmin = await client.query(
            'SELECT id, email FROM users WHERE role = $1 LIMIT 1',
            ['admin']
        );

        if (existingAdmin.rows.length > 0) {
            console.log(
                `OK: administrator already exists ` +
                `(${existingAdmin.rows[0].email}). No changes made.`
            );
            return;
        }

        console.log('');
        console.log('==================================================');
        console.log('  FIRST RUN - Create the real administrator');
        console.log('  No demo users or demo data will be created.');
        console.log('==================================================');
        console.log('');

        // Credentials are entered here in the console (the start .bat file runs
        // this script before the server boots, while the prompt window is open).
        // They are never read from .env. --name/--email/--password are available
        // only as a manual escape hatch.
        let name = (options.name || '').trim();
        let email = (options.email || '').trim();
        let password = options.password || '';

        // Name
        while (!name) {
            name = await ask('Administrator full name: ');

            if (!name) {
                console.log('Name cannot be empty.');
            }
        }

        // Email
        while (!email || !validateEmail(email)) {
            email = await ask('Administrator email: ');

            if (!validateEmail(email)) {
                console.log('Invalid email address. Please try again.');
            }
        }

        email = email.toLowerCase();

        // Check whether the email belongs to another existing account.
        const existingUser = await client.query(
            'SELECT id, role FROM users WHERE LOWER(email) = $1 LIMIT 1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            throw new Error(
                'This email already belongs to an account. ' +
                'No administrator was created. Check the existing account first.'
            );
        }

        // Password: use a valid --password flag if given, otherwise prompt
        // interactively (hidden input + confirmation). Requires a real terminal.
        if (!password || validatePassword(password)) {
            const error = password ? validatePassword(password) : null;
            if (error) {
                console.log(`[WARNING] Provided --password is not strong enough (${error}).`);
                console.log('Falling back to interactive password entry.');
            }
            while (true) {
                const entered = await askPassword('Password (hidden): ');
                const passwordError = validatePassword(entered);
                if (passwordError) {
                    console.log(passwordError);
                    continue;
                }
                const confirmation = await askPassword('Confirm password: ');
                if (entered !== confirmation) {
                    console.log('Passwords do not match. Please try again.');
                    continue;
                }
                password = entered;
                break;
            }
        }

        const hash = await bcrypt.hash(password, 12);

        // Recheck and insert inside a transaction to reduce the risk of two
        // simultaneous first-run processes creating administrators. The final
        // safety net is the UNIQUE constraint on users.email: if a second run
        // using the same email races ahead, its insert is rejected (error 23505)
        // and reported as "already created" below.
        await client.query('BEGIN');

        try {
            const lockedCheck = await client.query(
                'SELECT id FROM users WHERE role = $1 LIMIT 1 FOR UPDATE',
                ['admin']
            );

            if (lockedCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                console.log('An administrator was created by another process. No changes made.');
                return;
            }

            await client.query(
                `INSERT INTO users (name, email, password, role)
                 VALUES ($1, $2, $3, $4)`,
                [name, email, hash, 'admin']
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            if (error.code === '23505') {
                console.log('An administrator was created by another process. No changes made.');
                return;
            }
            throw error;
        }

        console.log('');
        console.log('SUCCESS: Administrator account created.');
        console.log(`Name:  ${name}`);
        console.log(`Email: ${email}`);
        console.log('Role:  admin');
        console.log('Keep your credentials secure.');
        console.log('');
    } finally {
        if (connected) {
            await client.end();
        }
    }
}

createAdmin().catch(error => {
    console.error(`\n[ERROR] ${error.message}`);
    process.exitCode = 1;
});
