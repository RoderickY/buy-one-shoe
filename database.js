'use strict';
// Uses Node v22's built-in experimental SQLite (no native build required)
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'buyoneshoe.db'));

db.exec(`
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

// Helper: prepare + get one row
function get(sql, ...params) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

// Helper: prepare + get all rows
function all(sql, ...params) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

// Helper: prepare + run (INSERT/UPDATE/DELETE)
function run(sql, ...params) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

function seed() {
  const { c } = get('SELECT COUNT(*) as c FROM users');
  if (c > 0) return;

  const users = [
    ['Alex Chen',  'alex@demo.com',   'AC', 'Below-knee amputee. Love running. Looking for right-side shoes in most brands.', 'San Francisco, CA'],
    ['Maya Patel', 'maya@demo.com',   'MP', 'My feet are different sizes (L:7.5, R:8.5). Co-buying pairs saves me so much money!', 'New York, NY'],
    ['Jordan Lee', 'jordan@demo.com', 'JL', 'Lost my left glove last winter. Here to give my right ones a new home.', 'Chicago, IL'],
    ['Sam Rivera', 'sam@demo.com',    'SR', 'Veteran, above-knee amputee. Active community member.', 'Austin, TX'],
    ['Riley Kim',  'riley@demo.com',  'RK', 'Jewelry enthusiast who keeps losing single earrings!', 'Seattle, WA'],
  ];
  users.forEach(u => run('INSERT INTO users (name,email,avatar,bio,location) VALUES (?,?,?,?,?)', ...u));

  const listings = [
    [1,'shoes',   'Nike',          'Air Max 270',         '10',      'left', 'White/Blue',  'new',      150,'San Francisco, CA','Brand new, never worn. I only need the right shoe — amputee, left side.'],
    [2,'shoes',   'Nike',          'Air Max 270',         '10',      'right','White/Blue',  'new',      150,'New York, NY',      'I need the left, size 10. Different foot sizes. Happy to split!'],
    [4,'shoes',   'Adidas',        'Ultraboost 22',       '9.5',     'left', 'Black/White', 'like-new', 180,'Austin, TX',       'Only worn a few times. Need the right side.'],
    [1,'shoes',   'New Balance',   '990v5',               '10',      'left', 'Grey',        'good',     185,'San Francisco, CA','Great condition, worn maybe 10 times.'],
    [3,'gloves',  'The North Face','Montana Ski Glove',   'L',       'right','Black',       'good',      60,'Chicago, IL',      'Lost the left one last season. Right glove is in perfect condition.'],
    [5,'gloves',  'The North Face','Montana Ski Glove',   'L',       'left', 'Black',       'good',      60,'Seattle, WA',      "Have the left, need the right. Let's match!"],
    [5,'earrings','Mejuri',        'Gold Hoop 14k',       'one-size','left', 'Gold',        'like-new',  80,'Seattle, WA',      'Beautiful hoop earring, lost the right one at a concert.'],
    [2,'shoes',   'Converse',      'Chuck Taylor All Star','8',       'right','Black',       'new',       70,'New York, NY',     'Left foot is 8, right is 8.5. Need someone with the opposite sizing.'],
    [4,'shoes',   'Brooks',        'Ghost 14',            '11',      'right','Blue/Silver', 'like-new', 140,'Austin, TX',       'Looking for left-side partner. Amazing running shoe.'],
    [3,'shoes',   'HOKA',          'Clifton 9',           '9',       'left', 'White/Coral', 'new',      145,'Chicago, IL',      'Need right side. Super cushioned, great for long walks.'],
    [1,'shoes',   'Salomon',       'Speedcross 5',        '10',      'left', 'Black/Red',   'good',     130,'San Francisco, CA','Trail running shoe. Need the right side partner.'],
    [5,'earrings','Mejuri',        'Pearl Stud',          'one-size','right','White/Gold',  'like-new',  65,'Seattle, WA',      'Lost my left pearl stud. Right one is perfect.'],
  ];
  listings.forEach(l => run(
    'INSERT INTO listings (user_id,category,brand,model,size,side,color,condition,price,location,description) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    ...l
  ));

  // Confirmed match: Alex (left Nike sz10) ↔ Maya (right Nike sz10)
  run('INSERT INTO matches (listing_id_1,listing_id_2,user_id_1,user_id_2,status) VALUES (?,?,?,?,?)', 1,2,1,2,'accepted');
  // Pending: Jordan (right glove) ↔ Riley (left glove)
  run('INSERT INTO matches (listing_id_1,listing_id_2,user_id_1,user_id_2,status) VALUES (?,?,?,?,?)', 5,6,3,5,'pending');

  const msgs = [
    [1,1,"Hi Maya! I saw your listing for Nike Air Max 270 right shoe, size 10. I need the left! Want to split a pair?"],
    [1,2,"Hi Alex! Yes, that's exactly what I'm looking for too. Which colorway were you thinking?"],
    [1,1,"The White/Blue one looks great. We could order from Nike.com and each pay $75 — half the retail price!"],
    [1,2,"Perfect! I'm definitely in. Should we do it this weekend?"],
    [1,1,"Let's do it! I'll send you the link to the exact pair. 🎉"],
    [2,3,"Hey Riley! I have the right North Face Montana glove size L in black. Lost my left one. Do you have the left?"],
    [2,5,"Jordan, yes! I have the exact same situation but opposite — I lost my right glove! This is fate 😄"],
  ];
  msgs.forEach(([mid,sid,c]) => run('INSERT INTO messages (match_id,sender_id,content) VALUES (?,?,?)', mid, sid, c));

  run('INSERT INTO reviews (reviewer_id,reviewed_id,match_id,rating,comment) VALUES (?,?,?,?,?)',
    2,1,1,5,'Alex was amazing to work with! Super communicative and the transaction went smoothly.');
  run('INSERT INTO reviews (reviewer_id,reviewed_id,match_id,rating,comment) VALUES (?,?,?,?,?)',
    1,2,1,5,'Maya was fast and reliable. Great experience — exactly why this app exists!');

  console.log('✅  Database seeded with demo data');
}

module.exports = { db, get, all, run, seed };
