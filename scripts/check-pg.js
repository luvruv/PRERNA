const { Client } = require('pg');

async function test(port, user, password, db) {
  const c = new Client({ host: 'localhost', port, user, password, database: db });
  try {
    await c.connect();
    console.log(`CONNECTED: port=${port}, user=${user}, db=${db}`);
    const res = await c.query('SELECT current_database(), current_user');
    console.log('Result:', res.rows[0]);
    const dbs = await c.query('SELECT datname FROM pg_database');
    console.log('All DBs:', dbs.rows.map(x => x.datname));
    await c.end();
    return true;
  } catch (err) {
    console.log(`ERR port=${port}, user=${user}, db=${db}: ${err.message}`);
    try { await c.end(); } catch {}
    return false;
  }
}

async function run() {
  await test(5432, 'postgres', 'postgrespassword', 'postgres');
  await test(5432, 'postgres', 'postgrespassword', 'prerna_store');
  await test(5432, 'postgres', 'postgres', 'postgres');
  await test(5432, 'postgres', 'admin', 'postgres');
  await test(5432, 'postgres', 'root', 'postgres');
  await test(5433, 'postgres', 'postgrespassword', 'postgres');
  await test(5433, 'postgres', 'postgres', 'postgres');
}

run();
