# Frontend — Game Portal

Next.js frontend for the gaming portal.

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL to your backend API URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. **Import** the repo in [Vercel](https://vercel.com/new)
2. **Environment variables** — add in Project Settings → Environment Variables:
   - `NEXT_PUBLIC_API_URL` — your backend API URL (e.g. `https://your-api.vercel.app` or `https://api.yourdomain.com`)
3. **Deploy** — Vercel auto-detects Next.js and uses the config in `vercel.json`

The app must connect to a running backend for data, admin, and real-time features.
