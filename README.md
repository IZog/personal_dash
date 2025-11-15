# Personal Systems Momentum Dashboard

This project is a single-page progressive dashboard that keeps five interconnected personal and business systems moving every day. The experience is optimised for quick daily check-ins, mobile responsiveness and motivating visual feedback.

## Features

- **Dashboard overview** with animated goal rings for weight and MRR, weekly momentum chart, pending habits and current focus block suggestions.
- **System 1 – Extraction to Delegation:** documentation capture, SOP tracker with progress bar, recording log with counts and delegation percentage tracker with trend chart.
- **System 2 – Body Recomposition:** weight logging with weekly average and chart, 16:8 fasting timer with streaks, camera friendly meal photo log and workout checklist with progressive overload notes.
- **System 3 – Revenue Multiplication:** template library, workshop pipeline, team training log and client win documentation with automatic case study counter.
- **System 4 – Energy Management:** meeting tracker with energy ratings, power hour timer/diary, focus time analyser and energy optimiser insight.
- **System 5 – Daily Compound Habits:** daily habit checklist with streaks, completion analytics, cumulative impact counters and Sunday planning space.
- **Strategic assistants** offering a CEO mode view, delegation suggestions, energy scheduling, compound effect projections and a daily quick win prompt.
- **Notification engine** that surfaces scheduled reminders for check-ins, power hour, documentation, evening wrap up and weekly planning.
- All data is stored in `localStorage`, giving an offline-first personal log that persists between sessions without any backend setup.

## Getting started

1. Clone the repository and move into the project folder.
   ```bash
   git clone <repo-url>
   cd personal_dash
   ```
2. Serve the site locally so that timers, notifications and camera uploads behave as they do in production. A helper `package.json` is included so you can simply run:
   ```bash
   npm run dev
   ```
   This command uses Python's built-in HTTP server underneath, so there is nothing to install beyond a working Python 3 runtime. Then visit [http://localhost:5173](http://localhost:5173) in a modern browser (Chrome, Edge, Safari or Firefox).
   > Prefer not to use npm? Run `python3 -m http.server 5173` yourself or open `index.html` directly in the browser. Just keep in mind that notifications, timers and media permissions behave more consistently when served via `http://`.
3. The interface is responsive. On mobile, add it to your home screen for an app-like feel.
4. Interact with the dashboard:
   - Log weights, MRR updates and daily habits to see goal rings animate.
   - Start/stop timers (fasting, power hour) and watch streaks update automatically.
   - Add SOPs, recordings, templates, meetings and more to feed the compound metrics and insights.

## Deployment

Because the project is a static site (HTML/CSS/JS only) you can host it on any static hosting provider. Below are three common
options:

### GitHub Pages (free, no extra tools)

1. Create a new GitHub repository and push this code to `main`.
2. In the repository settings, open **Pages** and set the source to `GitHub Actions` or the `main` branch with `/ (root)` folder.
3. Pages will build automatically and give you a URL like `https://<username>.github.io/<repo>/`.
4. Whenever you push new commits to `main`, the site redeploys automatically.

### Netlify (drag-and-drop or Git-connected)

1. Create a Netlify account (free tier works).
2. Choose **Add new site → Import an existing project** and connect your Git provider, or drag the project folder into the Netlify dashboard.
3. Use the default build command (none needed) and set the publish directory to the repo root.
4. Netlify will deploy in seconds and give you a customisable `.netlify.app` domain with HTTPS and preview deploys.

### Vercel (great for previews)

1. Install the Vercel CLI or use the dashboard to import the Git repository.
2. When asked for framework, choose **Other** (static) so no build step is executed.
3. Accept the defaults—Vercel will serve the root directory and assign a `.vercel.app` URL.
4. Each push to the tracked branch triggers automatic preview and production deployments.

> Tip: because the app relies on browser `localStorage`, no additional backend configuration is required on any host.

## Data model

The application initialises with sensible defaults and stores everything as a JSON payload under the key `personal-systems-tracker-v1`. If you ever want to reset progress, clear the key from browser dev tools or run `localStorage.clear()` in the console.

## Tech stack

- Static HTML, modern CSS (glassmorphism styling) and vanilla ES modules.
- [Chart.js](https://www.chartjs.org/) via CDN for all visualisations.
- No external dependencies or build tooling required.

## Project structure

```
├── index.html      # Application markup and layout
├── styles.css      # Styling, responsive rules and component design
└── app.js          # State management, event handling, charts and helpers
```

## Development tips

- The dashboard re-renders whenever state changes. Use the browser console to inspect `localStorage` for debugging.
- The code is organised by feature blocks (`renderX`, `drawX`, `buildX`). Search within `app.js` to extend or adjust behaviours.
- Because everything runs locally, you can version your personal data by exporting the storage value or by cloning the repo for different experiments.
