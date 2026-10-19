/* Chapter 07 — metallization & CMP */
(function () {
  const { css, canvas, animate, plot, bind, clamp, lerp, ease, alpha } = SB;

  /* ---------- Figure 7-1: interconnect stack ---------- */
  (function () {
    const L = [
      ['FEOL 트랜지스터', 46, 'fe', '실리콘 기판 위의 트랜지스터. 게이트 피치 약 50 nm. 여기까지가 전공정(FEOL)입니다.'],
      ['콘택 (W/Co)', 22, 'ct', '트랜지스터의 소스·드레인·게이트와 첫 금속층을 잇는 텅스텐 또는 코발트 플러그. MOL(Middle-of-Line)이라 부릅니다.'],
      ['M1', 14, [8, 22], '가장 가늘고 촘촘한 국지 배선. 피치 20~30 nm, EUV로 패터닝합니다. 셀 내부 연결.'],
      ['M2', 14, [8, 22], '국지 배선. M1과 직교 방향으로 깔려 격자를 이룹니다.'],
      ['M3', 14, [8, 22], '국지 배선의 마지막. 표준 셀끼리 연결합니다.'],
      ['M4–M5', 20, [14, 38], '중간(intermediate) 배선. 블록 간 신호를 나릅니다.'],
      ['M6–M7', 26, [22, 60], '중간 배선. 피치가 커질수록 저항이 줄어 먼 거리 신호에 유리합니다.'],
      ['M8–M9 (글로벌)', 40, [56, 140], '두껍고 넓은 글로벌 배선. 클록 분배와 전원망(PDN)을 담당합니다.'],
      ['재배선 · 패드', 48, [120, 300], '가장 위의 알루미늄/구리 패드층. 패키지 범프와 연결됩니다(9장).'],
    ];
    const svg = document.getElementById('stack');
    let s = '';
    let y = 372;
    const via = 8;
    const groups = [];
    L.forEach(([n, h, kind, txt], i) => {
      const y1 = y, y0 = y - h;
      let g = `<g class="ly" data-i="${i}" style="cursor:pointer"><rect x="40" y="${y0 - (i > 1 ? via : 0)}" width="700" height="${h + (i > 1 ? via : 0)}" fill="${i % 2 ? 'var(--fig-oxide)' : 'var(--fig-oxide)'}" opacity="${i % 2 ? 0.35 : 0.22}"/>`;
      if (kind === 'fe') {
        g += `<rect x="40" y="${y0 + 22}" width="700" height="${h - 22}" fill="var(--fig-si)"/>`;
        for (let x = 60; x < 730; x += 26) g += `<rect x="${x}" y="${y0 + 6}" width="9" height="16" fill="var(--fig-poly)"/><rect x="${x - 6}" y="${y0 + 22}" width="5" height="5" fill="var(--fig-ndope)"/>`;
      } else if (kind === 'ct') {
        for (let x = 52; x < 730; x += 26) g += `<rect x="${x}" y="${y0}" width="5" height="${h}" fill="#9aa1b3"/>`;
      } else {
        const [w, p] = kind;
        for (let x = 44 + (i * 7) % p; x + w < 740; x += p) {
          g += `<rect x="${x}" y="${y0}" width="${w}" height="${h}" fill="var(--fig-metal)"/>`;
          if ((x / p | 0) % 2 === 0) g += `<rect x="${x + w / 2 - Math.min(4, w / 3)}" y="${y1}" width="${Math.min(8, w / 1.5)}" height="${via}" fill="var(--fig-metal)" opacity=".85"/>`;
        }
      }
      g += `<rect x="40" y="${y0 - (i > 1 ? via : 0)}" width="700" height="${h + (i > 1 ? via : 0)}" fill="transparent" class="hit" stroke="transparent" stroke-width="2"/>`;
      g += `<text x="752" y="${y0 + h / 2 + 4}" font-size="12.5" font-weight="700" fill="var(--text-2)">${n}</text></g>`;
      groups.push(g);
      y = y0 - (i >= 1 ? via : 0);
    });
    // bracket labels
    s += groups.join('');
    s += `<text x="40" y="${y - 6}" font-size="12" fill="var(--muted)">↑ 위로 갈수록 두껍고 넓어짐 (BEOL)</text>`;
    svg.setAttribute('viewBox', `0 ${y - 22} 860 ${380 - y + 22}`);
    svg.innerHTML = s;
    const txt = document.getElementById('stack-text');
    svg.querySelectorAll('.ly').forEach(g => {
      const i = +g.dataset.i;
      const show = () => {
        svg.querySelectorAll('.ly .hit').forEach(h => h.setAttribute('stroke', 'transparent'));
        g.querySelector('.hit').setAttribute('stroke', 'var(--accent)');
        txt.innerHTML = `<b class="t">${L[i][0]}</b>${L[i][3]}`;
      };
      g.addEventListener('mouseenter', show); g.addEventListener('click', show);
    });
  })();

  /* ---------- LAB 7-1: dual damascene stepper ---------- */
  (function () {
    const STEPS = [
      ['하부 배선 (Mx)', '이미 완성된 아래층 구리 배선이 절연막 속에 묻혀 있고, 위는 SiCN 캡층이 덮고 있습니다.'],
      ['층간 절연막 증착', 'CVD로 저유전율(low-k, k≈2.5) 절연막을 쌓습니다. 유전율이 낮을수록 배선 간 기생 정전용량이 줄어 신호가 빨라집니다.'],
      ['비아 식각', '포토·식각으로 아래 배선까지 내려가는 작은 구멍(비아)을 뚫습니다. 바닥의 캡층도 열어 줍니다.'],
      ['트렌치 식각', '두 번째 포토·식각으로 위층 배선이 들어갈 넓은 홈을 팝니다. 비아와 트렌치를 한 번에 채우기 때문에 "듀얼" 다마신입니다.'],
      ['배리어 · 시드 (PVD)', '구리가 절연막으로 확산되지 않도록 TaN/Ta 배리어를 1~2 nm, 도금의 씨앗이 될 구리 시드를 얇게 입힙니다.'],
      ['전해 도금 (ECP)', '황산구리 용액에서 전류를 흘려 구리를 채웁니다. 첨가제(가속제·억제제) 덕분에 바닥부터 차오르는 "슈퍼필"로 보이드 없이 채워집니다.'],
      ['CMP', '넘친 구리와 배리어를 연마해 절연막 표면과 평평하게 맞춥니다.'],
      ['캡층 증착', '위에 다시 SiCN 캡층을 덮어 구리 확산과 전자 이동을 막습니다. 이제 위층(Mx+1)이 비아로 아래층과 연결되었습니다!'],
    ];
    const el = document.getElementById('dama');
    let k = 0, t = 1, playing = false, timer = 0;
    const st = canvas(el, (ctx, w, h) => {
      ctx.scale(w / 1000, h / 460);
      const C = { ild: css('--fig-oxide'), cu: css('--fig-metal'), cap: css('--fig-nitride'), bar: '#6b6f8a', bg: css('--surface-2'), text: css('--text') };
      const d = i => (k > i ? 1 : k === i ? ease(t) : 0);
      // lower ILD + Mx
      ctx.fillStyle = alpha(C.ild, 0.8); ctx.fillRect(0, 300, 1000, 160);
      ctx.fillStyle = C.bar; ctx.fillRect(372, 312, 256, 96);
      ctx.fillStyle = C.cu; ctx.fillRect(378, 316, 244, 86);
      ctx.fillStyle = C.cap; ctx.fillRect(0, 290, 1000, 10);
      // new ILD
      const ild = d(1);
      const ildTop = lerp(290, 130, ild);
      if (ild > 0) { ctx.fillStyle = alpha(C.ild, 0.55); ctx.fillRect(0, ildTop, 1000, 290 - ildTop); }
      // cavities
      const via = d(2), tr = d(3);
      const cav = () => {
        ctx.beginPath();
        if (via > 0) ctx.rect(470, 130, 60, lerp(0, 170, via));
        if (tr > 0) ctx.rect(300, 130, 400, lerp(0, 80, tr));
      };
      if (k >= 2) { ctx.fillStyle = C.bg; cav(); ctx.fill(); }
      // barrier/seed
      const bs = d(4);
      if (bs > 0) {
        ctx.strokeStyle = alpha(C.bar, bs); ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, 127); ctx.lineTo(303, 127); ctx.lineTo(303, 207); ctx.lineTo(473, 207); ctx.lineTo(473, 297); ctx.lineTo(527, 297); ctx.lineTo(527, 207); ctx.lineTo(697, 207); ctx.lineTo(697, 127); ctx.lineTo(1000, 127);
        ctx.stroke();
      }
      // electroplating fill (bottom-up)
      const ecp = d(5), cmp = d(6);
      if (ecp > 0) {
        const lvl = lerp(300, 86, ecp);
        ctx.save(); ctx.beginPath(); ctx.rect(476, 130, 48, 168); ctx.rect(306, 130, 388, 78); ctx.rect(0, 0, 1000, 124); ctx.clip();
        ctx.fillStyle = C.cu;
        const over = lerp(86, 124, cmp);
        ctx.fillRect(0, Math.max(lvl, k >= 6 ? over : 0), 1000, 300 - Math.max(lvl, k >= 6 ? over : 0));
        ctx.restore();
        // ions arrows
        if (k === 5 && t < 1) {
          ctx.fillStyle = C.cu;
          for (let i = 0; i < 14; i++) { const x = 320 + i * 26, y = 30 + ((performance.now() / 8 + i * 37) % 70); ctx.font = '600 13px ' + css('--font'); ctx.fillText('Cu²⁺', x, y); }
        }
      }
      // CMP: hide the field barrier progressively
      if (cmp > 0) {
        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1000, lerp(86, 124, cmp));
        if (cmp > 0.85) { ctx.fillStyle = alpha(C.ild, 0.55); ctx.fillRect(0, 124, 300, 6); ctx.fillRect(700, 124, 300, 6); ctx.fillStyle = C.cu; ctx.fillRect(306, 124, 388, 6); }
        if (k === 6 && t < 1) {
          ctx.fillStyle = alpha(C.text, 0.75); ctx.fillRect(0, lerp(40, 78, cmp), 1000, 34);
          ctx.fillStyle = css('--surface'); ctx.font = '600 15px ' + css('--font'); ctx.textAlign = 'center'; ctx.fillText('연마 패드 ⟳', 500, lerp(62, 100, cmp));
        }
      }
      // cap
      const cap = d(7);
      if (cap > 0) { ctx.fillStyle = alpha(C.cap, cap); ctx.fillRect(0, 120, 1000, 10); }
      if (k === 7 && t > 0.6) {
        ctx.strokeStyle = css('--accent'); ctx.fillStyle = css('--accent'); ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.moveTo(340, 170); ctx.lineTo(500, 170); ctx.lineTo(500, 350); ctx.lineTo(600, 350); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = '600 14px ' + css('--font'); ctx.textAlign = 'left'; ctx.fillText('전류 경로 e⁻', 610, 355);
      }
      ctx.fillStyle = alpha(C.text, 0.6); ctx.font = '600 14px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('Mx (하부 배선)', 640, 370);
      if (k >= 7) ctx.fillText('Mx+1', 710, 175);
      if (k >= 2) { ctx.fillText(k >= 6 ? '비아' : '', 540, 260); }
      ctx.fillStyle = alpha(C.text, 0.5); ctx.font = '600 15px ' + css('--mono'); ctx.textAlign = 'right';
      ctx.fillText(`STEP ${k + 1} / ${STEPS.length}`, 985, 30);
    });
    const dots = document.getElementById('dm-dots');
    STEPS.forEach((s, i) => { const b = document.createElement('button'); b.title = s[0]; b.onclick = () => { stop(); go(i); }; dots.appendChild(b); });
    function go(i) {
      k = clamp(i, 0, STEPS.length - 1); t = 0;
      document.getElementById('dm-text').innerHTML = `<span class="n">STEP ${k + 1}</span><b class="t">${STEPS[k][0]}</b>${STEPS[k][1]}`;
      [...dots.children].forEach((d, j) => d.classList.toggle('on', j === k));
    }
    const pb = document.getElementById('dm-play');
    function stop() { playing = false; pb.textContent = '▶ 자동 재생'; }
    pb.onclick = () => { playing = !playing; timer = 0; pb.textContent = playing ? '❚❚ 일시정지' : '▶ 자동 재생'; if (playing && k === STEPS.length - 1) go(0); };
    document.getElementById('dm-prev').onclick = () => { stop(); go(k - 1); };
    document.getElementById('dm-next').onclick = () => { stop(); go(k + 1); };
    go(0);
    animate(el, dt => {
      if (t < 1) t = Math.min(1, t + dt / 1.5);
      if (playing) { timer += dt; if (timer > 3) { timer = 0; if (k < STEPS.length - 1) go(k + 1); else stop(); } }
      st.redraw();
    });
  })();

  /* ---------- LAB 7-2: CMP simulator ---------- */
  (function () {
    const N = 320, DEPTH = 300, OB = 500;
    const el = document.getElementById('cmp');
    let P = { P: 3, V: 1, sel: 30, Lp: 60, dens: 0.6 };
    let trench, ox, cu, time, running, epTime;
    const WIDE = [34, 92], ARR = [128, 232], REF = [250, 312];
    function reset() {
      trench = new Uint8Array(N); ox = new Float32Array(N); cu = new Float32Array(N);
      for (let x = WIDE[0]; x < WIDE[1]; x++) trench[x] = 1;
      const pitch = 10, lw = Math.max(1, Math.round(pitch * P.dens));
      for (let x = ARR[0]; x < ARR[1]; x++) if ((x - ARR[0]) % pitch < lw) trench[x] = 1;
      // initial Cu surface after plating: partially planarised
      const sm = movAvg(Array.from(trench), 10);
      for (let x = 0; x < N; x++) { ox[x] = trench[x] ? -DEPTH : 0; cu[x] = OB - 260 * sm[x]; }
      time = 0; running = false; epTime = null;
      if (goB) goB.textContent = '▶ 연마';
    }
    function movAvg(a, win) {
      const out = new Float32Array(N), half = Math.max(1, Math.round(win / 2));
      let s = 0;
      const pre = new Float64Array(N + 1); for (let i = 0; i < N; i++) pre[i + 1] = pre[i] + a[i];
      for (let i = 0; i < N; i++) { const l = Math.max(0, i - half), r = Math.min(N, i + half + 1); out[i] = (pre[r] - pre[l]) / (r - l); }
      void s;
      return out;
    }
    const surf = x => trench[x] ? cu[x] : Math.max(ox[x], cu[x]);
    // pad surface: it rests on local high points (moving max) and bends smoothly over a planarisation length
    function padSurface(h) {
      const half = Math.max(1, Math.round(P.Lp / 2)), dil = new Float32Array(N);
      for (let i = 0; i < N; i++) { let m = -Infinity; for (let j = Math.max(0, i - half); j <= Math.min(N - 1, i + half); j++) m = Math.max(m, h[j]); dil[i] = m; }
      const z = movAvg(dil, P.Lp);
      for (let i = 0; i < N; i++) z[i] = Math.max(z[i], h[i]);
      return z;
    }
    function step(dt) {
      const h = new Float32Array(N); for (let x = 0; x < N; x++) h[x] = surf(x);
      const z = padSurface(h);
      const p = new Float32Array(N); let sum = 0;
      for (let x = 0; x < N; x++) p[x] = Math.max(0, 1 - (z[x] - h[x]) / 25);
      // load sharing: where only a fraction of the area touches the pad, the contact points carry more pressure
      const dens = movAvg(Array.from(p), P.Lp);
      for (let x = 0; x < N; x++) { p[x] = p[x] / Math.max(0.15, dens[x]); sum += p[x]; }
      const norm = N / (sum || 1);
      const base = 133 / 60 * P.P * P.V; // nm/s  (≈400 nm/min at 3 psi, 1 m/s)
      for (let x = 0; x < N; x++) {
        const rr = base * p[x] * norm * dt;
        if (trench[x]) { cu[x] = Math.max(-DEPTH, cu[x] - rr); }
        else if (cu[x] > ox[x] + 0.01) { cu[x] -= rr; if (cu[x] < ox[x]) cu[x] = ox[x]; }
        else { ox[x] -= rr / P.sel; cu[x] = ox[x]; }
      }
      // trench Cu beside eroded oxide also drops with neighbours (cannot sit above polished surface)
      time += dt;
    }
    function measure() {
      let ob = 0; for (let x = REF[0]; x < REF[1]; x++) ob += Math.max(0, cu[x] - ox[x]); ob /= (REF[1] - REF[0]);
      const oxNear = (ox[WIDE[0] - 6] + ox[WIDE[1] + 6]) / 2;
      let cuMin = Infinity; for (let x = WIDE[0] + 6; x < WIDE[1] - 6; x++) cuMin = Math.min(cuMin, cu[x]);
      const wideField = Math.max(cu[WIDE[0] - 6] - ox[WIDE[0] - 6], cu[WIDE[1] + 6] - ox[WIDE[1] + 6]);
      const dish = wideField < 1 ? Math.max(0, oxNear - cuMin) : null;
      let oref = 0; for (let x = REF[0]; x < REF[1]; x++) oref += ox[x]; oref /= (REF[1] - REF[0]);
      let oa = 0, na = 0; for (let x = ARR[0]; x < ARR[1]; x++) if (!trench[x]) { oa += ox[x]; na++; }
      const ero = oref - oa / na;
      return { ob, dish, ero };
    }
    let geo = null;
    const st = canvas(el, (ctx, w, h) => {
      if (!trench) return;
      const sx = w / N, top = 26, bot = h - 8;
      const ys = v => bot - (v + 420) / 1000 * (bot - top);
      // substrate oxide
      for (let x = 0; x < N; x++) {
        const X = x * sx;
        ctx.fillStyle = css('--fig-oxide');
        const oTop = trench[x] ? -DEPTH : ox[x];
        ctx.fillRect(X, ys(oTop), sx + 0.6, bot - ys(oTop));
        const cTop = trench[x] ? cu[x] : cu[x];
        const cBot = trench[x] ? -DEPTH : ox[x];
        if (cTop > cBot + 0.5) { ctx.fillStyle = css('--fig-metal'); ctx.fillRect(X, ys(cTop), sx + 0.6, ys(cBot) - ys(cTop)); }
      }
      // pad
      const hh = new Float32Array(N); for (let x = 0; x < N; x++) hh[x] = surf(x);
      const pz = padSurface(hh);
      ctx.fillStyle = alpha(css('--text'), 0.72);
      ctx.beginPath(); ctx.moveTo(0, 0);
      for (let x = 0; x < N; x++) ctx.lineTo(x * sx, ys(pz[x]) - 3);
      ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
      // pad texture motion
      ctx.strokeStyle = 'rgba(255,255,255,.12)';
      const off = (time * 60) % 24;
      for (let X = -24 + off; X < w; X += 24) { ctx.beginPath(); ctx.moveTo(X, 2); ctx.lineTo(X + 10, 14); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('연마 패드 →', 8, 16);
      // region labels
      ctx.fillStyle = css('--text-2'); ctx.textAlign = 'center'; ctx.font = '12px ' + css('--font');
      ctx.fillText('넓은 배선', (WIDE[0] + WIDE[1]) / 2 * sx, bot - 4);
      ctx.fillText('촘촘한 배열', (ARR[0] + ARR[1]) / 2 * sx, bot - 4);
      ctx.fillText('기준 필드', (REF[0] + REF[1]) / 2 * sx, bot - 4);
      // reference line at original oxide surface
      ctx.strokeStyle = css('--rose'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(0, ys(0)); ctx.lineTo(w, ys(0)); ctx.stroke(); ctx.setLineDash([]);
      geo = { w, h };
    });
    function readout() {
      const m = measure();
      document.getElementById('cm-t').innerHTML = time.toFixed(0) + ' <small>s</small>';
      document.getElementById('cm-ob').innerHTML = m.ob.toFixed(0) + ' <small>nm</small>';
      document.getElementById('cm-dish').innerHTML = m.dish == null ? '—' : m.dish.toFixed(1) + ' <small>nm</small>';
      document.getElementById('cm-ero').innerHTML = m.ero.toFixed(1) + ' <small>nm</small>';
      document.getElementById('cm-dish').parentElement.className = 'r ' + (m.dish == null ? '' : m.dish < 20 ? 'good' : m.dish > 50 ? 'bad' : '');
      document.getElementById('cm-ero').parentElement.className = 'r ' + (m.ero < 10 ? '' : m.ero > 30 ? 'bad' : '');
      if (epTime == null && m.ob < 0.5) epTime = time;
      document.getElementById('cm-ep').textContent = epTime == null ? '연마 중' : `${epTime.toFixed(0)} s 도달` + (time > epTime + 1 ? ` (+${(time - epTime).toFixed(0)} s 과연마)` : '');
    }
    let goB = null;
    reset();
    goB = document.getElementById('cmp-go');
    goB.onclick = () => { running = !running; goB.textContent = running ? '❚❚ 정지' : '▶ 계속'; };
    document.getElementById('cmp-reset').onclick = () => { reset(); readout(); st.redraw(); };
    let lastD = null;
    bind('#lab-cmp', v => {
      P = v;
      if (v.dens !== lastD) { lastD = v.dens; reset(); readout(); }
      st.redraw();
      return { P: v.P.toFixed(1) + ' psi', V: v.V.toFixed(2) + ' m/s', sel: v.sel + ' : 1', Lp: v.Lp + ' µm', dens: (v.dens * 100).toFixed(0) + '%' };
    });
    let acc = 0;
    animate(el, dt => {
      if (!running) return;
      for (let i = 0; i < 2; i++) step(0.09);
      st.redraw();
      acc += dt; if (acc > 0.12) { acc = 0; readout(); }
      if (time > 400) { running = false; goB.textContent = '▶ 계속'; }
    });
  })();

  /* ---------- LAB 7-3: resistivity scaling ---------- */
  (function () {
    const M = [
      { n: 'Cu', rho: 1.68, lam: 39, liner: 'tb', col: '--amber' },
      { n: 'Co', rho: 6.2, lam: 11.8, liner: 1, col: '--blue' },
      { n: 'Ru', rho: 7.1, lam: 6.6, liner: 0, col: '--teal' },
      { n: 'W', rho: 5.3, lam: 19.1, liner: 1, col: '--muted' },
    ];
    const el = document.getElementById('rc');
    let P = { W: 20, tb: 2, L: 100, k: 2.7 };
    function rhoEff(m, W) {
      const t = m.liner === 'tb' ? P.tb : m.liner;
      const H = 2 * W;
      const Wc = W - 2 * t, Hc = H - t;
      if (Wc <= 0.5 || Hc <= 0.5) return Infinity;
      const rho = m.rho * (1 + 1.2 * m.lam / Wc);
      return rho * (W * H) / (Wc * Hc);
    }
    const st = canvas(el, (ctx, w, h) => {
      const series = M.map(m => { const d = []; for (let W = 5; W <= 100; W *= 1.03) d.push([W, rhoEff(m, W)]); return { data: d, color: css(m.col), width: 2.6 }; });
      plot(ctx, w, h, {
        x: { min: 5, max: 100, log: true, label: '배선 폭 W (nm)', ticks: [5, 10, 20, 50, 100], fmt: v => v },
        y: { min: 1, max: 100, log: true, label: '실효 비저항 (µΩ·cm)', logFmt: 'plain' },
        series,
        vlines: [{ x: P.W, color: css('--accent'), label: 'W = ' + P.W + ' nm' }],
        marks: M.map(m => ({ x: P.W, y: rhoEff(m, P.W), color: css(m.col), r: 5 })),
      });
      // legend
      ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'left';
      M.forEach((m, i) => { ctx.fillStyle = css(m.col); ctx.fillText('● ' + m.n, w - 70, 26 + i * 16); });
    });
    bind('#lab-rc', v => {
      P = v;
      const rows = M.map(m => {
        const rho = rhoEff(m, v.W);
        const R = rho * 1e-8 * v.L * 1e-6 / (v.W * 1e-9 * 2 * v.W * 1e-9);
        const C = 6 * 8.854e-12 * v.k * v.L * 1e-6;
        const tau = 0.38 * R * C;
        return { m, rho, R, tau };
      });
      const best = rows.reduce((a, b) => (b.rho < a.rho ? b : a));
      document.getElementById('rc-out').innerHTML = rows.map(r => `<div class="r ${r === best ? 'good' : ''}"><div class="k">${r.m.n} · ρ ${isFinite(r.rho) ? r.rho.toFixed(1) : '∞'} µΩcm</div><div class="v">${isFinite(r.tau) ? (r.tau * 1e12 >= 1000 ? (r.tau * 1e9).toFixed(2) + ' <small>ns</small>' : (r.tau * 1e12).toFixed(1) + ' <small>ps</small>') : '—'}</div></div>`).join('');
      st.redraw();
      return { W: v.W + ' nm', tb: v.tb.toFixed(1) + ' nm', L: v.L + ' µm', k: v.k.toFixed(1) };
    });
  })();

  SB.quiz(document.getElementById('quiz'), [
    { q: '구리 배선을 알루미늄처럼 플라즈마 식각으로 패터닝하지 않는 이유는?', o: ['구리가 너무 단단해서', '구리 염화물 등이 휘발되지 않아 건식 식각이 어려워서', '구리가 투명해서', '구리는 전기가 안 통해서'], a: 1, why: '그래서 절연막에 홈을 파고 채운 뒤 연마하는 다마신 공정을 씁니다.' },
    { q: '프레스턴 방정식 RR = Kp·P·V에서 압력을 2배, 속도를 1.5배로 하면 제거 속도는?', o: ['1.5배', '2배', '3배', '3.5배'], a: 2, why: '2 × 1.5 = 3배.' },
    { q: '넓은 구리 배선의 가운데가 접시처럼 파이는 CMP 결함은?', o: ['에로전', '디싱', '보이드', '힐록'], a: 1, why: '패드가 넓은 부드러운 구리 영역 안으로 휘어 들어가 계속 깎는 현상을 디싱이라 합니다. 에로전은 촘촘한 배열 영역의 절연막까지 함께 내려앉는 현상입니다.' },
    { q: '배선 폭이 10 nm대로 줄면 Cu보다 Ru가 유리해질 수 있는 이유는?', o: ['Ru가 더 싸서', 'Ru는 전자 평균 자유 행로가 짧고 배리어가 거의 필요 없어서', 'Ru의 벌크 비저항이 더 낮아서', 'Ru는 CMP가 필요 없어서'], a: 1, why: '벌크 비저항은 Cu가 훨씬 낮지만, 가는 선에서는 크기 효과와 배리어 면적 손실이 Cu를 더 크게 불리하게 만듭니다.' },
  ]);
})();
