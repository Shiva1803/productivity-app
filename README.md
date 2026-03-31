# Countdown Timer with Analytics

A clean, modular countdown timer application with daily usage tracking, analytics visualization, and **cloud sync via Supabase**.

## Features

- ⏱️ Countdown timer with customizable hours (1-1930 hours)
- 📊 Daily usage analytics with session tracking
- 📈 Visual chart representation using Chart.js
- 🌓 Light/Dark theme toggle
- ☁️ **Cloud sync with Supabase** - Access your data from any device
- 💾 Hybrid storage (localStorage + Supabase for reliability)
- 🗑️ Delete individual history entries

## Project Structure

```
├── index.html      # Main HTML structure
├── styles.css      # All styling and theme variables
├── config.js       # Supabase configuration
├── app.js          # Modular JavaScript (StorageModule, TimerModule, AnalyticsModule, ThemeModule)
├── vercel.json     # Vercel deployment configuration
├── .env.local      # Environment variables (DO NOT COMMIT)
└── README.md       # This file
```

## Supabase Integration

### Database Tables

The app uses 3 tables:
- `timer_states` - Stores timer state per user
- `analytics` - Stores daily usage history
- `theme_preferences` - Stores theme preference

### How It Works

- **Hybrid Storage**: Data saves to localStorage first (instant), then syncs to Supabase (cloud backup)
- **Multi-device**: Same user ID across devices = synced data
- **Offline-first**: Works without internet, syncs when online

## Local Development

Simply open `index.html` in a modern web browser. No build process required!

```bash
# Option 1: Open directly
open index.html

# Option 2: Use a local server (recommended)
python -m http.server 8000
# Then visit http://localhost:8000
```

## Deployment to Vercel

### Method 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

### Method 2: Vercel Dashboard

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Click "Deploy" (no configuration needed!)

### Method 3: Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

## localStorage Keys

The application uses the following localStorage keys:

- `timerState` - Stores timer state (totalSeconds, paused)
- `analytics` - Stores daily usage history
- `theme` - Stores theme preference ('light' or 'dark')

## Data Structures

### TimerState
```javascript
{
  totalSeconds: number,  // Remaining seconds
  paused: boolean        // Timer running state
}
```

### AnalyticsHistory
```javascript
{
  "YYYY-MM-DD": {
    timeSpent: number,   // Total seconds used
    sessions: number     // Number of sessions
  }
}
```

## Browser Compatibility

- Modern browsers with ES6+ support
- localStorage API required
- CSS custom properties support

## License

MIT
