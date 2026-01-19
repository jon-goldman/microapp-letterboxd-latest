# Simple Notes Widget

A tiny client-side notes widget that persists to `localStorage`. This repo includes:

- `index.html` — example page that uses the widget.
- `styles.css` — styles for the example page and widget.
- `app.js` — module-driven widget for the example page.
- `embed.js` — small embeddable script to initialize the widget on other pages.
- `README.md` — this file.

## Usage

Open `index.html` in a browser to see the widget in action.

Notes are stored locally in `localStorage` under the key `simple-notes:v1`.

## Embedding on another site

1. Include `embed.js` on the host page:
   ```html
   <script src="embed.js" defer></script>
   ```
2. Add a container element where you want the widget:
   ```html
   <div id="my-notes"></div>
   ```
3. Create the widget:
   ```html
   <script>
     // after embed.js has loaded
     createNotesWidget('#my-notes', { storageKey: 'site-a-notes' });
   </script>
   ```

`createNotesWidget(selector, options)` will attach a shadow-root-hosted widget to the container to avoid style collisions. See `embed.js` for available options.

## Development

- Edit `app.js` and `styles.css` for changes to the primary widget.
- The repository is intentionally small and dependency-free.

## License

Choose and add a license if you plan to publish this project.


## Ship a new experiment (checklist)
1) Duplicate this repo (Use as template).
2) Rename title + subtitle in index.html.
3) Update DATA or logic in app.js.
4) Commit + push.
5) Settings → Pages → main / root.
6) Copy URL into Framer Entry + embed iframe.
