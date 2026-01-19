// Letterboxd "Latest Activity" micro-app
// Uses RSS -> JSON because Letterboxd RSS usually can't be fetched directly in browser JS (CORS).
// RSS URL pattern: https://letterboxd.com/<username>/rss/

const USERNAME = "jongoldman";
const RSS_URL = `https://letterboxd.com/${USERNAME}/rss/`;

// Alternative RSS -> JSON that doesn't require an API key:
const FEED2JSON = "https://www.toptal.com/developers/feed2json/convert?url=";

const MAX_ITEMS = 5;

const els = {
  q: document.getElementById("q"),
  status: document.getElementById("status"),
  results: document.getElementById("results"),
  empty: document.getElementById("empty"),
  pills: Array.from(document.querySelectorAll(".pill")),
  openStandalone: document.getElementById("openStandalone"),
};

let filter = "all"; // we’ll interpret as: all = everything, project = watched, note = reviews (light heuristic)
let DATA = [];

function inIframe() {
  try { return window.self !== window.top; } catch { return true; }
}

function normalizeTitle(raw) {
  // Letterboxd RSS titles often look like: "Film Title, 2024 - ★★★½"
  // We'll try to extract: title + year
  const t = (raw || "").trim();
  const yearMatch = t.match(/,\s(19|20)\d{2}/);
  const year = yearMatch ? yearMatch[0].replace(",", "").trim() : "";
  const title = yearMatch ? t.slice(0, yearMatch.index).trim() : t;
  return { title, year };
}

function extractRating(raw) {
  // Grab stars if present (e.g. ★★★½) or similar
  const m = (raw || "").match(/(★+½?|★+|½★)/);
  return m ? m[0] : "";
}

function render(items) {
  els.results.innerHTML = "";
  if (items.length === 0) {
    els.results.hidden = true;
    els.empty.hidden = false;
    els.status.textContent = "0 results";
    window.dispatchEvent(new Event("resize"));
    return;
  }

  els.empty.hidden = true;
  els.results.hidden = false;
  els.status.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;

  for (const it of items) {
    const li = document.createElement("li");
    li.className = "item";
    const a = it.link ? `<a class="link" href="${it.link}" target="_blank" rel="noopener noreferrer">open</a>` : "";
    li.innerHTML = `
      <p class="itemTitle">${it.title}${it.year ? ` <span style="color:#5a5a5a;font-weight:400;">(${it.year})</span>` : ""}</p>
      <p class="itemMeta">${it.kind}${it.rating ? ` · ${it.rating}` : ""}${it.date ? ` · ${it.date}` : ""} ${a ? ` · ${a}` : ""}</p>
    `;
    els.results.appendChild(li);
  }

  window.dispatchEvent(new Event("resize"));
}

function apply() {
  const q = (els.q.value || "").trim().toLowerCase();
  let items = DATA;

  if (filter === "project") items = items.filter(d => d.kind.toLowerCase().includes("watched"));
  if (filter === "note") items = items.filter(d => d.kind.toLowerCase().includes("review"));

  if (q) {
    items = items.filter(d =>
      `${d.title} ${d.year} ${d.kind}`.toLowerCase().includes(q)
    );
  }

  render(items.slice(0, MAX_ITEMS));
}

function setFilter(next) {
  filter = next;
  els.pills.forEach(p => p.classList.toggle("is-active", p.dataset.filter === next));
  apply();
}

async function loadFeed() {
  els.status.textContent = "Loading…";

  const url = `${FEED2JSON}${encodeURIComponent(RSS_URL)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Feed request failed (${res.status})`);

  const json = await res.json();

  // feed2json returns JSONFeed-ish structure: { items: [...] }
  const items = (json.items || []).slice(0, MAX_ITEMS).map((it) => {
    const rawTitle = it.title || "";
    const { title, year } = normalizeTitle(rawTitle);
    const rating = extractRating(rawTitle);

    const date = it.date_published
      ? new Date(it.date_published).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

    // Try to infer kind from tags if present; otherwise keep it simple
    const kind = (it.tags && it.tags.length) ? it.tags[0] : "Watched";

    return {
      title,
      year,
      rating,
      kind,
      date,
      link: it.url || it.external_url || "",
    };
  });

  DATA = items;

  els.status.textContent = "Ready";
  apply();
}

// Init UI
els.status.textContent = "Ready";
els.q.addEventListener("input", apply);
els.pills.forEach(p => p.addEventListener("click", () => setFilter(p.dataset.filter)));

els.openStandalone.addEventListener("click", (e) => {
  e.preventDefault();
  window.open(window.location.href, "_blank", "noopener,noreferrer");
});

// Embedded-mode nicety: rename UI a bit if inside iframe
if (inIframe()) {
  document.documentElement.classList.add("embedded");
}

// Load
loadFeed().catch((err) => {
  console.error(err);
  els.status.textContent = "Couldn’t load Letterboxd right now.";
  els.results.hidden = true;
  els.empty.hidden = false;
  els.empty.textContent = "Try opening standalone
