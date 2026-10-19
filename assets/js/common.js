/* SemiBook common runtime: layout, theme, quiz, plotting helpers */
(function () {
  'use strict';

  const CHAPTERS = [
    { id: 'intro', n: '00', file: 'intro.html', title: '반도체 공정 한눈에 보기', short: '공정 개요', group: '시작하기',
      desc: '모래에서 칩까지, 8대 공정의 큰 그림과 나노미터 스케일 감각을 익힙니다.',
      labs: ['공정 단면 시뮬레이터', '스케일 줌', '무어의 법칙'] },
    { id: 'wafer', n: '01', file: 'wafer.html', title: '웨이퍼 제조', short: '웨이퍼', group: '전공정 (FEOL)',
      desc: '초크랄스키 결정 성장부터 웨이퍼 한 장에 몇 개의 칩이 들어가는지까지.',
      labs: ['잉곳 성장기', '다이 계산기', '결정면 뷰어'] },
    { id: 'oxidation', n: '02', file: 'oxidation.html', title: '산화 공정', short: '산화', group: '전공정 (FEOL)',
      desc: 'Deal–Grove 모델로 산화막 두께를 예측하고, 두께에 따라 바뀌는 웨이퍼 색을 관찰합니다.',
      labs: ['Deal–Grove 계산기', '박막 간섭색', '실리콘 소모'] },
    { id: 'lithography', n: '03', file: 'lithography.html', title: '포토리소그래피', short: '노광', group: '전공정 (FEOL)',
      desc: '빛으로 회로를 그리는 기술. 해상도의 한계와 회절 광학을 직접 실험합니다.',
      labs: ['스핀 코팅', '레일리 해상도', '공간상 시뮬레이터', '오버레이 정렬'] },
    { id: 'etching', n: '04', file: 'etching.html', title: '식각 공정', short: '식각', group: '전공정 (FEOL)',
      desc: '등방성 vs 이방성, 플라즈마 속 이온의 움직임과 식각 프로파일을 시뮬레이션합니다.',
      labs: ['식각 프로파일', '플라즈마 챔버', '선택비'] },
    { id: 'deposition', n: '05', file: 'deposition.html', title: '박막 증착', short: '증착', group: '전공정 (FEOL)',
      desc: 'PVD·CVD·ALD — 원자 단위 몬테카를로로 스텝 커버리지와 보이드 형성을 봅니다.',
      labs: ['스텝 커버리지 MC', 'ALD 사이클', '스퍼터링'] },
    { id: 'implant', n: '06', file: 'implant.html', title: '이온 주입과 확산', short: '이온 주입', group: '전공정 (FEOL)',
      desc: '불순물 농도 프로파일, 접합 깊이, 열처리 확산과 채널링 효과.',
      labs: ['질량 분석기', '도핑 프로파일·어닐링', '이온 궤적·채널링'] },
    { id: 'metallization', n: '07', file: 'metallization.html', title: '금속 배선과 CMP', short: '배선·CMP', group: '후공정 배선 (BEOL)',
      desc: '다마신 공정, 화학적 기계적 연마의 디싱·에로전, 배선 RC 지연.',
      labs: ['다마신 스텝', 'CMP 시뮬레이터', '배선 저항 스케일링'] },
    { id: 'yield', n: '08', file: 'yield.html', title: '테스트와 수율', short: '수율', group: '후공정 (Back-end)',
      desc: '웨이퍼 맵, 결함 밀도와 수율 모델, 칩 한 개의 원가 계산.',
      labs: ['웨이퍼 맵', '수율 모델 비교', '다이 원가'] },
    { id: 'packaging', n: '09', file: 'packaging.html', title: '패키징', short: '패키징', group: '후공정 (Back-end)',
      desc: '와이어 본딩에서 HBM·칩렛까지, 3D로 분해해 보는 첨단 패키지.',
      labs: ['HBM 3D 분해도', '패키지 진화', '인터커넥트 밀도'] },
    { id: 'transistor', n: '10', file: 'transistor.html', title: '첨단 트랜지스터', short: '첨단 소자', group: '심화',
      desc: 'Planar → FinFET → GAA. 게이트 제어력과 누설 전류를 곡선으로 비교합니다.',
      labs: ['Id–Vg 곡선', '게이트 구조 비교', '노드 로드맵'] },
    { id: 'glossary', n: '··', file: 'glossary.html', title: '용어 사전', short: '용어 사전', group: '부록',
      desc: '책 전체의 핵심 용어를 검색합니다.', labs: [] },
  ];

  const LOGO = '<svg class="brand-logo" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a6cf0"/><stop offset="1" stop-color="#1fb3a3"/></linearGradient></defs><circle cx="16" cy="16" r="14" fill="url(#lg)"/><g stroke="#fff" stroke-opacity=".85" stroke-width="1.2"><path d="M9 11h14M9 16h14M9 21h14M11 8v16M16 6.5v19M21 8v16"/></g><path d="M23.5 27.6a14 14 0 0 1-15 0z" fill="#fff" fill-opacity=".5"/></svg>';

  const ICONS = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>',
    gh: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/></svg>',
  };

  const store = {
    get(k, d) { try { const v = localStorage.getItem('semibook:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('semibook:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };

  /* ---------------- theme ---------------- */
  const savedTheme = store.get('theme', null);
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  function isDark() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  const themeListeners = [];
  function onTheme(fn) { themeListeners.push(fn); }
  function fireTheme() { cssCache = {}; themeListeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(() => fireTheme());
  }

  let cssCache = {};
  function css(name) {
    if (cssCache[name]) return cssCache[name];
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    cssCache[name] = v;
    return v;
  }

  /* ---------------- layout ---------------- */
  function buildLayout() {
    const body = document.body;
    const root = body.dataset.root || './';
    const current = body.dataset.chapter || 'home';

    const top = document.createElement('header');
    top.className = 'topbar';
    top.innerHTML = `
      <button class="icon-btn menu-btn" aria-label="목차 열기">${ICONS.menu}</button>
      <a class="brand" href="${root}index.html">${LOGO}<span>SemiBook</span><small>반도체 공정 인터랙티브 북</small></a>
      <div class="spacer"></div>
      <button class="icon-btn theme-btn" aria-label="테마 전환"></button>`;
    body.prepend(top);

    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    body.prepend(bar);

    const side = document.createElement('nav');
    side.className = 'sidebar';
    side.setAttribute('aria-label', '목차');
    const done = store.get('done', {});
    let html = `<a class="nav-item ${current === 'home' ? 'active' : ''}" href="${root}index.html"><span class="num">⌂</span>표지 · 목차</a>`;
    let lastGroup = '';
    CHAPTERS.forEach(c => {
      if (c.group !== lastGroup) { html += `<div class="nav-group">${c.group}</div>`; lastGroup = c.group; }
      html += `<a class="nav-item ${c.id === current ? 'active' : ''}" href="${root}chapters/${c.file}"><span class="num">${c.n}</span><span>${c.title}</span>${done[c.id] ? '<span class="check" title="퀴즈 완료">✓</span>' : ''}</a>`;
      if (c.id === current) html += '<div class="sub" id="subtoc"></div>';
    });
    side.innerHTML = html;
    body.insertBefore(side, top.nextSibling);

    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    body.appendChild(scrim);

    top.querySelector('.menu-btn').addEventListener('click', () => body.classList.toggle('nav-open'));
    scrim.addEventListener('click', () => body.classList.remove('nav-open'));

    const tb = top.querySelector('.theme-btn');
    const paintTB = () => { tb.innerHTML = isDark() ? ICONS.sun : ICONS.moon; };
    paintTB();
    tb.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      store.set('theme', next);
      paintTB();
      fireTheme();
    });
    onTheme(paintTB);

    // control labels are flex rows (text ↔ value); keep rich text like V<sub>GS</sub> together in one span
    document.querySelectorAll('.ctrl label, .ctrl .lbl').forEach(l => {
      const nodes = [...l.childNodes].filter(n => !(n.nodeType === 1 && (n.tagName === 'OUTPUT' || n.tagName === 'INPUT')));
      if (nodes.length < 2) return;
      const span = document.createElement('span');
      l.insertBefore(span, nodes[0]);
      nodes.forEach(n => span.appendChild(n));
    });

    // sub-TOC from h2
    const sub = document.getElementById('subtoc');
    const heads = [...document.querySelectorAll('.article h2')];
    if (sub && heads.length) {
      heads.forEach((h, i) => {
        if (!h.id) h.id = 's' + (i + 1);
        const a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent.replace(/^\s*[\d.]+\s*/, '');
        a.addEventListener('click', () => body.classList.remove('nav-open'));
        sub.appendChild(a);
      });
      const links = [...sub.querySelectorAll('a')];
      const spy = () => {
        let idx = 0;
        heads.forEach((h, i) => { if (h.getBoundingClientRect().top < 140) idx = i; });
        links.forEach((l, i) => l.classList.toggle('on', i === idx));
      };
      window.addEventListener('scroll', spy, { passive: true });
      spy();
    }

    // reading progress
    const prog = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', prog, { passive: true });
    prog();

    // pager
    const art = document.querySelector('.article');
    const idx = CHAPTERS.findIndex(c => c.id === current);
    if (art && idx >= 0) {
      const prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
      const pg = document.createElement('div');
      pg.className = 'pager';
      if (prev) pg.innerHTML += `<a class="prev" href="${prev.file}"><small>← 이전 장</small><b>${prev.n} ${prev.title}</b></a>`;
      else pg.innerHTML += `<a class="prev" href="${root}index.html"><small>← 표지</small><b>목차로 돌아가기</b></a>`;
      if (next) pg.innerHTML += `<a class="next" href="${next.file}"><small>다음 장 →</small><b>${next.n} ${next.title}</b></a>`;
      art.appendChild(pg);
    }
    if (art) {
      const f = document.createElement('footer');
      f.className = 'site-foot';
      f.innerHTML = 'SemiBook · 반도체 공정 인터랙티브 북 — 시뮬레이션은 교육용 단순화 모델입니다.';
      art.appendChild(f);
    }
  }

  /* ---------------- canvas helpers ---------------- */
  // Prepares a canvas for crisp drawing; calls draw(ctx, w, h) now and on resize.
  function canvas(el, draw, opts) {
    opts = opts || {};
    const ratio = opts.ratio || (el.getAttribute('data-ratio') ? parseFloat(el.getAttribute('data-ratio')) : 0.6);
    const state = { ctx: el.getContext('2d'), w: 0, h: 0, el, draw };
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = el.clientWidth || el.parentElement.clientWidth || 600;
      const h = opts.height ? opts.height : Math.round(w * ratio);
      el.style.height = h + 'px';
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.w = w; state.h = h;
    }
    state.redraw = () => { state.ctx.save(); state.ctx.clearRect(0, 0, state.w, state.h); state.draw(state.ctx, state.w, state.h); state.ctx.restore(); };
    size();
    let lastW = state.w;
    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        const w = el.clientWidth;
        if (Math.abs(w - lastW) > 1) { lastW = w; size(); state.redraw(); }
      }).observe(el);
    }
    onTheme(() => state.redraw());
    state.redraw();
    return state;
  }

  // Runs fn(dt) every frame only while element is visible on screen.
  function animate(el, fn) {
    let visible = false, raf = 0, last = 0, running = true;
    function loop(t) {
      if (!visible || !running) { raf = 0; return; }
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;
      fn(dt, t / 1000);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf && visible && running) { last = 0; raf = requestAnimationFrame(loop); } }
    if (window.IntersectionObserver) {
      new IntersectionObserver(es => { visible = es[0].isIntersecting; start(); }, { rootMargin: '80px' }).observe(el);
    } else { visible = true; start(); }
    return {
      pause() { running = false; },
      play() { running = true; start(); },
      get running() { return running; },
    };
  }

  /* ---------------- plot ---------------- */
  // Simple line plot on a canvas state. cfg: {x:{min,max,label,log,ticks,fmt}, y:{...}, series:[{data, color, width, dash, label, fill}], marks:[{x,y,label,color}], vlines, hlines, pad}
  function plot(ctx, W, H, cfg) {
    const pad = Object.assign({ l: 56, r: 16, t: 14, b: 42 }, cfg.pad || {});
    const X = cfg.x, Y = cfg.y;
    const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    const tf = (a, log) => log ? Math.log10(a) : a;
    const xs = v => pad.l + (tf(v, X.log) - tf(X.min, X.log)) / (tf(X.max, X.log) - tf(X.min, X.log)) * pw;
    const ys = v => pad.t + ph - (tf(v, Y.log) - tf(Y.min, Y.log)) / (tf(Y.max, Y.log) - tf(Y.min, Y.log)) * ph;
    const axis = css('--fig-axis'), grid = css('--fig-grid'), text = css('--text-2');
    ctx.font = '12px ' + css('--font');
    ctx.lineWidth = 1;

    function ticks(A) {
      if (A.ticks) return A.ticks;
      if (A.log) {
        const out = [];
        for (let e = Math.ceil(Math.log10(A.min) - 1e-9); e <= Math.floor(Math.log10(A.max) + 1e-9); e++) out.push(Math.pow(10, e));
        return out;
      }
      const span = A.max - A.min;
      const raw = span / (A.n || 6);
      const mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || mag * 10;
      const out = [];
      for (let v = Math.ceil(A.min / step) * step; v <= A.max + step * 1e-6; v += step) out.push(+v.toFixed(10));
      return out;
    }
    const fmtDefault = (v, A) => {
      if (A.log) {
        const e = Math.round(Math.log10(v));
        if (A.logFmt === 'plain') return v >= 1 ? v.toLocaleString() : String(v);
        return '10' + sup(e);
      }
      return Math.abs(v) >= 10000 ? v.toExponential(0) : String(+v.toFixed(4));
    };
    // grid + ticks
    ctx.strokeStyle = grid; ctx.fillStyle = text;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ticks(X).forEach(v => {
      const x = xs(v);
      ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + ph); ctx.stroke();
      ctx.fillText((X.fmt || fmtDefault)(v, X), x, pad.t + ph + 6);
    });
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ticks(Y).forEach(v => {
      const y = ys(v);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + pw, y); ctx.stroke();
      ctx.fillText((Y.fmt || fmtDefault)(v, Y), pad.l - 7, y);
    });
    ctx.strokeStyle = axis;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ph); ctx.lineTo(pad.l + pw, pad.t + ph); ctx.stroke();
    // labels
    ctx.fillStyle = text; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    if (X.label) ctx.fillText(X.label, pad.l + pw / 2, H - 2);
    if (Y.label) { ctx.save(); ctx.translate(13, pad.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle'; ctx.fillText(Y.label, 0, 0); ctx.restore(); }

    ctx.save();
    ctx.beginPath(); ctx.rect(pad.l, pad.t - 2, pw + 2, ph + 4); ctx.clip();
    (cfg.bands || []).forEach(b => {
      ctx.fillStyle = b.color;
      if (b.x0 != null) ctx.fillRect(xs(b.x0), pad.t, xs(b.x1) - xs(b.x0), ph);
      else ctx.fillRect(pad.l, ys(b.y1), pw, ys(b.y0) - ys(b.y1));
    });
    (cfg.series || []).forEach(s => {
      if (!s.data || !s.data.length) return;
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2.2; ctx.setLineDash(s.dash || []);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let started = false;
      s.data.forEach(([a, b]) => {
        if (!isFinite(b) || (Y.log && b <= 0) || (X.log && a <= 0)) { started = false; return; }
        const px = xs(a), py = ys(b);
        if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
      });
      ctx.stroke();
      if (s.fill) {
        ctx.lineTo(xs(s.data[s.data.length - 1][0]), pad.t + ph);
        ctx.lineTo(xs(s.data[0][0]), pad.t + ph);
        ctx.closePath(); ctx.fillStyle = s.fill; ctx.fill();
      }
      ctx.setLineDash([]);
    });
    (cfg.vlines || []).forEach(v => {
      ctx.strokeStyle = v.color || axis; ctx.setLineDash(v.dash || [4, 4]); ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(xs(v.x), pad.t); ctx.lineTo(xs(v.x), pad.t + ph); ctx.stroke(); ctx.setLineDash([]);
      if (v.label) { ctx.fillStyle = v.color || axis; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(v.label, xs(v.x) + 4, pad.t + 4); }
    });
    (cfg.hlines || []).forEach(v => {
      ctx.strokeStyle = v.color || axis; ctx.setLineDash(v.dash || [4, 4]); ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(pad.l, ys(v.y)); ctx.lineTo(pad.l + pw, ys(v.y)); ctx.stroke(); ctx.setLineDash([]);
      if (v.label) { ctx.fillStyle = v.color || axis; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(v.label, pad.l + pw - 4, ys(v.y) - 3); }
    });
    (cfg.marks || []).forEach(m => {
      if (!isFinite(m.y)) return;
      ctx.fillStyle = m.color || css('--accent');
      ctx.beginPath(); ctx.arc(xs(m.x), ys(m.y), m.r || 5, 0, Math.PI * 2); ctx.fill();
      if (m.label) {
        ctx.font = (m.bold ? '600 ' : '') + '12px ' + css('--font');
        ctx.textAlign = m.align || 'left'; ctx.textBaseline = 'bottom';
        const dx = m.align === 'right' ? -8 : m.align === 'center' ? 0 : 8;
        ctx.fillText(m.label, xs(m.x) + dx, ys(m.y) - 6);
      }
    });
    ctx.restore();
    return { xs, ys, pad, pw, ph };
  }
  function sup(e) {
    const m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(e).split('').map(c => m[c] || c).join('');
  }
  function sci(v, d) {
    if (v === 0) return '0';
    if (!isFinite(v)) return '—';
    const e = Math.floor(Math.log10(Math.abs(v)));
    const m = v / Math.pow(10, e);
    return m.toFixed(d == null ? 2 : d) + '×10' + sup(e);
  }

  /* ---------------- controls ---------------- */
  // Binds all inputs inside root; calls fn(values) on change. Outputs: <output data-for="name" data-fmt="...">
  function bind(root, fn) {
    if (typeof root === 'string') root = document.querySelector(root);
    const inputs = [...root.querySelectorAll('input, select')];
    function read() {
      const v = {};
      inputs.forEach(i => {
        if (!i.name) return;
        if (i.type === 'checkbox') v[i.name] = i.checked;
        else if (i.type === 'range' || i.type === 'number') v[i.name] = parseFloat(i.value);
        else v[i.name] = i.value;
      });
      root.querySelectorAll('.seg[data-name]').forEach(s => {
        const on = s.querySelector('button.on');
        v[s.dataset.name] = on ? on.dataset.v : null;
      });
      return v;
    }
    function update() {
      const v = read();
      const disp = fn(v) || {};
      root.querySelectorAll('output[data-for]').forEach(o => {
        const k = o.dataset.for;
        if (disp[k] != null) o.textContent = disp[k];
        else if (v[k] != null) o.textContent = v[k] + (o.dataset.unit || '');
      });
    }
    inputs.forEach(i => i.addEventListener('input', update));
    root.querySelectorAll('.seg[data-name]').forEach(s => {
      s.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        s.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        update();
      });
    });
    update();
    return { update, read };
  }

  function seg(el, fn) {
    el.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || !el.contains(b)) return;
      el.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      fn(b.dataset.v, b);
    });
  }

  function tabs(root) {
    const btns = [...root.querySelectorAll('.tabs button')];
    const panes = [...root.querySelectorAll('[data-pane]')];
    function show(id) {
      btns.forEach(b => b.classList.toggle('on', b.dataset.tab === id));
      panes.forEach(p => p.classList.toggle('hidden', p.dataset.pane !== id));
      root.dispatchEvent(new CustomEvent('tab', { detail: id }));
    }
    btns.forEach(b => b.addEventListener('click', () => show(b.dataset.tab)));
    if (btns[0]) show(btns[0].dataset.tab);
    return show;
  }

  /* ---------------- quiz ---------------- */
  function quiz(el, questions) {
    const id = document.body.dataset.chapter;
    let answered = 0, right = 0;
    el.classList.add('quiz');
    el.innerHTML = `<div class="quiz-head"><span style="font-size:22px">🧠</span><h4>확인 퀴즈</h4><span class="score">0 / ${questions.length}</span></div>`;
    const score = el.querySelector('.score');
    questions.forEach((q, qi) => {
      const d = document.createElement('div');
      d.className = 'q';
      d.innerHTML = `<div class="qt"><span class="qn">Q${qi + 1}.</span>${q.q}</div><div class="opts"></div><div class="why"></div>`;
      const opts = d.querySelector('.opts');
      q.o.forEach((o, oi) => {
        const b = document.createElement('button');
        b.className = 'opt';
        b.innerHTML = o;
        b.addEventListener('click', () => {
          if (d.classList.contains('done')) return;
          d.classList.add('done');
          answered++;
          const ok = oi === q.a;
          if (ok) right++;
          [...opts.children].forEach((x, xi) => {
            x.disabled = true;
            if (xi === q.a) x.classList.add('right');
            else if (xi === oi) x.classList.add('wrong');
          });
          d.querySelector('.why').innerHTML = (ok ? '✅ 정답! ' : '❌ 아쉬워요. ') + (q.why || '');
          score.textContent = `${right} / ${questions.length}` + (answered === questions.length ? (right === questions.length ? ' · 만점 🎉' : ' · 완료') : '');
          if (answered === questions.length && id) {
            const done = store.get('done', {}); done[id] = true; store.set('done', done);
            const link = document.querySelector('.sidebar a.nav-item.active');
            if (link && !link.querySelector('.check')) link.insertAdjacentHTML('beforeend', '<span class="check">✓</span>');
          }
        });
        opts.appendChild(b);
      });
      el.appendChild(d);
    });
  }

  /* ---------------- misc math ---------------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function interpLog(table, x) {
    // table: [[x, y], ...] ascending; log-log interpolation
    if (x <= table[0][0]) {
      const [x0, y0] = table[0], [x1, y1] = table[1];
      return y0 * Math.pow(x / x0, Math.log(y1 / y0) / Math.log(x1 / x0));
    }
    for (let i = 1; i < table.length; i++) {
      if (x <= table[i][0]) {
        const [x0, y0] = table[i - 1], [x1, y1] = table[i];
        const t = Math.log(x / x0) / Math.log(x1 / x0);
        return Math.exp(Math.log(y0) + t * (Math.log(y1) - Math.log(y0)));
      }
    }
    const n = table.length;
    const [x0, y0] = table[n - 2], [x1, y1] = table[n - 1];
    return y1 * Math.pow(x / x1, Math.log(y1 / y0) / Math.log(x1 / x0));
  }
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; };
  }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function alpha(color, a) {
    // works with #rgb/#rrggbb
    if (color[0] !== '#') return color;
    let c = color.slice(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const n = parseInt(c, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  window.SB = { CHAPTERS, store, css, isDark, onTheme, canvas, animate, plot, bind, seg, tabs, quiz, clamp, lerp, ease, interpLog, rng, gauss, alpha, sci, sup };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildLayout);
  else buildLayout();
})();
