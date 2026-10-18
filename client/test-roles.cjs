const http = require('http');
const WebSocket = require('ws');

function getJSON(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const targets = await getJSON('http://localhost:9333/json');
    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let id = 0;
    const pending = new Map();

    const send = (method, params = {}) =>
        new Promise((resolve) => {
            const mid = ++id;
            pending.set(mid, resolve);
            ws.send(JSON.stringify({ id: mid, method, params }));
        });

    ws.on('message', (raw) => {
        const msg = JSON.parse(raw);
        if (msg.id && pending.has(msg.id)) {
            pending.get(msg.id)(msg.result);
            pending.delete(msg.id);
        }
    });

    await new Promise((r) => ws.on('open', r));
    await send('Page.enable');
    await send('Runtime.enable');

    const evalJS = async (expression) => {
        const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        return res.result ? res.result.value : undefined;
    };

    const loginAs = async (email, password) => {
        // Clear session first (on any page), THEN go to the login page fresh
        await evalJS(`try { localStorage.clear(); } catch(e) {}`);
        await send('Page.navigate', { url: 'http://localhost:4200/sprachschule-mank/auth/login' });
        // Poll until the login form is actually rendered (Angular boot can vary)
        for (let i = 0; i < 20; i++) {
            await sleep(500);
            const ready = await evalJS(`!!document.querySelector('#username')`);
            if (ready) break;
        }
        await sleep(300);
        await evalJS(`
            (function() {
                const setVal = (el, v) => {
                    const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value');
                    desc.set.call(el, v);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                };
                setVal(document.querySelector('#username'), ${JSON.stringify(email)});
                setVal(document.querySelector('#password'), ${JSON.stringify(password)});
                document.querySelector('form button[type="submit"]').click();
            })()
        `);
        await sleep(6000);
        return await evalJS('location.href');
    };

    const nav = async (path) => {
        await send('Page.navigate', { url: `http://localhost:4200/sprachschule-mank${path}` });
        await sleep(6000);
        return await evalJS('location.href');
    };

    const body = async () => (await evalJS('document.body.innerText'))?.slice(0, 120).replace(/\n+/g, ' | ');

    // STUDENT
    console.log('1) student login  ->', await loginAs('t-student@test.de', 'TempPass123'));
    console.log('   body:', await body());
    console.log('2) student -> /admin/dashboard ->', await nav('/admin/dashboard'));
    console.log('   body:', await body());

    // TEACHER
    console.log('3) teacher login  ->', await loginAs('t-teacher@test.de', 'TempPass123'));
    console.log('   body:', await body());
    console.log('4) teacher -> /admin/dashboard ->', await nav('/admin/dashboard'));

    // ANON
    await evalJS(`localStorage.clear()`);
    console.log('5) anon -> /admin/dashboard ->', await nav('/admin/dashboard'));
    console.log('   body:', await body());

    ws.close();
    process.exit(0);
})().catch((e) => {
    console.error('SCRIPT ERROR:', e.message);
    process.exit(1);
});
