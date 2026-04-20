
# SipLog

SipLog is a full-stack wine tasting journal built with React,
Express, and MongoDB.

The app lets users create wine entries, add tasting notes,
upload photos, organize wines by mood, and keep track of
favorite bottles in a personal digital cellar.

This project was created as a full-stack lab project and shows
frontend development, backend API development, MongoDB
integration, CRUD operations, and a custom user-focused
interface.

---

## Overview

SipLog was designed for people who want to remember wines they
have tasted in a more personal and visual way than a simple
notes app.

Instead of only saving a name and rating, the app stores
structured tasting notes such as appearance, nose, palate,
sweetness, acidity, body, tannin, personal thoughts, mood tags,
photos, and favorite status.

The app includes both a frontend and backend:

- `client/` contains the React frontend built with Vite
- `server/` contains the Express backend and MongoDB
  models/routes/controllers

---

## Features

### Wine Management
- Create a completely new wine entry
- Save producer, country, region, grape, and vintage
- Select an existing wine when adding a new tasting

### Tasting Notes
- Add appearance, nose notes, and palate notes
- Save sweetness, acidity, body, tannin, and rating
- Add price and personal thoughts
- Mark whether the wine would be bought again
- Attach mood tags such as:
  - `date night`
  - `cozy night`
  - `girls night`
  - `celebration`
  - `weeknight`
  - `summer patio`

### Photo Upload
- Upload a photo for a tasting entry
- Preview the image before saving
- Display the saved image inside the tasting card

### Tasting Journal Interface
- View tastings in a timeline-style layout
- Edit existing tasting entries
- Delete tasting entries
- Display bottle-style rating graphics
- Highlight favorite wines in a “Favorites Shelf”

### Search and Filter
- Search by wine name, producer, grape, notes, thoughts,
  or mood tags
- Filter by minimum rating
- Filter by grape
- Show favorites only

### Extra UI Features
- Custom burgundy wine-inspired theme
- Rosé glass logo
- Save splash animation after creating or updating entries
- Cleanup tool for broken test entries

---

## Tech Stack

### Frontend
- React
- Vite
- CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### Other Tools
- Git
- GitHub

---

## Project Structure

```bash
sipLog/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── controllers/
│   │   ├── tastingController.js
│   │   └── wineController.js
│   ├── models/
│   │   ├── Tasting.js
│   │   ├── User.js
│   │   └── Wine.js
│   ├── routes/
│   │   ├── tastingRoutes.js
│   │   └── wineRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── README.md

### Data Model Summary
-----------------------
-Wine
Each wine entry stores:
name
producer
country
region
grape
vintage

-Tasting
Each tasting entry stores:
userId
wineId
appearance
noseNotes
palateNotes
sweetness
acidity
body
tannin
rating
price
wouldBuyAgain
moodTags
personalThoughts
imageUrl
tastedAt

API Routes
--------------
Tasting Routes:
GET /api/tastings
GET /api/tastings/:id
POST /api/tastings
PUT /api/tastings/:id
DELETE /api/tastings/:id

Wine Routes:
GET /api/wines
POST /api/wines

-Installation
--------------------------
1. Clone the repository
git clone (https://github.com/ayahassaad/sipLog)
cd sipLog

2. Install frontend dependencies
cd client
npm install

3. Install backend dependencies
cd ../server
npm install

4. Create the environment file
Inside the server folder, create a .env file:


mongodb+srv://ayah_se:<db_password>@siplog.bjyvxki.mongodb.net/?appName=sipLog

Running the Application
Start the backend
Open a terminal and run:

cd server
node server.js
If the backend is working correctly, you should see:

MongoDB connected
Server running on port 5001
Start the frontend
Open a second terminal and run:

cd client
npm run dev
Vite will start the frontend and show a local development URL
such as:

http://localhost:5173/
Open that URL in the browser.
