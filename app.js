/* ============================================================
   Gloss 词下 · 交互层
   核心：逐词语境释义 → 点词看义项 → 接触 3 次升级为英文 → 6 次隐去
   ============================================================ */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const MASTER_AT = 3;   // 圆点满 3 → 英文近义词
  const FREE_AT = 6;     // 6 次 → 无标注
  const STORE = 'gloss.v1';

  const ICON = {
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.2"/><path d="m16 16 4 4"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.4"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="10" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3L11.5 6v12L7 14.5H4z"/><path d="M15 9.2a4.4 4.4 0 0 1 0 5.6"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 5 7 7-7 7"/></svg>'
  };

  /* ---------------- 音标 / 朗读 / 词根 ---------------- */
  function phonOf(k, w) {
    const curated = w && w.phon ? String(w.phon).replace(/^\/|\/$/g, '') : '';
    if (curated) return curated;
    if (typeof PHONETICS !== 'undefined') {
      const key = (w && w.lemma ? w.lemma : k || '').toLowerCase();
      const p = PHONETICS[k] || PHONETICS[key] || '';
      if (p) return p;
    }
    return '';
  }

  // 词根：长变体优先（station → stat 而不是 sta）
  function rootInfo(word) {
    if (typeof ROOTS === 'undefined' || !word) return null;
    const w = String(word).toLowerCase().replace(/[^a-z'-]/g, '');
    if (!w) return null;
    let id = ROOTS.words[w];
    if (!id) {
      const cands = [w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/ed$/, ''), w.replace(/ing$/, ''), w.replace(/e$/, '')];
      for (const c of cands) { if (ROOTS.words[c]) { id = ROOTS.words[c]; break; } }
    }
    if (!id) return null;
    const [variants, meaning, kind] = ROOTS.roots[id];
    const hits = variants.filter((v) => v.length > 1 && w.indexOf(v) >= 0).sort((a, b) => b.length - a.length);
    const hit = hits[0] || variants[0];
    const show = kind === '后缀' ? '-' + hit : kind === '前缀' ? hit + '-' : hit;
    return { root: show, meaning, kind };
  }

  function rootLine(word) {
    const r = rootInfo(word);
    if (!r) return '';
    return `<div class="root-line"><span class="root-kind">${r.kind}</span><b>${esc(r.root)}</b><span class="root-mean">${esc(r.meaning)}</span></div>`;
  }

  function say(text) {
    try {
      if (!('speechSynthesis' in window) || !text) return;
      const u = new SpeechSynthesisUtterance(String(text).replace(/[^A-Za-z' -]/g, ''));
      u.lang = 'en-US';
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { /* 设备没有 TTS 就静默 */ }
  }
  const canSay = typeof window !== 'undefined' && 'speechSynthesis' in window;

  /* 音标 + 朗读按钮（放不下音标时至少还有朗读） */
  function phonLine(k, w) {
    const p = phonOf(k, w);
    const word = (w && w.lemma) || k || '';
    const btn = canSay ? `<button class="say" data-act="say" data-w="${esc(word)}" aria-label="朗读">${ICON.speaker}</button>` : '';
    if (!p) return btn ? `<div class="phon-line">${btn}</div>` : '';
    return `<div class="phon-line"><span class="phon">/${esc(p)}/</span>${btn}</div>`;
  }

  const S = {
    tab: 'learn', seg: 'daily', idx: 0, sb: 0,
    blind: false, auto: true, remind: true,
    chunk: {}, zh: {}, uses: {}, seen: {}, seenVerse: {},
    q: '', hist: [], art: null, lib: 'all', update: null
  };

  /* 高中 3500 词表：内容尚未导入，先用空数组占位（zone3500.js 提供 ZONE3500 时自动生效） */
  const ZONE_LIST = (typeof ZONE3500 !== 'undefined' && Array.isArray(ZONE3500)) ? ZONE3500 : [];
  const ZONE_READY = ZONE_LIST.length > 0;

  /* ---------------- 版本与更新（静默检查，永不弹窗） ---------------- */
  const META = (name, def) => {
    const el = document.querySelector('meta[name="' + name + '"]');
    return el && el.content ? el.content : def;
  };
  const APP_VERSION = META('app-version', 'dev');
  const UPDATE_BASE = META('update-base', '');
  // 是否运行在壳里（Capacitor APK）；网页 / PWA 用"刷新"更新
  const IS_NATIVE = typeof window !== 'undefined' &&
    (!!window.Capacitor || /(Capacitor|;\s*wv\))/i.test(navigator.userAgent));

  const verParts = (v) => String(v).replace(/^v/i, '').split('.').map((x) => parseInt(x, 10) || 0);
  function verGt(a, b) {
    const A = verParts(a), B = verParts(b);
    for (let i = 0; i < Math.max(A.length, B.length); i++) {
      const x = A[i] || 0, y = B[i] || 0;
      if (x > y) return true;
      if (x < y) return false;
    }
    return false;
  }

  /* 静默检查：离线 / 超时 / 被墙都不打扰用户，只有真发现新版本才记进状态 */
  async function checkUpdate() {
    if (!UPDATE_BASE || !navigator.onLine) return;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(UPDATE_BASE + 'version.json?t=' + Date.now(), {
        cache: 'no-store',
        signal: ctrl.signal
      });
      clearTimeout(timer);
      if (!res.ok) return;
      const info = await res.json();
      if (info && info.version && verGt(info.version, APP_VERSION)) {
        S.update = info;
        if (S.tab === 'me') render(true);
      }
    } catch (e) { /* 静默失败 */ }
  }

  /* ---------------- 存储 ---------------- */
  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const o = JSON.parse(raw);
        ['blind', 'auto', 'remind', 'idx', 'sb', 'seg', 'uses', 'seen', 'seenVerse', 'hist'].forEach((k) => {
          if (o[k] !== undefined) S[k] = o[k];
        });
      }
    } catch (e) { /* 忽略隐私模式限制 */ }
  }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        blind: S.blind, auto: S.auto, remind: S.remind, idx: S.idx, sb: S.sb, seg: S.seg,
        uses: S.uses, seen: S.seen, seenVerse: S.seenVerse, hist: S.hist
      }));
    } catch (e) { /* noop */ }
  }

  /* ---------------- 词条统一访问（精讲词条 + ECDICT 扩展词库） ---------------- */
  const EXAM_TAG = { zk: '中考', gk: '高考', cet4: '四级', cet6: '六级', ky: '考研', toefl: '托福', ielts: '雅思', gre: 'GRE' };

  /* 少数常见"复数 / 第三人称"歧义：优先按名词复数理解（autumn leaves ≠ 许可） */
  const FORM_OVERRIDE = {
    leaves: 'leaf', lives: 'life', knives: 'knife', wives: 'wife', halves: 'half',
    wolves: 'wolf', shelves: 'shelf', thieves: 'thief', selves: 'self', loaves: 'loaf',
    calves: 'calf', scarves: 'scarf', hooves: 'hoof', wolves_: 'wolf', men: 'man',
    women: 'woman', children: 'child', feet: 'foot', teeth: 'tooth', mice: 'mouse',
    geese: 'goose', people: 'people'
  };

  function lexResolve(k) {
    if (!k || typeof LEXICON === 'undefined') return '';
    const key = String(k).toLowerCase();
    if (FORM_OVERRIDE[key] && LEXICON.words[FORM_OVERRIDE[key]]) return FORM_OVERRIDE[key];
    if (LEXICON.words[key]) return key;
    const lem = LEXICON.lemmas[key];
    return lem && LEXICON.words[lem] ? lem : '';
  }

  /* 英文释义截成短标注（用于逐词升级到英文那一步） */
  function shortEn(s, max = 14) {
    const t = String(s || '').replace(/[（(].*$/, '').replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    const cut = t.slice(0, max);
    const sp = cut.lastIndexOf(' ');
    return (sp > 5 ? cut.slice(0, sp) : cut).trim() + '…';
  }

  function lexEntry(k) {
    if (!k || typeof LEXICON === 'undefined') return null;
    const key = lexResolve(k);
    if (!key) return null;
    const row = LEXICON.words[key];
    const pos = row[0] || '', senses = row[1] || [], collins = row[2] || 0,
      oxford = row[3] || 0, tags = row[4] || '', rank = row[5] || 0, enDef = row[6] || '';
    const freqBase = collins >= 4 || oxford ? 3 : collins >= 2 ? 2 : 1;
    return {
      key, pos, collins, oxford, rank,
      tags: tags ? tags.split(' ').filter(Boolean) : [],
      senses: senses.map((s, i) => {
        const p = s.indexOf('|');
        return {
          id: 'lx' + (i + 1),
          zh: p >= 0 ? s.slice(p + 1) : s,
          pos: p >= 0 ? s.slice(0, p) : '',
          en: shortEn(enDef),
          enFull: enDef,
          freq: freqBase,
          ex: null
        };
      })
    };
  }

  /* 统一词条：先查精讲词库，再退回扩展词库 */
  function wordData(k) {
    const c = WORDS[k];
    if (c) return Object.assign({}, c, { curated: true, lemma: c.lemma || k });
    const lx = lexEntry(k);
    if (!lx || !lx.senses.length) return null;
    return {
      curated: false, lemma: lx.key, phon: '', pos: lx.pos || '',
      senses: lx.senses,
      tags: lx.tags, collins: lx.collins, oxford: lx.oxford, rank: lx.rank
    };
  }

  function allWordKeys() {
    const keys = Object.keys(WORDS);
    if (typeof LEXICON !== 'undefined') for (const k of Object.keys(LEXICON.words)) if (!WORDS[k]) keys.push(k);
    return keys;
  }

  /* ---------------- 义项掌握度 ---------------- */
  const keyOf = (k, s) => k + '::' + s;
  const usesOf = (k, s) => S.uses[keyOf(k, s)] || 0;
  function levelOf(k, s) {
    if (!S.auto) return 0;
    const n = usesOf(k, s);
    return n >= FREE_AT ? 2 : n >= MASTER_AT ? 1 : 0;
  }
  function senseOf(k, sid) {
    const w = wordData(k);
    if (!w) return null;
    return w.senses.find((x) => x.id === sid) || w.senses[0];
  }
  /* 词在当前语境下的标注内容：0=中文 1=英文近义词 2=无 */
  function glossOf(token) {
    const sense = senseOf(token.k, token.s);
    if (!sense) return { text: '', lv: 0, n: 0, sense: null };
    const n = usesOf(token.k, sense.id);
    const lv = levelOf(token.k, sense.id);
    const text = lv === 0 ? sense.zh : lv === 1 ? (sense.en || sense.zh) : '';
    return { text, lv, n, sense };
  }
  function primarySenseId(k) {
    for (const s of SENTENCES) for (const t of s.tokens) if (t.k === k) return t.s;
    const w = wordData(k);
    return w ? w.senses[0].id : null;
  }
  function freqDots(f) {
    return '<span class="fq">' + [1, 2, 3].map((i) => `<i class="${i <= f ? 'on' : ''}"></i>`).join('') + '</span>';
  }
  function progressDots(n) {
    return '<span class="dots">' + [0, 1, 2].map((i) => `<i class="${i < Math.min(n, 3) ? 'on' : ''}"></i>`).join('') + '</span>';
  }

  /* ---------------- 自适应分词：给飞鸟集 / 宣言 / 搜索句子生成逐词 token ---------------- */
  function tokenize(text) {
    const out = [];
    for (const raw of String(text).replace(/\s+/g, ' ').trim().split(' ')) {
      if (!raw) continue;
      const m = raw.match(/^([^\w'’-]*)([A-Za-z][A-Za-z'’-]*)(.*)$/);
      if (!m) { out.push({ t: raw }); continue; }
      const [, pre, core, post] = m;
      const key = lexResolve(core.toLowerCase()) || (WORDS[core.toLowerCase()] ? core.toLowerCase() : '');
      out.push({ t: pre + core + post, k: key, s: key ? firstSenseId(key) : '' });
    }
    return out;
  }

  function firstSenseId(k) {
    const w = wordData(k);
    return w ? w.senses[0].id : '';
  }

  /* 在句子里挑一个更贴语境的义项（无词性标注器时的轻量启发式）
     - to + X        → 优先动词义
     - X + 名词       → 优先形容词义
     - a/the + X     → 优先名词义
     其余情况仍用词典第一义项（用户点开可看全部） */
  function pickSenseFor(tokens, i) {
    const t = tokens[i];
    if (!t.k) return t;
    const w = wordData(t.k);
    if (!w || w.senses.length === 1) return t;
    const posOf = (s) => String(s.p || s.pos || '').toLowerCase();
    const pick = (re) => w.senses.find((s) => re.test(posOf(s)));
    const clean = (x) => (x ? x.replace(/[^A-Za-z]/g, '').toLowerCase() : '');
    const prev = clean(tokens[i - 1] && tokens[i - 1].t);
    const next = clean(tokens[i + 1] && tokens[i + 1].t);
    const nextData = next ? wordData(lexResolve(next) || next) : null;
    const nextIsNoun = nextData && /^n\./.test(String(nextData.senses[0].p || nextData.senses[0].pos || '').toLowerCase());

    let hit = null;
    if (prev === 'to') hit = pick(/^v\./);
    if (!hit && nextIsNoun) hit = pick(/^prep\./) || pick(/^adj\./);
    if (!hit && /^(a|an|the|this|that|my|your|his|her|its|our|their)$/.test(prev)) hit = pick(/^n\./);
    if (hit) { t.s = hit.id; }
    return t;
  }

  /* 按标点切意群（没有人工切分时兜底） */
  function autoChunks(tokens) {
    const chunks = [];
    let cur = null;
    tokens.forEach((t, i) => {
      if (!/[A-Za-z]/.test(t.t)) return;
      if (!cur) cur = { from: i, to: i, zh: '' };
      else cur.to = i;
      if (/[,;:.!?—]$/.test(t.t)) { chunks.push(cur); cur = null; }
    });
    if (cur) chunks.push(cur);
    return chunks;
  }

  /* 在任意句子里识别短语（精讲短语 + 词典短语，最多 3 词） */
  function detectPhrases(tokens) {
    const idxs = tokens.map((t, i) => (/^[^\w]*[A-Za-z]/.test(t.t) ? i : -1)).filter((i) => i >= 0);
    const clean = (t) => t.replace(/^[^A-Za-z]+|[^A-Za-z'’-]+$/g, '').toLowerCase();
    for (let a = 0; a < idxs.length; a++) {
      let matched = '';
      for (let len = Math.min(3, idxs.length - a); len >= 2; len--) {
        const span = idxs.slice(a, a + len);
        const text = span.map((i) => clean(tokens[i].t)).join(' ');
        if (!text || text.indexOf(' ') < 0) continue;
        if (PHRASES[text] || (typeof LEXICON !== 'undefined' && LEXICON.phrases && LEXICON.phrases[text])) { matched = text; break; }
      }
      if (matched) {
        const len = matched.split(' ').length;
        idxs.slice(a, a + len).forEach((i) => { tokens[i].ph = matched; });
        a += len - 1;
      }
    }
    return tokens;
  }

  function makeSentence(id, en, zh) {
    const tokens = tokenize(en).map((t, i, arr) => pickSenseFor(arr, i));
    detectPhrases(tokens);
    return { id, en, zh, tokens, chunks: autoChunks(tokens) };
  }

  /* ---------------- 句子渲染 ---------------- */
  function wordHTML(t, sid, i) {
    const g = glossOf(t);
    const dots = g.n > 0 ? progressDots(g.n) : '';
    const cls = 'word' + (t.ph ? ' in-phrase' : '');
    const idx = i === undefined ? '' : ` data-i="${i}"`;
    return `<button class="${cls}" data-act="word" data-sid="${sid}"${idx} data-k="${t.k}" data-s="${t.s}" data-ph="${esc(t.ph || '')}" type="button">
        <span class="en">${esc(t.t)}</span>
        <span class="gloss" data-lv="${g.lv}">${esc(g.text)}${dots}</span>
      </button>`;
  }

  /* opts.mode: 'word' | 'chunk'  opts.blind: 隐藏中文注（词仍可点） */
  function sentenceHTML(sent, opts = {}) {
    const hasChunks = sent.chunks && sent.chunks.length > 0;
    const mode = opts.mode || (S.chunk[sent.id] && hasChunks ? 'chunk' : 'word');
    const blind = !!opts.blind;
    let inner;

    if (mode === 'chunk' && hasChunks) {
      inner = sent.chunks.map((c) => {
        const seg = sent.tokens.slice(c.from, c.to + 1).map((t) => {
          if (!/[A-Za-z]/.test(t.t)) return `<span class="en punct">${esc(t.t)}</span>`;
          return wordHTML(t, sent.id);
        }).join('');
        return `<span class="chunk">${seg}</span>`;
      }).join('');
    } else {
      inner = sent.tokens.map((t, i) => wordHTML(t, sent.id, i)).join('');
    }

    return `<div class="sentence${blind ? ' is-blind' : ''}" data-sid="${sent.id}"><div class="line${mode === 'chunk' && hasChunks ? ' is-chunked' : ''}">${inner}</div></div>`;
  }

  function legendHTML() {
    return `<div class="legend">
      <b>释义升级</b>：同一义项在语境里接触 <b>3</b> 次 → 中文渐变为英文近义词；<b>6</b> 次 → 标注完全隐去。
      <div class="up" style="margin-top:6px">
        <span>拿起</span><span class="arr">→</span>
        <span style="color:var(--primary)">lift up</span><span class="arr">→</span>
        <span style="opacity:.5">无标注</span>
      </div>
      <div style="margin-top:6px">进度圆点 ${progressDots(2)} = 已接触 2/3 次。</div>
    </div>`;
  }

  /* ---------------- 首屏大搜索框 ---------------- */
  function searchBoxHTML(real) {
    if (real) {
      return `<div class="sbox" role="search">
          ${ICON.search}
          <input id="q" type="text" placeholder="中文或英文，如 车站 / pick" value="${esc(S.q)}"
                 autocomplete="off" autocapitalize="off" spellcheck="false" />
          <button class="clr" data-act="clearQ" aria-label="清空" style="visibility:${S.q ? 'visible' : 'hidden'}">${ICON.x}</button>
          <button class="mic" data-act="voice" aria-label="语音输入">${ICON.mic}</button>
        </div>`;
    }
    return `<button class="sbox" data-act="go" data-tab="search" aria-label="搜索">
        ${ICON.search}
        <span class="ph">查单词或句子，中英双向</span>
        <span class="mic" aria-hidden="true">${ICON.mic}</span>
      </button>`;
  }

  function backLink() {
    return `<button class="back-link" data-act="seg" data-seg="daily">${ICON.left}每日推荐</button>`;
  }

  /* ---------------- 学习页 ---------------- */
  function viewLearn() {
    const box = `<div class="sbox-wrap">${searchBoxHTML(false)}</div>`;
    if (S.seg === 'hist') return box + backLink() + viewHistory();
    if (S.seg === 'zone') return box + viewZone();
    if (S.seg === 'art') return box + (S.art === null ? backLink() + viewArtList() : viewArticle(S.art));
    return box + viewDaily();
  }

  /* ---------- 伪随机：同一天内固定，换一句按序推进 ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function dailySeedIndex(len) {
    const d = new Date();
    const key = 'gloss-sb-' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    return Math.floor(mulberry32(hashSeed(key))() * len);
  }

  function viewDaily() {
    const list = STRAY_BIRDS;
    const idx = (dailySeedIndex(list.length) + (S.sb || 0)) % list.length;
    const v = list[idx];
    S.seenVerse[v.no] = 1;

    // 逐词标注永久隐藏（盲点）+ 永久按意群分组，词仍可点
    const sent = makeSentence('sb' + v.no, v.en, v.zh);

    return `
      <article class="card">
        ${sentenceHTML(sent, { mode: 'chunk', blind: true })}
        <div class="zh-line show">${esc(v.zh)}</div>
      </article>

      <div class="navrow">
        <button class="nav-btn" data-act="prevVerse" aria-label="上一条">${ICON.left}</button>
        <div class="steps-num">第 ${idx + 1} / ${list.length} 首</div>
        <button class="nav-btn" data-act="nextVerse" aria-label="下一条">${ICON.right}</button>
      </div>

      <div class="entries">
        <button class="entry-card" data-act="seg" data-seg="hist">
          <b>查询历史</b><span>${S.hist.length} 条 · 共 ${S.hist.reduce((a, h) => a + h.n, 0)} 次</span>
        </button>
        <button class="entry-card" data-act="seg" data-seg="art">
          <b>共产党宣言</b><span>${MANIFESTO.length} 节 · ${MANIFESTO.reduce((a, u) => a + u.blocks.length, 0)} 段</span>
        </button>
        <button class="entry-card wide" data-act="seg" data-seg="zone">
          <b>高中 3500</b><span>3500 个核心词 · 音标 · 朗读 · 词根${ZONE_READY ? '' : ' · 内容准备中'}</span>
        </button>
      </div>`;
  }

  /* ---------------- 高中 3500 专区（先留位置与样式，内容待导入） ---------------- */
  function viewZone() {
    const ready = ZONE_READY;
    const list = ZONE_LIST;

    const row = (w) => {
      const info = wordData(w);
      const zh = info && info.senses.length ? info.senses[0].zh : '';
      const phon = info ? phonOf(w, info) : '';
      const r = rootInfo(w);
      return `<button class="lib-row" data-act="word" data-k="${esc(w)}" data-s="${info ? info.senses[0].id : ''}" data-sid="">
          <span class="lw">${esc(w)}</span>
          <span class="lg">${phon ? '/' + esc(phon) + '/' : ''}${zh ? ' · ' + esc(zh) : ''}${r ? ' · ' + esc(r.root) : ''}</span>
          <span class="lm">${canSay ? `<span class="say sm" data-act="say" data-w="${esc(w)}" role="button" aria-label="朗读">${ICON.speaker}</span>` : ''}</span>
        </button>`;
    };

    return `<button class="back-link" data-act="seg" data-seg="daily">${ICON.left}返回</button>
      <div class="sect-head"><h3>高中 3500</h3><span>${ready ? list.length + ' 词' : '内容准备中'}</span></div>
      <div class="mf-sub">3500 个高中核心词 · 每个词给音标、朗读、词根与当前义项</div>
      ${ready
        ? list.map(row).join('')
        : `<div class="empty"><b>词表还没导入</b>位置和样式先留好了：每个词一行<br>音标 + 一键朗读 + 词根提示，点词进义项卡</div>
           <div class="sect-label">样式示例 <em>非真实词条</em></div>
           <div class="rows">
             <div class="row">
               <span class="rk"><b>example</b><span>/ɪɡˈzɑːmpl/ · 例子 · exam-</span></span>
               <span class="row-ok">${canSay ? '可朗读' : '—'}</span>
             </div>
           </div>`}`;
  }

  /* ---------------- 查询历史 ---------------- */
  function timeAgo(t) {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 90) return '刚刚';
    if (diff < 3600) return Math.round(diff / 60) + ' 分钟前';
    const sameDay = d.toDateString() === now.toDateString();
    const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    if (sameDay) return '今天 ' + hm;
    const y = new Date(now.getTime() - 864e5);
    if (d.toDateString() === y.toDateString()) return '昨天 ' + hm;
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function viewHistory() {
    const hist = [...S.hist].sort((a, b) => (b.t || 0) - (a.t || 0));
    const total = hist.reduce((a, h) => a + h.n, 0);
    const head = `<div class="sect-head"><h3>查询历史</h3><span>${hist.length} 条 · ${total} 次</span></div>`;

    if (!hist.length) {
      return head + `<div class="empty"><b>还没有查询记录</b>在上方搜索框查任何一个词、短语或句子<br>这里会按时间留下你的查询轨迹</div>`;
    }

    return head + `
      <div class="chips" style="margin-bottom:14px">
        <button class="chip" data-act="clearHist">清空历史</button>
      </div>
      ${hist.map((h) => `<button class="lib-row hist" data-act="pickQ" data-q="${esc(h.q)}">
          <span class="lw">${esc(h.q)}</span>
          <span class="lg">${esc(timeAgo(h.t))}</span>
          <span class="lm">${h.n} 次</span>
        </button>`).join('')}`;
  }

  /* ---------------- 阅读素材：共产党宣言 ---------------- */
  function viewArtList() {
    const blocks = MANIFESTO.reduce((a, u) => a + u.blocks.length, 0);
    return `<div class="sect-head"><h3>共产党宣言</h3><span>${MANIFESTO.length} 节 · ${blocks} 段</span></div>
      <div class="mf-sub">马克思 · 恩格斯 1848 · 英文 1888 年版 · 每段可逐词查看</div>
      ${MANIFESTO.map((u, i) => `<button class="art-card" data-act="openArt" data-i="${i}">
          <span class="lv">${u.blocks.length} 段</span>
          <div class="at">${esc(u.zhTitle)}</div>
          <div class="ae">${esc(u.title)}</div>
          <div class="ad">${esc(u.blocks[0].zh.slice(0, 30))}…</div>
        </button>`).join('')}`;
  }

  function viewArticle(i) {
    const u = MANIFESTO[i];
    if (!u) return viewArtList();
    return `<button class="back-link" data-act="backArt">${ICON.left}共产党宣言</button>
      <h2 class="art-title">${esc(u.zhTitle)}</h2>
      <div class="art-sub">${esc(u.title)}</div>
      ${u.blocks.map((b, j) => {
        const sent = makeSentence(u.id + '-' + j, b.en, b.zh);
        return `<div class="art-block">${sentenceHTML(sent)}
          <div class="zh-line show">${esc(b.zh)}</div>
        </div>`;
      }).join('')}`;
  }

  /* ---------------- 搜索页 ---------------- */
  function viewSearch() {
    return `<button class="back-link" data-act="go" data-tab="learn">${ICON.left}返回</button>
      <div class="sbox-wrap">${searchBoxHTML(true)}</div>
      <div id="res">${resultsHTML()}</div>`;
  }

  function defaultSearchHTML() {
    const hist = [...S.hist].sort((a, b) => b.n - a.n).slice(0, 10);
    const poly = ['pick', 'charge', 'run', 'fair', 'present', 'book'];
    const cn = ['车站', '拿起', '忍受', '预订', '礼物', '经营'];
    const total = allWordKeys().length;
    return `<div class="lang-hint"><i class="rec"></i>中英混合输入，自动识别方向</div>
      ${hist.length ? `<div class="sect-label">最近搜索 <em>常用置顶</em></div>
        <div class="chips">${hist.map((h, i) => `<button class="chip ${i < 2 ? 'hot' : ''}" data-act="pickQ" data-q="${esc(h.q)}">${esc(h.q)}<span class="n">${h.n}</span></button>`).join('')}</div>` : ''}
      <div class="sect-label">一词多义 <em>点开看它在这一句里的意思</em></div>
      <div class="chips">${poly.map((g) => `<button class="chip" data-act="pickQ" data-q="${esc(g)}">${g}</button>`).join('')}</div>
      <div class="sect-label">中文查英文 <em>按使用场景排序</em></div>
      <div class="chips">${cn.map((g) => `<button class="chip" data-act="pickQ" data-q="${esc(g)}">${g}</button>`).join('')}</div>
      <div class="dict-note">词库 ${total} 词 · 支持词形还原（picked → pick）<br>数据源 ECDICT（MIT）· 离线可用</div>`;
  }

  function resultsHTML() {
    const q = S.q.trim();
    if (!q) return defaultSearchHTML();
    return /[\u4e00-\u9fa5]/.test(q) ? cnResultsHTML(q) : enResultsHTML(q);
  }

  function cnResultsHTML(q) {
    const entry = CN2EN.find((e) => e.zh.includes(q) || q.includes(e.zh)) ||
      CN2EN.find((e) => e.zh[0] === q[0]);

    // 精讲词条命中（带语境例句）
    const hits = [];
    Object.keys(WORDS).forEach((k) => WORDS[k].senses.forEach((s) => {
      if (s.zh.includes(q) || q.includes(s.zh.split('；')[0])) hits.push({ k, s });
    }));

    // 扩展词库命中：首义项优先 → 精确/前缀优先 → 词频
    const lexHits = [];
    if (typeof LEXICON !== 'undefined') {
      for (const k of Object.keys(LEXICON.words)) {
        if (WORDS[k]) continue;
        const senses = LEXICON.words[k][1];
        let best = null;
        for (let i = 0; i < senses.length; i++) {
          const zh = senses[i].split('|').pop();
          if (zh.indexOf(q) < 0) continue;
          const score = (zh === q ? 0 : zh.indexOf(q) === 0 ? 1 : 2) + (i === 0 ? 0 : 4);
          if (!best || score < best.score) best = { i, zh, score };
        }
        if (best) lexHits.push({ k, row: LEXICON.words[k], ...best });
      }
      lexHits.sort((a, b) => a.score - b.score || (a.row[5] || 1e9) - (b.row[5] || 1e9));
    }

    if (!entry && !hits.length && !lexHits.length) return emptyHTML(q);

    const items = entry ? entry.items.map((it) => {
      const reg = { '口语': 'oral', '书面': 'written', '俚语': 'slang', '通用': 'common' }[it.tag] || 'common';
      return `<button class="cn-item" data-act="pickQ" data-q="${esc(it.en)}">
          <div class="top"><span class="en">${esc(it.en)}</span><span class="tag-reg ${reg}">${it.tag}</span></div>
          <div class="note">${esc(it.note)}</div>
          <div class="ex"><div class="e">${esc(it.ex[0])}</div><div class="z">${esc(it.ex[1])}</div></div>
        </button>`;
    }).join('') : '';

    const lexRows = lexHits.slice(0, 12).map((h) => {
      const tag = (h.row[4] || '').split(' ').filter(Boolean)[0];
      const posNo = h.i + 1;
      return `<button class="lib-row" data-act="openSense" data-k="${esc(h.k)}" data-id="lx${posNo}">
          <span class="lw">${esc(h.k)}</span>
          <span class="lg">${esc(h.zh)}</span>
          <span class="lm">${tag ? esc(EXAM_TAG[tag] || tag) : (h.row[0] || '')}</span>
        </button>`;
    }).join('');

    return `<div class="res-main">
        <div class="res-word" style="font-family:var(--han);font-size:27px;font-weight:500">${esc(entry ? entry.zh : q)}</div>
        <div class="res-top" style="font-size:12px;color:var(--muted)">
          ${entry ? esc(entry.pinyin) + ' · ' + entry.items.length + ' 个英文表达' : (lexHits.length + hits.length) + ' 个词库匹配'}
        </div>
      </div>
      <div class="lang-hint"><i class="rec"></i>识别为中文 → 英文，按使用场景排序</div>
      ${items ? `<div class="sect-label">英文表达 <em>点击查看词条</em></div>${items}` : ''}
      ${hits.length ? `<div class="sect-label">精讲词条 <em>带语境例句</em></div>
        <div class="chips">${hits.slice(0, 8).map((h) => `<button class="chip" data-act="openSense" data-k="${h.k}" data-id="${h.s.id}">${esc(WORDS[h.k].lemma)} · ${esc(h.s.zh)}</button>`).join('')}</div>` : ''}
      ${lexHits.length ? `<div class="sect-label">词库收录 <em>${lexHits.length > 12 ? '共 ' + lexHits.length + ' 个，按频率排序' : '按词频排序'}</em></div>${lexRows}` : ''}`;
  }

  function normKey(q) {
    const w = q.trim().toLowerCase().replace(/[.,!?;:'"’“”]/g, '');
    if (!w) return '';
    if (WORDS[w]) return w;
    const exact = lexResolve(w);
    if (exact) return exact;
    const cands = [
      w.replace(/ies$/, 'y'), w.replace(/es$/, ''), w.replace(/s$/, ''),
      w.replace(/ed$/, ''), w.replace(/ing$/, ''), w.replace(/ing$/, 'e'), w.replace(/ed$/, 'e')
    ];
    for (const c of cands) { const r = lexResolve(c) || (WORDS[c] ? c : ''); if (r) return r; }
    return '';
  }

  function tagsHTML(w) {
    const bits = [];
    if (w.curated) bits.push(['精讲词条', 'cur']);
    if (w.collins) bits.push(['柯林斯 ' + '★'.repeat(Math.min(5, w.collins)), 'star']);
    if (w.oxford) bits.push(['牛津核心', 'star']);
    if (w.tags && w.tags.length) bits.push([w.tags.map((t) => EXAM_TAG[t]).filter(Boolean).join(' / '), '']);
    if (w.rank) bits.push(['词频 ' + w.rank, '']);
    return bits.length ? `<div class="sh-tags">${bits.filter((b) => b[0]).map((b) => `<span class="sh-tag ${b[1]}">${esc(b[0])}</span>`).join('')}</div>` : '';
  }

  /* ---------- 日常造句：优先 Tatoeba 语料，其次精讲义项自带例句 ---------- */
  function exampleList(k, w) {
    const ex = (typeof EXAMPLES !== 'undefined' && (EXAMPLES[k] || EXAMPLES[w.lemma] || EXAMPLES[w.lemma.toLowerCase()])) || [];
    if (ex.length) return ex.slice(0, 2);
    return w.senses.filter((s) => s.ex).slice(0, 2).map((s) => s.ex);
  }

  function examplesBlock(k, w) {
    const list = exampleList(k, w);
    if (!list.length) return '';
    return `<div class="sect-label">造句 <em>日常用法</em></div>
      <div class="ex-list">
        ${list.map(([en, zh]) => `<div class="ex-row">
            <p class="e">${esc(en)}</p>
            <p class="z">${esc(zh)}</p>
          </div>`).join('')}
      </div>`;
  }

  /* ---------- 短语（词典收录） ---------- */
  function dictPhraseHTML(key, row) {
    const senses = (row[0] || []).map((s) => {
      const i = s.indexOf('|');
      return { pos: i >= 0 ? s.slice(0, i) : '', zh: i >= 0 ? s.slice(i + 1) : s };
    });
    const tag = (row[1] || '').split(' ').filter(Boolean)[0];
    return `<div class="res-main">
        <div class="res-word" style="font-size:27px">${esc(key)}<small>短语 · ${senses.length} 个意思</small></div>
        <div class="res-top">${esc(senses[0] ? senses[0].zh : '')}<span class="tag">最常用</span></div>
        ${tag ? `<div class="sh-tags"><span class="sh-tag">${esc(EXAM_TAG[tag] || tag)}</span></div>` : ''}
      </div>
      <div class="lang-hint"><i class="rec"></i>短语命中 · 点每个义项可查其中单词</div>
      <div class="sect-label">义项 <em>按使用频率</em></div>
      <div class="ex-list">
        ${senses.map((s, i) => `<div class="ex-row">
            <p class="e">${s.pos ? `<span class="ex-pos">${esc(s.pos)}</span>` : ''}${esc(s.zh)}</p>
          </div>`).join('')}
      </div>
      <div class="sect-label">短语里的词</div>
      <div class="chips">${key.split(' ').map((t) => {
        const kk = normKey(t);
        return kk ? `<button class="chip" data-act="pickQ" data-q="${esc(t)}">${esc(t)} · ${esc((wordData(kk).senses[0] || {}).zh || '')}</button>` : '';
      }).join('')}</div>`;
  }

  /* ---------- 句子解析 ---------- */
  function sentenceResultHTML(text) {
    const sent = makeSentence('qsent', text, '');
    const known = sent.tokens.filter((t) => t.k);
    const uniq = [...new Set(known.map((t) => t.k))];
    if (!uniq.length) return emptyHTML(text);

    const rows = uniq.map((k) => {
      const w = wordData(k);
      if (!w) return '';
      // 与句中标注保持同一个义项
      const tok = known.find((t) => t.k === k);
      const s0 = (tok && w.senses.find((s) => s.id === tok.s)) || w.senses[0];
      return `<button class="lib-row" data-act="openSense" data-k="${esc(k)}" data-id="${s0.id}">
          <span class="lw">${esc(w.lemma)}</span>
          <span class="lg">${esc(s0.zh)}</span>
          <span class="lm">${esc(s0.p || s0.pos || w.pos || '')}</span>
        </button>`;
    }).join('');

    return `<div class="res-main">
        <div class="res-word" style="font-size:21px;line-height:1.45;letter-spacing:-.01em">${esc(text)}</div>
        <div class="res-top" style="font-size:12px;color:var(--muted)">句子解析 · ${known.length} 个词可查</div>
      </div>
      <div class="lang-hint"><i class="rec"></i>按句解析：先逐词给词义，点词看全部义项</div>
      <div class="card" style="padding:18px 16px;margin-top:12px">${sentenceHTML(sent)}</div>
      <div class="sect-label">逐词释义 <em>点词看全部义项</em></div>
      ${rows}`;
  }

  function enResultsHTML(q) {
    const raw = q.trim();
    const low = raw.toLowerCase();

    // 1) 精讲短语
    if (PHRASES[low]) return phraseResultHTML(PHRASES[low], low);

    // 2) 多词：词典短语 → 否则按句子解析
    const stripped = low.replace(/[.,!?;:"“”'’]/g, '').replace(/\s+/g, ' ').trim();
    if (stripped.indexOf(' ') > 0) {
      const dp = typeof LEXICON !== 'undefined' && LEXICON.phrases ? LEXICON.phrases[stripped] : null;
      if (dp) return dictPhraseHTML(stripped, dp);
      return sentenceResultHTML(raw);
    }

    // 3) 单词
    const k = normKey(q);
    if (!k) return emptyHTML(q);
    const w = wordData(k);
    if (!w) return emptyHTML(q);
    const best = [...w.senses].sort((a, b) => (b.freq || 0) - (a.freq || 0))[0];

    const me = lexResolve(k) || k;
    const related = Object.keys(PHRASES).filter((p) => p.split(' ').some((t) => (lexResolve(t) || t) === me));
    const cards = w.senses.map((s) => senseCardHTML(w, s, { act: 'openSense', k, current: s.id === best.id })).join('');
    const lemmaNote = low !== w.lemma.toLowerCase() ? (w.pos || '') + '' : (w.pos || '');
    const lemmaLine = low !== w.lemma.toLowerCase() ? ` · 原形 ${esc(w.lemma)}` : '';

    return `<div class="res-main">
        <div class="res-word">${esc(low)}<small>${esc(lemmaNote)}${lemmaLine}</small></div>
        ${phonLine(k, w)}
        <div class="res-top">${esc(best.zh)}<span class="tag">最匹配义项</span></div>
        ${rootLine(w.lemma || k)}
        ${tagsHTML(w)}
      </div>
      <div class="lang-hint"><i class="rec"></i>识别为英文 → 中文，只给当前最可能义项</div>
      <div class="sect-label">全部义项 <em>共 ${w.senses.length} 个 · 左右滑动</em></div>
      <div class="senses">${cards}</div>
      ${examplesBlock(k, w)}
      ${related.length ? `<div class="sect-label">相关短语</div><div class="chips">${related.map((p) => `<button class="chip" data-act="pickQ" data-q="${esc(p)}">${esc(p)}</button>`).join('')}</div>` : ''}
      ${w.curated && w.syn ? `<div class="sect-label">同义词</div><div class="chips">${w.syn.map((x) => `<button class="chip" data-act="pickQ" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
      ${w.curated && w.colloc ? `<div class="sect-label">常见搭配</div><div class="chips">${w.colloc.map((x) => `<button class="chip" data-act="pickQ" data-q="${esc(x.split(' ')[0])}">${esc(x)}</button>`).join('')}</div>` : ''}`;
  }

  function phraseResultHTML(ph, low) {
    return `<div class="res-main">
        <div class="res-word">${esc(low)}<small>短语动词</small></div>
        <div class="res-top">${esc(ph.senses[0].zh)}<span class="tag">最常用</span></div>
      </div>
      <div class="sect-label">用法说明</div>
      <div class="legend">${esc(ph.note)}</div>
      <div class="sect-label">义项</div>
      <div class="ph-list" style="background:#fff;padding:15px;border-radius:14px;box-shadow:var(--shadow)">
        ${ph.senses.map((s) => `<div class="ph-item"><b>${esc(s.zh)}</b><span>${esc(s.ex[0])} — ${esc(s.ex[1])}</span></div>`).join('')}
      </div>`;
  }

  function emptyHTML(q) {
    const pool = ['pick', 'charge', 'run', 'fair', 'present', '车站', '拿起'];
    return `<div class="empty"><b>词库还没有「${esc(q)}」</b>联网版会实时查询词典接口<br>
      <div class="chips" style="justify-content:center;margin-top:14px">${pool.map((p) => `<button class="chip" data-act="pickQ" data-q="${esc(p)}">${p}</button>`).join('')}</div></div>`;
  }

  /* ---------------- 我的（精简：头像 + 一个数据 + 重置） ---------------- */
  function viewMe() {
    const touched = Object.keys(S.uses).length;
    const up = S.update;
    const action = !up
      ? '<span class="row-ok">已是最新</span>'
      : (IS_NATIVE
        ? `<a class="row-act" href="${esc(up.apk || up.page || '#')}" target="_blank" rel="noopener">v${esc(up.version)} 可更新 ›</a>`
        : `<button class="row-act" data-act="reloadApp">v${esc(up.version)} · 刷新 ›</button>`);

    return `<button class="back-link" data-act="go" data-tab="learn">${ICON.left}返回</button>
      <div class="me-head">
        <div class="avatar">L</div>
        <div>
          <div class="me-name">Lexi</div>
          <div class="me-sub"><i class="rec"></i>连续 3 天 · 今日 12 分钟</div>
        </div>
      </div>
      <div class="stats one">
        <div class="stat"><div class="v">${touched}<i>次</i></div><div class="k">语境词义接触</div></div>
      </div>
      <div class="sect-label">关于</div>
      <div class="rows">
        <div class="row">
          <span class="rk"><b>版本</b><span>v${esc(APP_VERSION)}${up ? '' : ' · ' + (IS_NATIVE ? 'App' : '网页版')}</span></span>
          ${action}
        </div>
        ${up && up.notes && up.notes.length ? `<div class="row">
          <span class="rk"><b>更新内容</b><span>${up.notes.map((n) => esc(n)).join('；')}</span></span>
        </div>` : ''}
      </div>
      <button class="ghost-btn" data-act="reset">重置演示数据</button>`;
  }

  /* ---------------- 单词义项卡（底部抽屉） ---------------- */
  /* 义项标签：用词性（n. / v. / adj. …）代替 01、02 编号 */
  function posLabel(w, sense) {
    const p = sense.p || sense.pos || '';
    if (p) return p;
    if (w.senses.length === 1 && w.pos) return w.pos;
    return '义';
  }

  function senseCardHTML(w, sense, o = {}) {
    const sub = w.curated ? (sense.en || '') : '';
    const ex = sense.ex
      ? `<div class="sc-ex"><div class="e">${esc(sense.ex[0])}</div><div class="z">${esc(sense.ex[1])}</div></div>`
      : '';
    return `<button class="sense-card ${o.current ? 'is-current' : ''}" data-act="${o.act || 'sense'}"
        data-k="${o.k || ''}" data-id="${sense.id}">
        <div class="sc-top">
          <span class="sc-pos">${esc(posLabel(w, sense))}</span>
          ${o.current ? '<span class="sc-cur">当前语境</span>' : ''}
        </div>
        <div class="sc-zh">${esc(sense.zh)}</div>
        <div class="sc-en">${sub ? esc(sub) + ' ' : ''}${freqDots(sense.freq)}</div>
        ${ex}
      </button>`;
  }

  let sheetCtx = { k: null, sid: null, senseId: null };

  function openWord(k, sid, senseId, surface, ph) {
    const w = wordData(k);
    if (!w) { showToast('词库暂未收录「' + k + '」'); return; }
    const sense = senseOf(k, senseId);
    if (!sense) return;

    // 语境接触 +1
    const key = keyOf(k, sense.id);
    S.uses[key] = (S.uses[key] || 0) + 1;
    if (sid) S.seen[sid] = 1;
    save();

    const n = S.uses[key];
    const lv = levelOf(k, sense.id);

    sheetCtx = { k, sid, senseId: sense.id, surface: surface || '', ph: ph || '' };
    paintSheet(w, sense, n, lv);

    // 高亮短语组
    if (sid) flashPhrase(sid, k);

    if (n === MASTER_AT) {
      showToast(sense.en
        ? `「${sense.zh}」已掌握 · 释义升级为 <b>${sense.en}</b>`
        : `「${sense.zh}」已掌握 · 记入词库`);
    } else if (n === FREE_AT) showToast(`「${sense.zh}」进入无标注模式 · 纯英文思维`);

    refreshGlosses();
  }

  function paintSheet(w, sense, n, lv) {
    const surface = sheetCtx.surface || w.lemma;

    const phr = sheetCtx.ph || (() => {
      if (!sheetCtx.sid) return null;
      const st = SENTENCES.find((s) => s.id === sheetCtx.sid);
      const t = st && st.tokens.find((x) => x.k === sheetCtx.k);
      return t && t.ph ? t.ph : null;
    })();

    const pct = Math.min(100, (n / FREE_AT) * 100);
    const hint = n >= FREE_AT
      ? '已进入无标注模式：中文与英文标注同时隐去。'
      : n >= MASTER_AT
        ? `再接触 ${FREE_AT - n} 次，标注将完全隐去。`
        : `再接触 ${MASTER_AT - n} 次，中文释义升级为英文近义词。`;

    const others = w.senses.filter((s) => s.id !== sense.id)
      .concat([]).map((s) => senseCardHTML(w, s, { act: 'sense', current: false })).join('');
    const phraseBlock = phr ? (() => {
      const p = PHRASES[phr];
      if (p) {
        return `<div class="sect-label">短语 · 固定搭配</div>
        <div class="phrase">
          <div class="ph-head"><div class="ph-title">${esc(phr)}<small>${esc(p.pos)}</small></div><span class="ph-arrow">${freqDots(3)}</span></div>
          <div class="ph-note">${esc(p.note)}</div>
          <div class="ph-list">${p.senses.map((s) => `<div class="ph-item"><b>${esc(s.zh)}</b><span>${esc(s.ex[0])} — ${esc(s.ex[1])}</span></div>`).join('')}</div>
        </div>`;
      }
      const dp = typeof LEXICON !== 'undefined' && LEXICON.phrases ? LEXICON.phrases[phr] : null;
      if (!dp) return '';
      const senses = (dp[0] || []).map((s) => {
        const i = s.indexOf('|');
        return { pos: i >= 0 ? s.slice(0, i) : '', zh: i >= 0 ? s.slice(i + 1) : s };
      });
      return `<div class="sect-label">短语 · 固定搭配</div>
        <div class="phrase">
          <div class="ph-head"><div class="ph-title">${esc(phr)}<small>短语</small></div><span class="ph-arrow">${freqDots(3)}</span></div>
          <div class="ph-list">${senses.map((s) => `<div class="ph-item"><b>${esc(s.zh)}</b>${s.pos ? `<span>${esc(s.pos)}</span>` : ''}</div>`).join('')}</div>
        </div>`;
    })() : '';

    const timeline = w.timeline ? `<div class="sect-label">义项时间线 <em>该词语义如何演化</em></div>
      <div class="tl">${w.timeline.map((t) => `<div class="tl-item">
          <div class="tl-dot"></div>
          <div class="tl-era">${esc(t.era)}</div>
          <div class="tl-txt">${esc(t.sense)}</div>
        </div>`).join('')}</div>` : '';

    const html = `<div class="sheet-head">
        <div>
          <div class="sh-word">${esc(surface)}<span class="phon">${esc(phonOf(sheetCtx.k, w))}</span>${canSay ? `<button class="say sm" data-act="say" data-w="${esc(w.lemma || sheetCtx.k)}" aria-label="朗读">${ICON.speaker}</button>` : ''}</div>
          <div class="sh-sub">${surface.toLowerCase() !== w.lemma.toLowerCase() ? esc(w.lemma) + ' · ' : ''}${esc(posLabel(w, sense))} · 共 ${w.senses.length} 个义项</div>
          ${rootLine(w.lemma || sheetCtx.k)}
          ${tagsHTML(w)}
        </div>
        <button class="sh-close" data-act="closeSheet" aria-label="关闭">${ICON.x}</button>
      </div>

      <div class="cur">
        <div class="cur-tag">此刻含义 · 当前语境</div>
        <div class="cur-zh">${esc(sense.zh)}</div>
        ${sense.en ? `<div class="cur-en">≈ ${esc(sense.en)}</div>` : ''}
        <div class="cur-meta">${freqDots(sense.freq)}<span>使用频率</span><span>·</span><span>已接触 ${n} 次</span></div>
        <div class="mbar ${n >= FREE_AT ? 'full' : ''}"><i style="width:${pct}%"></i></div>
        <div class="mhint">${hint}</div>
      </div>

      ${others ? `<div class="sect-label">其他常见含义 <em>左右滑动</em></div>
      <div class="senses">${others}</div>` : ''}
      ${examplesBlock(sheetCtx.k, w)}
      ${phraseBlock}
      ${timeline}
      <div class="sect-label">标注升级</div>
      ${legendHTML()}`;

    const body = $('.sheet-body');
    if (body) {
      const top = body.scrollTop;
      body.innerHTML = html;
      body.scrollTop = top;
    } else {
      const sheet = $('#sheet');
      sheet.innerHTML = `<div class="sheet-grab"><i></i></div><div class="sheet-body">${html}</div>`;
    }
    $('#sheet').classList.add('on');
    $('#scrim').classList.add('on');
  }

  function closeSheet() {
    $('#sheet').classList.remove('on');
    $('#scrim').classList.remove('on');
    sheetCtx = { k: null, sid: null, senseId: null };
    setTimeout(() => {
      if (!$('#sheet').classList.contains('on')) $('#sheet').innerHTML = '';
    }, 380);
  }

  function flashPhrase(sid, k) {
    const st = SENTENCES.find((s) => s.id === sid);
    if (!st) return;
    const tok = st.tokens.find((t) => t.k === k);
    if (!tok || !tok.ph) return;
    const nodes = document.querySelectorAll(`.sentence[data-sid="${sid}"] .word.in-phrase`);
    nodes.forEach((n) => { n.classList.add('flash'); setTimeout(() => n.classList.remove('flash'), 1200); });
  }

  /* 只刷新逐词标注，不整体重绘（保持滚动位置） */
  function refreshGlosses() {
    document.querySelectorAll('.sentence .word').forEach((btn) => {
      const g = glossOf({ k: btn.dataset.k, s: btn.dataset.s });
      const el = btn.querySelector('.gloss');
      if (!el) return;
      el.dataset.lv = g.lv;
      el.innerHTML = esc(g.text) + (g.n > 0 ? progressDots(g.n) : '');
    });
  }

  /* ---------------- 外壳渲染 ---------------- */
  function render(keepScroll = false) {
    const view = $('#view');
    const st = keepScroll ? view.scrollTop : 0;
    const wasFocus = document.activeElement && document.activeElement.id === 'q';
    const caret = wasFocus ? document.activeElement.selectionStart : 0;

    const userBtn = $('#userBtn');
    if (userBtn) userBtn.classList.toggle('on', S.tab === 'me');

    view.innerHTML = S.tab === 'learn' ? viewLearn() : S.tab === 'search' ? viewSearch() : viewMe();
    view.scrollTop = st;

    if (wasFocus) {
      const q = $('#q');
      if (q) { q.focus(); q.setSelectionRange(caret, caret); }
    } else if (S.tab === 'search' && !S.q) {
      // 进入搜索页即可直接输入：空查询时自动聚焦
      const q = $('#q');
      if (q) { try { q.focus({ preventScroll: true }); } catch (e) { q.focus(); } }
    }
  }

  /* ---------------- Toast / 语音 ---------------- */
  let toastTimer = null;
  function showToast(msg) {
    const t = $('#toast');
    t.innerHTML = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), 2300);
  }

  function runVoice() {
    const v = $('#voice');
    v.classList.add('on');
    setTimeout(() => {
      v.classList.remove('on');
      const q = VOICE_SAMPLES[Math.floor(Math.random() * VOICE_SAMPLES.length)];
      S.q = q;
      S.tab = 'search';
      bumpHistory(q);
      render();
      showToast('语音已识别：' + q);
    }, 1500);
  }

  function bumpHistory(q) {
    q = q.trim();
    if (!q) return;
    const hit = S.hist.find((h) => h.q === q);
    if (hit) { hit.n += 1; hit.t = Date.now(); }
    else S.hist.unshift({ q, n: 1, t: Date.now() });
    S.hist = S.hist.slice(0, 40);
    save();
  }

  /* ---------------- 长按：逐词 / 意群 ---------------- */
  let lpTimer = null, lpStart = null, lpAt = 0;
  function bindLongPress() {
    document.addEventListener('pointerdown', (e) => {
      const s = e.target.closest('.sentence');
      if (!s) return;
      lpStart = { x: e.clientX, y: e.clientY, sid: s.dataset.sid };
      clearTimeout(lpTimer);
      lpTimer = setTimeout(() => {
        lpAt = Date.now();
        toggleChunk(s.dataset.sid);
      }, 430);
    }, { passive: true });

    document.addEventListener('pointermove', (e) => {
      if (!lpStart) return;
      if (Math.hypot(e.clientX - lpStart.x, e.clientY - lpStart.y) > 10) {
        clearTimeout(lpTimer); lpStart = null;
      }
    }, { passive: true });

    ['pointerup', 'pointercancel'].forEach((ev) =>
      document.addEventListener(ev, () => { clearTimeout(lpTimer); lpStart = null; }, true));

    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.sentence')) e.preventDefault();
    });
  }

  function toggleChunk(sid) {
    if (!sid) return;
    S.chunk[sid] = !S.chunk[sid];
    render(true);
    showToast(S.chunk[sid] ? '意群模式 · 按语块阅读' : '逐词模式 · 每个词一个义项');
  }

  /* ---------------- 事件 ---------------- */
  function onClick(e) {
    if (Date.now() - lpAt < 450) return; // 长按后抑制误触
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;

    switch (act) {
      case 'go':
        if (S.tab === el.dataset.tab) return;
        // 离开搜索页时把当前查询记入历史
        if (S.tab === 'search' && S.q.trim().length >= 2) { clearTimeout(histTimer); bumpHistory(S.q); }
        S.tab = el.dataset.tab;
        render(false);
        break;

      case 'seg':
        S.seg = el.dataset.seg;
        S.art = null;
        render(false);
        break;

      case 'word': {
        const en = el.querySelector('.en');
        openWord(el.dataset.k, el.dataset.sid || null, el.dataset.s, en ? en.textContent.trim() : '', el.dataset.ph || '');
        break;
      }

      case 'sense': {
        const k = sheetCtx.k;
        if (!k) return;
        const w = wordData(k);
        if (!w) return;
        const sense = w.senses.find((x) => x.id === el.dataset.id);
        if (!sense) return;
        const key = keyOf(k, sense.id);
        S.uses[key] = (S.uses[key] || 0) + 1;
        save();
        sheetCtx.senseId = sense.id;
        paintSheet(w, sense, S.uses[key], levelOf(k, sense.id));
        refreshGlosses();
        if (S.uses[key] === MASTER_AT) {
          showToast(sense.en ? `「${sense.zh}」已掌握 · 升级为 <b>${sense.en}</b>` : `「${sense.zh}」已掌握`);
        }
        break;
      }

      case 'openSense':
        bumpHistory(el.dataset.k);
        openWord(el.dataset.k, null, el.dataset.id);
        break;

      case 'closeSheet':
        closeSheet();
        break;

      case 'prev':
        S.sb = (S.sb || 0) - 1; save(); render(false);
        break;

      case 'next':
        S.sb = (S.sb || 0) + 1; save(); render(false);
        break;

      case 'toggleChunk':
        toggleChunk(el.dataset.sid);
        break;

      case 'libFilter':
        S.lib = el.dataset.id;
        render(false);
        break;

      case 'nextVerse':
        S.sb = (S.sb || 0) + 1;
        save();
        render(false);
        break;

      case 'prevVerse':
        S.sb = (S.sb || 0) - 1;
        save();
        render(false);
        break;

      case 'clearHist':
        S.hist = [];
        save();
        render(false);
        showToast('查询历史已清空');
        break;

      case 'openArt':
        S.art = Number(el.dataset.i);
        render(false);
        break;

      case 'backArt':
        S.art = null;
        render(false);
        break;

      case 'voice':
        runVoice();
        break;

      case 'clearQ':
        S.q = '';
        render(false);
        $('#q') && $('#q').focus();
        break;

      case 'pickQ': {
        S.q = el.dataset.q;
        bumpHistory(S.q);
        if (S.tab !== 'search') S.tab = 'search';
        render(false);
        break;
      }

      case 'reset':
        try { localStorage.removeItem(STORE); } catch (err) { /* noop */ }
        S.uses = {}; S.seen = {}; S.seenVerse = {}; S.hist = []; S.blind = false; S.auto = true; S.remind = true;
        S.idx = 0; S.sb = 0; S.seg = 'daily'; S.art = null; S.chunk = {}; S.zh = {};
        render(false);
        showToast('演示数据已重置');
        break;

      case 'say':
        say(el.dataset.w);
        break;

      case 'reloadApp':
        location.reload();
        break;
    }
  }

  let histTimer = null;
  function onInput(e) {
    if (e.target.id !== 'q') return;
    S.q = e.target.value;
    const res = $('#res');
    if (res) res.innerHTML = resultsHTML();
    const clr = document.querySelector('.sbox .clr');
    if (clr) clr.style.visibility = S.q ? 'visible' : 'hidden';
    // 停止输入 1.1s 后记入查询历史（避免每个字符都记一条）
    clearTimeout(histTimer);
    histTimer = setTimeout(() => {
      if (S.q.trim().length >= 2) bumpHistory(S.q);
    }, 1100);
  }

  function onKey(e) {
    if (e.key === 'Escape') { closeSheet(); return; }
    if (e.key === 'Enter' && e.target.id === 'q') {
      clearTimeout(histTimer);
      if (S.q.trim()) bumpHistory(S.q);
      return;
    }
    if (S.tab !== 'learn' || S.seg !== 'daily') return;
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') { S.sb = (S.sb || 0) + 1; save(); render(false); }
    if (e.key === 'ArrowLeft') { S.sb = (S.sb || 0) - 1; save(); render(false); }
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    load();

    // 深链：?tab=search&q=pick / ?seg=art / ?open=word
    const p = new URLSearchParams(location.search);
    if (p.get('tab')) S.tab = p.get('tab');
    if (p.get('seg')) S.seg = p.get('seg');
    if (p.get('q') !== null) S.q = p.get('q');
    if (p.get('art') !== null) { S.seg = 'art'; S.art = Number(p.get('art')) || 0; }
    if (p.get('sb') !== null) S.sb = Number(p.get('sb')) || 0;

    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKey);
    $('#scrim').addEventListener('click', closeSheet);
    bindLongPress();

    render(false);

    // 调试/预览：?open=pick 直接展开义项卡
    const op = p.get('open');
    if (op && wordData(op)) {
      openWord(op, null, p.get('sense') || primarySenseId(op), op);
    }
    if (p.get('chunk') !== null) {
      const v = STRAY_BIRDS[(dailySeedIndex(STRAY_BIRDS.length) + (S.sb || 0)) % STRAY_BIRDS.length];
      S.chunk['sb' + v.no] = true;
      render(false);
    }
    if (p.get('blind') !== null) { S.blind = true; render(false); }

    // 静默检查更新：不阻塞首屏、不弹窗，失败就算了
    setTimeout(checkUpdate, 1200);
  }

  let booted = false;
  const once = () => { if (!booted) { booted = true; boot(); } };
  document.addEventListener('DOMContentLoaded', once);
  if (document.readyState !== 'loading') once();
})();
