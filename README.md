# Flowdeck

A mobile-first **command deck for all your coding projects** — installable on iOS as a
PWA. Track each project's status, tasks and notes, jump straight into the work, and pull
live GitHub activity, all from your phone. Works offline.

> **Isolation:** Flowdeck lives on the `flowdeck` branch and deploys as its **own**
> Cloudflare Worker (`flowdeck-app`). The "Aminos & More" storefront lives on its own
> branch and its own worker — the two never share a deploy. Do not point the store's
> Cloudflare project at this branch.

## What it does

- **Home** — a daily overview: project counts, active projects, open tasks, and what's
  "in focus" across everything.
- **Projects** — cards with status (Active / In progress / Blocked / Idle / Done), tags,
  task progress and last-touched time. Filter by status.
- **Project detail** — set status, manage a task list (priority + done), keep freeform
  notes, and one-tap links to **Claude Code**, the repo, pull requests, issues, the live
  site and docs.
- **Quick capture** — a floating ＋ button to drop a task into any project (or the Inbox)
  in seconds.
- **GitHub (optional)** — add a personal access token to import your repositories and see
  live open-PR / open-issue / last-push activity per project.
- **Offline & installable** — a service worker caches the app shell; add it to your home
  screen and it runs full-screen with no network needed.

Everything is stored **locally on the device** (`localStorage`). Export / import JSON in
Settings to back up or move between devices. The GitHub token is stored only on the device
and is sent solely to `api.github.com`.

## Install on iPhone

1. Open the deployed URL in **Safari**.
2. Tap the **Share** icon → **Add to Home Screen**.
3. Launch it from the home screen — it runs standalone and works offline.

## Tech

No framework, no build step. Plain HTML/CSS/JS in [`public/`](public), served as static
assets by Cloudflare Workers.

```
public/
  index.html            app shell + iOS PWA meta
  styles.css            theme (dark/light), layout, components
  app.js                state, routing, views, GitHub integration
  sw.js                 service worker (offline app shell)
  manifest.webmanifest  PWA manifest
  icons/                generated app icons + favicon
```

## Develop locally

Any static file server works, e.g.:

```bash
npx serve public          # or: python3 -m http.server -d public 4173
```

Then open the URL. (A service worker requires `http://localhost` or HTTPS.)

## Deploy (Cloudflare)

Served as static assets — no build step. See [`wrangler.jsonc`](wrangler.jsonc).

```bash
npx wrangler deploy
```

Or connect the repo in the Cloudflare dashboard with **Root directory** `/` and an empty
build command. `not_found_handling: single-page-application` makes client-side routes and
deep links resolve to `index.html`.

## Regenerate icons

Icons are produced by a self-contained Node script (built-in `zlib` only):

```bash
node scripts/genicons.js public/icons
```
