// embed.js - small embeddable notes widget
// Usage: createNotesWidget(selector, { storageKey })
(function (global) {
  const defaultCSS = `:host{font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial;color:#0f172a}
  .widget{background:#fff;border-radius:10px;padding:12px;box-shadow:0 6px 18px rgba(16,24,40,0.06);max-width:420px}
  .note-form{display:flex;gap:8px;margin-bottom:10px}
  input{flex:1;padding:8px;border:1px solid #e6e9ef;border-radius:8px}
  button{background:#2563eb;color:#fff;border:none;padding:8px 10px;border-radius:8px;cursor:pointer}
  ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
  li{background:#fbfdff;padding:8px;border-radius:8px;border:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center}
  .muted{color:#6b7280;font-size:0.95rem}
  `;

  function createShadowWidget(container, options = {}) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) {
      console.warn('createNotesWidget: container not found', container);
      return;
    }

    // Avoid double-init
    if (el.__notesWidget) return el.__notesWidget;

    const shadowHost = document.createElement('div');
    const shadow = shadowHost.attachShadow ? shadowHost.attachShadow({ mode: 'open' }) : shadowHost;

    const style = document.createElement('style');
    style.textContent = defaultCSS;
    shadow.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'widget';
    wrapper.innerHTML = `
      <form class="note-form" aria-label="Add note form">
        <input class="note-input" type="text" placeholder="Write a note..." />
        <button type="submit">Add</button>
      </form>
      <ul class="notes-list" aria-live="polite"></ul>
    `;
    shadow.appendChild(wrapper);
    el.appendChild(shadowHost);

    const storageKey = options.storageKey || 'simple-notes:embed:v1';
    const input = shadow.querySelector('.note-input');
    const form = shadow.querySelector('.note-form');
    const list = shadow.querySelector('.notes-list');

    function readNotes() {
      try {
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
    function writeNotes(notes) {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    }
    function render() {
      list.innerHTML = '';
      const notes = readNotes();
      if (notes.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'muted';
        empty.textContent = 'No notes yet — add one above.';
        list.appendChild(empty);
        return;
      }
      notes.forEach(n => {
        const li = document.createElement('li');
        li.textContent = n.text;
        const del = document.createElement('button');
        del.textContent = 'Delete';
        del.style.marginLeft = '12px';
        del.addEventListener('click', () => {
          const remaining = readNotes().filter(x => x.id !== n.id);
          writeNotes(remaining);
          render();
        });
        li.appendChild(del);
        list.appendChild(li);
      });
    }

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const notes = readNotes();
      notes.unshift({ id: Date.now().toString(), text });
      writeNotes(notes);
      input.value = '';
      render();
    });

    render();

    const widget = { el, shadowHost, render };
    el.__notesWidget = widget;
    return widget;
  }

  // Export to global
  global.createNotesWidget = createShadowWidget;
})(window);

(function () {
  function postHeight() {
    const height = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    window.parent?.postMessage({ type: "MICROAPP_HEIGHT", height }, "*");
  }

  window.addEventListener("load", postHeight);
  window.addEventListener("resize", postHeight);

  const obs = new MutationObserver(() => postHeight());
  obs.observe(document.body, { childList: true, subtree: true, attributes: true });

  setTimeout(postHeight, 250);
  setTimeout(postHeight, 1000);
})();
