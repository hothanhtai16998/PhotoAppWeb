# Setup Instructions

## 📋 Quick Setup Checklist

### 1. Sentry Setup (5 minutes)

**Step 1**: Go to https://sentry.io and sign up (free)

**Step 2**: Create a new project:
- Click "Create Project"
- Select "React"
- Name it "PhotoApp"
- Click "Create Project"

**Step 3**: Copy your DSN (it will be shown on the screen)

**Step 4**: Create `.env` file in `frontend` folder:
```bash
# In your terminal, navigate to frontend folder
cd frontend

# Create .env file (Windows PowerShell)
New-Item -Path .env -ItemType File

# Or create manually: create a new file named ".env" in frontend folder
```

**Step 5**: Add this line to `.env`:
```
VITE_SENTRY_DSN=https://your-dsn-here@xxxxx.ingest.sentry.io/xxxxx
```
(Replace with your actual DSN from Sentry)

**Step 6**: Restart your dev server:
```bash
npm run dev
```

✅ **Done!** Errors will now be tracked in Sentry.

---

### 2. Run Tests (2 minutes)

**Simple test run**:
```bash
cd frontend
npm test
```

**With interactive UI**:
```bash
npm run test:ui
```
This opens a browser window where you can see and run tests.

**With coverage report**:
```bash
npm run test:coverage
```

**What you'll see**:
- Tests passing ✅ or failing ❌
- Test execution time
- Coverage percentage

---

### 3. Test Accessibility (10-15 minutes)

#### Option 1: Browser DevTools (Easiest - 2 minutes)

1. Open your app in Chrome/Edge
2. Press `F12` (open DevTools)
3. Click "Lighthouse" tab
4. Check "Accessibility"
5. Click "Analyze page load"
6. Review the score (aim for 90+)

#### Option 2: Screen Reader (Most Accurate - 10 minutes)

**For Windows**:
1. Download NVDA (free): https://www.nvaccess.org/download/
2. Install and start NVDA
3. Open your PhotoApp
4. Use keyboard:
   - `Tab` = Move between buttons/links
   - `Enter` = Click button
   - `Escape` = Close modal
   - `Arrow keys` = Navigate images
5. Listen to what NVDA says - it should describe everything

**For macOS**:
1. Press `Command + F5` to enable VoiceOver
2. Open your PhotoApp in Safari
3. Use VoiceOver:
   - `Control + Option + Right Arrow` = Next element
   - `Control + Option + Space` = Activate
4. Listen to announcements

#### Quick Keyboard Test:
1. Open your app
2. Don't use mouse - only keyboard
3. Press `Tab` repeatedly - should move through all buttons
4. Press `Enter` on buttons - should work
5. Press `Escape` - should close modals
6. Use arrow keys in image grid - should navigate

✅ **If you can use the entire app with keyboard only, it's accessible!**

---

## 📁 Files Created

I've created these guide files for you:
- **QUICK_START.md** - Quick reference
- **SENTRY_SETUP.md** - Detailed Sentry guide
- **TESTING_GUIDE.md** - Detailed testing guide
- **ACCESSIBILITY_TESTING.md** - Complete accessibility guide

---

## 🎯 Quick Commands Reference

```bash
# Sentry: Create .env file
cd frontend
# Then create .env file manually and add: VITE_SENTRY_DSN=your-dsn

# Tests
npm test              # Run tests
npm run test:ui       # Interactive test UI
npm run test:coverage # Coverage report

# Dev server (restart after adding .env)
npm run dev
```

---

## ❓ Troubleshooting

**Sentry not working?**
- Check `.env` file exists in `frontend` folder
- Check DSN is correct (starts with `https://`)
- Restart dev server after adding DSN
- Check browser console for errors

**Tests not running?**
- Make sure you're in `frontend` directory
- Run `npm install` if packages are missing
- Check that `vitest` is installed

**Accessibility issues?**
- Use browser DevTools Lighthouse first
- Check that all buttons have labels
- Verify keyboard navigation works
- Test with screen reader for best results

