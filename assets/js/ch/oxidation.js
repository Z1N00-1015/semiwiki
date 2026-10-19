/* Chapter 02 — oxidation */
(function () {
  const { css, canvas, plot, bind, clamp, alpha } = SB;

  /* ---------- Figure 2-1: furnace ---------- */
  (function () {
    const svg = document.getElementById('furnace');
    let s = `<defs><linearGradient id="tube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe6f2" stop-opacity=".55"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".25"/><stop offset="1" stop-color="#cfe6f2" stop-opacity=".55"/></linearGradient>
      <radialGradient id="heat" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".35"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient></defs>`;
    s += `<rect x="150" y="40" width="560" height="140" fill="url(#heat)"><animate attributeName="opacity" values=".6;1;.6" dur="3s" repeatCount="indefinite"/></rect>`;
    for (let i = 0; i < 14; i++) {
      const x = 170 + i * 38;
      s += `<rect x="${x}" y="40" width="22" height="14" rx="3" fill="#e8763a" opacity=".85"/><rect x="${x}" y="166" width="22" height="14" rx="3" fill="#e8763a" opacity=".85"/>`;
    }
    s += `<rect x="90" y="62" width="700" height="96" rx="48" fill="url(#tube)" stroke="var(--border-2)" stroke-width="2"/>`;
    // boat & wafers
    s += `<rect x="300" y="140" width="290" height="8" rx="3" fill="var(--muted)" opacity=".7"/>`;
    for (let i = 0; i < 20; i++) s += `<rect x="${308 + i * 14}" y="76" width="4" height="66" rx="2" fill="url(#wf)"/>`;
    s = s.replace('</defs>', '<linearGradient id="wf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7b5cd6"/><stop offset=".5" stop-color="#3d7be0"/><stop offset="1" stop-color="#7b5cd6"/></linearGradient></defs>');
    // gas particles
    for (let i = 0; i < 18; i++) {
      const y = 80 + (i * 37) % 60, dur = 3 + (i % 5) * 0.5, delay = (i * 0.37) % 3;
      s += `<circle r="3.2" cy="${y}" fill="var(--blue)" opacity=".8"><animate attributeName="cx" from="40" to="800" dur="${dur}s" begin="-${delay}s" repeatCount="indefinite"/></circle>`;
    }
    s += `<text x="20" y="56" font-size="13" fill="var(--blue)" font-weight="700">O₂ / H₂O 유입 →</text>`;
    s += `<text x="740" y="200" font-size="13" fill="var(--muted)" text-anchor="end">배기 →</text>`;
    s += `<text x="445" y="30" font-size="13" fill="#e8763a" text-anchor="middle" font-weight="700">히터 800–1200 °C</text>`;
    s += `<text x="445" y="208" font-size="13" fill="var(--text-2)" text-anchor="middle">석영 보트 위 웨이퍼</text>`;
    svg.innerHTML = s;
  })();

  /* ---------- LAB 2-1: Deal–Grove ---------- */
  const DG = {
    dry: { C1: 772, E1: 1.23, C2: 6.23e6, E2: 2.0 },
    wet: { C1: 386, E1: 0.78, C2: 1.63e8, E2: 2.05 },
  };
  function coeffs(amb, ori, T) {
    const k = 8.617e-5 * (T + 273.15), p = DG[amb];
    const B = p.C1 * Math.exp(-p.E1 / k);                       // µm²/h
    const BA = p.C2 * Math.exp(-p.E2 / k) / (ori === '100' ? 1.68 : 1); // µm/h
    return { B, BA, A: B / BA };
  }
  function thick(c, tmin, x0nm) {
    const x0 = x0nm / 1000, t = tmin / 60;
    const tau = (x0 * x0 + c.A * x0) / c.B;
    return (c.A / 2) * (Math.sqrt(1 + (t + tau) / (c.A * c.A / (4 * c.B))) - 1) * 1000; // nm
  }
  (function () {
    const el = document.getElementById('dg');
    let P = { amb: 'dry', ori: '100', T: 1000, t: 60, x0: 0, asym: true };
    const st = canvas(el, (ctx, w, h) => {
      const tmax = clamp(Math.max(60, P.t * 1.5), 60, 600);
      const cur = coeffs(P.amb, P.ori, P.T);
      const cd = coeffs('dry', P.ori, P.T), cw = coeffs('wet', P.ori, P.T);
      const N = 160;
      const mk = c => { const a = []; for (let i = 0; i <= N; i++) { const t = i / N * tmax; a.push([t, thick(c, t, P.x0)]); } return a; };
      const sd = mk(cd), sw = mk(cw);
      const ymax = Math.max(thick(cur, tmax, P.x0), 20) * 1.15;
      const series = [
        { data: sw, color: alpha(css('--blue'), P.amb === 'wet' ? 1 : 0.55), width: P.amb === 'wet' ? 3 : 1.6 },
        { data: sd, color: alpha(css('--amber'), P.amb === 'dry' ? 1 : 0.55), width: P.amb === 'dry' ? 3 : 1.6 },
      ];
      if (P.asym) {
        const lin = [], par = [];
        for (let i = 0; i <= N; i++) { const t = i / N * tmax; lin.push([t, cur.BA * t / 60 * 1000]); par.push([t, Math.sqrt(cur.B * t / 60) * 1000]); }
        series.push({ data: lin, color: css('--muted'), width: 1.3, dash: [5, 4] }, { data: par, color: css('--muted'), width: 1.3, dash: [2, 3] });
      }
      const xt = thick(cur, P.t, P.x0);
      const g = plot(ctx, w, h, {
        x: { min: 0, max: tmax, label: '산화 시간 (분)' },
        y: { min: 0, max: ymax, label: '산화막 두께 (nm)' },
        series,
        vlines: [{ x: P.t, color: css('--accent') }],
        marks: [{ x: P.t, y: xt, color: css('--accent'), r: 6, label: xt.toFixed(1) + ' nm', bold: true, align: P.t > tmax * 0.7 ? 'right' : 'left' }],
      });
      if (P.asym) {
        ctx.fillStyle = css('--muted'); ctx.font = '11.5px ' + css('--font'); ctx.textAlign = 'right';
        ctx.fillText('- - 선형 x=(B/A)t   ··· 포물선 x=√(Bt)', g.pad.l + g.pw - 6, g.pad.t + g.ph - 10);
      }
    });
    bind('#lab-dg', v => {
      P = v;
      const c = coeffs(v.amb, v.ori, v.T), x = thick(c, v.t, v.x0);
      document.getElementById('dg-x').innerHTML = (x >= 1000 ? (x / 1000).toFixed(2) + ' <small>µm</small>' : x.toFixed(1) + ' <small>nm</small>');
      const A = c.A * 1000;
      document.getElementById('dg-reg').textContent = x < A / 4 ? '반응 지배 (선형)' : x > 2 * A ? '확산 지배 (포물선)' : '전이 영역';
      document.getElementById('dg-b').textContent = SB.sci(c.B, 2) + ' µm²/h';
      document.getElementById('dg-ba').textContent = SB.sci(c.BA, 2) + ' µm/h';
      st.redraw();
      const tm = v.t >= 60 ? (v.t / 60).toFixed(v.t % 60 ? 1 : 0) + ' 시간' : v.t + ' 분';
      return { T: v.T + ' °C', t: tm, x0: v.x0 + ' nm' };
    });
  })();

  /* ---------- LAB 2-2: LOCOS ---------- */
  (function () {
    const el = document.getElementById('locos');
    let P = { tox: 300, mode: 'locos' };
    const erf = x => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
    const st = canvas(el, (ctx, w, h) => {
      const y0 = h * 0.5, s = (h * 0.62) / 700;
      const edge = w * 0.42;
      const pad = P.mode === 'locos' ? 20 : 0;
      const L = (0.9 * P.tox + 20) * s * 1.6;
      const tox = x => P.mode === 'flat' ? P.tox : Math.max(pad, P.tox * 0.5 * (1 + erf((x - edge) / L)));
      const xs = []; for (let x = 0; x <= w; x += 2) xs.push(x);
      // silicon
      ctx.fillStyle = css('--fig-si');
      ctx.beginPath(); ctx.moveTo(0, h);
      xs.forEach(x => ctx.lineTo(x, y0 + 0.44 * tox(x) * s));
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      // oxide
      ctx.fillStyle = css('--fig-oxide');
      ctx.beginPath();
      xs.forEach((x, i) => { const y = y0 - 0.56 * tox(x) * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(xs[i], y0 + 0.44 * tox(xs[i]) * s);
      ctx.closePath(); ctx.fill();
      // nitride
      if (P.mode === 'locos') {
        const nt = 150 * s;
        const nx = xs.filter(x => x <= edge);
        ctx.fillStyle = css('--fig-nitride');
        ctx.beginPath();
        nx.forEach((x, i) => { const y = y0 - 0.56 * tox(x) * s - nt; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        for (let i = nx.length - 1; i >= 0; i--) ctx.lineTo(nx[i], y0 - 0.56 * tox(nx[i]) * s);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = css('--text'); ctx.font = '600 13px ' + css('--font'); ctx.textAlign = 'left';
        ctx.fillText('Si₃N₄ 마스크', 14, y0 - 0.56 * pad * s - nt - 8);
        // bird's beak annotation
        if (P.tox > 60) {
          const bx0 = edge - L * 1.2, bx1 = edge + L * 0.4;
          ctx.strokeStyle = css('--rose'); ctx.lineWidth = 1.5;
          const by = y0 + 0.44 * P.tox * s + 22;
          ctx.beginPath(); ctx.moveTo(bx0, by); ctx.lineTo(bx1, by); ctx.moveTo(bx0, by - 5); ctx.lineTo(bx0, by + 5); ctx.moveTo(bx1, by - 5); ctx.lineTo(bx1, by + 5); ctx.stroke();
          ctx.fillStyle = css('--rose'); ctx.textAlign = 'center'; ctx.fillText('버즈비크', (bx0 + bx1) / 2, by + 18);
        }
      }
      // original surface
      ctx.strokeStyle = css('--text'); ctx.setLineDash([6, 5]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(w, y0); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = css('--text'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'right';
      ctx.fillText('원래 Si 표면', w - 120, y0 - 6);
      // dimension arrows on the right
      if (P.tox > 20) {
        const ax = w - 40, yt = y0 - 0.56 * P.tox * s, yb = y0 + 0.44 * P.tox * s;
        ctx.strokeStyle = css('--accent'); ctx.fillStyle = css('--accent'); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ax, yt); ctx.lineTo(ax, yb); ctx.moveTo(ax - 6, yt); ctx.lineTo(ax + 6, yt); ctx.moveTo(ax - 6, y0); ctx.lineTo(ax + 6, y0); ctx.moveTo(ax - 6, yb); ctx.lineTo(ax + 6, yb); ctx.stroke();
        ctx.textAlign = 'right'; ctx.font = '600 12px ' + css('--mono');
        ctx.fillText('0.56x', ax - 8, (yt + y0) / 2 + 4);
        ctx.fillText('0.44x', ax - 8, (yb + y0) / 2 + 4);
      }
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = '600 14px ' + css('--font');
      ctx.fillText('Si', 14, h - 14);
      if (P.tox > 80) { ctx.fillStyle = css('--text'); ctx.fillText('SiO₂', P.mode === 'locos' ? w * 0.7 : w * 0.3, y0 + 5); }
    });
    bind('#lab-locos', v => { P = v; st.redraw(); return { tox: v.tox + ' nm' }; });
  })();

  /* ---------- LAB 2-3: thin-film colour ---------- */
  const g = (l, m, s1, s2) => { const t = (l - m) / (l < m ? s1 : s2); return Math.exp(-0.5 * t * t); };
  const cie = l => [
    1.056 * g(l, 599.8, 37.9, 31.0) + 0.362 * g(l, 442.0, 16.0, 26.7) - 0.065 * g(l, 501.1, 20.4, 26.2),
    0.821 * g(l, 568.8, 46.9, 40.5) + 0.286 * g(l, 530.9, 16.3, 31.1),
    1.217 * g(l, 437.0, 11.8, 36.0) + 0.681 * g(l, 459.0, 26.0, 13.8),
  ];
  const planck = l => 1 / (Math.pow(l, 5) * (Math.exp(1.4388e7 / (l * 6504)) - 1));
  const SI_N = [[380, 6.0, 0.6], [400, 5.57, 0.39], [450, 4.67, 0.14], [500, 4.30, 0.07], [550, 4.08, 0.04], [600, 3.94, 0.02], [650, 3.85, 0.017], [700, 3.78, 0.012], [750, 3.73, 0.009], [800, 3.69, 0.006]];
  function siN(l) {
    for (let i = 1; i < SI_N.length; i++) if (l <= SI_N[i][0]) {
      const [l0, n0, k0] = SI_N[i - 1], [l1, n1, k1] = SI_N[i], t = (l - l0) / (l1 - l0);
      return [n0 + (n1 - n0) * t, k0 + (k1 - k0) * t];
    }
    return [3.69, 0.006];
  }
  // complex helpers [re, im]
  const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const NOX = 1.46;
  function refl(l, d) {
    const [n2, k2] = siN(l);
    const N2 = [n2, -k2];
    const r01 = [(1 - NOX) / (1 + NOX), 0];
    const r12 = cdiv([NOX - N2[0], -N2[1]], [NOX + N2[0], N2[1]]);
    const beta = 2 * Math.PI * NOX * d / l;
    const ph = [Math.cos(-2 * beta), Math.sin(-2 * beta)];
    const num = cadd(r01, cmul(r12, ph));
    const den = cadd([1, 0], cmul(r01, cmul(r12, ph)));
    const r = cdiv(num, den);
    return r[0] * r[0] + r[1] * r[1];
  }
  const LAM = []; for (let l = 380; l <= 780; l += 5) LAM.push(l);
  const W = LAM.map(l => { const c = cie(l), p = planck(l); return [c[0] * p, c[1] * p, c[2] * p]; });
  const Yw = W.reduce((a, c) => a + c[1], 0);
  const colorCache = new Map();
  function oxColor(d) {
    const key = Math.round(d * 2);
    if (colorCache.has(key)) return colorCache.get(key);
    let X = 0, Y = 0, Z = 0;
    LAM.forEach((l, i) => { const R = refl(l, d); X += W[i][0] * R; Y += W[i][1] * R; Z += W[i][2] * R; });
    X /= Yw; Y /= Yw; Z /= Yw;
    const k = 1.55; // exposure boost so bare Si looks like polished silver
    let rgb = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.2040 * Y + 1.0570 * Z].map(v => v * k);
    rgb = rgb.map(v => { v = clamp(v, 0, 1); return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); });
    const out = `rgb(${rgb.join(',')})`;
    colorCache.set(key, out);
    return out;
  }
  (function () {
    let P = { d: 120, nu: 0 };
    const wafer = canvas(document.getElementById('cwafer'), (ctx, w, h) => {
      const R = Math.min(w, h) * 0.45, cx = w / 2, cy = h / 2;
      const rings = 90;
      for (let i = rings; i >= 1; i--) {
        const r = i / rings;
        const d = Math.max(0, P.d * (1 + P.nu / 100 * (0.5 - r * r)));
        ctx.fillStyle = oxColor(d);
        ctx.beginPath(); ctx.arc(cx, cy, R * r, 0, Math.PI * 2); ctx.fill();
      }
      // specular highlight
      const hg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      hg.addColorStop(0, 'rgba(255,255,255,.25)'); hg.addColorStop(0.45, 'rgba(255,255,255,0)'); hg.addColorStop(1, 'rgba(0,0,0,.12)');
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = css('--surface-2'); ctx.beginPath(); ctx.arc(cx, cy + R, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = css('--text-2'); ctx.font = '600 13px ' + css('--mono'); ctx.textAlign = 'left';
      ctx.fillText(`SiO₂ ${P.d} nm`, 12, 22);
    });
    const spec = canvas(document.getElementById('cspec'), (ctx, w, h) => {
      const data = [], bare = [];
      for (let l = 380; l <= 780; l += 4) { data.push([l, refl(l, P.d) * 100]); bare.push([l, refl(l, 0) * 100]); }
      // rainbow band under axis
      plot(ctx, w, h, {
        pad: { l: 40, r: 8, t: 8, b: 34 },
        x: { min: 380, max: 780, label: '파장 (nm)', ticks: [400, 500, 600, 700] },
        y: { min: 0, max: 60, label: 'R (%)', ticks: [0, 20, 40, 60] },
        series: [{ data: bare, color: css('--muted'), width: 1.2, dash: [4, 3] }, { data, color: css('--accent'), width: 2.4 }],
      });
    });
    const bar = canvas(document.getElementById('cbar'), (ctx, w, h) => {
      const bh = h - 16;
      for (let x = 0; x < w; x++) { ctx.fillStyle = oxColor(x / w * 1000); ctx.fillRect(x, 0, 1.5, bh); }
      ctx.fillStyle = css('--text-2'); ctx.font = '11px ' + css('--mono');
      for (let d = 0; d <= 1000; d += 100) { ctx.textAlign = d === 0 ? 'left' : d === 1000 ? 'right' : 'center'; ctx.fillText(d + '', d / 1000 * w, h - 2); }
      const mx = P.d / 1000 * w;
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(mx - 3, 1, 6, bh - 2);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(mx - 3, 1, 6, bh - 2);
    }, { height: 52 });
    const ctl = bind('#lab-color', v => {
      P = v;
      document.getElementById('c-sw').style.background = oxColor(v.d);
      let best = 380, bv = 0; for (let l = 380; l <= 780; l += 2) { const r = refl(l, v.d); if (r > bv) { bv = r; best = l; } }
      document.getElementById('c-pk').innerHTML = best + ' <small>nm</small>';
      wafer.redraw(); spec.redraw(); bar.redraw();
      return { d: v.d + ' nm', nu: '±' + (v.nu / 2).toFixed(0) + '%' };
    });
    const barEl = document.getElementById('cbar');
    const setFromBar = e => {
      const r = barEl.getBoundingClientRect();
      document.querySelector('#lab-color [name=d]').value = Math.round(clamp((e.clientX - r.left) / r.width, 0, 1) * 1000);
      ctl.update();
    };
    let down = false;
    barEl.addEventListener('pointerdown', e => { down = true; barEl.setPointerCapture(e.pointerId); setFromBar(e); });
    barEl.addEventListener('pointermove', e => { if (down) setFromBar(e); });
    barEl.addEventListener('pointerup', () => { down = false; });
  })();

  SB.quiz(document.getElementById('quiz'), [
    { q: '게이트 산화막처럼 얇고 고품질의 막이 필요할 때 주로 쓰는 방식은?', o: ['습식 산화', '건식 산화', 'PVD 스퍼터링', '전기 도금'], a: 1, why: '건식 산화는 느리지만 치밀하고 결함이 적은 막을 만들어 두께를 정밀하게 제어할 수 있습니다.' },
    { q: 'Deal–Grove 모델에서 산화막이 충분히 두꺼워졌을 때 두께는 시간에 대해 어떻게 증가할까?', o: ['x ∝ t', 'x ∝ √t', 'x ∝ t²', '일정하다'], a: 1, why: '산화제가 두꺼운 산화막을 확산해 통과해야 하므로 포물선 법칙 x ≈ √(Bt)를 따릅니다.' },
    { q: '두께 100 nm의 열산화막을 만들었을 때 소모된 실리콘 두께는?', o: ['약 100 nm', '약 56 nm', '약 44 nm', '0 nm'], a: 2, why: 'SiO₂ 두께의 약 44%만큼 실리콘이 소모됩니다.' },
    { q: '산화된 웨이퍼의 색이 두께에 따라 달라 보이는 원리는?', o: ['산화막 자체의 색소', '박막의 위·아래 계면 반사광의 간섭', '실리콘의 형광', '도핑 농도 차이'], a: 1, why: '산화막 위 표면과 Si 계면에서 반사된 빛의 경로차가 특정 파장을 보강/상쇄합니다.' },
  ]);
})();
