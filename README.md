# SipLog

SipLog is a full-stack wine tasting journal built with React, Express, and
MongoDB. It lets you create wine entries, add structured tasting notes,
upload photos, organize wines by mood, and keep track of favorite bottles in
a personal digital cellar.

Multiple people can use the same SipLog instance: everyone shares one wine
catalog (so you're not re-entering a bottle someone else already logged),
but every tasting note, rating, and photo is private to the account that
created it.

---

## Architecture

- `client/` - React 19 + Vite frontend, routed with `react-router-dom`
  (`/login`, `/register`, and the journal at `/`).
- `server/` - Express 5 + Mongoose backend.
- **Auth**: email/password, hashed with bcrypt, sessions via a JWT stored in
  an httpOnly, Secure cookie (never exposed to frontend JS).
- **Images**: tasting photos are uploaded directly from the browser to
  Cloudinary (signed by the backend) - only the resulting URL is stored in
  MongoDB, not the image itself.
- **Database**: MongoDB Atlas.

```
sipLog/
├── client/
│   ├── src/
│   │   ├── pages/          # LoginPage, RegisterPage, JournalPage
│   │   ├── components/     # Presentational pieces (form, timeline, filters...)
│   │   ├── context/        # AuthContext
│   │   ├── hooks/          # useTastings, useWines
│   │   └── services/       # api.js + one file per resource (auth, wines, tastings, uploads)
│   └── vite.config.js
│
├── server/
│   ├── config/              # db.js, cloudinary.js
│   ├── controllers/
│   ├── middleware/          # auth.js, errorHandler.js
│   ├── models/
│   ├── routes/
│   ├── scripts/seed.js
│   ├── tests/
│   └── server.js
│
└── .github/workflows/ci.yml
```

## Data Model

**Wine** (shared catalog): name, producer, country, region, grape, vintage.

**Tasting** (private to the user who created it): wineId, appearance, nose
notes, palate notes, sweetness/acidity/body/tannin/rating (1-5), price,
wouldBuyAgain, mood tags, personal thoughts, photo URL, timestamps.

## API Routes

All routes below (except `/api/auth/*`) require a logged-in session.

**Auth**
```
POST   /api/auth/register   { name, email, password }
POST   /api/auth/login      { email, password }
POST   /api/auth/logout
GET    /api/auth/me
```

**Wines** (shared)
```
GET    /api/wines
GET    /api/wines/:id
GET    /api/wines/:id/tastings   (your own tastings for this wine)
POST   /api/wines
PUT    /api/wines/:id
DELETE /api/wines/:id
```

**Tastings** (private, always scoped to the logged-in user)
```
GET    /api/tastings?page=&limit=&wineId=&favorite=&minRating=&grape=&country=
GET    /api/tastings/stats/summary
GET    /api/tastings/:id
POST   /api/tastings
PUT    /api/tastings/:id
DELETE /api/tastings/:id
```

**Uploads**
```
GET    /api/uploads/signature   (signed params for a direct-to-Cloudinary upload)
```

---

## Local Development

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill in `server/.env`:
- `MONGO_URI` - your MongoDB Atlas connection string
- `JWT_SECRET` - a long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
- `CLIENT_ORIGIN` - `http://localhost:5173` for local dev
- `CLOUDINARY_*` - from your Cloudinary dashboard (photo upload won't work without these, everything else will)

`client/.env` just needs `VITE_API_URL=http://localhost:5001/api`.

### 3. (Optional) Seed sample data

```bash
cd server && npm run seed
```

This creates 5 sample accounts, all with the password `Password123!`
(e.g. `ayah@siplog.app` / `Password123!`) - useful for trying the
shared-catalog/private-tastings behavior.

### 4. Run it

```bash
# from the repo root
npm run dev
```

This starts the API on `http://localhost:5001` and the frontend on
`http://localhost:5173`.

### 5. Run the tests

```bash
cd server && npm test    # Jest + Supertest, spins up an in-memory MongoDB
cd client && npm test    # Vitest + React Testing Library
```

---

## Deployment

1. **MongoDB Atlas** - use your existing cluster. Under Network Access, allow
   access from anywhere (`0.0.0.0/0`) since Render's outbound IPs aren't fixed
   on the free tier.
2. **Cloudinary** - create a free account, grab the cloud name, API key, and
   API secret from the dashboard.
3. **Backend on Render** - new Web Service from this repo, root directory
   `server`, build command `npm install`, start command `npm start`. Set all
   the env vars from `server/.env.example`, with `NODE_ENV=production` and
   `CLIENT_ORIGIN` set to your Vercel URL once you have it.
4. **Frontend on Vercel** - new project from this repo, root directory
   `client`, build command `npm run build`, output directory `dist`. Set
   `VITE_API_URL` to your Render URL + `/api`.
5. Go back to Render and update `CLIENT_ORIGIN` to the real Vercel URL (no
   trailing slash), then redeploy the backend so CORS + the cross-domain
   cookie (`SameSite=None; Secure`) line up correctly.

---

## Original feature set

- **Wine management** - create wines (producer, country, region, grape,
  vintage) or reuse an existing one when logging a new tasting.
- **Tasting notes** - appearance, nose, palate, sweetness/acidity/body/tannin,
  rating, price, personal thoughts, mood tags (date night, cozy night, girls
  night, celebration, weeknight, summer patio).
- **Photos** - upload and preview a photo per tasting.
- **Timeline** - tastings grouped by date, editable/deletable, with bottle
  rating graphics and a "Favorites Shelf" for highly rated or buy-again wines.
- **Search & filter** - by name/producer/grape/notes/mood, minimum rating,
  grape, or favorites only.
