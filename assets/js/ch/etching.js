/* Chapter 04 — etching */
(function () {
  const { css, canvas, animate, plot, bind, clamp, lerp, rng, alpha } = SB;
  const hexRGB = c => { c = c.trim(); if (c[0] !== '#') return [128, 128, 128]; let s = c.slice(1); if (s.length === 3) s = s.split('').map(x => x + x).join(''); const n = parseInt(s, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

  /* ---------- LAB 4-1: etch profile cellular automaton ---------- */
  (function () {
    const NX = 200, NY = 110, CELL = 10; // nm per cell
    const MASK0 = 10, FILM0 = 30, SI0 = 80;
    const el = document.getElementById('etch');
    let P = { A: 0.95, Sm: 6, Ss: 15, W: 300 };
    let mode = 'rie';
    let mat, hp, pas, time, running = false, tick = 0, maskInit = 0;
    const r = rng(42);
    const off = document.createElement('canvas'); off.width = NX; off.height = NY;
    const octx = off.getContext('2d');
    const img = octx.createImageData(NX, NY);
    function reset() {
      mat = new Uint8Array(NX * NY); hp = new Float32Array(NX * NY); pas = new Uint8Array(NX * NY);
      const half = Math.round(P.W / CELL / 2), c = NX / 2;
      maskInit = 0;
      for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
        const i = y * NX + x;
        let m = 0;
        if (y >= SI0) m = 3; else if (y >= FILM0) m = 2; else if (y >= MASK0 && (x < c - half || x >= c + half)) m = 1;
        mat[i] = m; hp[i] = 1 + (r() - 0.5) * 0.3;
        if (m === 1) maskInit++;
      }
      time = 0; tick = 0; running = false;
      if (goBtn) goBtn.textContent = '▶ 식각';
    }
    const top = new Int16Array(NX);
    function step() {
      const bosch = mode === 'bosch';
      let phaseEtch = true, A = P.A;
      if (bosch) { const ph = tick % 34; phaseEtch = ph < 26; A = 0.3; }
      tick++;
      time += 0.2;
      for (let x = 0; x < NX; x++) { let y = 0; while (y < NY && mat[y * NX + x] === 0) y++; top[x] = y; }
      if (bosch && !phaseEtch) {
        // passivation: coat every exposed surface with polymer
        for (let y = 1; y < NY - 1; y++) for (let x = 1; x < NX - 1; x++) {
          const i = y * NX + x; if (!mat[i]) continue;
          if (!mat[i - 1] || !mat[i + 1] || !mat[i - NX] || !mat[i + NX]) pas[i] = 1;
        }
        return;
      }
      const base = 0.085;
      const kill = [];
      for (let y = 1; y < NY - 1; y++) for (let x = 1; x < NX - 1; x++) {
        const i = y * NX + x, m = mat[i]; if (!m) continue;
        let e = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && !mat[i + dy * NX + dx]) e += (dx && dy) ? 0.7 : 1;
        if (!e) continue;
        const sel = m === 1 ? P.Sm : m === 3 ? P.Ss : 1;
        const rate = base / sel;
        let dmg = 0;
        const hit = top[x] === y;
        if (hit) { dmg += A * rate * 1.0; pas[i] = 0; }
        if (!pas[i]) dmg += (1 - A) * rate * Math.min(1, e / 2.6);
        if (dmg) { hp[i] -= dmg * (0.85 + r() * 0.3); if (hp[i] <= 0) kill.push(i); }
      }
      kill.forEach(i => { mat[i] = 0; pas[i] = 0; });
    }
    function measure() {
      const c = NX / 2, half = Math.round(P.W / CELL / 2);
      let deep = FILM0; for (let y = FILM0; y < NY; y++) if (!mat[y * NX + c]) deep = y + 1;
      let under = 0;
      for (let y = FILM0; y < SI0; y++) {
        let x = c; while (x > 0 && !mat[y * NX + x - 1]) x--;
        if (!mat[y * NX + c]) under = Math.max(under, (c - half) - x);
      }
      let mask = 0; for (let i = 0; i < mat.length; i++) if (mat[i] === 1) mask++;
      let siLoss = 0; for (let x = 0; x < NX; x++) for (let y = SI0; y < NY; y++) if (!mat[y * NX + x]) siLoss = Math.max(siLoss, y - SI0 + 1);
      // thinnest remaining mask column near the opening edge
      let minMask = 99; for (let x = 0; x < NX; x++) { if (x >= c - half && x < c + half) continue; let n = 0; for (let y = MASK0; y < FILM0; y++) if (mat[y * NX + x] === 1) n++; minMask = Math.min(minMask, n); }
      return { depth: (deep - FILM0) * CELL, under: Math.max(0, under) * CELL, mask: mask / maskInit, siLoss: siLoss * CELL, minMask: minMask * CELL };
    }
    let goBtn = null;
    reset();
    const ions = []; for (let i = 0; i < 40; i++) ions.push({ x: r(), y: r(), a: 0 });
    const st = canvas(el, (ctx, w, h) => {
      const C = { 1: hexRGB(css('--fig-pr')), 2: hexRGB(css('--fig-oxide')), 3: hexRGB(css('--fig-si')) };
      const bg = hexRGB(css('--surface-2'));
      const d = img.data;
      for (let i = 0; i < NX * NY; i++) {
        const m = mat[i];
        let c = m ? C[m] : bg;
        if (m && pas[i]) c = [122, 106, 156];
        d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      const dh = w * NY / NX, oy = h - dh;
      ctx.fillStyle = css('--surface-2'); ctx.fillRect(0, 0, w, h);
      // plasma glow
      const pg = ctx.createLinearGradient(0, 0, 0, oy + dh * 0.12);
      pg.addColorStop(0, 'rgba(160,110,255,.35)'); pg.addColorStop(1, 'rgba(160,110,255,0)');
      ctx.fillStyle = pg; ctx.fillRect(0, 0, w, oy + dh * 0.12);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, oy, w, dh);
      // ions
      if (running) {
        ctx.strokeStyle = 'rgba(255,107,138,.85)'; ctx.lineWidth = 1.5;
        ions.forEach(o => {
          const X = o.x * w, Y = o.y * (oy + dh * 0.15);
          ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X - Math.sin(o.a) * 9, Y - Math.cos(o.a) * 9); ctx.stroke();
        });
      }
      // scale bar
      ctx.fillStyle = css('--text'); ctx.fillRect(12, h - 12, 100 / CELL * w / NX * 5, 3);
      ctx.font = '600 11px ' + css('--mono'); ctx.textAlign = 'left'; ctx.fillText('500 nm', 12, h - 18);
      ctx.fillStyle = css('--text-2'); ctx.font = '12px ' + css('--font');
      ctx.fillText(mode === 'bosch' ? (tick % 34 < 26 ? 'Bosch: SF₆ 식각 단계' : 'Bosch: C₄F₈ 보호막 단계') : '플라즈마', 12, 18);
    });
    function readout() {
      const m = measure();
      document.getElementById('et-t').innerHTML = time.toFixed(0) + ' <small>s</small>';
      document.getElementById('et-d').innerHTML = m.depth + ' <small>nm</small>';
      document.getElementById('et-u').innerHTML = m.under + ' <small>nm</small>';
      document.getElementById('et-m').innerHTML = (m.mask * 100).toFixed(0) + '<small>%</small>';
      document.getElementById('et-s').innerHTML = m.siLoss + ' <small>nm</small>';
      document.getElementById('et-u').parentElement.className = 'r ' + (m.depth >= 500 ? (m.under <= 20 ? 'good' : 'bad') : '');
      document.getElementById('et-m').parentElement.className = 'r ' + (m.minMask === 0 ? 'bad' : '');
      document.getElementById('et-s').parentElement.className = 'r ' + (m.depth >= 500 ? (m.siLoss <= 30 ? 'good' : 'bad') : '');
      return m;
    }
    goBtn = document.getElementById('etch-go');
    goBtn.onclick = () => { running = !running; goBtn.textContent = running ? '❚❚ 정지' : '▶ 계속'; };
    document.getElementById('etch-reset').onclick = () => { reset(); readout(); st.redraw(); };
    const root = document.getElementById('lab-etch');
    let lastW = null;
    const ctl = bind(root, v => {
      P = v;
      if (v.W !== lastW) { lastW = v.W; reset(); readout(); }
      st.redraw();
      return { A: v.A.toFixed(2), Sm: v.Sm + ' : 1', Ss: v.Ss + ' : 1', W: v.W + ' nm' };
    });
    SB.seg(document.getElementById('etch-preset'), v => {
      mode = v;
      const set = (n, val) => { root.querySelector(`[name=${n}]`).value = val; };
      if (v === 'wet') { set('A', 0); set('Sm', 40); set('Ss', 100); }
      if (v === 'rie') { set('A', 0.95); set('Sm', 6); set('Ss', 15); }
      if (v === 'bosch') { set('A', 0.3); set('Sm', 40); set('Ss', 1); }
      root.querySelector('[name=A]').disabled = v === 'bosch';
      reset(); ctl.update(); readout();
    });
    reset(); readout();
    let acc = 0;
    animate(el, dt => {
      if (running) {
        for (let k = 0; k < 3; k++) step();
        ions.forEach(o => { o.y += dt * 2.2; if (o.y > 1) { o.y = 0; o.x = 0.3 + r() * 0.4; o.a = (r() - 0.5) * (1 - P.A) * 2.2; } o.x += Math.sin(o.a) * dt * 0.3; });
        acc += dt; if (acc > 0.15) { acc = 0; const m = readout(); if (time > 400 || m.siLoss > 280) { running = false; goBtn.textContent = '▶ 계속'; } }
        st.redraw();
      }
    });
  })();

  /* ---------- LAB 4-2: plasma chamber ---------- */
  (function () {
    const el = document.getElementById('plasma');
    const hel = document.getElementById('plhist');
    let P = { p: 20, vb: 400 };
    const r = rng(9);
    const ions = [], elec = [], rad = [];
    for (let i = 0; i < 90; i++) elec.push({ x: r(), y: r() });
    for (let i = 0; i < 40; i++) rad.push({ x: r(), y: r() });
    const hist = new Float32Array(18);
    const sheathMM = () => 1 + P.vb / 250;           // sheath thickness (mm), grows with bias
    const mfpMM = () => 50 / P.p;                     // mean free path (mm) ~ 5 cm at 1 mTorr
    let geo = null;
    const st = canvas(el, (ctx, w, h) => {
      const topE = 26, botE = h - 34;
      const sPx = 24 + P.vb / 1000 * 60;
      const sheathTop = botE - sPx;
      geo = { w, h, topE, botE, sPx, sheathTop };
      // electrodes
      ctx.fillStyle = css('--fig-si-2'); ctx.fillRect(w * 0.1, 8, w * 0.8, 18);
      ctx.fillRect(w * 0.1, botE + 8, w * 0.8, 20);
      ctx.fillStyle = '#c3c8d6'; ctx.fillRect(w * 0.2, botE, w * 0.6, 8);
      ctx.fillStyle = css('--text-2'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('상부 전극 (접지)', w * 0.1 + 6, 21);
      ctx.fillText('하부 전극 + 웨이퍼 (RF 바이어스 −' + P.vb + ' V)', w * 0.1 + 6, botE + 23);
      // plasma glow
      const g = ctx.createLinearGradient(0, topE, 0, sheathTop);
      const k = clamp(P.p / 100, 0.2, 1);
      g.addColorStop(0, `rgba(170,110,255,${0.18 + 0.15 * k})`); g.addColorStop(0.5, `rgba(190,130,255,${0.3 + 0.2 * k})`); g.addColorStop(1, `rgba(170,110,255,${0.15 + 0.1 * k})`);
      ctx.fillStyle = g; ctx.fillRect(w * 0.1, topE, w * 0.8, sheathTop - topE);
      // sheath
      ctx.fillStyle = alpha(css('--text'), 0.04); ctx.fillRect(w * 0.1, sheathTop, w * 0.8, sPx);
      ctx.strokeStyle = alpha(css('--accent'), 0.6); ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(w * 0.1, sheathTop); ctx.lineTo(w * 0.9, sheathTop); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = css('--accent'); ctx.textAlign = 'right'; ctx.fillText('쉬스 ↓ 강한 전기장', w * 0.9 - 6, sheathTop + 14);
      ctx.fillStyle = css('--text-2'); ctx.textAlign = 'left'; ctx.fillText('벌크 플라즈마', w * 0.1 + 6, topE + 18);
      // particles
      ctx.fillStyle = '#7ad9ff';
      elec.forEach(e => { ctx.fillRect(w * 0.1 + e.x * w * 0.8, topE + e.y * (sheathTop - topE), 2, 2); });
      ctx.fillStyle = '#9be37a';
      rad.forEach(e => { ctx.beginPath(); ctx.arc(w * 0.1 + e.x * w * 0.8, topE + e.y * (botE - topE), 2.5, 0, Math.PI * 2); ctx.fill(); });
      ctx.strokeStyle = '#ff6b8a'; ctx.fillStyle = '#ff6b8a'; ctx.lineWidth = 1.4;
      ions.forEach(o => {
        ctx.beginPath(); ctx.arc(o.x, o.y, 3, 0, Math.PI * 2); ctx.fill();
        const sp = Math.hypot(o.vx, o.vy) || 1;
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x - o.vx / sp * 10, o.y - o.vy / sp * 10); ctx.stroke();
      });
    });
    const hst = canvas(hel, (ctx, w, h) => {
      const tot = hist.reduce((a, b) => a + b, 0) || 1;
      const data = []; hist.forEach((v, i) => { data.push([i * 5, v / tot * 100], [i * 5 + 5, v / tot * 100]); });
      plot(ctx, w, h, { pad: { l: 36, r: 8, t: 8, b: 32 }, x: { min: 0, max: 90, label: '입사각 (°)', ticks: [0, 15, 30, 45, 60, 75, 90] }, y: { min: 0, max: 60, label: '%', ticks: [0, 20, 40, 60] }, series: [{ data, color: '#ff6b8a', width: 2, fill: 'rgba(255,107,138,.2)' }] });
    });
    function readout() {
      const s = sheathMM(), l = mfpMM();
      document.getElementById('pl-mfp').innerHTML = (l >= 10 ? (l / 10).toFixed(1) + ' <small>cm</small>' : l.toFixed(2) + ' <small>mm</small>');
      document.getElementById('pl-col').innerHTML = (s / l).toFixed(2) + ' <small>회</small>';
      const tot = hist.reduce((a, b) => a + b, 0) || 1;
      const mean = hist.reduce((a, v, i) => a + v * (i * 5 + 2.5), 0) / tot;
      document.getElementById('pl-ang').innerHTML = mean.toFixed(1) + ' <small>°</small>';
    }
    bind('#lab-plasma', v => { P = v; hist.fill(0); readout(); return { p: v.p + ' mTorr', vb: v.vb + ' V' }; });
    let acc = 0;
    animate(el, dt => {
      if (!geo) return;
      const { w, botE, sPx, sheathTop, topE } = geo;
      elec.forEach(e => { e.x = (e.x + (r() - 0.5) * 0.04 + 1) % 1; e.y = clamp(e.y + (r() - 0.5) * 0.06, 0, 1); });
      rad.forEach(e => { e.x = (e.x + (r() - 0.5) * 0.01 + 1) % 1; e.y = clamp(e.y + (r() - 0.5) * 0.012, 0, 1); });
      // spawn ions at sheath edge
      for (let k = 0; k < 2; k++) if (ions.length < 70) ions.push({ x: w * (0.22 + r() * 0.56), y: sheathTop, vx: (r() - 0.5) * 30, vy: 10 + r() * 20 });
      const pxPerMM = sPx / sheathMM();
      const lamPx = mfpMM() * pxPerMM;
      const acc0 = P.vb * 2.2;
      for (let i = ions.length - 1; i >= 0; i--) {
        const o = ions[i];
        const sub = 4;
        for (let s = 0; s < sub; s++) {
          const ddt = dt / sub;
          if (o.y >= sheathTop) o.vy += acc0 * ddt;
          const dist = Math.hypot(o.vx, o.vy) * ddt;
          if (o.y >= sheathTop && r() < dist / lamPx) {
            const sp = Math.hypot(o.vx, o.vy) * 0.45, a = (r() - 0.5) * Math.PI;
            o.vx = Math.sin(a) * sp; o.vy = Math.abs(Math.cos(a)) * sp * (r() < 0.8 ? 1 : -1);
          }
          o.x += o.vx * ddt; o.y += o.vy * ddt;
        }
        if (o.y >= botE) {
          if (o.x > w * 0.2 && o.x < w * 0.8) { const ang = Math.atan2(Math.abs(o.vx), Math.max(1e-6, o.vy)) * 180 / Math.PI; hist[Math.min(17, Math.floor(ang / 5))] += 1; }
          ions.splice(i, 1);
        } else if (o.y < topE || o.x < w * 0.1 || o.x > w * 0.9) ions.splice(i, 1);
      }
      for (let i = 0; i < hist.length; i++) hist[i] *= 0.997;
      st.redraw();
      acc += dt; if (acc > 0.25) { acc = 0; hst.redraw(); readout(); }
    });
  })();

  /* ---------- LAB 4-3: endpoint game ---------- */
  (function () {
    const el = document.getElementById('ep'), xel = document.getElementById('epx');
    const FILM = 300, R0 = 10, SEL = 10, SPEED = 3;
    let nu = 8, t = 0, running = false, stopped = false, sig = [], r = rng(5);
    const rate = x => R0 * (1 + nu / 100 * (0.5 - x * x) * 2);
    const tclear = x => FILM / rate(x);
    function signal(t) {
      // area-weighted fraction still covered (disk: weight ∝ r)
      let cov = 0, tot = 0;
      for (let i = 0; i < 60; i++) { const x = (i + 0.5) / 60; tot += x; if (t < tclear(x)) cov += x; }
      return 0.25 + 0.75 * cov / tot;
    }
    const tEnd = () => tclear(1) * 1.7;
    const st = canvas(el, (ctx, w, h) => {
      const tm = Math.max(tEnd(), 10);
      plot(ctx, w, h, {
        x: { min: 0, max: tm, label: '시간 (s)' }, y: { min: 0, max: 1.15, label: 'CO* 발광 세기 (a.u.)', ticks: [0, 0.25, 0.5, 0.75, 1] },
        series: [{ data: sig, color: css('--accent'), width: 2 }],
        vlines: stopped ? [{ x: t, color: css('--rose'), label: '정지' }].concat([{ x: tclear(0), color: css('--muted'), label: '중앙 완료' }, { x: tclear(1), color: css('--teal'), label: '가장자리 완료' }]) : [],
      });
    });
    const xs = canvas(xel, (ctx, w, h) => {
      const film = h * 0.4, base = h * 0.55;
      ctx.fillStyle = css('--fig-si'); ctx.fillRect(0, base, w, h - base);
      for (let px = 0; px < w; px++) {
        const x = Math.abs(px / w * 2 - 1);
        const etched = rate(x) * t;
        const remain = Math.max(0, FILM - etched);
        const si = Math.max(0, (etched - FILM) / SEL);
        ctx.fillStyle = css('--fig-oxide');
        if (remain > 0) ctx.fillRect(px, base - remain / FILM * film, 1, remain / FILM * film);
        if (si > 0) { ctx.fillStyle = css('--surface-2'); ctx.fillRect(px, base, 1, Math.min(h - base, si * 1.5)); }
      }
      ctx.fillStyle = css('--text-2'); ctx.font = '11px ' + css('--font'); ctx.textAlign = 'left'; ctx.fillText('가장자리', 4, 12); ctx.textAlign = 'center'; ctx.fillText('중앙', w / 2, 12); ctx.textAlign = 'right'; ctx.fillText('가장자리', w - 4, 12);
    }, { height: 70 });
    const goB = document.getElementById('ep-go'), stopB = document.getElementById('ep-stop');
    goB.onclick = () => { t = 0; sig = []; running = true; stopped = false; stopB.disabled = false; goB.disabled = true; document.getElementById('ep-res').textContent = '진행 중…'; document.getElementById('ep-rr').className = 'r'; };
    stopB.onclick = () => finish();
    function finish() {
      running = false; stopped = true; stopB.disabled = true; goB.disabled = false; goB.textContent = '↺ 다시';
      const resid = Math.max(0, (tclear(1) - t) * rate(1));
      const loss = Math.max(0, (t - tclear(0)) * rate(0) / SEL);
      const rr = document.getElementById('ep-rr'), res = document.getElementById('ep-res');
      if (resid > 0.5) { res.innerHTML = `잔막 ${resid.toFixed(0)} nm ✗`; rr.className = 'r bad'; }
      else if (loss > 8) { res.innerHTML = `과식각 Si −${loss.toFixed(1)} nm ✗`; rr.className = 'r bad'; }
      else { res.innerHTML = `성공! Si 손실 ${loss.toFixed(1)} nm ✓`; rr.className = 'r good'; }
      st.redraw(); xs.redraw();
    }
    bind('#lab-ep', v => { nu = v.nu; if (!running) { st.redraw(); xs.redraw(); } return { nu: '±' + (v.nu / 2) + '%' }; });
    animate(el, dt => {
      if (!running) return;
      t += dt * SPEED;
      sig.push([t, signal(t) + (r() - 0.5) * 0.03]);
      document.getElementById('ep-t').innerHTML = t.toFixed(1) + ' <small>s</small>';
      if (t > tEnd()) finish();
      st.redraw(); xs.redraw();
    });
  })();

  SB.quiz(document.getElementById('quiz'), [
    { q: '마스크 아래로 막이 옆으로 파고드는 언더컷이 가장 크게 생기는 방식은?', o: ['반응성 이온 식각 (RIE)', '습식 식각', 'Bosch 공정', '이온 빔 밀링'], a: 1, why: '화학 용액은 방향성이 없어 모든 방향으로 같은 속도로 깎는 등방성 식각입니다.' },
    { q: '건식 식각 챔버 압력을 낮추면 일반적으로 어떻게 될까?', o: ['이온이 더 많이 충돌해 퍼진다', '평균 자유 행로가 길어져 이온이 더 수직으로 입사한다', '플라즈마가 꺼진다', '선택비가 무한대가 된다'], a: 1, why: '압력이 낮으면 기체 분자가 적어 이온이 쉬스를 충돌 없이 통과하므로 방향성이 좋아집니다. 대신 라디칼 밀도가 낮아 식각 속도는 느려질 수 있습니다.' },
    { q: '산화막 500 nm를 식각하는 동안 감광액 100 nm가 깎였다. 마스크 선택비는?', o: ['0.2', '5', '50', '500'], a: 1, why: '선택비 = 산화막 식각량 / 마스크 식각량 = 500 / 100 = 5.' },
    { q: 'Bosch 공정의 측벽에 물결무늬(scallop)가 생기는 이유는?', o: ['이온이 진동해서', '등방성 식각과 보호막 증착을 번갈아 반복해서', '웨이퍼가 회전해서', '마스크가 녹아서'], a: 1, why: '짧은 등방성 식각이 반원형으로 파고들고, 보호막이 측벽을 덮고, 바닥만 이온이 뚫는 사이클이 반복되어 물결 모양이 남습니다.' },
  ]);
})();
