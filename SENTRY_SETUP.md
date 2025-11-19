# Sentry Setup Guide

## Step 1: Create a Sentry Account
1. Go to https://sentry.io
2. Sign up for a free account (or sign in if you already have one)
3. Create a new project:
   - Click "Create Project"
   - Select "React" as the platform
   - Enter project name (e.g., "PhotoApp")
   - Click "Create Project"

## Step 2: Get Your DSN
1. After creating the project, Sentry will show you a DSN (Data Source Name)
2. It looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
3. Copy this DSN

## Step 3: Add DSN to Environment File
1. In your `frontend` directory, create or edit `.env` file:
   ```bash
   cd frontend
   ```

2. Add the DSN to `.env`:
   ```
   VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

3. **Important**: Never commit `.env` to git! It should already be in `.gitignore`

## Step 4: Restart Your Dev Server
After adding the DSN, restart your development server:
```bash
npm run dev
```

## Step 5: Test Sentry
1. Open your app in the browser
2. Open browser console (F12)
3. You should see: "Sentry initialized" (or similar)
4. To test error tracking, you can temporarily throw an error in your code

## Production Setup
For production, set the environment variable on your hosting platform:
- **Vercel**: Add in Project Settings → Environment Variables
- **Netlify**: Add in Site Settings → Environment Variables
- **Heroku**: Use `heroku config:set VITE_SENTRY_DSN=your-dsn`

