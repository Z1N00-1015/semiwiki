/* Chapter 06 — ion implantation */
(function () {
  const { css, canvas, animate, plot, bind, clamp, lerp, rng, alpha, interpLog, sci } = SB;

  /* ---------- Figure 6-1: doped lattice ---------- */
  (function () {
    const svg = document.getElementById('lattice');
    function draw(mode) {
      const COLS = 7, ROWS = 4, dx = 86, dy = 66, x0 = 62, y0 = 50;
      let s = '';
      const cx = 3, cy = 1;
      for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
        const x = x0 + i * dx, y = y0 + j * dy;
        if (i < COLS - 1) {
          const missing = mode === 'p' && j === cy && i === cx; // one bond to the right of B is incomplete
          s += `<line x1="${x + 20}" y1="${y - 4}" x2="${x + dx - 20}" y2="${y - 4}" stroke="var(--border-2)" stroke-width="3"/>`;
          if (!missing) s += `<line x1="${x + 20}" y1="${y + 4}" x2="${x + dx - 20}" y2="${y + 4}" stroke="var(--border-2)" stroke-width="3"/>`;
          else s += `<circle cx="${x + dx / 2}" cy="${y + 4}" r="7" fill="none" stroke="var(--rose)" stroke-width="2.5" class="hole0"/>`;
        }
        if (j < ROWS - 1) {
          s += `<line x1="${x - 4}" y1="${y + 20}" x2="${x - 4}" y2="${y + dy - 20}" stroke="var(--border-2)" stroke-width="3"/><line x1="${x + 4}" y1="${y + 20}" x2="${x + 4}" y2="${y + dy - 20}" stroke="var(--border-2)" stroke-width="3"/>`;
        }
      }
      for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
        const x = x0 + i * dx, y = y0 + j * dy;
        const dop = (mode !== 'i' && i === cx && j === cy);
        const col = dop ? (mode === 'n' ? 'var(--fig-ndope)' : 'var(--fig-pdope)') : 'var(--fig-si-2)';
        const lab = dop ? (mode === 'n' ? 'P' : 'B') : 'Si';
        s += `<circle cx="${x}" cy="${y}" r="19" fill="${col}"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${lab}</text>`;
      }
      const X = i => x0 + i * dx, Y = j => y0 + j * dy;
      if (mode === 'n') {
        const path = `M ${X(cx) + 26} ${Y(cy) - 26} C ${X(5)} ${Y(0) - 30}, ${X(6) + 30} ${Y(2)}, ${X(5) + 43} ${Y(3) - 33} S ${X(1)} ${Y(3) + 30}, ${X(0) + 43} ${Y(2) - 33} S ${X(2)} ${Y(0) - 20}, ${X(cx) + 26} ${Y(cy) - 26}`;
        s += `<path d="${path}" fill="none" stroke="var(--blue)" stroke-opacity=".25" stroke-dasharray="4 6"/>`;
        s += `<circle r="8" fill="var(--blue)"><animateMotion dur="7s" repeatCount="indefinite" path="${path}"/></circle>`;
        s += `<text x="${X(cx) + 30}" y="${Y(cy) - 34}" font-size="12.5" fill="var(--blue)" font-weight="700">여분의 전자 e⁻</text>`;
      } else if (mode === 'p') {
        const hops = [[X(3) + dx / 2, Y(1) + 4], [X(4) + 4, Y(1) + dy / 2], [X(4) + dx / 2, Y(2) - 4], [X(5) + 4, Y(2) + dy / 2], [X(4) + dx / 2, Y(3) - 4], [X(2) + dx / 2, Y(3) - 4], [X(2) - 4, Y(2) + dy / 2], [X(1) + dx / 2, Y(2) + 4], [X(2) - 4, Y(1) + dy / 2], [X(3) + dx / 2, Y(1) + 4]];
        const vals = hops.map(p => p.join(',')).join(';');
        s += `<circle r="8" fill="none" stroke="var(--rose)" stroke-width="3"><animate attributeName="cx" dur="8s" repeatCount="indefinite" calcMode="discrete" values="${hops.map(p => p[0]).join(';')}"/><animate attributeName="cy" dur="8s" repeatCount="indefinite" calcMode="discrete" values="${hops.map(p => p[1]).join(';')}"/></circle>`;
        s += `<text x="${X(cx) + 30}" y="${Y(cy) - 26}" font-size="12.5" fill="var(--rose)" font-weight="700">빈 결합 = 정공 h⁺</text>`;
        s = s.replace('class="hole0"', 'opacity=".35"');
        void vals;
      } else {
        s += `<text x="320" y="290" text-anchor="middle" font-size="13" fill="var(--muted)">모든 전자가 결합에 묶여 있어 자유 캐리어가 거의 없음</text>`;
      }
      svg.innerHTML = s;
    }
    SB.seg(document.getElementById('dope-seg'), draw);
    draw('n');
  })();

  /* ---------- LAB 6-1: mass analyzer ---------- */
  (function () {
    const GAS = {
      bf3: [['¹⁰B⁺', 10, '#e0605f'], ['¹¹B⁺', 11, '#ff9b5c'], ['F⁺', 19, '#9be37a'], ['BF⁺', 30, '#5fb3e8'], ['BF₂⁺', 49, '#a98bf0']],
      ph3: [['H⁺', 1, '#9aa3b5'], ['P⁺', 31, '#4f86e0'], ['PH⁺', 32, '#5fd0c8'], ['PH₂⁺', 33, '#a98bf0']],
      ash3: [['H⁺', 1, '#9aa3b5'], ['As⁺', 75, '#4f86e0'], ['AsH⁺', 76, '#e8a33d']],
    };
    const R0 = 0.4, SLIT = 0.008, V = 30e3;
    const rad = (m, B) => Math.sqrt(2 * m * 1.6605e-27 * V / 1.602e-19) / B;
    const el = document.getElementById('mass');
    let P = { gas: 'bf3', B: 0.3 }, dash = 0;
    const st = canvas(el, (ctx, w, h) => {
      const Rpx = Math.min(w * 0.5, h * 0.62), k = Rpx / R0;
      const x0 = w * 0.16, y0 = h * 0.86;     // magnet entrance
      const cx = x0, cy = y0 - Rpx;           // centre of reference orbit
      const ys = cy - 40;                     // slit wall height (above exit point)
      // source
      ctx.fillStyle = css('--muted'); ctx.fillRect(8, y0 - 14, 40, 28);
      ctx.fillStyle = css('--text-2'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('이온 소스', 8, y0 + 30);
      // magnet sector
      ctx.fillStyle = alpha(css('--blue'), 0.08); ctx.strokeStyle = alpha(css('--blue'), 0.4);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, Rpx * 1.35, 0, Math.PI / 2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, Rpx * 0.65, 0, Math.PI / 2); ctx.lineTo(cx, cy); ctx.fillStyle = css('--surface-2'); ctx.fill();
      ctx.fillStyle = css('--blue'); ctx.font = '600 12px ' + css('--font');
      ctx.fillText('⊙ B = ' + P.B.toFixed(3) + ' T', cx + Rpx * 0.75, cy + Rpx * 0.75);
      // wall with slit
      const sx = cx + Rpx, sh = SLIT * k;
      ctx.fillStyle = css('--text-2');
      ctx.fillRect(cx + Rpx * 0.5, ys - 4, sx - sh - (cx + Rpx * 0.5), 8);
      ctx.fillRect(sx + sh, ys - 4, Rpx * 0.6, 8);
      ctx.fillText('분석 슬릿', sx + sh + 6, ys + 20);
      // wafer
      ctx.fillStyle = css('--fig-si'); ctx.fillRect(sx - 40, 12, 80, 8);
      ctx.fillStyle = css('--text-2'); ctx.textAlign = 'center'; ctx.fillText('가속관 → 웨이퍼', sx, 36);
      // beams
      const sp = GAS[P.gas];
      sp.forEach(([name, m, col]) => {
        const r = rad(m, P.B) * k;
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([10, 6]); ctx.lineDashOffset = -dash;
        ctx.beginPath(); ctx.moveTo(48, y0); ctx.lineTo(x0, y0);
        // arc centred at (x0, y0 - r), from angle +90° (bottom) sweeping counter-clockwise to 0°
        const ccy = y0 - r;
        const maxAng = Math.PI / 2;
        let endAng = maxAng, hitWall = false;
        // if orbit leaves magnet (r small → turns more within sector) keep it simple: 90° bend
        ctx.arc(x0, ccy, r, Math.PI / 2, Math.PI / 2 - endAng, true);
        const ex = x0 + r, ey = ccy;
        let ty = ys, pass = Math.abs(ex - sx) < sh;
        if (ey < ys) { ty = ey; pass = false; hitWall = false; }
        ctx.lineTo(ex, pass ? 20 : Math.max(ty, Math.min(ey, ys)));
        ctx.stroke(); ctx.setLineDash([]);
        if (!pass && ey >= ys) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ex, ys + 4, 5, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = col; ctx.font = '700 12px ' + css('--font'); ctx.textAlign = 'left';
        if (ex < w - 20 && ex > 0) ctx.fillText(name, ex + 5, Math.min(h - 6, Math.max(ty, ey) + 20 + (m % 3) * 12));
        void hitWall;
      });
    });
    function readout() {
      const sp = GAS[P.gas];
      const pass = sp.filter(([, m]) => Math.abs(rad(m, P.B) - R0) < SLIT);
      const ion = document.getElementById('ms-ion');
      ion.textContent = pass.length ? pass.map(s => s[0]).join(', ') : '없음';
      document.getElementById('ms-r').className = 'r ' + (pass.length === 1 ? 'good' : pass.length > 1 ? 'bad' : '');
      document.getElementById('ms-list').innerHTML = '<b>필요한 B 값</b> (눌러서 설정)<br>' + sp.map(([n, m]) => `<a href="#" data-b="${(rad(m, 1) / R0).toFixed(3)}">${n} (m=${m})</a> → ${(rad(m, 1) / R0).toFixed(3)} T`).join('<br>');
    }
    const root = document.getElementById('lab-mass');
    const ctl = bind(root, v => { P = v; readout(); st.redraw(); return { B: v.B.toFixed(3) + ' T' }; });
    document.getElementById('ms-list').addEventListener('click', e => {
      const a = e.target.closest('a[data-b]'); if (!a) return; e.preventDefault();
      root.querySelector('[name=B]').value = a.dataset.b; ctl.update();
    });
    animate(el, dt => { dash += dt * 40; st.redraw(); });
  })();

  /* ---------- LAB 6-2: doping profile ---------- */
  (function () {
    const RNG = { // energy keV → [Rp nm, dRp nm]
      B: [[1, 5.5, 4], [10, 33.3, 17.1], [30, 98.7, 37.1], [50, 160.8, 50.4], [100, 306.8, 71.0], [200, 529.9, 92.1]],
      P: [[1, 3.0, 1.6], [10, 13.9, 6.9], [30, 39.8, 18.1], [50, 65.5, 27.6], [100, 123.8, 45.6], [200, 253.9, 77.5]],
      As: [[1, 2.6, 1.1], [10, 9.7, 3.6], [30, 21.5, 7.9], [50, 32.2, 11.8], [100, 58.2, 20.7], [200, 110.5, 37.5]],
    };
    const DIFF = { B: [0.76, 3.46], P: [3.85, 3.66], As: [0.32, 3.56] };
    const el = document.getElementById('prof');
    let P = { sp: 'B', E: 30, lq: 14, lb: 16, an: 'rta', T: 1050 };
    function calc() {
      const t = RNG[P.sp];
      const rp = interpLog(t.map(r => [r[0], r[1]]), P.E), drp = interpLog(t.map(r => [r[0], r[2]]), P.E);
      const Q = Math.pow(10, P.lq), NB = Math.pow(10, P.lb);
      const [D0, Ea] = DIFF[P.sp];
      const D = D0 * Math.exp(-Ea / (8.617e-5 * (P.T + 273.15)));
      const time = P.an === 'rta' ? 1 : P.an === 'fur' ? 1800 : 0;
      const Dt = D * time * 1e14; // nm²
      const s1 = Math.sqrt(drp * drp + 2 * Dt);
      const pk0 = Q / (Math.sqrt(2 * Math.PI) * drp * 1e-7), pk1 = Q / (Math.sqrt(2 * Math.PI) * s1 * 1e-7);
      const xj = pk1 > NB ? rp + s1 * Math.sqrt(2 * Math.log(pk1 / NB)) : null;
      return { rp, drp, s1, pk0, pk1, NB, Dt, xj, Q };
    }
    const st = canvas(el, (ctx, w, h) => {
      const c = calc();
      const xmax = clamp(Math.max(c.rp + 5 * c.s1, c.xj ? c.xj * 1.3 : 0), 30, 1500);
      const prof = (s, pk) => { const a = []; for (let i = 0; i <= 240; i++) { const x = i / 240 * xmax; a.push([x, pk * Math.exp(-Math.pow(x - c.rp, 2) / (2 * s * s))]); } return a; };
      const col = P.sp === 'B' ? css('--fig-pdope') : css('--fig-ndope');
      const series = [{ data: prof(c.drp, c.pk0), color: alpha(col, 0.6), width: 1.8, dash: [6, 4] }];
      if (P.an !== 'none') series.push({ data: prof(c.s1, c.pk1), color: col, width: 3, fill: alpha(col, 0.12) });
      plot(ctx, w, h, {
        x: { min: 0, max: xmax, label: '깊이 (nm)' },
        y: { min: 1e14, max: 1e22, log: true, label: '농도 (cm⁻³)' },
        series,
        hlines: [{ y: c.NB, color: css('--muted'), label: '기판 농도 N_B' }],
        vlines: c.xj && c.xj < xmax ? [{ x: c.xj, color: css('--accent'), label: 'x_j' }] : [],
        bands: [{ y0: 1e14, y1: c.NB, color: alpha(P.sp === 'B' ? css('--fig-ndope') : css('--fig-pdope'), 0.06) }],
      });
      ctx.fillStyle = css('--text-2'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'right';
      ctx.fillText(P.an === 'none' ? '주입 직후' : '점선: 주입 직후 · 실선: 어닐링 후', w - 20, h - 52);
    });
    bind('#lab-prof', v => {
      P = v;
      const c = calc();
      document.getElementById('pf-rp').innerHTML = c.rp.toFixed(1) + ' <small>nm</small>';
      document.getElementById('pf-drp').innerHTML = c.drp.toFixed(1) + ' <small>nm</small>';
      document.getElementById('pf-pk').innerHTML = sci(P.an === 'none' ? c.pk0 : c.pk1, 1);
      document.getElementById('pf-dt').innerHTML = (2 * Math.sqrt(c.Dt)).toFixed(1) + ' <small>nm</small>';
      document.getElementById('pf-xj').innerHTML = c.xj ? c.xj.toFixed(0) + ' <small>nm</small>' : '접합 없음';
      document.querySelector('#lab-prof [name=T]').disabled = v.an === 'none';
      st.redraw();
      return { E: v.E + ' keV', lq: sci(Math.pow(10, v.lq), 1) + ' cm⁻²', lb: sci(Math.pow(10, v.lb), 1) + ' cm⁻³', T: v.T + ' °C' };
    });
  })();

  /* ---------- LAB 6-3: channeling ---------- */
  (function () {
    const el = document.getElementById('chan');
    let P = { tilt: 0, E: 40, mat: 'xtal' };
    const r = rng(2024);
    const BINS = 40;
    let hist = new Float32Array(BINS), depths = [], traces = [];
    let geo = null;
    function run() {
      const { W, H, a, x0, y0 } = geo;
      let x = W * 0.25 + r() * W * 0.5, y = 0;
      let ang = P.tilt * Math.PI / 180 + (r() - 0.5) * 0.01;
      let E = P.E;
      const path = [[x, y]];
      const ds = 1.5, rc = a * 0.2, lam = a * 0.55;
      for (let k = 0; k < 4000 && E > 0.6; k++) {
        if (P.mat === 'xtal') {
          const ic = Math.round((x - x0) / a), xc = x0 + ic * a, dx = x - xc;
          const jr = Math.round((y - y0) / a), ya = y0 + jr * a;
          const d = Math.hypot(dx, y - ya);
          // continuum steering by atomic rows (only matters near alignment)
          ang += Math.sign(dx) * Math.exp(-Math.abs(dx) / (a * 0.12)) * 0.22 * ds / (a * Math.sqrt(E));
          if (d < rc && y > 2) { ang += (r() - 0.5) * Math.min(2.2, 30 / E); E *= 0.8; }
          ang += (r() - 0.5) * 0.02; // thermal vibration → gradual dechanneling
        } else if (r() < ds / lam) { ang += (r() - 0.5) * Math.min(2.2, 30 / E); E *= 0.8; }
        E -= 0.04 * Math.sqrt(E) * ds;
        x += Math.sin(ang) * ds; y += Math.cos(ang) * ds;
        if (y < 0) break;
        if (k % 4 === 0) path.push([x, y]);
        if (y > H) { y = H; break; }
      }
      path.push([x, y]);
      return { path, depth: Math.max(0, y) };
    }
    const st = canvas(el, (ctx, w, h) => {
      const W = w * 0.78, H = h - 34, a = 18;
      geo = { W, H, a, x0: a / 2, y0: 34 + a / 2 };
      const top = 34;
      ctx.fillStyle = alpha(css('--fig-si'), 0.18); ctx.fillRect(0, top, W, H - top + 34);
      // atoms
      ctx.fillStyle = alpha(css('--fig-si-2'), 0.85);
      if (P.mat === 'xtal') {
        for (let x = a / 2; x < W; x += a) for (let y = top + a / 2; y < h; y += a) { ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill(); }
      } else {
        const rr = rng(99);
        for (let i = 0; i < (W / a) * ((h - top) / a); i++) { ctx.beginPath(); ctx.arc(rr() * W, top + rr() * (h - top), 3.2, 0, Math.PI * 2); ctx.fill(); }
      }
      // beam arrow
      const ta = P.tilt * Math.PI / 180;
      ctx.strokeStyle = css('--accent'); ctx.lineWidth = 2; ctx.fillStyle = css('--accent');
      ctx.beginPath(); ctx.moveTo(W / 2 - Math.sin(ta) * 28, 4); ctx.lineTo(W / 2, 30); ctx.stroke();
      ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'left'; ctx.fillText(`이온 빔 (${P.tilt}°)`, W / 2 + 8, 18);
      // traces (path y offset by top)
      traces.forEach((t, i) => {
        ctx.strokeStyle = alpha(css('--fig-ndope'), 0.25 + 0.6 * (i / traces.length)); ctx.lineWidth = 1.3;
        ctx.beginPath(); t.path.forEach(([x, y], k) => { k ? ctx.lineTo(x, y + top) : ctx.moveTo(x, y + top); }); ctx.stroke();
        const [lx, ly] = t.path[t.path.length - 1];
        ctx.fillStyle = css('--rose'); ctx.beginPath(); ctx.arc(lx, ly + top, 2.5, 0, Math.PI * 2); ctx.fill();
      });
      // histogram
      const hx = W + 10, hw = w - hx - 6;
      const mx = Math.max(...hist, 1);
      ctx.fillStyle = css('--surface'); ctx.fillRect(hx - 4, top, hw + 4, h - top);
      ctx.fillStyle = alpha(css('--accent'), 0.75);
      for (let i = 0; i < BINS; i++) { const bh = (h - top) / BINS; ctx.fillRect(hx, top + i * bh, hist[i] / mx * hw, bh - 1); }
      ctx.fillStyle = css('--text-2'); ctx.font = '11px ' + css('--font'); ctx.textAlign = 'left'; ctx.fillText('정지 깊이', hx, top - 6);
      ctx.fillStyle = css('--muted'); ctx.fillText('↓ 깊이', 6, top + 14);
    });
    function readout() {
      if (!depths.length) { document.getElementById('ch-mean').textContent = '—'; document.getElementById('ch-tail').textContent = '—'; return; }
      const H = geo.H, nmPer = 300 / H;
      const mean = depths.reduce((a, b) => a + b, 0) / depths.length;
      const tail = depths.filter(d => d > H * 0.55).length / depths.length;
      document.getElementById('ch-mean').innerHTML = (mean * nmPer).toFixed(0) + ' <small>nm</small>';
      const t = document.getElementById('ch-tail');
      t.innerHTML = (tail * 100).toFixed(1) + '<small>%</small>';
      t.parentElement.className = 'r ' + (tail > 0.1 ? 'bad' : 'good');
    }
    const clear = () => { hist = new Float32Array(BINS); depths = []; traces = []; };
    document.getElementById('ch-clear').onclick = () => { clear(); st.redraw(); readout(); };
    bind('#lab-chan', v => { P = v; clear(); st.redraw(); readout(); return { tilt: v.tilt + '°', E: v.E + ' keV' }; });
    let acc = 0, spawn = 0;
    animate(el, dt => {
      if (!geo) return;
      spawn += dt;
      if (spawn > 0.06 && depths.length < 2500) {
        spawn = 0;
        for (let k = 0; k < 4; k++) {
          const t = run();
          depths.push(t.depth);
          hist[Math.min(BINS - 1, Math.floor(t.depth / geo.H * BINS))]++;
          if (k === 0) { traces.push(t); if (traces.length > 30) traces.shift(); }
        }
        st.redraw();
      }
      acc += dt; if (acc > 0.3) { acc = 0; readout(); }
    });
  })();

  SB.quiz(document.getElementById('quiz'), [
    { q: '실리콘에 인(P)을 도핑하면 어떤 반도체가 될까?', o: ['p형, 정공이 다수 캐리어', 'n형, 전자가 다수 캐리어', '진성 반도체', '절연체'], a: 1, why: '인은 최외각 전자가 5개라 결합 후 전자 1개가 남아 n형이 됩니다.' },
    { q: '이온 주입 에너지를 높이면 도핑 프로파일은?', o: ['더 얕고 날카로워진다', '더 깊어지고 넓게 퍼진다', '변화 없다', '농도가 높아진다'], a: 1, why: 'Rp와 ΔRp가 모두 커집니다. 같은 도즈면 최대 농도는 오히려 낮아집니다.' },
    { q: '질량 분석 자석에서 같은 전압으로 가속된 ¹⁰B⁺와 ¹¹B⁺ 중 더 큰 반지름으로 휘는 것은?', o: ['¹⁰B⁺', '¹¹B⁺', '똑같다', '자기장 방향에 따라 다르다'], a: 1, why: 'r = √(2mV/q)/B 이므로 무거운 ¹¹B⁺가 덜 휘어 반지름이 큽니다.' },
    { q: '이온 주입 시 웨이퍼를 약 7° 기울이는 주된 이유는?', o: ['빔을 넓게 퍼뜨리려고', '채널링을 방지하려고', '웨이퍼를 식히려고', '마스크 정렬을 위해'], a: 1, why: '결정 축과 정렬된 방향으로 들어가면 원자 열 사이로 이온이 깊이 파고드는 채널링이 생기기 때문입니다.' },
    { q: 'RTA(급속 열처리)를 쓰는 가장 큰 목적은?', o: ['확산을 최대화', '도펀트 활성화는 하되 확산(열 예산)을 최소화', '산화막 성장', '웨이퍼 세정'], a: 1, why: '확산 길이는 √(Dt)에 비례하므로 시간을 극단적으로 줄이면 활성화에 필요한 고온을 쓰면서도 접합을 얕게 유지할 수 있습니다.' },
  ]);
})();
