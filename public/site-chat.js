/**
 * site-chat.js — Claude-powered site assistant.
 *
 * REPLACES the current cross-site footer. Each site loads this with a
 * site-specific config that defines persona, knowledge base URL, and
 * suggested questions. Backend endpoint must accept POST {messages, config}
 * and stream Anthropic API responses.
 *
 * Drop-in usage on any site:
 *   <script src="/site-chat.js" data-config="/site-chat.config.json"></script>
 *
 * Backend (separate): a single Cloudflare Worker / Vercel Function at
 *   /api/site-chat that proxies to Anthropic's Messages API with the
 *   per-site system prompt + retrieved context (RAG).
 */
(function () {
  const SCRIPT = document.currentScript;
  const CONFIG_URL = SCRIPT.dataset.config || '/site-chat.config.json';
  const ENDPOINT   = SCRIPT.dataset.endpoint || '/api/site-chat';

  const styles = `
    .sc-fab {
      position: fixed; right: 22px; bottom: 22px; z-index: 9999;
      background: #C24D33; color: #F4ECDB; border: none; cursor: pointer;
      width: 56px; height: 56px; border-radius: 50%;
      box-shadow: 0 4px 18px rgba(18,14,8,0.18);
      font-family: 'JetBrains Mono', Menlo, monospace; font-size: 20px;
      transition: transform 0.15s;
    }
    .sc-fab:hover { transform: scale(1.06); }
    .sc-panel {
      position: fixed; right: 22px; bottom: 90px; z-index: 9998;
      width: min(420px, calc(100vw - 44px));
      height: min(560px, calc(100vh - 132px));
      background: #F4ECDB; border: 1px solid #120E08;
      box-shadow: 0 10px 40px rgba(18,14,8,0.2);
      display: none; flex-direction: column; overflow: hidden;
      font-family: 'Newsreader', Georgia, serif;
    }
    .sc-panel.open { display: flex; }
    .sc-head {
      padding: 14px 18px; border-bottom: 1px solid rgba(18,14,8,0.12);
      display: flex; justify-content: space-between; align-items: center;
    }
    .sc-head .ttl { font-size: 16px; font-weight: 600; color: #120E08; }
    .sc-head .sub { font-family: 'JetBrains Mono', monospace; font-size: 10px;
                    color: #8B7E68; letter-spacing: 0.12em; text-transform: uppercase; }
    .sc-close { background: none; border: none; font-size: 22px; cursor: pointer; color: #6B5F4E; }
    .sc-msgs  { flex: 1; overflow-y: auto; padding: 14px 18px; }
    .sc-msg   { margin-bottom: 14px; line-height: 1.4; font-size: 15px; }
    .sc-msg.user { color: #120E08; font-style: italic; padding-left: 14px; border-left: 2px solid #C24D33; }
    .sc-msg.bot  { color: #3D2F22; }
    .sc-msg.bot .src { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #8B7E68; margin-top: 6px; display: block; }
    .sc-suggest { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 18px; }
    .sc-suggest button {
      background: transparent; border: 1px solid rgba(18,14,8,0.2);
      padding: 6px 10px; font-family: 'JetBrains Mono', monospace; font-size: 10px;
      color: #6B5F4E; cursor: pointer; letter-spacing: 0.05em;
    }
    .sc-suggest button:hover { border-color: #C24D33; color: #C24D33; }
    .sc-form {
      display: flex; gap: 8px; padding: 12px 18px;
      border-top: 1px solid rgba(18,14,8,0.12);
    }
    .sc-form input {
      flex: 1; border: none; background: transparent; outline: none;
      font-family: 'Newsreader', Georgia, serif; font-size: 15px; color: #120E08;
    }
    .sc-form button {
      background: #C24D33; color: #F4ECDB; border: none; padding: 8px 14px;
      cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 11px;
      letter-spacing: 0.1em; text-transform: uppercase;
    }
  `;

  const style = document.createElement('style');
  style.textContent = styles;
  document.head.appendChild(style);

  let config = null;
  let history = [];

  fetch(CONFIG_URL).then(r => r.json()).then(c => { config = c; mount(); }).catch(() => {
    config = { persona: 'Site Assistant', greeting: 'Hi. Ask me anything about this site.', suggested: [] };
    mount();
  });

  function mount() {
    // Remove existing footer iframes/widgets if present (replaces v11 footer)
    document.querySelectorAll('[data-harness-footer]').forEach(n => n.remove());

    const fab = document.createElement('button');
    fab.className = 'sc-fab'; fab.textContent = '✦';
    fab.setAttribute('aria-label', 'Open site assistant');

    const panel = document.createElement('div');
    panel.className = 'sc-panel';
    panel.innerHTML = `
      <div class="sc-head">
        <div>
          <div class="ttl">${config.persona || 'Site Assistant'}</div>
          <div class="sub">${config.brand || 'site'} · powered by Claude</div>
        </div>
        <button class="sc-close" aria-label="Close">×</button>
      </div>
      <div class="sc-msgs"></div>
      <div class="sc-suggest"></div>
      <form class="sc-form">
        <input type="text" placeholder="Ask anything about ${config.brand || 'this site'}..." aria-label="Message" />
        <button type="submit">Send</button>
      </form>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    const msgs = panel.querySelector('.sc-msgs');
    const sug  = panel.querySelector('.sc-suggest');
    const form = panel.querySelector('.sc-form');
    const input = form.querySelector('input');

    fab.onclick = () => {
      panel.classList.toggle('open');
      if (panel.classList.contains('open') && msgs.children.length === 0) {
        addMsg('bot', config.greeting || 'Hi.');
      }
    };
    panel.querySelector('.sc-close').onclick = () => panel.classList.remove('open');

    (config.suggested || []).forEach(q => {
      const b = document.createElement('button');
      b.textContent = q; b.onclick = () => { input.value = q; form.dispatchEvent(new Event('submit')); };
      sug.appendChild(b);
    });

    function addMsg(role, text, sources) {
      const div = document.createElement('div');
      div.className = `sc-msg ${role}`;
      div.textContent = text;
      if (sources && sources.length) {
        const s = document.createElement('span');
        s.className = 'src';
        s.textContent = 'sources: ' + sources.join(' · ');
        div.appendChild(s);
      }
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }

    form.onsubmit = async (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      input.value = '';
      addMsg('user', q);
      history.push({ role: 'user', content: q });

      const placeholder = document.createElement('div');
      placeholder.className = 'sc-msg bot'; placeholder.textContent = '...';
      msgs.appendChild(placeholder);

      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, config: config })
        });
        const data = await res.json();
        placeholder.remove();
        addMsg('bot', data.reply || '...', data.sources);
        history.push({ role: 'assistant', content: data.reply });
      } catch (err) {
        placeholder.textContent = 'Error reaching assistant. Try again or email ' + (config.fallback_email || 'us') + '.';
      }
    };
  }
})();
