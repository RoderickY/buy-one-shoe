'use strict';
const express = require('express');
const path = require('path');
const cors = require('cors');
const { get, all, run, seed } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

seed();

// ── USERS ──────────────────────────────────────────────────────────────────
app.get('/api/users', (req, res) => {
  res.json(all('SELECT id,name,email,avatar,bio,location,created_at FROM users'));
});

app.get('/api/users/:id', (req, res) => {
  const user = get('SELECT id,name,email,avatar,bio,location,created_at FROM users WHERE id=?', req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });

  const { avg, count } = get('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE reviewed_id=?', req.params.id);
  const listings = all('SELECT * FROM listings WHERE user_id=? ORDER BY created_at DESC', req.params.id);
  const reviews  = all(`
    SELECT r.*,u.name as reviewer_name,u.avatar as reviewer_avatar
    FROM reviews r JOIN users u ON r.reviewer_id=u.id
    WHERE r.reviewed_id=? ORDER BY r.created_at DESC
  `, req.params.id);

  res.json({ ...user, avg_rating: avg, review_count: count, listings, reviews });
});

// ── LISTINGS ────────────────────────────────────────────────────────────────
app.get('/api/listings', (req, res) => {
  const { category, size, side, search, exclude_user } = req.query;
  let q = `SELECT l.*,u.name as user_name,u.avatar as user_avatar,u.location as user_location
           FROM listings l JOIN users u ON l.user_id=u.id WHERE l.status='active'`;
  const p = [];

  if (category && category !== 'all') { q += ' AND l.category=?'; p.push(category); }
  if (size)                           { q += ' AND l.size=?';     p.push(size); }
  if (side && side !== 'all')         { q += ' AND l.side=?';     p.push(side); }
  if (exclude_user)                   { q += ' AND l.user_id!=?'; p.push(exclude_user); }
  if (search) {
    q += ' AND (l.brand LIKE ? OR l.model LIKE ? OR l.description LIKE ? OR l.color LIKE ?)';
    const s = `%${search}%`;
    p.push(s, s, s, s);
  }
  q += ' ORDER BY l.created_at DESC';
  res.json(all(q, ...p));
});

app.get('/api/listings/:id', (req, res) => {
  const listing = get(`SELECT l.*,u.name as user_name,u.avatar as user_avatar
    FROM listings l JOIN users u ON l.user_id=u.id WHERE l.id=?`, req.params.id);
  if (!listing) return res.status(404).json({ error: 'Not found' });
  res.json(listing);
});

app.post('/api/listings', (req, res) => {
  const { user_id,category,brand,model,size,side,color,condition,price,location,description } = req.body;
  const result = run(`
    INSERT INTO listings (user_id,category,brand,model,size,side,color,condition,price,location,description)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    user_id,category,brand,model,size,side,color,condition,price||null,location,description
  );
  const listing = get('SELECT * FROM listings WHERE id=?', result.lastInsertRowid);

  const oppSide = side==='left'?'right':side==='right'?'left':null;
  let potentialMatches = [];
  if (oppSide) {
    potentialMatches = all(`
      SELECT l.*,u.name as user_name,u.avatar as user_avatar
      FROM listings l JOIN users u ON l.user_id=u.id
      WHERE l.status='active' AND l.category=? AND l.size=? AND l.side=? AND l.user_id!=? LIMIT 5`,
      category,size,oppSide,user_id
    );
  }
  res.json({ ...listing, potentialMatches });
});

app.patch('/api/listings/:id', (req, res) => {
  run('UPDATE listings SET status=? WHERE id=?', req.body.status, req.params.id);
  res.json(get('SELECT * FROM listings WHERE id=?', req.params.id));
});

// ── MATCH SUGGESTIONS ────────────────────────────────────────────────────────
app.get('/api/listings/:id/suggestions', (req, res) => {
  const listing = get('SELECT * FROM listings WHERE id=?', req.params.id);
  if (!listing) return res.status(404).json({ error: 'Not found' });
  const oppSide = listing.side==='left'?'right':listing.side==='right'?'left':null;
  if (!oppSide) return res.json([]);
  res.json(all(`
    SELECT l.*,u.name as user_name,u.avatar as user_avatar,u.location as user_location
    FROM listings l JOIN users u ON l.user_id=u.id
    WHERE l.status='active' AND l.category=? AND l.size=? AND l.side=? AND l.user_id!=? LIMIT 10`,
    listing.category,listing.size,oppSide,listing.user_id
  ));
});

// ── MATCHES ──────────────────────────────────────────────────────────────────
app.get('/api/matches', (req, res) => {
  const { user_id } = req.query;
  res.json(all(`
    SELECT m.*,
      l1.brand as l1_brand,l1.model as l1_model,l1.size as l1_size,l1.side as l1_side,
      l1.category as category,l1.color as l1_color,l1.price as l1_price,
      l2.brand as l2_brand,l2.model as l2_model,l2.size as l2_size,l2.side as l2_side,
      l2.color as l2_color,l2.price as l2_price,
      u1.name as user1_name,u1.avatar as user1_avatar,u1.location as user1_location,
      u2.name as user2_name,u2.avatar as user2_avatar,u2.location as user2_location
    FROM matches m
    JOIN listings l1 ON m.listing_id_1=l1.id
    JOIN listings l2 ON m.listing_id_2=l2.id
    JOIN users u1 ON m.user_id_1=u1.id
    JOIN users u2 ON m.user_id_2=u2.id
    WHERE (m.user_id_1=? OR m.user_id_2=?)
    ORDER BY m.created_at DESC`,
    user_id, user_id
  ));
});

app.post('/api/matches', (req, res) => {
  const { listing_id_1,listing_id_2,user_id_1,user_id_2 } = req.body;
  const existing = get(`SELECT * FROM matches WHERE
    (listing_id_1=? AND listing_id_2=?) OR (listing_id_1=? AND listing_id_2=?)`,
    listing_id_1,listing_id_2,listing_id_2,listing_id_1
  );
  if (existing) return res.json(existing);
  const result = run(`INSERT INTO matches (listing_id_1,listing_id_2,user_id_1,user_id_2,status) VALUES (?,?,?,?,'pending')`,
    listing_id_1,listing_id_2,user_id_1,user_id_2
  );
  res.json(get('SELECT * FROM matches WHERE id=?', result.lastInsertRowid));
});

app.patch('/api/matches/:id', (req, res) => {
  run('UPDATE matches SET status=? WHERE id=?', req.body.status, req.params.id);
  if (req.body.status==='completed') {
    const m = get('SELECT * FROM matches WHERE id=?', req.params.id);
    run("UPDATE listings SET status='matched' WHERE id=? OR id=?", m.listing_id_1, m.listing_id_2);
  }
  res.json(get('SELECT * FROM matches WHERE id=?', req.params.id));
});

// ── MESSAGES ─────────────────────────────────────────────────────────────────
app.get('/api/messages/:matchId', (req, res) => {
  res.json(all(`
    SELECT m.*,u.name as sender_name,u.avatar as sender_avatar
    FROM messages m JOIN users u ON m.sender_id=u.id
    WHERE m.match_id=? ORDER BY m.created_at ASC`,
    req.params.matchId
  ));
});

app.post('/api/messages/:matchId', (req, res) => {
  const { sender_id, content } = req.body;
  const result = run('INSERT INTO messages (match_id,sender_id,content) VALUES (?,?,?)',
    req.params.matchId, sender_id, content
  );
  const match = get('SELECT * FROM matches WHERE id=?', req.params.matchId);
  if (match.status==='pending') {
    run("UPDATE matches SET status='accepted' WHERE id=?", req.params.matchId);
  }
  res.json(get(`SELECT m.*,u.name as sender_name,u.avatar as sender_avatar
    FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=?`, result.lastInsertRowid
  ));
});

// ── REVIEWS ───────────────────────────────────────────────────────────────────
app.get('/api/reviews/check', (req, res) => {
  const { reviewer_id, match_id } = req.query;
  const review = get('SELECT id FROM reviews WHERE reviewer_id=? AND match_id=?', reviewer_id, match_id);
  res.json({ exists: !!review });
});

app.post('/api/reviews', (req, res) => {
  const { reviewer_id,reviewed_id,match_id,rating,comment } = req.body;
  const result = run('INSERT INTO reviews (reviewer_id,reviewed_id,match_id,rating,comment) VALUES (?,?,?,?,?)',
    reviewer_id,reviewed_id,match_id,rating,comment
  );
  res.json({ id: result.lastInsertRowid });
});

// ── SERVE BUILT FRONTEND ──────────────────────────────────────────────────────
// Serve static files whenever the dist folder exists (production OR Codespaces)
const distPath = path.join(__dirname, 'client/dist');
const fs = require('fs');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  const mode = process.env.NODE_ENV==='production' ? '(production)' : '(development)';
  console.log(`\n🥿  Buy One Shoe server running ${mode}`);
  console.log(`   API  → http://localhost:${PORT}/api`);
  if (process.env.NODE_ENV!=='production') {
    console.log(`   App  → http://localhost:5173  (run: cd client && npm run dev)\n`);
  } else {
    console.log(`   App  → http://localhost:${PORT}\n`);
  }
});
