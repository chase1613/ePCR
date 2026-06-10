# ePCR System — Turnover Guide
## Civil Service Commission Region VI

---

## Overview
The ePCR (Electronic Performance Commitment and Review) system is a web-based application
for managing Individual Performance Commitment Reviews (IPCR) for CSC Region VI employees.

| Layer      | Technology            | Hosting  |
|------------|-----------------------|----------|
| Frontend   | React + Vite          | Vercel   |
| Backend    | Node.js + Express     | Render   |
| Database   | Supabase (PostgreSQL) | Supabase |
| Email      | Resend                | Resend   |
| Monitoring | Sentry                | Sentry   |

---

## STEP 1 — Create a Supabase Account (Database)

Supabase is where all the system data is stored (users, PCRs, pillars, divisions).

1. Go to https://supabase.com and click **Start your project**
2. Sign up using a Google account or email
3. Click **New Project** and fill in:
   - **Organization:** Create new (e.g. CSC Region VI)
   - **Project Name:** epcr-csc-region6
   - **Database Password:** Set a strong password and **save it somewhere safe**
   - **Region:** Southeast Asia (Singapore)
4. Wait for the project to finish setting up (~2 minutes)
5. Once ready, go to **Project Settings → API** and copy:
   - **Project URL** → this will be your `SUPABASE_URL`
   - **anon / public key** → this will be your `SUPABASE_KEY`
6. Save both values — you will need them in STEP 4

### Run the Database Migration Scripts (in order)
1. Go to **Supabase → SQL Editor**
2. Run each file in the `/databases` folder **IN ORDER**:
   - Copy the full contents of `01_create_users.sql` → paste into SQL Editor → click **Run**
   - Copy the full contents of `02_create_pillars.sql` → paste into SQL Editor → click **Run**
   - Copy the full contents of `03_create_divisions.sql` → paste into SQL Editor → click **Run**
   - Copy the full contents of `04_create_pcr.sql` → paste into SQL Editor → click **Run**
3. Go to **Table Editor** to confirm all 4 tables were created:
   - ✓ users
   - ✓ pillars
   - ✓ divisions
   - ✓ pcr

---

## STEP 2 — Create a Resend Account (Email Service)

Resend is used for sending OTP emails for the Forgot Password feature.

1. Go to https://resend.com and click **Sign Up**
2. Verify your email address
3. Go to **API Keys → Create API Key**:
   - **Name:** ePCR CSC Region VI
   - **Permission:** Full Access
4. Copy the API key → this will be your `RESEND_API_KEY`
5. Go to **Domains → Add Domain**:
   - Add your official CSC email domain (e.g. `csc.gov.ph`)
   - Follow the DNS verification steps provided by Resend
   - Once verified, update the sender email in the backend:
     Open `controllers/forgotPasswordController.js` and update:
     ```
     from: 'no-reply@csc.gov.ph'
     ```

---

## STEP 3 — Create a Sentry Account (Error Monitoring)

Sentry is used for monitoring and tracking errors in the system.

1. Go to https://sentry.io and click **Get Started**
2. Sign up using a Google account or email
3. Create a new Organization:
   - **Name:** CSC Region VI
4. Create two Projects:

   **For the Frontend:**
   - Click **Create Project**
   - Select **React** as the platform
   - Name it: `epcr-frontend`
   - Copy the **DSN** → this will be your `VITE_SENTRY_DSN`

   **For the Backend:**
   - Click **Create Project**
   - Select **Node.js** as the platform
   - Name it: `epcr-backend`
   - Copy the **DSN** → this will be your `SENTRY_DSN`

---

## STEP 4 — Set Up Environment Variables

### Backend — create a `.env` file inside the `/server` folder:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=any_long_random_string_here
JWT_EXPIRES_IN=8h
RESEND_API_KEY=your_resend_api_key
PORT=5000
```

### Frontend — create a `.env` file inside the `/client` folder:
```
VITE_API_URL=your_backend_render_url
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SENTRY_DSN=your_frontend_sentry_dsn
VITE_SENTRY_ENV=
VITE_APP_VERSION=1.0.0
```

> ⚠️ Never share or commit `.env` files to GitHub.

---

## STEP 5 — Install Dependencies

Open a terminal and run the following:

### Backend:
```
cd server
npm install
```

### Frontend:
```
cd epcr-app
npm install
```

---

## STEP 6 — Seed the Admin Account

1. Make sure your backend `.env` file is set up correctly (STEP 4)
2. Open a terminal inside the `/server` folder
3. Run:
```
npm run seed
```
4. You should see:
```
✅ Admin account created successfully!
📧 Email:    admin@csc.gov.ph
🔑 Password: LingkodBayan!
```

> ⚠️ If it says "Admin already exists, skipping seed." that means
> the admin account is already in the database — this is fine.

---

## STEP 7 — Deploy the System

### Backend (Render)
1. Go to https://render.com and sign up
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Fill in:
   - **Name:** epcr-backend
   - **Root Directory:** server
   - **Branch:** main
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Go to **Environment** tab and add all variables from your backend `.env`
6. Click **Deploy** and wait for it to finish
7. Copy the generated URL (e.g. `https://epcr-backend.onrender.com`)
   → this is your `VITE_API_URL` for the frontend

### Frontend (Vercel)
1. Go to https://vercel.com and sign up
2. Click **Add New → Project**
3. Connect your GitHub repository
4. Fill in:
   - **Root Directory:** client
   - **Framework Preset:** Vite
5. Go to **Environment Variables** and add all variables
   from your frontend `.env`
6. Click **Deploy** and wait for it to finish
7. Copy the generated URL → this is your live system URL

---

## STEP 8 — First Login and Password Change

1. Open the live system URL
2. Log in with the default admin credentials:
   - **Email:**    admin@csc.gov.ph
   - **Password:** LingkodBayan!
3. Go to **Manage Users → 🔑 Change Password**
4. Set a new strong password immediately
5. ⚠️ Do not share the new password with unauthorized personnel

---

## Default Admin Credentials
```
Email:    admin@csc.gov.ph
Password: LingkodBayan!
```
> ⚠️ IMPORTANT: Change the password immediately after first login!

---

## Folder Structure
```
epcr-app/
  src/         ← React + Vite frontend
  server/         ← Node.js + Express backend
    config/
    controllers/
    databases/    ← SQL migration scripts
    middleware/
    routes/
    utils/
    index.js
    package.json
    TURNOVER.md
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Dropdown names not showing | Check if users are set to `is_active = true` in Supabase |
| Cannot log in | Check if `.env` credentials are correct |
| Emails not sending | Check Resend API key and domain verification |
| Database tables missing | Re-run the SQL migration scripts in order |
| Backend not starting | Run `npm install` first, then check `.env` file |
Forgot Password OTP not sendingDomain csc.gov.ph not yet verified in Resend — see Limitations above

---

## Support
For technical issues, contact the system developer:
- **Developer:** Carl Emmanuel C. Pacardo
- **Email:** carlpacardo16@gmail.com
- **System:** ePCR — Electronic Performance Commitment and Review
- **Agency:** Civil Service Commission Region VI
