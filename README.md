# 👟 Buy One Shoe

> A co-buying marketplace for items sold in pairs or sets — find your perfect co-buyer and each pay half.

## Quick Start

**Requirements:** Node.js v22 or later

```bash
# 1. Install backend dependencies
npm install

# 2. Install & build the frontend
cd client && npm install && npm run build && cd ..

# 3. Run the app
npm start
# → App available at http://localhost:3001
```

By default, local development uses `buyoneshoe.db` with Node's built-in SQLite.
For hosted deployment, set `DATABASE_URL` to a Supabase/Postgres connection
string and the same app automatically switches to Postgres.

## Development Mode (hot reload)

```bash
# Terminal 1 — Backend
npm run dev:server

# Terminal 2 — Frontend (with hot reload)
cd client && npm run dev
# → Frontend at http://localhost:5173
# → API proxied to http://localhost:3001
```

## Features

| Feature | Description |
|---------|-------------|
| **Browse & Search** | Filter listings by category (shoes, gloves, earrings…), side (left/right), size, and keyword |
| **Post a Listing** | 3-step wizard to post what you have and what you need |
| **Smart Matching** | Automatically surfaces complementary listings (same brand/model/size, opposite side) |
| **Messaging** | Real-time-style chat between matched co-buyers with a clean conversation UI |
| **Profiles & Ratings** | User profiles with star ratings and review history |
| **Match Management** | Track pending, active, and completed co-buys |

## Demo Users

The app ships with 5 demo users and sample listings. Switch between them using the user menu in the top-right corner:

| User | Story |
|------|-------|
| **Alex Chen** | Below-knee amputee; needs right-side shoes |
| **Maya Patel** | Size-mismatched feet (L:7.5, R:8.5) |
| **Jordan Lee** | Lost left glove; has matching right |
| **Sam Rivera** | Above-knee veteran amputee |
| **Riley Kim** | Keeps losing single earrings |

## Tech Stack

- **Backend:** Node.js 22 + Express
- **Frontend:** React 18 + React Router v6 + Vite
- **Database:** SQLite locally (built-in `node:sqlite`), Supabase/Postgres in production
- **Styling:** Custom CSS design system

## Deploying with Supabase + Vercel

1. Create a Supabase project.
2. Copy the Postgres connection string. For Vercel/serverless, use the
   Supabase transaction pooler URL when available.
3. In Vercel, import `RoderickY/buy-one-shoe`.
4. Add this environment variable:
   ```
   DATABASE_URL=postgresql://...
   ```
5. Deploy. Vercel runs `npm run vercel-build`, serves `client/dist`, and routes
   `/api/*` to the Express app in `api/index.js`.

The database schema and demo seed data are created automatically on first boot.

## Project Structure

```
buy-one-shoe/
├── app.js             # Express app shared by local server + Vercel
├── api/index.js       # Vercel serverless entrypoint
├── server.js          # Local HTTP server
├── database.js        # SQLite/Postgres adapter + seed data
├── vercel.json        # Vercel build + routing config
├── package.json       # Server dependencies
└── client/
    ├── src/
    │   ├── App.jsx            # Root + routing
    │   ├── api.js             # API client
    │   ├── pages/
    │   │   ├── Browse.jsx     # Listing grid + filters
    │   │   ├── PostListing.jsx # 3-step listing form
    │   │   ├── Matches.jsx    # Match management
    │   │   ├── Messages.jsx   # Chat interface
    │   │   └── Profile.jsx    # User profile + reviews
    │   └── components/
    │       ├── Navbar.jsx
    │       └── ListingCard.jsx
    └── vite.config.js
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user with listings + reviews |
| GET | `/api/listings` | Search listings (query params: category, size, side, search) |
| POST | `/api/listings` | Create a listing |
| GET | `/api/listings/:id/suggestions` | Get matching listings for a listing |
| GET | `/api/matches?user_id=` | Get matches for a user |
| POST | `/api/matches` | Create a match request |
| PATCH | `/api/matches/:id` | Update match status |
| GET | `/api/messages/:matchId` | Get messages for a match |
| POST | `/api/messages/:matchId` | Send a message |
| POST | `/api/reviews` | Leave a review |
