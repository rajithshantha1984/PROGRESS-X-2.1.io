# PROGRESS - X 2.1 — Publish-ready edition

A static HTML/CSS/JavaScript task dashboard with animated UI, responsive layouts, a circular progress ring, task categories and priorities, due dates, local browser storage, JSON export, a custom X logo, and basic offline caching as a Progressive Web App (PWA).

## Files

- `index.html` — dashboard structure and metadata
- `style.css` — dark responsive UI and animations
- `script.js` — task logic, analytics, localStorage, JSON export, service-worker registration
- `manifest.webmanifest` — installable-app metadata
- `service-worker.js` — caches the static app shell for repeat/offline visits
- `progress-x-logo.png`, `progress-x-icon-192.png`, `progress-x-icon-512.png` — logo and app icons

## Test locally

1. Open this folder in VS Code.
2. Use Live Server or Live Preview to serve `index.html` (do not double-click the file if you want to test the PWA/offline support).
3. Add a few tasks, refresh, and confirm that tasks remain in the same browser.
4. Export tasks to JSON as a backup before testing Restart App.

## Publish online — easiest options

### Option A: GitHub Pages (free static hosting)

1. Sign in to GitHub and create a **new public repository**, for example `progress-x`.
2. Upload **all files in this folder** to the repository root. Keep the filenames and folder structure unchanged.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then save.
6. Wait for GitHub Pages to finish deploying. The Pages settings will show the public URL; open it and test the app.
7. If you update files later, commit/upload the changes and wait for the deployment to finish.

### Option B: Netlify (drag and drop)

1. Open Netlify and sign in.
2. Choose the option to add/deploy a site manually (wording can vary).
3. Drag the **whole project folder** (the folder containing `index.html`, `style.css`, `script.js`, and the manifest) into the deployment drop area.
4. Open the public URL Netlify gives you and test the app.
5. To update the site, deploy the updated folder again.

## Important storage note

This version uses `localStorage`. Tasks are saved only in the current browser profile on the current device and site origin. Publishing the app does **not** sync tasks between devices or different browsers. A different domain/URL has separate storage. Use **Export tasks (JSON)** to back up your tasks. If you need account login and cloud sync across devices, that requires a backend/database and authentication; this static version does not include those services.

## Offline note

The service worker can cache the static interface after the first successful visit. Service workers require HTTPS (provided by GitHub Pages/Netlify) or localhost. If you change static files and an older version appears, refresh after the browser updates the cache; for major changes, increment `CACHE_NAME` in `service-worker.js` (for example `progress-x-static-v2`).

## Before sharing publicly

- Test add/complete/delete/filter/export/restart and mobile layout.
- Remember that anyone with the public URL can open the app, but each visitor has their own browser-local task data.
- Do not enter sensitive or confidential information.
