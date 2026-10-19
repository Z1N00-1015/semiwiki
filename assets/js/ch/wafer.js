/* Chapter 01 — wafer */
(function () {
  const { css, canvas, animate, bind, clamp, lerp, rng, alpha } = SB;

  /* ---------- Figure 1-1: purity ---------- */
  (function () {
    const rows = [
      ['규석 (석영 모래)', 'SiO₂', 2, '~99%'],
      ['금속급 실리콘 MG-Si', '아크로 환원', 1.7, '98%'],
      ['트리클로로실란 증류', 'SiHCl₃', 6, '99.9999%'],
      ['폴리실리콘 EG-Si', '지멘스 공정', 11, '11N'],
      ['단결정 잉곳', 'CZ 성장', 11.5, '11N + 단결정'],
    ];
    const svg = document.getElementById('purity');
    let s = '';
    const x0 = 250, x1 = 760, rowH = 42;
    for (let n = 0; n <= 11; n++) {
      const x = x0 + n / 12 * (x1 - x0);
      s += `<line x1="${x}" y1="10" x2="${x}" y2="${10 + rows.length * rowH}" stroke="var(--fig-grid)"/>`;
      if (n % 2 === 1 || n === 11) s += `<text x="${x}" y="${rows.length * rowH + 28}" font-size="12" text-anchor="middle" fill="var(--muted)">${n}N</text>`;
    }
    rows.forEach(([a, b, nines, v], i) => {
      const y = 14 + i * rowH;
      const wbar = nines / 12 * (x1 - x0);
      s += `<text x="0" y="${y + 16}" font-size="14.5" font-weight="700" fill="var(--text)">${a}</text>`;
      s += `<text x="0" y="${y + 33}" font-size="12" fill="var(--muted)">${b}</text>`;
      s += `<rect x="${x0}" y="${y + 4}" width="0" height="24" rx="5" fill="url(#pg)"><animate attributeName="width" from="0" to="${wbar}" dur="1.2s" begin="${i * 0.25}s" fill="freeze"/></rect>`;
      s += `<text x="${x0 + wbar + 8}" y="${y + 21}" font-size="13" font-family="var(--mono)" font-weight="700" fill="var(--accent)">${v}</text>`;
    });
    svg.innerHTML = `<defs><linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="var(--teal)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs>` + s;
  })();

  /* ---------- Figure 1-2: shaping ---------- */
  (function () {
    const steps = [
      ['잉곳', '<rect x="-18" y="-46" width="36" height="86" rx="6" fill="url(#ing)"/><path d="M-18 -40 Q0 -54 18 -40" fill="var(--fig-si-2)"/>'],
      ['와이어 절단', '<rect x="-18" y="-46" width="36" height="86" rx="6" fill="url(#ing)"/>' + [ -30, -14, 2, 18, 34].map(y => `<line x1="-34" y1="${y}" x2="34" y2="${y}" stroke="var(--rose)" stroke-width="1.5"/>`).join('')],
      ['연삭·래핑', '<ellipse cx="0" cy="8" rx="40" ry="12" fill="var(--fig-si)"/><ellipse cx="0" cy="-12" rx="34" ry="9" fill="none" stroke="var(--muted)" stroke-dasharray="4 3"/><path d="M-6 -36 v14 M6 -36 v14" stroke="var(--muted)" stroke-width="2"/>'],
      ['화학 식각', '<ellipse cx="0" cy="8" rx="40" ry="12" fill="var(--fig-si)"/><g fill="var(--teal)"><circle cx="-20" cy="-20" r="3"/><circle cx="4" cy="-30" r="3"/><circle cx="22" cy="-16" r="3"/><circle cx="-6" cy="-12" r="2"/></g>'],
      ['경면 연마', '<ellipse cx="0" cy="8" rx="40" ry="12" fill="url(#mir)"/><path d="M-22 4 L-8 -2" stroke="#fff" stroke-width="3" opacity=".8"/>'],
      ['세정·검사', '<ellipse cx="0" cy="8" rx="40" ry="12" fill="url(#mir)"/><circle cx="18" cy="-24" r="12" fill="none" stroke="var(--accent)" stroke-width="3"/><line x1="26" y1="-16" x2="36" y2="-6" stroke="var(--accent)" stroke-width="3"/>'],
    ];
    const svg = document.getElementById('shaping');
    let s = `<defs><linearGradient id="ing" x1="0" x2="1"><stop offset="0" stop-color="var(--fig-si-2)"/><stop offset=".45" stop-color="#e6e9f0"/><stop offset="1" stop-color="var(--fig-si-2)"/></linearGradient>
      <linearGradient id="mir" x1="0" x2="1"><stop offset="0" stop-color="#8f9ab3"/><stop offset=".4" stop-color="#eef1f7"/><stop offset="1" stop-color="#9aa5bd"/></linearGradient>
      <marker id="ar2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>`;
    steps.forEach(([t, g], i) => {
      const x = 70 + i * 144;
      s += `<g transform="translate(${x},90)">${g}</g><text x="${x}" y="180" text-anchor="middle" font-size="14" font-weight="700" fill="var(--text)">${t}</text>`;
      if (i < steps.length - 1) s += `<line x1="${x + 50}" y1="95" x2="${x + 94}" y2="95" stroke="var(--muted)" stroke-width="2" marker-end="url(#ar2)"/>`;
    });
    svg.innerHTML = s;
  })();

  /* ---------- LAB 1-1: Czochralski ---------- */
  (function () {
    const el = document.getElementById('cz');
    const P = { v: 1, dT: 0, rpm: 12 };
    let S;
    function reset() { S = { L: 0, d: 5, prof: [], phase: 'idle', rot: 0, t: 0, running: false }; }
    reset();
    const G = 7.7; // K/mm, interface gradient (simplified constant)
    const dss = () => clamp(300 * Math.pow(1 / P.v, 0.55) * (1 - P.dT * 0.045), 40, 440);
    const vg = () => P.v / G;
    function phaseName(p) { return { idle: '대기', neck: '넥킹', shoulder: '어깨', body: '몸통', tail: '꼬리', done: '완료' }[p]; }

    const st = canvas(el, (ctx, w, h) => {
      const meltY = h * 0.74;
      const sz = (h * 0.6) / 1000; // px per mm length
      const sd = (w * 0.56) / 450; // px per mm diameter
      const cx = w / 2;
      const glow = clamp(0.55 + P.dT * 0.05, 0.15, 1);
      // chamber
      ctx.fillStyle = alpha(css('--text'), 0.05);
      ctx.fillRect(cx - w * 0.42, 10, w * 0.84, h - 20);
      // heaters
      for (let i = 0; i < 6; i++) {
        const y = meltY - 10 + i * 12;
        ctx.fillStyle = `rgba(255,${90 + 60 * glow},40,${0.35 + 0.5 * glow})`;
        ctx.fillRect(cx - w * 0.40, y, 10, 7); ctx.fillRect(cx + w * 0.40 - 10, y, 10, 7);
      }
      // crucible
      const cw = w * 0.62, ch = h * 0.18;
      ctx.fillStyle = alpha('#d8e4ee', 0.65);
      ctx.beginPath(); ctx.moveTo(cx - cw / 2 - 6, meltY - 24); ctx.lineTo(cx - cw / 2 - 6, meltY + ch - 16); ctx.quadraticCurveTo(cx - cw / 2 - 6, meltY + ch + 6, cx - cw / 2 + 24, meltY + ch + 6);
      ctx.lineTo(cx + cw / 2 - 24, meltY + ch + 6); ctx.quadraticCurveTo(cx + cw / 2 + 6, meltY + ch + 6, cx + cw / 2 + 6, meltY + ch - 16); ctx.lineTo(cx + cw / 2 + 6, meltY - 24); ctx.closePath(); ctx.fill();
      // melt
      const mg = ctx.createLinearGradient(0, meltY, 0, meltY + ch);
      mg.addColorStop(0, `rgba(255,${150 + 60 * glow},60,1)`); mg.addColorStop(1, `rgba(220,${70 + 40 * glow},20,1)`);
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.moveTo(cx - cw / 2, meltY); ctx.lineTo(cx - cw / 2, meltY + ch - 16); ctx.quadraticCurveTo(cx - cw / 2, meltY + ch, cx - cw / 2 + 24, meltY + ch);
      ctx.lineTo(cx + cw / 2 - 24, meltY + ch); ctx.quadraticCurveTo(cx + cw / 2, meltY + ch, cx + cw / 2, meltY + ch - 16); ctx.lineTo(cx + cw / 2, meltY); ctx.closePath(); ctx.fill();
      // melt surface shimmer
      ctx.strokeStyle = 'rgba(255,240,200,.6)'; ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        for (let x = cx - cw / 2 + 4; x < cx + cw / 2 - 4; x += 6) ctx.lineTo(x, meltY + 4 + i * 6 + Math.sin(x * 0.05 + S.t * 3 + i) * 1.2);
        ctx.stroke();
      }
      // seed shaft
      const topY = meltY - S.L * sz;
      ctx.strokeStyle = css('--muted'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, topY - 14); ctx.stroke();
      ctx.fillStyle = css('--fig-si-2'); ctx.fillRect(cx - 4, topY - 16, 8, 16);
      // ingot
      if (S.prof.length > 1) {
        const pts = S.prof;
        const ig = ctx.createLinearGradient(cx - 230 * sd, 0, cx + 230 * sd, 0);
        ig.addColorStop(0, '#5f6880'); ig.addColorStop(0.42, '#e9ecf3'); ig.addColorStop(0.55, '#c9cfdc'); ig.addColorStop(1, '#58617a');
        ctx.fillStyle = ig;
        ctx.beginPath();
        pts.forEach((p, i) => { const y = meltY - (S.L - p.z) * sz; const x = cx - p.d / 2 * sd; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; ctx.lineTo(cx + p.d / 2 * sd, meltY - (S.L - p.z) * sz); }
        ctx.closePath(); ctx.fill();
        // defect tint bands
        pts.forEach((p, i) => {
          if (i === 0 || !p.type) return;
          const q = pts[i - 1];
          const y0 = meltY - (S.L - q.z) * sz, y1 = meltY - (S.L - p.z) * sz;
          ctx.fillStyle = p.type === 'V' ? 'rgba(70,120,255,.18)' : p.type === 'I' ? 'rgba(255,70,90,.18)' : 'rgba(0,0,0,0)';
          ctx.fillRect(cx - p.d / 2 * sd, y1, p.d * sd, y0 - y1 + 0.5);
        });
        // rotation stripes
        ctx.save();
        ctx.beginPath();
        pts.forEach((p, i) => { const y = meltY - (S.L - p.z) * sz; const x = cx - p.d / 2 * sd; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; ctx.lineTo(cx + p.d / 2 * sd, meltY - (S.L - p.z) * sz); }
        ctx.closePath(); ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2;
        for (let k = 0; k < 6; k++) {
          const ph = (S.rot + k / 6 * Math.PI * 2) % (Math.PI * 2);
          if (ph > Math.PI) continue;
          const xo = Math.cos(ph);
          ctx.beginPath(); ctx.moveTo(cx + xo * 220 * sd, topY); ctx.lineTo(cx + xo * 220 * sd, meltY); ctx.stroke();
        }
        ctx.restore();
        // meniscus glow
        const dNow = S.d * sd;
        const mgl = ctx.createRadialGradient(cx, meltY, dNow / 2 * 0.8, cx, meltY, dNow / 2 + 14);
        mgl.addColorStop(0, 'rgba(255,255,230,0)'); mgl.addColorStop(0.6, 'rgba(255,250,210,.9)'); mgl.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = mgl; ctx.beginPath(); ctx.ellipse(cx, meltY + 1, dNow / 2 + 14, 7, 0, 0, Math.PI * 2); ctx.fill();
      }
      // scale: target 300 mm guide
      const gx = 300 / 2 * sd;
      ctx.strokeStyle = alpha(css('--accent'), 0.6); ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - gx, 20); ctx.lineTo(cx - gx, meltY - 4); ctx.moveTo(cx + gx, 20); ctx.lineTo(cx + gx, meltY - 4); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = css('--accent'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('목표 Ø300 mm', cx + gx + 4, 30);
      ctx.fillStyle = css('--text-2'); ctx.textAlign = 'left';
      ctx.fillText('Si 융액 1414 °C' + (P.dT ? (P.dT > 0 ? ' +' : ' ') + P.dT.toFixed(1) : ''), cx - cw / 2 + 6, meltY + ch - 8);
      // legend tint
      ctx.font = '11.5px ' + css('--font');
      ctx.fillStyle = 'rgba(70,120,255,.9)'; ctx.fillText('■ 공공 우세', 14, h - 30);
      ctx.fillStyle = 'rgba(255,70,90,.9)'; ctx.fillText('■ 격자간 우세', 14, h - 14);
    });

    function step(dt) {
      S.t += dt;
      S.rot += dt * P.rpm / 60 * Math.PI * 2 * 0.5;
      if (!S.running) return;
      const minPerSec = 14;
      const dL = P.v * minPerSec * dt;
      let target;
      if (S.phase === 'neck') { target = 5; if (S.L > 40) S.phase = 'shoulder'; }
      if (S.phase === 'shoulder') { target = Math.min(dss(), 5 + (S.L - 40) * 2.4); if (S.L > 40 && target >= dss() - 1) S.phase = 'body'; }
      if (S.phase === 'body') { target = dss(); if (S.L > 880) S.phase = 'tail'; }
      if (S.phase === 'tail') { target = Math.max(0, S.d - dL * 2.2); if (S.d < 12) { S.phase = 'done'; S.running = false; runBtn.textContent = '▶ 성장 시작'; } }
      const k = S.phase === 'tail' ? 1 : 1 - Math.exp(-dL / 22);
      S.d += (target - S.d) * k;
      S.L += dL;
      const r = vg();
      const type = S.phase === 'body' || S.phase === 'tail' ? (r > 0.14 ? 'V' : r < 0.12 ? 'I' : 'P') : null;
      S.prof.push({ z: S.L, d: S.d, type });
      if (S.prof.length > 1500) S.prof = S.prof.filter((p, i) => i % 2 === 0 || i === S.prof.length - 1);
    }
    const runBtn = document.getElementById('cz-run');
    runBtn.onclick = () => {
      if (S.phase === 'done') reset();
      if (S.phase === 'idle') { S.phase = 'neck'; S.prof.push({ z: 0, d: 5 }); }
      S.running = !S.running;
      runBtn.textContent = S.running ? '❚❚ 일시정지' : '▶ 계속';
    };
    document.getElementById('cz-reset').onclick = () => { reset(); runBtn.textContent = '▶ 성장 시작'; st.redraw(); readout(); };
    function readout() {
      const dr = document.getElementById('cz-dr');
      document.getElementById('cz-d').innerHTML = S.d.toFixed(0) + ' <small>mm</small>';
      document.getElementById('cz-l').innerHTML = S.L.toFixed(0) + ' <small>mm</small>';
      document.getElementById('cz-ph').textContent = phaseName(S.phase);
      const r = vg();
      document.getElementById('cz-vg').textContent = r.toFixed(3) + (r > 0.14 ? ' · 공공' : r < 0.12 ? ' · 격자간' : ' · 무결함 ✓');
      const inBody = S.phase === 'body';
      dr.classList.toggle('good', inBody && Math.abs(S.d - 300) < 8);
      dr.classList.toggle('bad', inBody && Math.abs(S.d - 300) > 25);
    }
    bind('#lab-cz', v => {
      Object.assign(P, v);
      readout();
      return { v: v.v.toFixed(2) + ' mm/min', dT: (v.dT > 0 ? '+' : '') + v.dT.toFixed(1) + ' °C', rpm: v.rpm + ' rpm' };
    });
    let acc = 0;
    animate(el, dt => { step(dt); st.redraw(); acc += dt; if (acc > 0.1) { acc = 0; readout(); } });
  })();

  /* ---------- LAB 1-2: dies per wafer ---------- */
  (function () {
    const el = document.getElementById('dpw');
    let P = { D: 300, dw: 10, dh: 10, ee: 3, d0: 0.1 }, seed = 7, res = null;
    const SCRIBE = 0.1;
    function compute() {
      const R = P.D / 2, Re = R - P.ee;
      const pw = P.dw + SCRIBE, ph = P.dh + SCRIBE;
      let best = null;
      [[0, 0], [0.5, 0], [0, 0.5], [0.5, 0.5]].forEach(([ox, oy]) => {
        const dies = [];
        const nx = Math.ceil(R / pw) + 1, ny = Math.ceil(R / ph) + 1;
        for (let i = -nx; i <= nx; i++) for (let j = -ny; j <= ny; j++) {
          const x0 = (i + ox) * pw - pw / 2, y0 = (j + oy) * ph - ph / 2;
          const x1 = x0 + P.dw, y1 = y0 + P.dh;
          const far = Math.max(x0 * x0, x1 * x1) + Math.max(y0 * y0, y1 * y1);
          const near = (x0 > 0 ? x0 * x0 : x1 < 0 ? x1 * x1 : 0) + (y0 > 0 ? y0 * y0 : y1 < 0 ? y1 * y1 : 0);
          if (far <= Re * Re) dies.push({ x0, y0, x1, y1, full: true });
          else if (near < R * R) dies.push({ x0, y0, x1, y1, full: false });
        }
        const n = dies.filter(d => d.full).length;
        if (!best || n > best.n) best = { n, dies };
      });
      // defects
      const r = rng(seed * 7919 + Math.round(P.D));
      const area = Math.PI * Math.pow(P.D / 20, 2); // cm²
      const lam = P.d0 * area;
      // poisson sample via normal approx for big lam
      let N = lam > 40 ? Math.max(0, Math.round(lam + Math.sqrt(lam) * SB.gauss(r))) : (() => { let L = Math.exp(-lam), k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; })();
      const defects = [];
      for (let i = 0; i < N; i++) { const a = r() * Math.PI * 2, rr = R * Math.sqrt(r()); defects.push([rr * Math.cos(a), rr * Math.sin(a)]); }
      let good = 0;
      best.dies.forEach(d => {
        d.bad = d.full && defects.some(([x, y]) => x >= d.x0 && x <= d.x1 && y >= d.y0 && y <= d.y1);
        if (d.full && !d.bad) good++;
      });
      return { ...best, defects, good };
    }
    const st = canvas(el, (ctx, w, h) => {
      if (!res) return;
      const R = P.D / 2;
      const sc = (Math.min(w, h) * 0.47) / Math.max(R, 150); // smaller wafers drawn to scale vs 300 mm
      const cx = w / 2, cy = h / 2;
      // wafer
      const wg = ctx.createRadialGradient(cx - R * sc * 0.3, cy - R * sc * 0.3, 10, cx, cy, R * sc);
      wg.addColorStop(0, '#e6e9f2'); wg.addColorStop(1, '#a8b0c4');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(cx, cy, R * sc, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = alpha(css('--rose'), 0.5); ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(cx, cy, (R - P.ee) * sc, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      // dies
      res.dies.forEach(d => {
        const x = cx + d.x0 * sc, y = cy + d.y0 * sc, ww = (d.x1 - d.x0) * sc, hh = (d.y1 - d.y0) * sc;
        if (!d.full) { ctx.strokeStyle = 'rgba(60,60,80,.25)'; ctx.lineWidth = 0.6; ctx.strokeRect(x, y, ww, hh); return; }
        ctx.fillStyle = d.bad ? 'rgba(214,69,93,.85)' : 'rgba(46,158,79,.78)';
        ctx.fillRect(x, y, ww, hh);
        if (ww > 14) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x + ww * 0.15, y + hh * 0.15, ww * 0.3, hh * 0.25); }
      });
      // defects
      ctx.fillStyle = '#111';
      res.defects.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(cx + x * sc, cy + y * sc, 1.8, 0, Math.PI * 2); ctx.fill(); });
      // notch
      ctx.fillStyle = css('--surface-2'); ctx.beginPath(); ctx.arc(cx, cy + R * sc, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = css('--text-2'); ctx.font = '600 13px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText(`Ø ${P.D} mm`, 12, 22);
      ctx.fillStyle = css('--muted'); ctx.font = '12px ' + css('--font');
      ctx.fillText(`다이 ${P.dw}×${P.dh} mm = ${(P.dw * P.dh).toFixed(0)} mm²`, 12, 40);
      ctx.fillText(`결함 ${res.defects.length}개`, 12, 56);
    });
    const ctl = bind('#lab-dpw', v => {
      P = { D: +v.D, dw: v.dw, dh: v.dh, ee: v.ee, d0: v.d0 };
      res = compute();
      const S = P.dw * P.dh;
      const est = Math.PI * Math.pow(P.D / 2, 2) / S - Math.PI * P.D / Math.sqrt(2 * S);
      const gross = res.n;
      document.getElementById('dpw-gross').textContent = gross;
      document.getElementById('dpw-est').textContent = Math.max(0, Math.round(est));
      document.getElementById('dpw-good').textContent = res.good;
      const Ymodel = Math.exp(-S / 100 * P.d0);
      document.getElementById('dpw-y').innerHTML = (gross ? (res.good / gross * 100).toFixed(0) : 0) + '% <small>모델 ' + (Ymodel * 100).toFixed(0) + '%</small>';
      st.redraw();
      return { dw: v.dw + ' mm', dh: v.dh + ' mm', ee: v.ee + ' mm', d0: v.d0.toFixed(2) + ' /cm²' };
    });
    document.getElementById('dpw-seed').onclick = () => { seed++; ctl.update(); };
    const form = document.getElementById('lab-dpw');
    SB.seg(document.getElementById('dpw-preset'), v => {
      const p = { mob: [10, 10], cpu: [15, 13], gpu: [32, 25.5] }[v];
      form.querySelector('[name=dw]').value = p[0]; form.querySelector('[name=dh]').value = p[1];
      ctl.update();
    });
  })();

  /* ---------- LAB 1-3: crystal viewer ---------- */
  (function () {
    const el = document.getElementById('xtal');
    const atoms = [];
    const add = (x, y, z) => { if (!atoms.some(a => Math.abs(a[0] - x) + Math.abs(a[1] - y) + Math.abs(a[2] - z) < 1e-6)) atoms.push([x, y, z]); };
    for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) add(x, y, z);
    [[.5, .5, 0], [.5, .5, 1], [.5, 0, .5], [.5, 1, .5], [0, .5, .5], [1, .5, .5]].forEach(p => add(...p));
    [[.25, .25, .25], [.75, .75, .25], [.75, .25, .75], [.25, .75, .75]].forEach(p => add(...p));
    const bonds = [];
    atoms.forEach((a, i) => atoms.forEach((b, j) => {
      if (j <= i) return;
      const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      if (Math.abs(d - Math.sqrt(3) / 4) < 1e-3) bonds.push([i, j]);
    }));
    const PL = {
      '100': { poly: [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], on: a => Math.abs(a[0]) < 1e-6, info: ['(100) 면', '표면 원자 밀도 6.78×10¹⁴ cm⁻²', 'Si/SiO₂ 계면 결함(Dit)이 가장 적어 <b>CMOS 로직·메모리 표준</b>입니다. 노치는 &lt;110&gt; 방향을 가리킵니다.'] },
      '110': { poly: [[1, 0, 0], [0, 1, 0], [0, 1, 1], [1, 0, 1]], on: a => Math.abs(a[0] + a[1] - 1) < 1e-6, info: ['(110) 면', '표면 원자 밀도 9.59×10¹⁴ cm⁻²', '정공 이동도가 높아 PMOS 성능 향상 연구에 쓰이며, 습식 식각 시 수직 벽을 만들기 쉽습니다.'] },
      '111': { poly: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], on: a => Math.abs(a[0] + a[1] + a[2] - 1) < 1e-6, info: ['(111) 면', '표면 원자 밀도 7.83×10¹⁴ cm⁻²', '원자가 가장 빽빽하게 결합된 면으로 KOH 식각 속도가 가장 느립니다. 그래서 (100) 웨이퍼를 KOH로 식각하면 54.7° 경사 벽이 생깁니다.'] },
    };
    let plane = '100', showBonds = true, spin = true, yaw = 0.6, pitch = -0.45, drag = null;
    function proj(p, w, h) {
      let [x, y, z] = [p[0] - .5, p[1] - .5, p[2] - .5];
      // yaw around y-axis (z up in crystal → map z to screen up)
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      let X = x * cy - y * sy, Y = x * sy + y * cy, Z = z;
      const Y2 = Y * cp - Z * sp, Z2 = Y * sp + Z * cp;
      const f = 3.2 / (3.2 + Y2);
      const s = Math.min(w, h) * 0.55;
      return [w / 2 + X * s * f, h / 2 - Z2 * s * f, Y2];
    }
    const st = canvas(el, (ctx, w, h) => {
      const pl = PL[plane];
      // cube edges
      const corners = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
      const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
      ctx.strokeStyle = alpha(css('--text'), 0.25); ctx.lineWidth = 1;
      edges.forEach(([a, b]) => { const p = proj(corners[a], w, h), q = proj(corners[b], w, h); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); });
      // plane
      ctx.fillStyle = alpha(css('--accent'), 0.22); ctx.strokeStyle = css('--accent'); ctx.lineWidth = 2;
      ctx.beginPath(); pl.poly.forEach((p, i) => { const q = proj(p, w, h); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fill(); ctx.stroke();
      // bonds
      const P = atoms.map(a => proj(a, w, h));
      if (showBonds) {
        ctx.strokeStyle = alpha(css('--text-2'), 0.55); ctx.lineWidth = 3;
        bonds.forEach(([i, j]) => { ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke(); });
      }
      // atoms sorted far→near
      const order = atoms.map((a, i) => i).sort((i, j) => P[j][2] - P[i][2]);
      order.forEach(i => {
        const [x, y, d] = P[i];
        const on = pl.on(atoms[i]);
        const r = (on ? 11 : 8) * (3.2 / (3.2 + d));
        const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
        const base = on ? css('--accent') : css('--fig-si-2');
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, base); g.addColorStop(1, alpha(base, 0.9));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      });
      // axes
      const o = proj([0, 0, 0], w, h);
      [['x', [0.35, 0, 0]], ['y', [0, 0.35, 0]], ['z', [0, 0, 0.35]]].forEach(([n, v]) => {
        const q = proj(v, w, h);
        ctx.strokeStyle = css('--rose'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        ctx.fillStyle = css('--rose'); ctx.font = '600 13px ' + css('--mono'); ctx.fillText(n, q[0] + 4, q[1] - 4);
      });
      ctx.fillStyle = css('--muted'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('격자 상수 a = 0.543 nm · 단위 격자당 원자 8개', 12, h - 12);
    });
    bind('#lab-xtal', v => {
      plane = v.plane; showBonds = v.bonds; spin = v.spin;
      const [t, a, b] = PL[plane].info;
      document.getElementById('xtal-info').innerHTML = `<b class="t">${t}</b><span class="mono" style="font-size:13px">${a}</span><br>${b}`;
      st.redraw();
    });
    el.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, yaw, pitch]; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (!drag) return; yaw = drag[2] + (e.clientX - drag[0]) * 0.01; pitch = clamp(drag[3] + (e.clientY - drag[1]) * 0.01, -1.5, 1.5); st.redraw(); });
    el.addEventListener('pointerup', () => { drag = null; });
    animate(el, dt => { if (spin && !drag) { yaw += dt * 0.35; st.redraw(); } });
  })();

  SB.quiz(document.getElementById('quiz'), [
    { q: 'CZ 성장 중 인상 속도를 갑자기 두 배로 올리면 잉곳 지름은 어떻게 될까?', o: ['굵어진다', '가늘어진다', '변하지 않는다', '잉곳이 다결정이 된다'], a: 1, why: '결정화 잠열을 빼낼 시간이 부족해져 고-액 계면이 좁아지고 잉곳이 가늘어집니다. LAB 1-1에서 직접 확인해 보세요.' },
    { q: '넥킹(necking) 단계에서 지름을 수 mm로 가늘게 뽑는 이유는?', o: ['재료를 아끼기 위해', '전위(dislocation)가 표면으로 빠져나가 사라지게 하기 위해', '산소 농도를 높이기 위해', '도핑 농도를 맞추기 위해'], a: 1, why: '종자를 담글 때의 열충격으로 생긴 전위가 가는 넥을 따라 표면으로 빠져나가 무전위 결정이 됩니다(Dash 넥킹).' },
    { q: '다이 면적이 100 mm²에서 400 mm²로 커지고 결함 밀도가 0.1 /cm²일 때 푸아송 수율은?', o: ['90% → 67%', '90% → 90%', '99% → 96%', '50% → 12%'], a: 0, why: 'Y = e^(−A·D₀). 1 cm² × 0.1 → e^−0.1 ≈ 90%, 4 cm² × 0.1 → e^−0.4 ≈ 67%.' },
    { q: 'CMOS 공정에 주로 (100) 웨이퍼를 사용하는 가장 큰 이유는?', o: ['가장 단단해서', 'Si/SiO₂ 계면 결함 밀도가 가장 낮아서', 'KOH 식각이 가장 느려서', '원자 밀도가 가장 높아서'], a: 1, why: '(100) 면은 표면 댕글링 본드가 적어 산화막과의 계면 트랩이 가장 적고, 이는 트랜지스터 문턱 전압 안정성으로 이어집니다.' },
  ]);
})();
