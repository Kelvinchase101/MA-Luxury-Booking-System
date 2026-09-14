# MA Luxury Booking System

React + Vite booking/admin dashboard for MA Luxury Apartments. The existing UI/design is preserved.

## Google Sheets backend

The project includes `google-apps-script.gs`, which turns a Google Sheet into the backend API.

### 1. Create the Google Sheet

Create a new Google Sheet, then open **Extensions → Apps Script**.

Copy the complete contents of `google-apps-script.gs` into the Apps Script editor and save.

### 2. Deploy the backend

In Apps Script:

1. Click **Deploy → New deployment**.
2. Select **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Deploy and authorize the script if Google asks.
6. Copy the Web App URL ending in `/exec`.

The script automatically creates these tabs:

- `Bookings`
- `Blocks`
- `Settings`

### 3. Connect the website

You have two options.

**Option A, easiest:**

Open the deployed MA Luxury app → Admin Dashboard → Settings → Google Sheets sync. Paste the Apps Script `/exec` URL and save.

**Option B, recommended for production:**

Set this environment variable in Vercel or Netlify:

`VITE_GOOGLE_SHEETS_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`

Then redeploy.

### 4. What is stored

Bookings, maintenance blocks, and settings are synchronized with Google Sheets. The browser also keeps a local cache so the app can still display previously loaded data if the Sheet API is temporarily unavailable.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production output is `dist/`.

## Deploy to Vercel

Import this project/repository into Vercel. Vercel detects Vite automatically.

If using the environment-variable option, add `VITE_GOOGLE_SHEETS_API_URL` under Project Settings → Environment Variables, then redeploy.

## Deploy to Netlify

- Build command: `npm run build`
- Publish directory: `dist`

If using the environment-variable option, add `VITE_GOOGLE_SHEETS_API_URL` under Site configuration → Environment variables, then redeploy.

## Important

Google Sheets is being used as a lightweight backend. It is suitable for this type of booking dashboard, but it is not equivalent to a full database such as Supabase or PostgreSQL for high-volume, highly concurrent workloads.
