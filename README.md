# Keziah's Whimsical Beginning Learning Hub - Website

Official website and enrollment records system for **Keziah's Whimsical Beginning Learning Hub**
(Nursery, Pre-Kindergarten and Kindergarten). Blue and gold theme, English interface.

Built with React, Vite, Tailwind CSS 4, React Router and Lucide icons (same stack as the NSTP system).

## Branches
- Timalan Balsahan Naic Branch (open)
- New Branch (soon to open)

## Run locally (Frontend + Backend + MySQL)
1. Ensure MySQL is running on `127.0.0.1:3306` and verify `server/.env` settings.
2. Install dependencies and initialize the MySQL database (`kwb_learning_hub`):
```bash
npm install
npm run db:init
```
3. Run both frontend (`http://localhost:3000`) and backend (`http://localhost:4000`):
```bash
npm run dev:all
```
Or run them in separate terminals (`npm run server` and `npm run dev`).
To open phpMyAdmin on `http://localhost:8080/index.php?route=/database/structure&db=kwb_learning_hub`, run:
```bash
npm run phpmyadmin
```

## Build
```bash
npm run build
```

## Edit school information
Open `src/lib/data.js` to change the contact details, branches, programs and values.
The phone number and email there are placeholders - replace them with the real ones.

## Staff area
Go to `/#/admin` (or click "Staff Login" in the footer).
Default account: `admin` / `kwb2024` (stored hashed in MySQL `admins` table; configure initial credentials in `server/.env`).

Enrollment inquiries are stored in the MySQL database `kwb_learning_hub` via the Express API (`server/index.js`).
Copy `server/.env.example` to `server/.env` and configure `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `PAYMENT_*` values to send live approval emails with payment instructions (otherwise email updates are recorded in the MySQL `email_logs` table).
