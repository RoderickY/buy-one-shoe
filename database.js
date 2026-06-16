'use strict';

const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const isPostgres = Boolean(DATABASE_URL);

let sqliteDb = null;
let pgPool = null;

function getSqliteDb() {
  if (!sqliteDb) {
    const { DatabaseSync } = require('node:sqlite');
    sqliteDb = new DatabaseSync(path.join(__dirname, 'buyoneshoe.db'));
  }
  return sqliteDb;
}

function sqlPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function query(sql, params = []) {
  if (isPostgres) {
    if (!pgPool) {
      const { Pool } = require('pg');
      pgPool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
      });
    }
    return pgPool.query(sqlPlaceholders(sql), params);
  }

  const stmt = getSqliteDb().prepare(sql);
  if (/^\s*select\b/i.test(sql)) {
    return { rows: stmt.all(...params) };
  }
  const result = stmt.run(...params);
  return { rows: [], lastInsertRowid: result.lastInsertRowid };
}

async function get(sql, ...params) {
  const result = await query(sql, params);
  return result.rows[0];
}

async function all(sql, ...params) {
  const result = await query(sql, params);
  return result.rows;
}

async function run(sql, ...params) {
  if (isPostgres && /^\s*insert\b/i.test(sql) && !/\breturning\b/i.test(sql)) {
    const result = await query(`${sql} RETURNING id`, params);
    return { lastInsertRowid: result.rows[0]?.id };
  }
  const result = await query(sql, params);
  return { lastInsertRowid: result.lastInsertRowid ?? result.rows[0]?.id };
}

async function createSchema() {
  if (isPostgres) {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        avatar TEXT,
        bio TEXT,
        location TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS listings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        category TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        size TEXT,
        side TEXT,
        color TEXT,
        condition TEXT DEFAULT 'good',
        price REAL,
        location TEXT,
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        listing_id_1 INTEGER NOT NULL REFERENCES listings(id),
        listing_id_2 INTEGER NOT NULL REFERENCES listings(id),
        user_id_1 INTEGER NOT NULL REFERENCES users(id),
        user_id_2 INTEGER NOT NULL REFERENCES users(id),
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        match_id INTEGER NOT NULL REFERENCES matches(id),
        sender_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        reviewer_id INTEGER NOT NULL REFERENCES users(id),
        reviewed_id INTEGER NOT NULL REFERENCES users(id),
        match_id INTEGER REFERENCES matches(id),
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    return;
  }

  getSqliteDb().exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar TEXT,
      bio TEXT,
      location TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      size TEXT,
      side TEXT,
      color TEXT,
      condition TEXT DEFAULT 'good',
      price REAL,
      location TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id_1 INTEGER NOT NULL,
      listing_id_2 INTEGER NOT NULL,
      user_id_1 INTEGER NOT NULL,
      user_id_2 INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (listing_id_1) REFERENCES listings(id),
      FOREIGN KEY (listing_id_2) REFERENCES listings(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (match_id) REFERENCES matches(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewer_id INTEGER NOT NULL,
      reviewed_id INTEGER NOT NULL,
      match_id INTEGER,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (reviewed_id) REFERENCES users(id)
    );
  `);
}

async function seed() {
  await createSchema();
  const { c } = await get('SELECT COUNT(*) as c FROM users');
  if (Number(c) > 0) return;

  const users = [
    ['Alex Chen', 'alex@demo.com', 'AC', 'Below-knee amputee. Love running. Looking for right-side shoes in most brands.', 'San Francisco, CA'],
    ['Maya Patel', 'maya@demo.com', 'MP', 'My feet are different sizes (L:7.5, R:8.5). Co-buying pairs saves me so much money!', 'New York, NY'],
    ['Jordan Lee', 'jordan@demo.com', 'JL', 'Lost my left glove last winter. Here to give my right ones a new home.', 'Chicago, IL'],
    ['Sam Rivera', 'sam@demo.com', 'SR', 'Veteran, above-knee amputee. Active community member.', 'Austin, TX'],
    ['Riley Kim', 'riley@demo.com', 'RK', 'Jewelry enthusiast who keeps losing single earrings!', 'Seattle, WA'],
  ];
  for (const user of users) {
    await run('INSERT INTO users (name,email,avatar,bio,location) VALUES (?,?,?,?,?)', ...user);
  }

  const listings = [
    [1, 'shoes', 'Nike', 'Air Max 270', '10', 'left', 'White/Blue', 'new', 150, 'San Francisco, CA', 'Brand new, never worn. I only need the right shoe — amputee, left side.'],
    [2, 'shoes', 'Nike', 'Air Max 270', '10', 'right', 'White/Blue', 'new', 150, 'New York, NY', 'I need the left, size 10. Different foot sizes. Happy to split!'],
    [4, 'shoes', 'Adidas', 'Ultraboost 22', '9.5', 'left', 'Black/White', 'like-new', 180, 'Austin, TX', 'Only worn a few times. Need the right side.'],
    [1, 'shoes', 'New Balance', '990v5', '10', 'left', 'Grey', 'good', 185, 'San Francisco, CA', 'Great condition, worn maybe 10 times.'],
    [3, 'gloves', 'The North Face', 'Montana Ski Glove', 'L', 'right', 'Black', 'good', 60, 'Chicago, IL', 'Lost the left one last season. Right glove is in perfect condition.'],
    [5, 'gloves', 'The North Face', 'Montana Ski Glove', 'L', 'left', 'Black', 'good', 60, 'Seattle, WA', "Have the left, need the right. Let's match!"],
    [5, 'earrings', 'Mejuri', 'Gold Hoop 14k', 'one-size', 'left', 'Gold', 'like-new', 80, 'Seattle, WA', 'Beautiful hoop earring, lost the right one at a concert.'],
    [2, 'shoes', 'Converse', 'Chuck Taylor All Star', '8', 'right', 'Black', 'new', 70, 'New York, NY', 'Left foot is 8, right is 8.5. Need someone with the opposite sizing.'],
    [4, 'shoes', 'Brooks', 'Ghost 14', '11', 'right', 'Blue/Silver', 'like-new', 140, 'Austin, TX', 'Looking for left-side partner. Amazing running shoe.'],
    [3, 'shoes', 'HOKA', 'Clifton 9', '9', 'left', 'White/Coral', 'new', 145, 'Chicago, IL', 'Need right side. Super cushioned, great for long walks.'],
    [1, 'shoes', 'Salomon', 'Speedcross 5', '10', 'left', 'Black/Red', 'good', 130, 'San Francisco, CA', 'Trail running shoe. Need the right side partner.'],
    [5, 'earrings', 'Mejuri', 'Pearl Stud', 'one-size', 'right', 'White/Gold', 'like-new', 65, 'Seattle, WA', 'Lost my left pearl stud. Right one is perfect.'],
  ];
  for (const listing of listings) {
    await run(
      'INSERT INTO listings (user_id,category,brand,model,size,side,color,condition,price,location,description) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      ...listing
    );
  }

  await run('INSERT INTO matches (listing_id_1,listing_id_2,user_id_1,user_id_2,status) VALUES (?,?,?,?,?)', 1, 2, 1, 2, 'accepted');
  await run('INSERT INTO matches (listing_id_1,listing_id_2,user_id_1,user_id_2,status) VALUES (?,?,?,?,?)', 5, 6, 3, 5, 'pending');

  const messages = [
    [1, 1, 'Hi Maya! I saw your listing for Nike Air Max 270 right shoe, size 10. I need the left! Want to split a pair?'],
    [1, 2, "Hi Alex! Yes, that's exactly what I'm looking for too. Which colorway were you thinking?"],
    [1, 1, 'The White/Blue one looks great. We could order from Nike.com and each pay $75 — half the retail price!'],
    [1, 2, "Perfect! I'm definitely in. Should we do it this weekend?"],
    [1, 1, "Let's do it! I'll send you the link to the exact pair. 🎉"],
    [2, 3, 'Hey Riley! I have the right North Face Montana glove size L in black. Lost my left one. Do you have the left?'],
    [2, 5, 'Jordan, yes! I have the exact same situation but opposite — I lost my right glove! This is fate 😄'],
  ];
  for (const message of messages) {
    await run('INSERT INTO messages (match_id,sender_id,content) VALUES (?,?,?)', ...message);
  }

  await run(
    'INSERT INTO reviews (reviewer_id,reviewed_id,match_id,rating,comment) VALUES (?,?,?,?,?)',
    2, 1, 1, 5, 'Alex was amazing to work with! Super communicative and the transaction went smoothly.'
  );
  await run(
    'INSERT INTO reviews (reviewer_id,reviewed_id,match_id,rating,comment) VALUES (?,?,?,?,?)',
    1, 2, 1, 5, 'Maya was fast and reliable. Great experience — exactly why this app exists!'
  );

  console.log(`✅  Database seeded with demo data (${isPostgres ? 'Postgres' : 'SQLite'})`);
}

const ready = seed();

module.exports = { all, get, isPostgres, ready, run };
