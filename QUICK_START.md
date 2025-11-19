# Quick Start Guide

## 1. Set Up Sentry (Error Tracking)

### Quick Steps:
1. **Go to https://sentry.io** and create a free account
2. **Create a new project** → Select "React"
3. **Copy your DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)
4. **Create `.env` file** in `frontend` directory:
   ```bash
   cd frontend
   ```
   Create `.env` file with:
   ```
   VITE_SENTRY_DSN=https://your-dsn-here@xxxxx.ingest.sentry.io/xxxxx
   ```
5. **Restart your dev server**:
   ```bash
   npm run dev
   ```

✅ **Done!** Sentry will now track errors automatically.

---

## 2. Run Tests

### Quick Commands:
```bash
cd frontend

# Run all tests
npm test

# Run tests with UI (interactive)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### What to Expect:
- Tests will run and show results in terminal
- `test:ui` opens a browser interface at `http://localhost:51204/__vitest__/`
- `test:coverage` shows how much code is tested

✅ **Current tests**: Utility functions (cn, validators)

---

## 3. Test Accessibility

### Option A: Use Browser DevTools (Easiest)
1. **Open your app** in Chrome/Edge
2. **Press F12** to open DevTools
3. **Go to "Lighthouse" tab**
4. **Select "Accessibility"**
5. **Click "Analyze page load"**
6. **Review the score** and fix any issues

### Option B: Use Screen Reader (Most Accurate)

#### Windows (NVDA - Free):
1. **Download**: https://www.nvaccess.org/download/
2. **Install and start** NVDA
3. **Open your app** in browser
4. **Use keyboard**:
   - `Tab` - Navigate between elements
   - `Enter/Space` - Activate buttons
   - `Escape` - Close modals
5. **Listen** to what NVDA announces

#### macOS (VoiceOver - Built-in):
1. **Press `Command + F5`** to enable VoiceOver
2. **Open your app** in Safari
3. **Use VoiceOver commands**:
   - `Control + Option + Right Arrow` - Next element
   - `Control + Option + Space` - Activate
4. **Listen** to announcements

### Quick Accessibility Checklist:
- [ ] Can navigate entire app with keyboard only
- [ ] All buttons have labels (screen reader announces them)
- [ ] Images have alt text
- [ ] Modals announce when opened
- [ ] Focus indicators are visible

---

## Need More Details?

See the detailed guides:
- **SENTRY_SETUP.md** - Complete Sentry setup
- **TESTING_GUIDE.md** - Detailed testing instructions
- **ACCESSIBILITY_TESTING.md** - Complete accessibility guide

