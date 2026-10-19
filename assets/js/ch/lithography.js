/* Chapter 03 — lithography */
(function () {
  const { css, canvas, animate, plot, bind, clamp, lerp, rng, alpha } = SB;

  /* ---------- Figure 3-1: process steps ---------- */
  (function () {
    const S = [
      ['🧴', '표면 처리', 'HMDS 증기로 웨이퍼 표면을 소수성으로 바꿔 감광액이 잘 붙게 합니다. 먼저 탈수 베이크로 수분을 날립니다.'],
      ['🌀', '스핀 코팅', '감광액을 떨어뜨리고 수천 rpm으로 회전시켜 균일한 막을 만듭니다. (LAB 3-1)'],
      ['♨️', '소프트 베이크', '90~110 °C 핫플레이트에서 용매를 날려 막을 굳힙니다. 마스크나 장비가 오염되지 않게 합니다.'],
      ['🔦', '정렬 · 노광', '스캐너가 정렬 마크로 아래층과 위치를 맞춘 뒤 마스크 패턴을 1/4로 축소 투영합니다. 슬릿 형태의 빛으로 필드를 훑으며(scan) 노광합니다.'],
      ['🔥', 'PEB', '노광 후 베이크(Post-Exposure Bake). 화학 증폭형 레지스트에서 빛이 만든 산(H⁺)이 퍼지며 연쇄 반응을 일으켜 감도를 높이고 정재파 무늬를 완화합니다.'],
      ['💧', '현상', 'TMAH 2.38% 알칼리 수용액으로 노광된(양성 PR) 부분을 녹여 냅니다.'],
      ['🧱', '하드 베이크', '남은 PR 패턴을 더 단단하게 만들어 식각·이온주입을 견디게 합니다.'],
      ['🔍', '검사', 'CD-SEM으로 선폭, 계측 장비로 오버레이를 측정합니다. 불합격이면 PR을 벗기고 다시 하는 재작업(rework)이 가능합니다 — 포토만의 장점입니다.'],
    ];
    const svg = document.getElementById('steps');
    let s = '<defs><marker id="ar3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>';
    s += '<rect x="6" y="18" width="312" height="180" rx="14" fill="var(--teal)" opacity=".07"/><text x="16" y="36" font-size="12" font-weight="700" fill="var(--teal)">트랙 (코터)</text>';
    s += '<rect x="330" y="18" width="104" height="180" rx="14" fill="var(--accent)" opacity=".09"/><text x="340" y="36" font-size="12" font-weight="700" fill="var(--accent)">스캐너</text>';
    s += '<rect x="446" y="18" width="320" height="180" rx="14" fill="var(--teal)" opacity=".07"/><text x="456" y="36" font-size="12" font-weight="700" fill="var(--teal)">트랙 (디벨로퍼)</text>';
    s += '<rect x="778" y="18" width="96" height="180" rx="14" fill="var(--amber)" opacity=".09"/><text x="788" y="36" font-size="12" font-weight="700" fill="var(--amber)">계측</text>';
    S.forEach(([ic, t], i) => {
      const x = 58 + i * 108;
      s += `<g class="st" data-i="${i}" style="cursor:pointer" transform="translate(${x},110)"><circle r="38" fill="var(--surface)" stroke="var(--border-2)" stroke-width="1.5"/><text y="10" text-anchor="middle" font-size="28">${ic}</text><text y="62" text-anchor="middle" font-size="13.5" font-weight="700" fill="var(--text)">${t}</text><text y="-46" text-anchor="middle" font-size="11" font-family="var(--mono)" fill="var(--muted)">${i + 1}</text></g>`;
      if (i < S.length - 1) s += `<line x1="${x + 40}" y1="110" x2="${x + 66}" y2="110" stroke="var(--muted)" stroke-width="1.6" marker-end="url(#ar3)"/>`;
    });
    svg.innerHTML = s;
    const txt = document.getElementById('steps-text');
    const show = i => {
      svg.querySelectorAll('.st circle').forEach((c, j) => { c.setAttribute('stroke', j === i ? 'var(--accent)' : 'var(--border-2)'); c.setAttribute('stroke-width', j === i ? 3 : 1.5); });
      txt.innerHTML = `<span class="n">STEP ${i + 1}</span><b class="t">${S[i][1]}</b>${S[i][2]}`;
    };
    svg.querySelectorAll('.st').forEach(g => { const i = +g.dataset.i; g.addEventListener('mouseenter', () => show(i)); g.addEventListener('click', () => show(i)); });
    show(3);
  })();

  /* ---------- LAB 3-1: spin coater ---------- */
  (function () {
    const el = document.getElementById('spin');
    let P = { rpm: 3000, eta: 20 };
    const finalT = () => 800 * Math.pow(P.eta / 20, 0.9) * Math.sqrt(3000 / P.rpm);
    let S = { phase: 'idle', t: 0, rot: 0, R: 0, h: 0 };
    function thColor(nm, a) { const hue = (nm / 1.6) % 360; return `hsla(${hue + 200},70%,58%,${a == null ? 1 : a})`; }
    const st = canvas(el, (ctx, w, h) => {
      const half = w * 0.48;
      // top view
      const cx = half / 2 + 6, cy = h / 2, R = Math.min(half, h) * 0.42;
      ctx.fillStyle = '#b6bdcd'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      if (S.R > 0) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, S.R * R);
        const hNow = S.h;
        g.addColorStop(0, thColor(hNow, 0.95)); g.addColorStop(0.9, thColor(hNow * 1.02, 0.95)); g.addColorStop(1, thColor(hNow * 1.6, 0.95));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, S.R * R, 0, Math.PI * 2); ctx.fill();
        // swirl lines
        if (S.phase !== 'idle' && S.phase !== 'done') {
          ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.3;
          for (let k = 0; k < 8; k++) {
            ctx.beginPath();
            for (let r = 0.05; r < S.R; r += 0.02) { const a = S.rot + k * Math.PI / 4 + r * 3.2; ctx.lineTo(cx + Math.cos(a) * r * R, cy + Math.sin(a) * r * R); }
            ctx.stroke();
          }
        }
      }
      // flung droplets
      if (S.phase === 'spread' || S.phase === 'thin') {
        ctx.fillStyle = thColor(S.h, 0.8);
        for (let k = 0; k < 14; k++) { const a = S.rot * 1.3 + k * 0.45, rr = R * (1.02 + ((S.t * 2 + k * 0.13) % 0.3)); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2, 0, Math.PI * 2); ctx.fill(); }
      }
      // rotation marker
      ctx.strokeStyle = css('--text-2'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R + 8, S.rot, S.rot + 0.8); ctx.stroke();
      ctx.fillStyle = css('--text-2'); ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'center';
      ctx.fillText('위에서 본 모습', cx, h - 8);
      // side view
      const x0 = half + 24, x1 = w - 16, yb = h * 0.62;
      const maxH = h * 0.32; // px for 2500 nm
      const hpx = nm => maxH * Math.log10(1 + nm / 40) / Math.log10(1 + 30000 / 40); // log scale so µm drops and nm films both fit
      ctx.fillStyle = css('--fig-si'); ctx.fillRect(x0, yb, x1 - x0, 18);
      ctx.fillStyle = css('--muted'); ctx.fillRect((x0 + x1) / 2 - 18, yb + 18, 36, 30);
      if (S.R > 0) {
        const mid = (x0 + x1) / 2, halfW = (x1 - x0) / 2 * S.R;
        ctx.fillStyle = css('--fig-pr');
        ctx.beginPath(); ctx.moveTo(mid - halfW, yb);
        const N = 60;
        for (let i = 0; i <= N; i++) {
          const u = i / N * 2 - 1;
          const bead = S.R > 0.98 ? Math.exp(-Math.pow((1 - Math.abs(u)) / 0.04, 2)) * 0.8 : 0;
          const prof = S.phase === 'dispense' ? Math.sqrt(Math.max(0, 1 - u * u)) * 4 : (1 + bead);
          ctx.lineTo(mid + u * halfW, yb - hpx(S.h * prof));
        }
        ctx.lineTo(mid + halfW, yb); ctx.closePath(); ctx.fill();
      }
      if (S.phase === 'dispense') {
        ctx.fillStyle = css('--fig-pr');
        const mid = (x0 + x1) / 2; ctx.fillRect(mid - 4, 20, 8, yb - 30);
        ctx.fillStyle = css('--muted'); ctx.fillRect(mid - 10, 6, 20, 16);
      }
      ctx.fillStyle = css('--text-2'); ctx.textAlign = 'center';
      ctx.fillText('옆에서 본 단면 (두께 로그 스케일)', (x0 + x1) / 2, h - 8);
      ctx.textAlign = 'left'; ctx.font = '600 13px ' + css('--mono'); ctx.fillStyle = css('--accent');
      ctx.fillText((S.phase === 'idle' ? finalT() : S.h).toFixed(0) + ' nm', x0, 22);
      ctx.fillStyle = css('--muted'); ctx.font = '12px ' + css('--font');
      ctx.fillText({ idle: '대기', dispense: '디스펜스', spread: '퍼짐', thin: '박막화·건조', done: '완료' }[S.phase], x0, 40);
    });
    function step(dt) {
      const rpmNow = S.phase === 'dispense' ? 300 : S.phase === 'idle' || S.phase === 'done' ? 0 : P.rpm;
      S.rot += dt * rpmNow / 60 * Math.PI * 2 * 0.08;
      if (S.phase === 'idle' || S.phase === 'done') return;
      S.t += dt;
      if (S.phase === 'dispense') { S.R = Math.min(0.3, S.t * 0.35); S.h = 20000; if (S.t > 0.9) { S.phase = 'spread'; S.t = 0; } }
      else if (S.phase === 'spread') { S.R = Math.min(1, 0.3 + S.t * 0.9); S.h = lerp(20000, 6000, S.R); if (S.R >= 1) { S.phase = 'thin'; S.t = 0; S.h0 = S.h; } }
      else if (S.phase === 'thin') { const f = finalT(); S.h = f + (S.h0 - f) * Math.exp(-S.t / 0.5); if (S.t > 3) { S.h = f; S.phase = 'done'; readout(); } }
    }
    function readout() {
      const t = finalT();
      document.getElementById('spin-t').innerHTML = t.toFixed(0) + ' <small>nm</small>';
      const ok = document.getElementById('spin-ok');
      const d = t - 100;
      ok.textContent = Math.abs(d) <= 5 ? 'ArF 목표 달성 ✓' : (d > 0 ? '+' : '') + d.toFixed(0) + ' nm';
      ok.parentElement.classList.toggle('good', Math.abs(d) <= 5);
    }
    document.getElementById('spin-go').onclick = () => { S = { phase: 'dispense', t: 0, rot: S.rot, R: 0, h: 0 }; };
    bind('#lab-spin', v => { P = v; if (S.phase === 'done') S.h = finalT(); readout(); st.redraw(); return { rpm: v.rpm + ' rpm', eta: v.eta + ' cP' }; });
    animate(el, dt => { step(dt); st.redraw(); });
  })();

  /* ---------- LAB 3-2: Rayleigh ---------- */
  (function () {
    const SRC = {
      g: { lam: 436, na: [0.2, 0.6], era: '1980년대 · 1 µm급', year: 1985 },
      i: { lam: 365, na: [0.3, 0.7], era: '1990년대 · 0.35 µm', year: 1992 },
      krf: { lam: 248, na: [0.4, 0.85], era: '1990년대 후반 · 180 nm', year: 1998 },
      arf: { lam: 193, na: [0.5, 0.93], era: '2000년대 · 90~65 nm', year: 2003 },
      arfi: { lam: 193, na: [0.9, 1.35], era: '2007~ · 45 nm~ (멀티패터닝)', year: 2008 },
      euv: { lam: 13.5, na: [0.25, 0.33], era: '2019~ · 7/5/3 nm', year: 2019 },
      heuv: { lam: 13.5, na: [0.4, 0.55], era: '2025~ · 2 nm 이하', year: 2025 },
    };
    const HIST = [['g-line', 1985, 800], ['i-line', 1992, 350], ['KrF', 1998, 180], ['ArF', 2003, 90], ['ArF 액침', 2008, 40], ['EUV', 2019, 16], ['High-NA', 2025, 8]];
    const el = document.getElementById('ray');
    let P = { src: 'arfi', na: 1.35, k1: 0.3 }, lastSrc = null;
    const root = document.getElementById('lab-ray');
    const naIn = root.querySelector('[name=na]');
    const st = canvas(el, (ctx, w, h) => {
      const cd = P.k1 * SRC[P.src].lam / P.na;
      const g = plot(ctx, w, h, {
        x: { min: 1980, max: 2030, label: '양산 연도', ticks: [1980, 1990, 2000, 2010, 2020, 2030] },
        y: { min: 3, max: 2000, log: true, label: '최소 선폭 (nm)', logFmt: 'plain' },
        series: [{ data: HIST.map(d => [d[1], d[2]]), color: alpha(css('--muted'), 0.6), width: 1.5, dash: [3, 3] }],
        hlines: [{ y: cd, color: css('--accent'), label: '현재 설정 CD = ' + cd.toFixed(1) + ' nm', dash: [6, 4] }],
        marks: HIST.map(d => ({ x: d[1], y: d[2], label: d[0], color: css('--teal'), r: 5 })).concat([{ x: SRC[P.src].year, y: cd, color: css('--accent'), r: 8 }]),
      });
      // printed lines preview inset
      const bx = g.pad.l + g.pw - 170, by = g.pad.t + 8, bw = 160, bh = 64;
      ctx.fillStyle = css('--surface'); ctx.strokeStyle = css('--border'); ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
      const scale = bw / 400; // 400 nm window
      const pw = 2 * cd * scale;
      ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
      ctx.fillStyle = css('--fig-pr');
      if (pw > 1.2) for (let x = bx + 4; x < bx + bw; x += pw) ctx.fillRect(x, by + 6, Math.max(0.6, cd * scale), bh - 26);
      else { ctx.fillStyle = alpha(css('--fig-pr'), 0.5); ctx.fillRect(bx, by + 6, bw, bh - 26); }
      ctx.restore();
      ctx.fillStyle = css('--muted'); ctx.font = '11px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('400 nm 창에 그린 라인/스페이스', bx + 4, by + bh - 6);
    });
    bind(root, v => {
      if (v.src !== lastSrc) {
        const [a, b] = SRC[v.src].na;
        naIn.min = a; naIn.max = b; naIn.value = b; v.na = b; lastSrc = v.src;
      }
      P = v;
      const lam = SRC[v.src].lam, cd = v.k1 * lam / v.na, dof = 0.5 * lam / (v.na * v.na);
      document.getElementById('ray-cd').innerHTML = cd.toFixed(1) + ' <small>nm</small>';
      document.getElementById('ray-dof').innerHTML = (dof >= 1000 ? (dof / 1000).toFixed(2) + ' <small>µm</small>' : dof.toFixed(0) + ' <small>nm</small>');
      document.getElementById('ray-p').innerHTML = (2 * cd).toFixed(1) + ' <small>nm</small>';
      document.getElementById('ray-era').textContent = SRC[v.src].era;
      st.redraw();
      return { na: (+v.na).toFixed(2), k1: v.k1.toFixed(2) };
    });
  })();

  /* ---------- LAB 3-3: aerial image ---------- */
  (function () {
    const el = document.getElementById('aerial');
    let P = { pitch: 180, lam: '193', na: 0.93, sig: 0.5, z: 0, th: 0.3, mask: 'bin' };
    const sinc = x => x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
    let cache = null;
    function compute() {
      const lam = +P.lam, p = P.pitch, NA = P.na, fc = NA / lam;
      const psm = P.mask === 'psm';
      const Pp = psm ? 2 * p : p, a = p / 2;
      const nMax = Math.ceil((1 + P.sig) * fc * Pp) + 1;
      const orders = [];
      for (let n = -nMax; n <= nMax; n++) {
        let c = psm ? (a / Pp) * sinc(n * a / Pp) * (1 - Math.pow(-1, n)) : (a / Pp) * sinc(n * a / Pp);
        if (Math.abs(c) < 1e-9) continue;
        orders.push({ n, f: n / Pp, c });
      }
      const Ns = P.sig < 0.005 ? 1 : 25;
      const src = []; for (let j = 0; j < Ns; j++) src.push(Ns === 1 ? 0 : (-1 + 2 * j / (Ns - 1)) * P.sig * fc);
      const NX = 360, x0 = -1.5 * p, x1 = 1.5 * p;
      const I = new Float64Array(NX);
      src.forEach(s => {
        const pass = orders.filter(o => Math.abs(o.f + s) <= fc + 1e-12);
        for (let i = 0; i < NX; i++) {
          const x = x0 + (x1 - x0) * i / (NX - 1);
          let re = 0, im = 0;
          pass.forEach(o => { const ph = 2 * Math.PI * o.f * x - Math.PI * lam * P.z * Math.pow(o.f + s, 2); re += o.c * Math.cos(ph); im += o.c * Math.sin(ph); });
          I[i] += (re * re + im * im) / src.length;
        }
      });
      const passed = new Set(); src.forEach(s => orders.forEach(o => { if (Math.abs(o.f + s) <= fc + 1e-12) passed.add(o.n); }));
      let mx = -Infinity, mn = Infinity; I.forEach(v => { mx = Math.max(mx, v); mn = Math.min(mn, v); });
      // printed CD over the central period
      let dark = 0, cnt = 0;
      for (let i = 0; i < NX; i++) { const x = x0 + (x1 - x0) * i / (NX - 1); if (x >= -p / 2 && x < p / 2) { cnt++; if (I[i] < P.th) dark++; } }
      return { I, x0, x1, NX, orders, passed, mx, mn, frac: dark / cnt, fc, Pp };
    }
    const st = canvas(el, (ctx, w, h) => {
      const R = cache; if (!R) return;
      const L = 46, Rr = w - 12, xs = x => L + (x - R.x0) / (R.x1 - R.x0) * (Rr - L);
      const p = P.pitch, psm = P.mask === 'psm';
      // mask band
      const my = 8, mh = h * 0.08;
      ctx.fillStyle = alpha(css('--fig-oxide'), 0.35); ctx.fillRect(L, my, Rr - L, mh);
      for (let k = -3; k <= 3; k++) {
        const c = (k + 0.5) * p; // chrome centred between openings
        const x0 = xs(c - p / 4), x1 = xs(c + p / 4);
        ctx.fillStyle = css('--text'); ctx.fillRect(Math.max(L, x0), my, Math.max(0, Math.min(Rr, x1) - Math.max(L, x0)), mh);
      }
      if (psm) {
        ctx.font = '600 11px ' + css('--mono'); ctx.textAlign = 'center';
        for (let k = -2; k <= 2; k++) { const x = xs(k * p); if (x > L && x < Rr) { ctx.fillStyle = k % 2 ? css('--rose') : css('--blue'); ctx.fillText(k % 2 ? 'π' : '0', x, my + mh / 2 + 4); } }
      }
      ctx.fillStyle = css('--muted'); ctx.font = '11px ' + css('--font'); ctx.textAlign = 'right'; ctx.fillText('마스크', L - 4, my + mh / 2 + 4);
      // intensity plot
      const py0 = my + mh + 14, py1 = h * 0.74;
      const ymax = Math.max(1.0, R.mx * 1.1);
      const ys = v => py1 - v / ymax * (py1 - py0);
      ctx.strokeStyle = css('--fig-grid');
      for (let v = 0; v <= ymax; v += 0.25) { ctx.beginPath(); ctx.moveTo(L, ys(v)); ctx.lineTo(Rr, ys(v)); ctx.stroke(); }
      ctx.fillStyle = css('--text-2'); ctx.font = '11px ' + css('--font'); ctx.textAlign = 'right';
      for (let v = 0; v <= ymax + 1e-9; v += 0.5) ctx.fillText(v.toFixed(1), L - 6, ys(v) + 4);
      ctx.save(); ctx.translate(12, (py0 + py1) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('빛 세기 I', 0, 0); ctx.restore();
      ctx.fillStyle = alpha(css('--accent'), 0.13); ctx.strokeStyle = css('--accent'); ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(xs(R.x0), ys(0));
      for (let i = 0; i < R.NX; i++) ctx.lineTo(xs(R.x0 + (R.x1 - R.x0) * i / (R.NX - 1)), ys(R.I[i]));
      ctx.lineTo(xs(R.x1), ys(0)); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      for (let i = 0; i < R.NX; i++) { const X = xs(R.x0 + (R.x1 - R.x0) * i / (R.NX - 1)), Y = ys(R.I[i]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke();
      ctx.strokeStyle = css('--rose'); ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L, ys(P.th)); ctx.lineTo(Rr, ys(P.th)); ctx.stroke(); ctx.setLineDash([]);
      // resist band
      const ry0 = h * 0.79, ry1 = h * 0.93;
      ctx.fillStyle = css('--fig-si'); ctx.fillRect(L, ry1, Rr - L, h - ry1 - 4);
      ctx.fillStyle = css('--fig-pr');
      for (let i = 0; i < R.NX - 1; i++) {
        if (R.I[i] < P.th) { const X0 = xs(R.x0 + (R.x1 - R.x0) * i / (R.NX - 1)), X1 = xs(R.x0 + (R.x1 - R.x0) * (i + 1) / (R.NX - 1)); ctx.fillRect(X0, ry0, X1 - X0 + 0.6, ry1 - ry0); }
      }
      ctx.fillStyle = css('--muted'); ctx.textAlign = 'right'; ctx.fillText('PR', L - 4, (ry0 + ry1) / 2 + 4);
      // x axis ticks in nm
      ctx.textAlign = 'center'; ctx.fillStyle = css('--text-2');
      [-1, 0, 1].forEach(k => ctx.fillText((k * p) + ' nm', xs(k * p), py1 + 14));
      // pupil inset
      const pr = Math.min(48, w * 0.07), pcx = Rr - pr - 10, pcy = py0 + pr + 6;
      ctx.fillStyle = css('--surface'); ctx.strokeStyle = css('--border-2'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(pcx, pcy, pr + 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = css('--accent'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pcx, pcy, pr, 0, Math.PI * 2); ctx.stroke();
      R.orders.forEach(o => {
        const u = o.f / R.fc;
        if (Math.abs(u) > 3) return;
        const x = pcx + u * pr;
        const on = R.passed.has(o.n);
        ctx.fillStyle = on ? alpha(css('--accent'), 0.35) : alpha(css('--muted'), 0.18);
        ctx.beginPath(); ctx.ellipse(x, pcy, Math.max(3, P.sig * pr), 4 + Math.min(Math.abs(o.c), 0.5) * 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = on ? css('--accent') : css('--muted');
        ctx.beginPath(); ctx.arc(x, pcy, 3, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = css('--muted'); ctx.font = '10.5px ' + css('--font'); ctx.textAlign = 'center';
      ctx.fillText('동공 & 회절 차수', pcx, pcy + pr + 20);
    });
    bind('#lab-aerial', v => {
      P = v;
      cache = compute();
      const c = (cache.mx - cache.mn) / (cache.mx + cache.mn + 1e-12);
      document.getElementById('ae-c').textContent = (c * 100).toFixed(0) + '%';
      const ords = [...cache.passed].sort((a, b) => a - b);
      document.getElementById('ae-o').textContent = ords.length ? ords.map(n => (n > 0 ? '+' : '') + n).join(', ') : '없음';
      const ok = c > 0.25 && cache.frac > 0.02 && cache.frac < 0.98;
      const cd = cache.frac * v.pitch;
      document.getElementById('ae-cd').innerHTML = ok ? cd.toFixed(0) + ' <small>nm</small>' : '—';
      const okEl = document.getElementById('ae-ok');
      okEl.textContent = ok ? '해상됨 ✓' : c < 0.25 ? '패턴 소실 ✗' : '전부 노광/미노광';
      okEl.parentElement.classList.toggle('good', ok); okEl.parentElement.classList.toggle('bad', !ok);
      st.redraw();
      return { pitch: v.pitch + ' nm', lam: v.lam + ' nm', na: v.na.toFixed(2), sig: v.sig.toFixed(2), z: v.z + ' nm', th: v.th.toFixed(2) };
    });
  })();

  /* ---------- LAB 3-4: overlay game ---------- */
  (function () {
    const el = document.getElementById('ovl');
    const marks = [[-13, -16], [13, -16], [13, 16], [-13, 16]];
    let T, C = { cx: 0, cy: 0, cr: 0, cm: 0 }, tries = 0, r = rng(Date.now() % 100000);
    function newT() {
      T = { tx: (r() - 0.5) * 30, ty: (r() - 0.5) * 30, rot: (r() - 0.5) * 1.5, mag: (r() - 0.5) * 1.5, noise: marks.map(() => [(r() - 0.5) * 0.8, (r() - 0.5) * 0.8]) };
      tries++;
      document.getElementById('ovl-n').textContent = tries;
    }
    newT();
    const err = (m, i) => {
      const [x, y] = m;
      const ex = (T.tx - C.cx) - (T.rot - C.cr) * y + (T.mag - C.cm) * x + T.noise[i][0];
      const ey = (T.ty - C.cy) + (T.rot - C.cr) * x + (T.mag - C.cm) * y + T.noise[i][1];
      return [ex, ey];
    };
    const st = canvas(el, (ctx, w, h) => {
      const fw = w * 0.62, fh = fw * 33 / 26 > h * 0.86 ? h * 0.86 : fw * 33 / 26;
      const fW = fh * 26 / 33;
      const cx = w / 2, cy = h / 2;
      const sx = fW / 26, sy = fh / 33;
      ctx.strokeStyle = css('--border-2'); ctx.fillStyle = alpha(css('--accent'), 0.05); ctx.lineWidth = 1.5;
      ctx.fillRect(cx - fW / 2, cy - fh / 2, fW, fh); ctx.strokeRect(cx - fW / 2, cy - fh / 2, fW, fh);
      // grid of dies
      ctx.strokeStyle = css('--fig-grid');
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - fW / 2 + fW * i / 4, cy - fh / 2); ctx.lineTo(cx - fW / 2 + fW * i / 4, cy + fh / 2); ctx.stroke(); }
      for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(cx - fW / 2, cy - fh / 2 + fh * i / 5); ctx.lineTo(cx + fW / 2, cy - fh / 2 + fh * i / 5); ctx.stroke(); }
      let worst = 0;
      marks.forEach((m, i) => {
        const [ex, ey] = err(m, i);
        const mag = Math.hypot(ex, ey); worst = Math.max(worst, mag);
        const mx = cx + m[0] * sx * 0.82, my = cy + m[1] * sy * 0.82;
        const box = Math.min(46, w * 0.06);
        const good = mag < 2;
        ctx.strokeStyle = css('--text-2'); ctx.lineWidth = 3; ctx.strokeRect(mx - box / 2, my - box / 2, box, box);
        const k = 0.9; // px per nm for inner box (visual)
        ctx.strokeStyle = good ? css('--green') : css('--rose'); ctx.lineWidth = 3;
        ctx.strokeRect(mx - box / 4 + ex * k, my - box / 4 + ey * k, box / 2, box / 2);
        // arrow ×20
        const ax = ex * 2.2, ay = ey * 2.2;
        if (mag > 0.2) {
          ctx.strokeStyle = good ? css('--green') : css('--rose'); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + ax, my + ay); ctx.stroke();
          const a = Math.atan2(ay, ax);
          ctx.beginPath(); ctx.moveTo(mx + ax, my + ay); ctx.lineTo(mx + ax - 8 * Math.cos(a - 0.4), my + ay - 8 * Math.sin(a - 0.4)); ctx.lineTo(mx + ax - 8 * Math.cos(a + 0.4), my + ay - 8 * Math.sin(a + 0.4)); ctx.fill();
        }
        ctx.fillStyle = css('--text-2'); ctx.font = '600 12px ' + css('--mono'); ctx.textAlign = 'center';
        ctx.fillText(mag.toFixed(1) + ' nm', mx, my + (m[1] < 0 ? -box / 2 - 8 : box / 2 + 18));
      });
      ctx.fillStyle = css('--muted'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('노광 필드 26 × 33 mm', 10, 18);
      const r = document.getElementById('ovl-r');
      document.getElementById('ovl-max').innerHTML = worst.toFixed(2) + ' <small>nm</small>' + (worst < 2 ? ' 🎉' : '');
      r.classList.toggle('good', worst < 2); r.classList.toggle('bad', worst >= 2);
    });
    const root = document.getElementById('lab-ovl');
    const ctl = bind(root, v => { C = v; st.redraw(); return { cx: v.cx.toFixed(1) + ' nm', cy: v.cy.toFixed(1) + ' nm', cr: v.cr.toFixed(2) + ' µrad', cm: v.cm.toFixed(2) + ' ppm' }; });
    document.getElementById('ovl-new').onclick = () => {
      newT();
      root.querySelectorAll('input[type=range]').forEach(i => (i.value = 0));
      ctl.update();
    };
  })();

  /* ---------- Figure 3-2: EUV path ---------- */
  (function () {
    const svg = document.getElementById('euv');
    const pts = [[130, 250], [270, 150], [380, 270], [500, 120], [600, 36], [670, 200], [760, 80], [830, 230], [700, 300]];
    const names = [null, '중간 초점', '조명계 거울', '조명계 거울', '반사형 마스크', '투영 거울', '투영 거울', '투영 거울', '웨이퍼'];
    let s = `<defs><radialGradient id="pl"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#c9a6ff"/><stop offset="1" stop-color="#8a5cff" stop-opacity="0"/></radialGradient>
      <linearGradient id="mo" x1="0" x2="1"><stop offset="0" stop-color="#c8ccd8"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#a9afc2"/></linearGradient></defs>`;
    s += `<rect x="20" y="10" width="845" height="310" rx="18" fill="var(--accent)" opacity=".05" stroke="var(--accent)" stroke-opacity=".25" stroke-dasharray="5 5"/>`;
    s += `<text x="36" y="34" font-size="12" fill="var(--accent)" font-weight="700">진공 챔버</text>`;
    // droplets
    for (let i = 0; i < 6; i++) s += `<circle cx="130" r="3" fill="#9aa3b5"><animate attributeName="cy" from="40" to="250" dur="1.2s" begin="-${i * 0.2}s" repeatCount="indefinite"/></circle>`;
    s += `<rect x="116" y="28" width="28" height="14" rx="3" fill="var(--muted)"/><text x="150" y="40" font-size="12" fill="var(--text-2)">주석(Sn) 방울 발생기</text>`;
    // laser
    s += `<line x1="40" y1="310" x2="128" y2="252" stroke="#ff4d4d" stroke-width="4" opacity=".85"><animate attributeName="opacity" values=".3;1;.3" dur=".4s" repeatCount="indefinite"/></line>`;
    s += `<text x="150" y="312" font-size="12" fill="#ff4d4d" font-weight="700">← CO₂ 레이저</text>`;
    // collector
    s += `<path d="M 60 190 Q 30 250 60 310" fill="none" stroke="url(#mo)" stroke-width="9" stroke-linecap="round"/><text x="34" y="180" font-size="12" fill="var(--text-2)">집광 거울</text>`;
    s += `<circle cx="130" cy="250" r="22" fill="url(#pl)"><animate attributeName="r" values="14;26;14" dur=".4s" repeatCount="indefinite"/></circle>`;
    s += `<text x="160" y="275" font-size="12" fill="#8a5cff" font-weight="700">플라즈마 → 13.5 nm</text>`;
    // beam path
    const d = 'M ' + pts.map(p => p.join(' ')).join(' L ');
    s += `<path d="${d}" fill="none" stroke="#8a5cff" stroke-opacity=".25" stroke-width="10" stroke-linejoin="round"/>`;
    s += `<path d="${d}" fill="none" stroke="#8a5cff" stroke-width="2.5" stroke-dasharray="10 8" stroke-linejoin="round"><animate attributeName="stroke-dashoffset" from="36" to="0" dur=".8s" repeatCount="indefinite"/></path>`;
    // mirrors
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      if (i === 1) { s += `<circle cx="${x}" cy="${y}" r="5" fill="#8a5cff"/>`; }
      else if (i < pts.length - 1) {
        const a = pts[i - 1], b = pts[i + 1];
        const din = [x - a[0], y - a[1]], dout = [b[0] - x, b[1] - y];
        const ln = v => Math.hypot(v[0], v[1]);
        const n = [dout[0] / ln(dout) - din[0] / ln(din), dout[1] / ln(dout) - din[1] / ln(din)];
        const t = [-n[1] / ln(n), n[0] / ln(n)];
        const L = i === 4 ? 46 : 30;
        s += `<line x1="${x - t[0] * L}" y1="${y - t[1] * L}" x2="${x + t[0] * L}" y2="${y + t[1] * L}" stroke="${i === 4 ? 'var(--text)' : 'url(#mo)'}" stroke-width="${i === 4 ? 8 : 9}" stroke-linecap="round"/>`;
        if (i === 4) s += `<rect x="${x - 60}" y="${y - 30}" width="120" height="12" fill="var(--muted)" opacity=".6"/>`;
      } else {
        s += `<rect x="${x - 70}" y="${y}" width="140" height="8" fill="url(#mo)"/><rect x="${x - 80}" y="${y + 8}" width="160" height="10" fill="var(--muted)" opacity=".6"/>`;
      }
      if (names[i]) s += `<text x="${x + (i === 8 ? 0 : i === 7 ? -14 : 14)}" y="${y + (i === 4 ? 26 : i === 8 ? -10 : -16)}" font-size="12" fill="var(--text-2)" text-anchor="${i === 8 ? 'middle' : i === 7 ? 'end' : 'start'}" font-weight="${i === 4 || i === 8 ? 700 : 500}">${names[i]}</text>`;
    }
    svg.innerHTML = s;
  })();

  SB.quiz(document.getElementById('quiz'), [
    { q: 'ArF 액침(λ=193 nm, NA=1.35)에서 k₁=0.3일 때 최소 선폭은 약 얼마일까?', o: ['약 13 nm', '약 43 nm', '약 145 nm', '약 193 nm'], a: 1, why: 'CD = 0.3 × 193 / 1.35 ≈ 42.9 nm. 이보다 작은 패턴은 멀티 패터닝이나 EUV가 필요합니다.' },
    { q: 'NA를 키워 해상도를 높이면 함께 생기는 부작용은?', o: ['파장이 길어진다', '초점 심도(DOF)가 얕아진다', '마스크가 투명해진다', '감광액이 두꺼워진다'], a: 1, why: 'DOF ∝ λ/NA² 이므로 NA가 커질수록 초점이 맞는 깊이가 급격히 얕아집니다.' },
    { q: '피치 p의 라인 패턴에서 수직 조명(σ=0)일 때 패턴이 사라지는 조건은?', o: ['p > λ/NA', 'p < λ/NA', 'p = 2λ', 'NA > 1'], a: 1, why: '1차 회절광의 공간 주파수 1/p가 렌즈 컷오프 NA/λ보다 크면 ±1차가 모두 렌즈 밖으로 나가 0차만 남습니다.' },
    { q: 'EUV 노광기가 렌즈 대신 거울만 사용하는 이유는?', o: ['거울이 더 싸서', '13.5 nm 빛은 거의 모든 물질에 흡수되어 투과 렌즈를 만들 수 없어서', '빛을 확대하기 위해', '레이저를 반사하기 위해'], a: 1, why: 'EUV는 유리는 물론 공기에도 흡수됩니다. 그래서 진공 속에서 Mo/Si 다층 반사 거울과 반사형 마스크를 사용합니다.' },
    { q: '스핀 코팅에서 회전 속도를 4배로 올리면 막 두께는?', o: ['4배', '2배', '1/2', '1/4'], a: 2, why: '두께 ∝ 1/√ω 이므로 √4 = 2, 두께는 절반이 됩니다.' },
  ]);
})();
