# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A dependency-free, static micro-app that displays the 5 most recent Letterboxd film entries for a specific user. It is designed to be embedded as an iframe inside a Framer site. There is no build step, no package manager, and no test suite.

## Development

Open `index.html` directly in a browser to view the widget. Because `app.js` fetches `feed.json` via `fetch()`, you need a local HTTP server to avoid CORS issues with `file://` URLs:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

To regenerate `feed.json` locally (requires network access to letterboxd.com):

```bash
python3 update_feed.py
```

## Architecture

### Data flow

1. A GitHub Actions workflow (`.github/workflows/update_feed.yml`) runs `update_feed.py` every 6 hours and commits the result as `feed.json`.
2. `app.js` fetches `./feed.json` at page load (`cache: "no-store"`) and renders the items.
3. The page is served statically via GitHub Pages (root of `main`).

### File roles

- **`update_feed.py`** — fetches `https://letterboxd.com/jongoldman/rss/`, parses the first 5 `<item>` elements, extracts title/year/star-rating/link, and writes `feed.json`. The RSS title format expected is `"Film Name, YYYY - ★★★"`.
- **`feed.json`** — the only data file; committed by CI, read by `app.js`. Changing the shape of its objects requires updating both `update_feed.py` and `app.js`.
- **`app.js`** — plain ES module (no bundler). Queries DOM elements by id/class on load, then calls `loadFeed()`. Filtering is client-side text search over `title + year`.
- **`embed.js`** — a separate, self-contained IIFE that exposes `createNotesWidget(selector, options)` globally. It mounts a Shadow DOM widget for notes stored in `localStorage`. It also contains a second IIFE that posts the page's scroll height to the parent frame via `postMessage` (type `MICROAPP_HEIGHT`) — this is what makes iframe auto-resizing work in Framer.
- **`styles.css`** — styles for `index.html` only. `embed.js` inlines its own CSS string inside the Shadow DOM, so changes to `styles.css` do not affect the embedded notes widget.

### Framer iframe integration

`embed.js` periodically calls `window.parent.postMessage({ type: "MICROAPP_HEIGHT", height }, "*")` on load, resize, and DOM mutations. The host Framer page is expected to listen for this message and resize the iframe accordingly. `background-color: transparent` in `styles.css` allows the iframe to blend into the Framer canvas.

## Key conventions

- **Letterboxd handle**: hardcoded as `jongoldman` in `update_feed.py` (RSS URL) and `index.html` (footer link). Change both when adapting for a different user.
- **Item cap**: `MAX_ITEMS = 5` in `app.js` limits rendered results; `update_feed.py` also slices `[:5]` from the RSS feed. These are independent caps.
- **Star ratings**: stored as Unicode characters (`★`, `☆`, `½`) parsed from the RSS `<title>` field by `update_feed.py`. The regex `([★☆½]+)$` is what extracts them.
- **localStorage key**: the notes widget in `embed.js` defaults to `simple-notes:embed:v1`; pass `storageKey` in options to override.
- **No module system in `app.js`**: it is loaded as a plain `<script>` (not `type="module"`), so it uses direct DOM globals rather than imports.

## Shipping a new experiment

1. Duplicate this repo ("Use as template").
2. Update the title/subtitle in `index.html` and the Letterboxd handle in `update_feed.py` + `index.html`.
3. Modify data shape or display logic in `app.js`.
4. Commit and push.
5. Enable GitHub Pages on `main` / root.
6. Paste the Pages URL into Framer as an iframe embed.
