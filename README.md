# SubSense - Smart Subscription Tracker

Full-stack web app using:
- HTML, CSS, vanilla JavaScript frontend
- Node.js + Express backend
- MongoDB (Mongoose)

## Features
- Login/Sign Up with validation
- Protected routes + session persistence with JWT
- Dashboard metrics (monthly spend, renewals, active count, biggest spenders)
- Subscription CRUD with detail modal
- Auto plan pricing by service + plan + currency (USD/INR/AED)
- Calendar view of upcoming charges
- Insights with apply actions
- Reminders and notifications (upcoming + sent history)
- Settings with test notifications (email/SMS simulation)
- Profile editing, phone verification UI, delete account cascade
- CSV export
- Branding assets (favicon + horizontal logo)

## Setup
1. Install dependencies:
```bash
cd server
npm install
```
Optional (only if you want standalone static client server on port 3000):
```bash
cd ../clients
npm install
```
2. Start MongoDB locally (default used: `mongodb://127.0.0.1:27017/subsense`).
3. Configure env:
```bash
copy .env.example .env
```
4. Run server:
```bash
npm start
```
5. Open:
`http://localhost:5000`

## Root Scripts
From project root:
- `npm run dev` -> starts Express API + frontend (served by Express) with nodemon
- `npm run dev:server` -> same as above
- `npm run dev:client` -> serves only `clients/` on `http://localhost:3000` (expects API on `http://localhost:5000`)
- `npm start` -> production-style server start

## Notes
- SMS and Email delivery are Twilio-ready style UI flows, simulated in-app for v1.
- Phone verification returns a demo code in API response for local testing.
