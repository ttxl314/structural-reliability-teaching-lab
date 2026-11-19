/* ============================================================================
 * i18n.js — Chinese/English UI switching.
 *
 * The source strings stay Chinese; this layer translates:
 *   - DOM text nodes and title/placeholder/aria-label attributes
 *   - dynamically inserted DOM (MutationObserver)
 *   - Canvas fillText/strokeText labels (charts)
 *
 * Language resolution: ?lang=zh|en → localStorage → browser language.
 * Canvas redraw is requested through RL.Stations.refresh() after a switch.
 * ==========================================================================*/
(function (global) {
  'use strict';
  const RL = (global.RL = global.RL || {});
  const DATA = RL.I18N_DATA || { exact: {}, phrases: [] };
  const STORAGE = 'structural-reliability-lab.lang';
  const ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
  const textOrig = new WeakMap();
  const attrOrig = new WeakMap();
  const missingCanvas = new Set();
  let dict = DATA.exact || {};
  let phrases = (DATA.phrases || []).slice().sort((a, b) => b[0].length - a[0].length);
  let lang = 'zh';
  let observer = null;
  let applying = false;

  const hasCjk = (s) => /[\u3400-\u9fff\u3000-\u303f\uff00-\uffef]/.test(s || '');
  const PUNCT = {
    '，': ', ', '、': ', ', '；': '; ', '。': '. ', '：': ': ',
    '（': '(', '）': ')', '！': '! ', '？': '? ',
    '“': '"', '”': '"', '‘': "'", '’': "'",
  };
  function punctuation(s) {
    return s.replace(/[，、；。：（）！？“”‘’]/g, (c) => PUNCT[c] || c);
  }

  function translate(s) {
    if (lang !== 'en' || !s) return s;
    if (!hasCjk(s)) return s;
    if (Object.prototype.hasOwnProperty.call(dict, s)) return dict[s];
    let out = s;
    for (const p of phrases) {
      if (out.indexOf(p[0]) >= 0) out = out.split(p[0]).join(p[1]);
    }
    return punctuation(out);
  }

  function translatePreserve(s) {
    if (!s || !hasCjk(s)) return s;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    if (!m) return translate(s);
    return m[1] + translate(m[2]) + m[3];
  }

  function setOriginal(node) {
    if (!textOrig.has(node)) textOrig.set(node, node.nodeValue);
  }

  function translateTextNode(node) {
    if (!node || !node.parentNode) return;
    const tag = node.parentNode.nodeName;
    if (tag === 'SCRIPT' || tag === 'STYLE') return;
    if (node.parentNode.closest && node.parentNode.closest('#langToggle')) return;
    setOriginal(node);
    const src = textOrig.get(node);
    const out = lang === 'en' ? translatePreserve(src) : src;
    if (node.nodeValue !== out) {
      applying = true;
      node.nodeValue = out;
      applying = false;
    }
  }

  function translateElementAttributes(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.closest && el.closest('#langToggle')) return;
    let stash = attrOrig.get(el);
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      if (!stash) { stash = {}; attrOrig.set(el, stash); }
      if (!(a in stash)) stash[a] = el.getAttribute(a);
      const src = stash[a];
      const out = lang === 'en' ? translate(src) : src;
      if (el.getAttribute(a) !== out) {
        applying = true;
        el.setAttribute(a, out);
        applying = false;
      }
    }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { translateTextNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.nodeType === 1) translateElementAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    let n = walker.nextNode();
    while (n) {
      if (n.nodeType === 3) translateTextNode(n);
      else translateElementAttributes(n);
      n = walker.nextNode();
    }
  }

  function updateButton() {
    const b = document.getElementById('langToggle');
    if (!b) return;
    b.textContent = lang === 'zh' ? 'EN' : '中文';
    b.setAttribute('title', lang === 'zh' ? 'Switch to English' : '切换到中文');
    b.setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
  }

  function updateDocumentLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    const titleSrc = textOrig.get(document.querySelector('title')) ||
      document.querySelector('title')?.textContent || document.title;
    document.title = lang === 'en' ? translate(titleSrc) : titleSrc;
  }

  function ensureObserver() {
    if (observer) { observer.disconnect(); observer = null; }
    if (lang !== 'en' || typeof MutationObserver === 'undefined') return;
    observer = new MutationObserver((records) => {
      if (applying || lang !== 'en') return;
      for (const r of records) {
        if (r.type === 'childList') {
          for (const n of r.addedNodes) walk(n);
        } else if (r.type === 'characterData') {
          // JS may have rewritten the text in Chinese; remember it before translating.
          if (hasCjk(r.target.nodeValue)) {
            textOrig.set(r.target, r.target.nodeValue);
            translateTextNode(r.target);
          }
        } else if (r.type === 'attributes' && r.target) {
          translateElementAttributes(r.target);
        }
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function apply(redraw) {
    updateDocumentLang();
    if (lang === 'en') {
      walk(document.body);
      ensureObserver();
    } else {
      if (observer) { observer.disconnect(); observer = null; }
      walk(document.body); // restores Chinese originals stored in WeakMap
    }
    updateButton();
    if (redraw && RL.Stations && typeof RL.Stations.refresh === 'function') {
      try { RL.Stations.refresh(); } catch (e) { /* S not ready */ }
    }
  }

  function saveLang(l) {
    try { localStorage.setItem(STORAGE, l); } catch (e) { /* file:// */ }
    try {
      const u = new URL(location.href);
      if (l === 'zh') u.searchParams.delete('lang');
      else u.searchParams.set('lang', l);
      history.replaceState(null, '', u.toString());
    } catch (e) { /* file:// */ }
  }

  function setLang(l, opts) {
    l = l === 'en' ? 'en' : 'zh';
    const changed = l !== lang;
    lang = l;
    apply(opts && opts.redraw === false ? false : changed);
    if (!(opts && opts.silent)) saveLang(l);
  }

  function detectLang() {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q === 'en' || q === 'zh') return q;
    } catch (e) { /* ignore */ }
    try {
      const stored = localStorage.getItem(STORAGE);
      if (stored === 'en' || stored === 'zh') return stored;
    } catch (e) { /* ignore */ }
    const nav = (navigator.language || 'zh').toLowerCase();
    return nav.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function bind() {
    const b = document.getElementById('langToggle');
    if (b) b.addEventListener('click', () => setLang(lang === 'zh' ? 'en' : 'zh'));
  }

  // Canvas text translation. Installed before Charts is created.
  function patchCanvas() {
    if (!global.CanvasRenderingContext2D || global.CanvasRenderingContext2D.__rlI18n) return;
    const P = global.CanvasRenderingContext2D.prototype;
    const ft = P.fillText, st = P.strokeText;
    P.fillText = function (text, x, y, maxWidth) {
      const t = typeof text === 'string' ? translate(text) : text;
      if (lang === 'en' && typeof t === 'string' && hasCjk(t)) missingCanvas.add(t);
      return arguments.length > 3 ? ft.call(this, t, x, y, maxWidth) : ft.call(this, t, x, y);
    };
    P.strokeText = function (text, x, y, maxWidth) {
      const t = typeof text === 'string' ? translate(text) : text;
      return arguments.length > 3 ? st.call(this, t, x, y, maxWidth) : st.call(this, t, x, y);
    };
    global.CanvasRenderingContext2D.__rlI18n = true;
  }

  function init() {
    patchCanvas();
    // Keep the title original for restoring Chinese.
    const title = document.querySelector('title');
    if (title) textOrig.set(title, title.textContent);
    lang = detectLang();
    bind();
    apply(false);
  }

  function untranslated() {
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let n = w.nextNode();
    while (n) {
      if (hasCjk(n.nodeValue) && !/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)) out.push(n.nodeValue.trim());
      n = w.nextNode();
    }
    return Array.from(new Set(out)).filter(Boolean);
  }

  function untranslatedCanvas() {
    return Array.from(missingCanvas);
  }

  RL.I18N = {
    init, setLang, translate, untranslated, untranslatedCanvas,
    get lang() { return lang; },
    get hasData() { return Object.keys(dict).length > 0 || phrases.length > 0; },
  };
})(typeof window !== 'undefined' ? window : globalThis);
