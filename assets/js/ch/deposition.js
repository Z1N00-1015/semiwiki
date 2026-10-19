/* Chapter 05 — deposition */
(function () {
  const { css, canvas, animate, bind, clamp, lerp, rng, alpha } = SB;
  const hexRGB = c => { c = c.trim(); if (c[0] !== '#') return [128, 128, 128]; let s = c.slice(1); if (s.length === 3) s = s.split('').map(x => x + x).join(''); const n = parseInt(s, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

  /* ---------- LAB 5-1: step-coverage Monte Carlo ---------- */
  (function () {
    const NX = 160, NY = 130, FIELD = 30, TW = 24;
    const el = document.getElementById('mc');
    let P = { m: 'pvd', ar: 2, s: 1, col: false };
    let g, depth, running = false, paths = [], aldCycles = 0, aldT = 0, done = false;
    const r = rng(123);
    const off = document.createElement('canvas'); off.width = NX; off.height = NY;
    const octx = off.getContext('2d'); const img = octx.createImageData(NX, NY);
    const c0 = NX / 2 - TW / 2, c1 = NX / 2 + TW / 2;
    let voidMask = new Uint8Array(NX * NY);
    function reset() {
      g = new Uint8Array(NX * NY);
      depth = Math.round(P.ar * TW);
      for (let y = FIELD; y < NY; y++) for (let x = 0; x < NX; x++) {
        const inT = x >= c0 && x < c1 && y < FIELD + depth;
        if (!inT) g[y * NX + x] = 1;
      }
      paths = []; aldCycles = 0; running = false; done = false; voidMask.fill(0);
      if (goBtn) goBtn.textContent = '▶ 증착';
    }
    const solid = (x, y) => { if (y < 0) return false; if (y >= NY) return true; x = ((x % NX) + NX) % NX; return g[(y | 0) * NX + (x | 0)] > 0; };
    function cosDir(nx, ny) {
      // cosine-law direction about normal (nx, ny)
      const u = r(); const th = Math.asin(Math.sqrt(u)) * (r() < 0.5 ? -1 : 1);
      const c = Math.cos(th), s = Math.sin(th);
      return [nx * c - ny * s, nx * s + ny * c];
    }
    function launch() {
      let x = r() * NX, y = 0.5;
      let d;
      if (P.col && P.m === 'pvd') { const th = (r() - 0.5) * 0.12; d = [Math.sin(th), Math.cos(th)]; }
      else d = cosDir(0, 1);
      const path = [[x, y]];
      const s = P.m === 'pvd' ? 1 : P.s;
      for (let bounce = 0; bounce < 150; bounce++) {
        let hit = false;
        for (let k = 0; k < 600; k++) {
          const nx = x + d[0] * 0.5, ny = y + d[1] * 0.5;
          if (ny < 0) { if (path.length > 1) path.push([nx, ny]); return path.length > 2 ? path : null; }
          if (solid(nx, ny)) { hit = true; break; }
          x = nx; y = ny;
          if (x < 0) x += NX; if (x >= NX) x -= NX;
        }
        if (!hit) return null;
        path.push([x, y]);
        if (r() < s) {
          let ix = Math.floor(x), iy = Math.floor(y);
          // surface relaxation: hop to the best-coordinated empty neighbour (keeps films dense)
          for (let hop = 0; hop < 2; hop++) {
            let best = -1, bx = ix, by = iy;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
              const qx = (ix + dx + NX) % NX, qy = iy + dy;
              if (qy < 0 || qy >= NY || g[qy * NX + qx]) continue;
              let n = 0;
              for (let ey = -1; ey <= 1; ey++) for (let ex = -1; ex <= 1; ex++) if ((ex || ey) && solid(qx + ex, qy + ey)) n++;
              if (n > best || (n === best && r() < 0.5)) { best = n; bx = qx; by = qy; }
            }
            ix = bx; iy = by;
          }
          if (iy >= 0 && iy < NY && !g[iy * NX + ix]) g[iy * NX + ix] = 2;
          return path;
        }
        // re-emit about local surface normal
        let nx = 0, ny = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && solid(Math.floor(x) + dx, Math.floor(y) + dy)) { nx -= dx; ny -= dy; }
        const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
        if (!nx && !ny) ny = -1;
        d = cosDir(nx, ny);
      }
      return path;
    }
    function aldCycle() {
      // flood-reachable empty cells adjacent to solid become film
      const reach = flood();
      const add = [];
      for (let y = 1; y < NY - 1; y++) for (let x = 0; x < NX; x++) {
        const i = y * NX + x; if (g[i] || !reach[i]) continue;
        const xl = (x + NX - 1) % NX, xr = (x + 1) % NX;
        if (g[i - NX] || g[i + NX] || g[y * NX + xl] || g[y * NX + xr]) add.push(i);
      }
      add.forEach(i => (g[i] = 2));
      aldCycles++;
    }
    function flood() {
      const reach = new Uint8Array(NX * NY), q = [];
      for (let x = 0; x < NX; x++) if (!g[x]) { reach[x] = 1; q.push(x); }
      while (q.length) {
        const i = q.pop(), x = i % NX, y = (i / NX) | 0;
        const nb = [y > 0 ? i - NX : -1, y < NY - 1 ? i + NX : -1, y * NX + (x + 1) % NX, y * NX + (x + NX - 1) % NX];
        nb.forEach(j => { if (j >= 0 && !g[j] && !reach[j]) { reach[j] = 1; q.push(j); } });
      }
      return reach;
    }
    function measure() {
      const col = 12; let top = 0; for (let y = FIELD - 1; y >= 0 && g[y * NX + col] === 2; y--) top++;
      const cx = NX / 2; let bot = 0; for (let y = FIELD + depth - 1; y >= 0 && g[y * NX + cx] === 2; y--) bot++;
      const reach = flood(); let voids = 0;
      voidMask.fill(0);
      for (let y = FIELD; y < NY; y++) for (let x = 0; x < NX; x++) { const i = y * NX + x; if (!g[i] && !reach[i]) { voids++; voidMask[i] = 1; } }
      return { top, bot, voids };
    }
    const st = canvas(el, (ctx, w, h) => {
      if (!g) return;
      const S = hexRGB(css('--fig-si')), F = hexRGB(css('--fig-metal')), B = hexRGB(css('--surface-2')), V = hexRGB(css('--rose'));
      const d = img.data;
      for (let i = 0; i < NX * NY; i++) {
        const c = g[i] === 1 ? S : g[i] === 2 ? F : voidMask[i] ? V : B;
        d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      const sc = Math.min(w / NX, h / NY), ox = (w - NX * sc) / 2, oy = (h - NY * sc) / 2;
      ctx.drawImage(off, ox, oy, NX * sc, NY * sc);
      ctx.strokeStyle = alpha(css('--accent'), 0.55); ctx.lineWidth = 1;
      paths.forEach(p => {
        ctx.beginPath();
        p.forEach(([x, y], i) => { const X = ox + x * sc, Y = oy + y * sc; if (i && Math.abs(x - p[i - 1][0]) > NX / 2) ctx.moveTo(X, Y); else i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        ctx.stroke();
        const [lx, ly] = p[p.length - 1];
        ctx.fillStyle = css('--accent'); ctx.beginPath(); ctx.arc(ox + lx * sc, oy + ly * sc, 2.2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = css('--text-2'); ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText(P.m === 'ald' ? `ALD ${aldCycles} 사이클` : P.m.toUpperCase() + (P.m === 'cvd' ? ` · s = ${P.s.toFixed(2)}` : ''), ox + 8, oy + 16);
    });
    function readout() {
      const m = measure();
      const sc = m.top ? m.bot / m.top : 0;
      document.getElementById('mc-top').innerHTML = m.top * 10 + ' <small>nm</small>';
      document.getElementById('mc-bot').innerHTML = m.bot * 10 + ' <small>nm</small>';
      const scEl = document.getElementById('mc-sc');
      scEl.innerHTML = m.top ? (sc * 100).toFixed(0) + '<small>%</small>' : '—';
      scEl.parentElement.className = 'r ' + (m.top >= 4 ? (sc > 0.8 ? 'good' : sc < 0.4 ? 'bad' : '') : '');
      const v = document.getElementById('mc-void');
      v.textContent = m.voids ? `있음 (${m.voids}셀)` : '없음';
      v.parentElement.className = 'r ' + (m.voids ? 'bad' : m.top >= 4 ? 'good' : '');
      return m;
    }
    let goBtn = null;
    reset();
    goBtn = document.getElementById('mc-go');
    goBtn.onclick = () => { if (done) { reset(); } running = !running; goBtn.textContent = running ? '❚❚ 정지' : '▶ 계속'; };
    document.getElementById('mc-reset').onclick = () => { reset(); readout(); st.redraw(); };
    const root = document.getElementById('lab-mc');
    let lastKey = '';
    bind(root, v => {
      const key = v.m + v.ar;
      if (v.m !== P.m) {
        const sIn = root.querySelector('[name=s]');
        sIn.value = v.m === 'pvd' ? 1 : 0.1; v.s = +sIn.value;
      }
      P = v;
      document.getElementById('mc-s').classList.toggle('hidden', v.m !== 'cvd');
      document.getElementById('mc-col').classList.toggle('hidden', v.m !== 'pvd');
      if (key !== lastKey) { lastKey = key; reset(); readout(); }
      st.redraw();
      return { ar: v.ar.toFixed(1), s: v.s.toFixed(2) };
    });
    let acc = 0;
    animate(el, dt => {
      if (!running) return;
      if (P.m === 'ald') {
        aldT += dt; if (aldT > 0.18) { aldT = 0; aldCycle(); }
      } else {
        const n = P.m === 'pvd' ? 70 : 45;
        for (let i = 0; i < n; i++) { const p = launch(); if (p && r() < 0.12) { paths.push(p); if (paths.length > 14) paths.shift(); } }
      }
      acc += dt;
      if (acc > 0.2) {
        acc = 0;
        const m = readout();
        if (m.top >= 14 || aldCycles >= TW / 2 + 2) { running = false; done = true; goBtn.textContent = '↺ 다시'; paths = []; }
      }
      st.redraw();
    });
  })();

  /* ---------- LAB 5-2: ALD cycle ---------- */
  (function () {
    const el = document.getElementById('ald');
    const N = 14;
    const PH = ['① TMA 펄스', '② 퍼지 (Ar)', '③ H₂O 펄스', '④ 퍼지 (Ar)'];
    let dose = 1.5, phase = 0, pt = 0, cycle = 0, thick = 0, playing = false, stepReq = false;
    const sites = Array.from({ length: N }, () => ({ s: 'OH', h: 0 }));
    let mols = [];
    const r = rng(77);
    const dur = () => (phase === 0 || phase === 2 ? dose : 1.0);
    function nextPhase() {
      if (phase === 2) {
        // complete the cycle bookkeeping
        let grown = 0;
        sites.forEach(s => { if (s.s === 'OH2') { s.s = 'OH'; s.h++; grown++; } });
        thick += 0.11 * grown / N; cycle++;
      }
      phase = (phase + 1) % 4; pt = 0;
    }
    const st = canvas(el, (ctx, w, h) => {
      const base = h - 36, sw = (w - 40) / N;
      // substrate
      ctx.fillStyle = css('--fig-si'); ctx.fillRect(0, base, w, h - base);
      ctx.fillStyle = '#fff'; ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'left'; ctx.fillText('Si 기판', 10, h - 12);
      sites.forEach((s, i) => {
        const x = 20 + i * sw + sw / 2;
        // grown layers
        for (let k = 0; k < Math.min(s.h, 12); k++) { ctx.fillStyle = k % 2 ? '#7fb3d8' : '#93c4e6'; ctx.fillRect(x - sw / 2 + 1, base - (k + 1) * 6, sw - 2, 6); }
        const y = base - Math.min(s.h, 12) * 6;
        if (s.s === 'OH') { ball(ctx, x, y - 8, 6, '#e05050', 'O'); ball(ctx, x, y - 20, 4, '#f3f3f3'); }
        else if (s.s === 'TMA') { ball(ctx, x, y - 8, 6, '#e05050', 'O'); ball(ctx, x, y - 22, 8, '#8a7fd8', 'Al'); ball(ctx, x - 9, y - 32, 5, '#888'); ball(ctx, x + 9, y - 32, 5, '#888'); }
        else if (s.s === 'OH2') { ball(ctx, x, y - 8, 6, '#e05050', 'O'); ball(ctx, x, y - 22, 8, '#8a7fd8', 'Al'); ball(ctx, x - 9, y - 32, 5, '#e05050'); ball(ctx, x + 9, y - 32, 5, '#e05050'); }
      });
      mols.forEach(m => {
        if (m.k === 'TMA') { ball(ctx, m.x, m.y, 7, '#8a7fd8'); ball(ctx, m.x - 8, m.y - 6, 4, '#888'); ball(ctx, m.x + 8, m.y - 6, 4, '#888'); ball(ctx, m.x, m.y + 9, 4, '#888'); }
        else if (m.k === 'H2O') { ball(ctx, m.x, m.y, 6, '#e05050'); ball(ctx, m.x - 7, m.y + 5, 3.5, '#f3f3f3'); ball(ctx, m.x + 7, m.y + 5, 3.5, '#f3f3f3'); }
        else if (m.k === 'CH4') { ball(ctx, m.x, m.y, 5, '#666'); }
      });
      // phase banner
      ctx.fillStyle = alpha(css('--accent'), 0.12); ctx.fillRect(0, 0, w, 28);
      ctx.fillStyle = css('--accent'); ctx.font = '700 13px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText(PH[phase] + (playing ? '' : ' (일시정지)'), 10, 19);
      ctx.fillStyle = css('--accent'); ctx.fillRect(w - 130, 10, 120 * clamp(pt / dur(), 0, 1), 8);
      ctx.strokeStyle = css('--accent'); ctx.strokeRect(w - 130, 10, 120, 8);
    });
    function ball(ctx, x, y, r, c, label) {
      const gr = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, c); gr.addColorStop(1, c);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      if (label && r > 6) { ctx.fillStyle = '#fff'; ctx.font = '700 8px ' + css('--font'); ctx.textAlign = 'center'; ctx.fillText(label, x, y + 3); }
    }
    function readout() {
      document.getElementById('ald-ph').textContent = PH[phase];
      document.getElementById('ald-cy').textContent = cycle;
      const key = phase <= 1 ? 'TMA' : 'OH2';
      const cov = phase === 0 || phase === 1 ? sites.filter(s => s.s === 'TMA').length / N : sites.filter(s => s.s === 'OH2').length / Math.max(1, sites.filter(s => s.s === 'OH2' || s.s === 'TMA').length);
      document.getElementById('ald-cov').innerHTML = (cov * 100).toFixed(0) + '<small>%</small>';
      document.getElementById('ald-th').innerHTML = thick.toFixed(2) + ' <small>nm</small>';
    }
    function update(dt) {
      const w = st.w, h = st.h, base = h - 36, sw = (w - 40) / N;
      pt += dt;
      if (phase === 0 || phase === 2) {
        const kind = phase === 0 ? 'TMA' : 'H2O';
        if (r() < dt * 14) mols.push({ k: kind, x: 20 + r() * (w - 40), y: 34, vy: 90 + r() * 60, vx: (r() - 0.5) * 30 });
        // reaction kinetics: each free site reacts with rate 2/s
        sites.forEach(s => {
          if (phase === 0 && s.s === 'OH' && r() < dt * 2) s.s = 'TMA';
          if (phase === 2 && s.s === 'TMA' && r() < dt * 2) { s.s = 'OH2'; if (r() < 0.6) mols.push({ k: 'CH4', x: 20 + sites.indexOf(s) * sw + sw / 2, y: base - s.h * 6 - 40, vy: -60, vx: (r() - 0.5) * 40 }); }
        });
      }
      mols.forEach(m => {
        if (phase === 1 || phase === 3) { m.vx += 400 * dt; }
        m.x += m.vx * dt; m.y += m.vy * dt;
        const floor = base - 70;
        if (m.y > floor && m.vy > 0 && m.k !== 'CH4') { m.vy = -m.vy * 0.8; m.y = floor; }
      });
      mols = mols.filter(m => m.x > -20 && m.x < w + 20 && m.y > 20 && m.y < h);
      if (pt >= dur()) { nextPhase(); if (!playing) stepReq = false; }
    }
    const playB = document.getElementById('ald-play');
    playB.onclick = () => { playing = !playing; playB.textContent = playing ? '❚❚ 일시정지' : '▶ 재생'; };
    document.getElementById('ald-step').onclick = () => { stepReq = true; };
    bind('#lab-ald', v => { dose = v.dose; return { dose: v.dose.toFixed(2) + ' s' }; });
    let acc = 0;
    animate(el, dt => {
      if (playing || stepReq) update(dt);
      st.redraw();
      acc += dt; if (acc > 0.2) { acc = 0; readout(); }
    });
    readout();
  })();

  /* ---------- LAB 5-3: magnetron sputtering ---------- */
  (function () {
    const el = document.getElementById('sput');
    let P = { d: 60, p: 3, rt: 0.55 };
    const BINS = 48;
    let prof = new Float32Array(BINS), erosion = new Float32Array(BINS), emitted = 0, landed = 0;
    const atoms = [];
    const r = rng(31);
    let geo = null;
    const st = canvas(el, (ctx, w, h) => {
      const tY = 40, wY = tY + 20 + P.d / 150 * (h - tY - 80);
      const tx0 = w * 0.1, tx1 = w * 0.9, wx0 = w * 0.2, wx1 = w * 0.8;
      geo = { tY, wY, tx0, tx1, wx0, wx1, w, h };
      // magnets
      ctx.font = '700 11px ' + css('--mono'); ctx.textAlign = 'center';
      [-1, 0, 1].forEach(k => {
        const x = (tx0 + tx1) / 2 + k * (tx1 - tx0) / 2 * (k === 0 ? 0 : 0.95);
        ctx.fillStyle = k === 0 ? '#d6455d' : '#2f74d0'; ctx.fillRect(x - 12, 6, 24, 18);
        ctx.fillStyle = '#fff'; ctx.fillText(k === 0 ? 'N' : 'S', x, 19);
      });
      // target with erosion
      const em = Math.max(...erosion, 1);
      ctx.fillStyle = css('--fig-metal');
      ctx.beginPath(); ctx.moveTo(tx0, 26);
      ctx.lineTo(tx1, 26); ctx.lineTo(tx1, tY);
      for (let i = BINS - 1; i >= 0; i--) { const x = tx0 + (i + 0.5) / BINS * (tx1 - tx0); ctx.lineTo(x, tY - erosion[i] / em * 9); }
      ctx.lineTo(tx0, tY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css('--text-2'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('타깃 (−) · 레이스트랙 침식', tx0, tY + 16);
      // plasma ring glow
      [-1, 1].forEach(sg => {
        const x = (tx0 + tx1) / 2 + sg * P.rt * (tx1 - tx0) / 2;
        const gr = ctx.createRadialGradient(x, tY + 10, 2, x, tY + 10, 40);
        gr.addColorStop(0, 'rgba(180,120,255,.55)'); gr.addColorStop(1, 'rgba(180,120,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(x - 40, tY - 20, 80, 70);
      });
      // wafer + film profile
      ctx.fillStyle = css('--fig-si'); ctx.fillRect(wx0, wY, wx1 - wx0, 10);
      ctx.fillStyle = css('--muted'); ctx.fillRect(wx0 - 10, wY + 10, wx1 - wx0 + 20, 10);
      const pm = Math.max(...prof, 1);
      ctx.fillStyle = css('--fig-metal');
      ctx.beginPath(); ctx.moveTo(wx0, wY);
      for (let i = 0; i < BINS; i++) { const x = wx0 + (i + 0.5) / BINS * (wx1 - wx0); ctx.lineTo(x, wY - prof[i] / pm * 28); }
      ctx.lineTo(wx1, wY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css('--text-2'); ctx.fillText('웨이퍼 · 막 두께 분포(과장)', wx0, wY + 36);
      // atoms
      ctx.fillStyle = css('--fig-metal');
      atoms.forEach(a => { ctx.beginPath(); ctx.arc(a.x, a.y, 2.2, 0, Math.PI * 2); ctx.fill(); });
      // Ar ions hitting target
      ctx.fillStyle = '#ff6b8a';
      for (let k = 0; k < 8; k++) {
        const sg = k % 2 ? 1 : -1, x = (tx0 + tx1) / 2 + sg * P.rt * (tx1 - tx0) / 2 + (((k * 37) % 20) - 10);
        const y = tY + 40 - ((performance.now() / 6 + k * 23) % 40);
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    });
    function emitOne() {
      const { tY, wY, tx0, tx1, wx0, wx1 } = geo;
      const half = (tx1 - tx0) / 2, cx = (tx0 + tx1) / 2;
      let u = P.rt + SB.gauss(r) * 0.07; u = clamp(u, 0, 0.98) * (r() < 0.5 ? -1 : 1);
      const x = cx + u * half;
      const bi = Math.floor((u + 1) / 2 * BINS); erosion[clamp(bi, 0, BINS - 1)]++;
      const th = Math.asin(Math.sqrt(r())) * (r() < 0.5 ? -1 : 1);
      emitted++;
      return { x, y: tY + 2, vx: Math.sin(th), vy: Math.cos(th), live: true };
    }
    function trace(a) {
      const { wY, wx0, wx1, w } = geo;
      const lam = 260 / P.p;
      for (let k = 0; k < 400; k++) {
        const step = 4;
        if (r() < step / lam) { const t = r() * Math.PI * 2; a.vx = Math.cos(t); a.vy = Math.sin(t); }
        a.x += a.vx * step; a.y += a.vy * step;
        if (a.y >= wY) {
          if (a.x >= wx0 && a.x <= wx1) { prof[Math.min(BINS - 1, Math.floor((a.x - wx0) / (wx1 - wx0) * BINS))]++; landed++; }
          return;
        }
        if (a.y < geo.tY || a.x < 0 || a.x > w) return;
      }
    }
    function readout() {
      let mx = -Infinity, mn = Infinity; for (let i = 2; i < BINS - 2; i++) { mx = Math.max(mx, prof[i]); mn = Math.min(mn, prof[i]); }
      const u = (mx - mn) / (mx + mn || 1) * 100;
      const el1 = document.getElementById('sp-u');
      el1.innerHTML = landed > 500 ? u.toFixed(1) + '<small>%</small>' : '측정 중…';
      el1.parentElement.className = 'r ' + (landed > 500 ? (u < 5 ? 'good' : u > 15 ? 'bad' : '') : '');
      document.getElementById('sp-e').innerHTML = (emitted ? landed / emitted * 100 : 0).toFixed(0) + '<small>%</small>';
    }
    const clear = () => { prof.fill(0); erosion.fill(0); emitted = landed = 0; atoms.length = 0; };
    document.getElementById('sp-clear').onclick = clear;
    bind('#lab-sput', v => { P = v; clear(); return { d: v.d + ' mm', p: v.p.toFixed(1) + ' mTorr', rt: (v.rt * 100).toFixed(0) + '%' }; });
    let acc = 0;
    animate(el, dt => {
      if (!geo) return;
      for (let k = 0; k < 120; k++) trace(emitOne());
      // visible atoms
      if (atoms.length < 60) for (let k = 0; k < 3; k++) atoms.push(emitOne());
      const lam = 260 / P.p;
      for (let i = atoms.length - 1; i >= 0; i--) {
        const a = atoms[i], sp = 260 * dt;
        if (r() < sp / lam) { const t = r() * Math.PI * 2; a.vx = Math.cos(t); a.vy = Math.sin(t); }
        a.x += a.vx * sp; a.y += a.vy * sp;
        if (a.y > geo.wY || a.y < geo.tY || a.x < 0 || a.x > geo.w) atoms.splice(i, 1);
      }
      st.redraw();
      acc += dt; if (acc > 0.3) { acc = 0; readout(); }
    });
  })();

  SB.quiz(document.getElementById('quiz'), [
    { q: '종횡비가 큰 트렌치에 PVD로 금속을 채울 때 생기기 쉬운 문제는?', o: ['막이 너무 균일해진다', '입구 오버행으로 내부에 보이드가 생긴다', '막이 단결정이 된다', '바닥이 가장 두껍다'], a: 1, why: 'PVD 원자는 직진하므로 입구 모서리에 먼저 쌓여 입구를 막아 버립니다.' },
    { q: 'CVD에서 부착 계수(sticking coefficient)가 낮을수록 스텝 커버리지는?', o: ['나빠진다', '좋아진다', '변화 없다', '0이 된다'], a: 1, why: '분자가 여러 번 튕기며 깊숙한 곳까지 도달한 뒤 붙기 때문에 더 컨포멀해집니다.' },
    { q: 'ALD에서 "자기 제한(self-limiting)"이 의미하는 것은?', o: ['온도가 스스로 조절된다', '표면 반응 자리가 모두 차면 전구체를 더 흘려도 더 이상 쌓이지 않는다', '플라즈마가 스스로 꺼진다', '막이 스스로 식각된다'], a: 1, why: '한 사이클의 성장량이 공급량이 아니라 표면 반응 자리 수로 정해지므로 원자층 단위 제어가 가능합니다.' },
    { q: 'Al₂O₃ ALD의 성장 속도가 사이클당 0.11 nm라면 5 nm를 쌓는 데 필요한 사이클 수는?', o: ['약 5', '약 45', '약 450', '약 4500'], a: 1, why: '5 / 0.11 ≈ 45 사이클. 사이클당 수 초~수십 초가 걸리므로 ALD는 느린 공정입니다.' },
  ]);
})();
