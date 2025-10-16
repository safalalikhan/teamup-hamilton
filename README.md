# ⚽ TeamUp Hamilton:

**TeamUp Hamilton** is a smart football matchmaking and turf coordination web application designed for casual football players in Hamilton, New Zealand. The platform helps players find matches, form balanced teams, discover available turfs, and manage real-time logistics using live weather and travel data.

---

## 🚀 Features :

- ✅ Secure user authentication
- ✅ Player profiles with skill level and position preferences
- ✅ Weekly availability input
- ✅ Matchmaking engine
- ✅ Turf database with lighting, availability, and permission data
- ✅ Turf suggestion system (distance, weather, daylight)
- ✅ Travel time and departure planner (Google Distance Matrix API)
- ✅ Real-time weather and daylight check (OpenWeatherMap, Sunrise-Sunset API)
- ✅ Match dashboard with RSVP system
- ✅ Real-time chat room per match 
- ✅ Last-minute join feature for cancellations

---

## 🔮 Planned Future Features

- AI-powered team formation optimization
- Attendance prediction model
- Player rating system and scouting portal
- Match stats, leaderboards, and participation history
- Verified clubs & camp/training promotion
- Turf booking integration with councils
- Mobile app (React Native)
- Multi-sport support (cricket, badminton, basketball)

---

## 🛠 Tech Stack

| Layer      | Tech Stack                           |
|------------|---------------------------------------|
| Frontend   | React.js, Tailwind CSS                |
| Backend    | Node.js, Express.js                   |
| Database   | MongoDB Atlas, Mongoose               |
| Auth/Realtime | JWT Authentication, Realtime DB |
| APIs       | Google Maps, Distance Matrix, OpenWeatherMap, Sunrise-Sunset |
| Deployment | Vercel (frontend), Render (backend)   |
| Design     | Figma                                 |

---

## 🔧 Deploy & Debug

- Backend (Render)
  - Root: `backend`
  - Build: `npm install`
  - Start: `npm start`
  - Health: `/health`
  - Env: `MONGO_URI`, `MONGO_DB_NAME`, `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN=https://<your-netlify>.netlify.app`

- Frontend (Netlify)
  - Base: `frontend`
  - Build: `npm run build`
  - Publish: `dist`
  - Env: `VITE_API_URL=https://<your-render>.onrender.com`, `VITE_GOOGLE_MAPS_API_KEY=<key>`

- Debugging
  - Every response includes `X-Request-Id`. Use it to find the exact request in Render logs (morgan prints `rid=`).
  - CORS errors: ensure Netlify origin is listed in `CORS_ORIGIN` on Render.
  - Health: check `/health` returns `{ ok: true }` after deploy.
