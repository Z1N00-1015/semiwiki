/* Chapter 08 — test & yield */
(function () {
  const { css, canvas, animate, plot, bind, clamp, rng, alpha } = SB;

  /* ---------- Figure 8-1: probe card ---------- */
  (function () {
    const svg = document.getElementById('probe');
    let s = `<defs><linearGradient id="wfg" x1="0" x2="1"><stop offset="0" stop-color="#9aa3b8"/><stop offset=".5" stop-color="#dfe3ec"/><stop offset="1" stop-color="#9aa3b8"/></linearGradient></defs>`;
    s += `<rect x="300" y="6" width="260" height="34" rx="6" fill="var(--text-2)"/><text x="430" y="28" text-anchor="middle" font-size="13" fill="var(--surface)" font-weight="700">테스터 헤드</text>`;
    s += `<rect x="200" y="46" width="460" height="22" rx="4" fill="#2e7d4f"/><text x="430" y="62" text-anchor="middle" font-size="12" fill="#fff" font-weight="700">프로브 카드 (PCB)</text>`;
    s += `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 10;0 10;0 0;0 0" keyTimes="0;.2;.6;.8;1" dur="2.4s" repeatCount="indefinite"/>`;
    for (let i = 0; i < 22; i++) {
      const x0 = 240 + i * 18, x1 = 360 + i * 6.6;
      s += `<path d="M ${x0} 68 L ${x0} 92 Q ${x0} 120 ${x1} 140 L ${x1} 150" stroke="#b8a26a" stroke-width="1.8" fill="none"/>`;
    }
    s += `</g>`;
    // signal pulses
    s += `<line x1="430" y1="40" x2="430" y2="46" stroke="var(--accent)" stroke-width="4"/>`;
    s += `<path d="M 330 40 V 46 M 530 40 V 46" stroke="var(--accent)" stroke-width="3"/>`;
    // wafer with dies
    s += `<ellipse cx="430" cy="185" rx="330" ry="34" fill="url(#wfg)"/>`;
    for (let i = -10; i <= 10; i++) for (let j = -2; j <= 2; j++) {
      const x = 430 + i * 28 + j * 4, y = 185 + j * 11;
      if (((x - 430) / 320) ** 2 + ((y - 185) / 30) ** 2 < 0.8) s += `<rect x="${x - 11}" y="${y - 4}" width="22" height="8" fill="${(i * 3 + j * 7 + 50) % 9 === 0 ? 'var(--rose)' : 'var(--green)'}" opacity=".55"/>`;
    }
    s += `<rect x="415" y="177" width="30" height="12" fill="none" stroke="var(--accent)" stroke-width="2.5"><animate attributeName="opacity" values="1;.3;1" dur="1.2s" repeatCount="indefinite"/></rect>`;
    s += `<rect x="120" y="214" width="620" height="18" rx="4" fill="var(--muted)" opacity=".6"/><text x="430" y="227" text-anchor="middle" font-size="12" fill="var(--surface)" font-weight="700">척(chuck) · 온도 제어 −40 ~ 150 °C</text>`;
    s += `<text x="700" y="120" font-size="12.5" fill="var(--text-2)">텅스텐/MEMS 프로브 바늘</text><line x1="696" y1="116" x2="610" y2="120" stroke="var(--muted)"/>`;
    s += `<text x="40" y="150" font-size="12.5" fill="var(--text-2)">한 번에 여러 다이를</text><text x="40" y="168" font-size="12.5" fill="var(--text-2)">동시에 테스트(멀티 사이트)</text>`;
    svg.innerHTML = s;
  })();

  /* ---------- LAB 8-1: wafer map ---------- */
  (function () {
    const el = document.getElementById('wmap');
    const R = 150, EE = 3;
    let P = { pat: 'rand', d0: 0.25, die: 12 }, seed = 1, defects = [], extra = [], dies = [];
    function gen() {
      const r = rng(seed * 101 + 7);
      const area = Math.PI * Math.pow(R / 10, 2);
      const N = Math.round(P.d0 * area);
      const d = [];
      const disk = () => { const a = r() * Math.PI * 2, rr = R * Math.sqrt(r()); return [rr * Math.cos(a), rr * Math.sin(a)]; };
      if (P.pat === 'rand') for (let i = 0; i < N; i++) d.push(disk());
      if (P.pat === 'clus') {
        const nc = Math.max(1, Math.round(N / 9)); const cs = []; for (let i = 0; i < nc; i++) cs.push(disk());
        for (let i = 0; i < N; i++) { const c = cs[i % nc]; d.push([c[0] + SB.gauss(r) * 7, c[1] + SB.gauss(r) * 7]); }
      }
      if (P.pat === 'edge') for (let i = 0; i < N; i++) { const a = r() * Math.PI * 2, rr = R * (1 - 0.22 * Math.pow(r(), 2)); d.push([rr * Math.cos(a), rr * Math.sin(a)]); }
      if (P.pat === 'scr') {
        const a = r() * Math.PI, off = (r() - 0.5) * R;
        const nx = Math.cos(a), ny = Math.sin(a);
        const ns = Math.round(N * 0.7);
        for (let i = 0; i < ns; i++) { const t = (i / ns - 0.5) * 2 * R * 0.9; d.push([-ny * off + nx * t + SB.gauss(r) * 0.8, nx * off + ny * t + SB.gauss(r) * 0.8]); }
        for (let i = ns; i < N; i++) d.push(disk());
      }
      defects = d.filter(([x, y]) => x * x + y * y < R * R);
    }
    function layout() {
      const s = P.die + 0.1, n = Math.ceil(R / s) + 1;
      dies = [];
      for (let i = -n; i < n; i++) for (let j = -n; j < n; j++) {
        const x0 = i * s, y0 = j * s, x1 = x0 + P.die, y1 = y0 + P.die;
        const far = Math.max(x0 * x0, x1 * x1) + Math.max(y0 * y0, y1 * y1);
        if (far <= (R - EE) * (R - EE)) dies.push({ x0, y0, x1, y1 });
      }
      const all = defects.concat(extra);
      dies.forEach(d => { d.n = all.filter(([x, y]) => x >= d.x0 && x <= d.x1 && y >= d.y0 && y <= d.y1).length; });
    }
    let geo = null;
    const st = canvas(el, (ctx, w, h) => {
      const sc = Math.min(w, h) * 0.47 / R, cx = w / 2, cy = h / 2;
      geo = { sc, cx, cy };
      ctx.fillStyle = '#cfd4df'; ctx.beginPath(); ctx.arc(cx, cy, R * sc, 0, Math.PI * 2); ctx.fill();
      dies.forEach(d => {
        ctx.fillStyle = d.n ? (d.n > 1 ? '#b8324a' : 'rgba(214,69,93,.88)') : 'rgba(46,158,79,.82)';
        ctx.fillRect(cx + d.x0 * sc, cy + d.y0 * sc, (d.x1 - d.x0) * sc, (d.y1 - d.y0) * sc);
        if (d.n > 1 && P.die * sc > 14) { ctx.fillStyle = '#fff'; ctx.font = '600 10px ' + css('--mono'); ctx.textAlign = 'center'; ctx.fillText(d.n, cx + (d.x0 + d.x1) / 2 * sc, cy + (d.y0 + d.y1) / 2 * sc + 3); }
      });
      ctx.fillStyle = '#16161c';
      defects.concat(extra).forEach(([x, y]) => { ctx.beginPath(); ctx.arc(cx + x * sc, cy + y * sc, 1.7, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = css('--surface-2'); ctx.beginPath(); ctx.arc(cx, cy + R * sc, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = css('--muted'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('숫자 = 한 다이에 겹친 결함 수', 10, h - 10);
    });
    function update() {
      layout();
      const good = dies.filter(d => !d.n).length;
      const nDef = defects.length + extra.length;
      const area = Math.PI * Math.pow(R / 10, 2), D = nDef / area, A = P.die * P.die / 100;
      document.getElementById('mp-y').innerHTML = (good / dies.length * 100).toFixed(1) + '<small>%</small>';
      document.getElementById('mp-p').innerHTML = (Math.exp(-A * D) * 100).toFixed(1) + '<small>%</small>';
      document.getElementById('mp-n').textContent = nDef;
      document.getElementById('mp-f').textContent = `${dies.length - good} / ${dies.length}`;
      st.redraw();
    }
    let lastK = '';
    bind('#lab-map', v => {
      const k = v.pat + v.d0;
      P = v;
      if (k !== lastK) { lastK = k; gen(); }
      update();
      return { d0: v.d0.toFixed(2) + ' /cm²', die: v.die + ' mm' };
    });
    document.getElementById('map-new').onclick = () => { seed++; extra = []; gen(); update(); };
    document.getElementById('map-clr').onclick = () => { defects = []; extra = []; update(); };
    el.addEventListener('pointerdown', e => {
      if (!geo) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - geo.cx) / geo.sc, y = (e.clientY - r.top - geo.cy) / geo.sc;
      if (x * x + y * y < R * R) { extra.push([x, y]); update(); }
    });
  })();

  /* ---------- LAB 8-2: yield model comparison ---------- */
  const MODELS = [
    ['푸아송', (x) => Math.exp(-x), '--rose'],
    ['머피', (x) => x < 1e-6 ? 1 : Math.pow((1 - Math.exp(-x)) / x, 2), '--amber'],
    ['시즈', (x) => 1 / (1 + x), '--blue'],
  ];
  (function () {
    const el = document.getElementById('ym');
    let P = { A: 100, d0: 0.1, al: 2 };
    const nb = x => Math.pow(1 + x / P.al, -P.al);
    const st = canvas(el, (ctx, w, h) => {
      const xs = []; for (let x = 0; x <= 5; x += 0.05) xs.push(x);
      const x0 = P.A / 100 * P.d0;
      const series = MODELS.map(([n, f, c]) => ({ data: xs.map(x => [x, f(x) * 100]), color: css(c), width: 2 }));
      series.push({ data: xs.map(x => [x, nb(x) * 100]), color: css('--accent'), width: 3.2 });
      plot(ctx, w, h, {
        x: { min: 0, max: 5, label: 'A · D₀ (칩당 평균 결함 수)' },
        y: { min: 0, max: 100, label: '수율 (%)' },
        series,
        vlines: [{ x: Math.min(5, x0), color: css('--text-2'), label: 'A·D₀ = ' + x0.toFixed(2) }],
        marks: [{ x: Math.min(5, x0), y: nb(x0) * 100, color: css('--accent'), r: 6 }],
      });
      ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'right';
      MODELS.concat([['음이항 (α=' + P.al.toFixed(1) + ')', 0, '--accent']]).forEach(([n, , c], i) => { ctx.fillStyle = css(c); ctx.fillText('— ' + n, w - 22, 26 + i * 16); });
    });
    bind('#lab-ym', v => {
      P = v;
      const x = v.A / 100 * v.d0;
      document.getElementById('ym-out').innerHTML = MODELS.map(([n, f]) => `<div class="r"><div class="k">${n}</div><div class="v">${(f(x) * 100).toFixed(1)}<small>%</small></div></div>`).join('') + `<div class="r good"><div class="k">음이항</div><div class="v">${(nb(x) * 100).toFixed(1)}<small>%</small></div></div>`;
      st.redraw();
      return { A: v.A + ' mm²', d0: v.d0.toFixed(2) + ' /cm²', al: v.al.toFixed(1) };
    });
  })();

  /* ---------- LAB 8-3: cost per die ---------- */
  (function () {
    const el = document.getElementById('cost');
    let P = { wc: 18000, A: 600, d0: 0.1, n: 4 };
    const dpw = A => Math.max(0, Math.PI * 150 * 150 / A - Math.PI * 300 / Math.sqrt(2 * A));
    const Y = A => Math.pow(1 + A / 100 * P.d0 / 3, -3);
    const cpd = A => P.wc / (dpw(A) * Y(A));
    const mono = A => cpd(A);
    const chip = (A, n) => n === 1 ? mono(A) : n * (cpd(A / n * 1.1) + 15) / Math.pow(0.99, n);
    const st = canvas(el, (ctx, w, h) => {
      const xs = []; for (let A = 50; A <= 800; A += 10) xs.push(A);
      plot(ctx, w, h, {
        x: { min: 50, max: 800, label: '전체 로직 면적 (mm²)' },
        y: { min: 10, max: 20000, log: true, label: '양품 1개당 원가 ($)', logFmt: 'plain' },
        series: [{ data: xs.map(A => [A, mono(A)]), color: css('--rose'), width: 2.6 }, { data: xs.map(A => [A, chip(A, P.n)]), color: css('--teal'), width: 2.6 }],
        vlines: [{ x: P.A, color: css('--text-2') }],
        marks: [{ x: P.A, y: mono(P.A), color: css('--rose'), r: 6 }, { x: P.A, y: chip(P.A, P.n), color: css('--teal'), r: 6 }],
      });
      ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillStyle = css('--rose'); ctx.fillText('— 모놀리식', 70, 26);
      ctx.fillStyle = css('--teal'); ctx.fillText(`— 칩렛 ×${P.n}`, 70, 42);
    });
    bind('#lab-cost', v => {
      P = v;
      const m = mono(v.A), c = chip(v.A, v.n);
      const save = (1 - c / m) * 100;
      document.getElementById('cost-out').innerHTML = `
        <div class="r"><div class="k">모놀리식 다이/웨이퍼</div><div class="v">${dpw(v.A).toFixed(0)}</div></div>
        <div class="r"><div class="k">모놀리식 수율</div><div class="v">${(Y(v.A) * 100).toFixed(0)}<small>%</small></div></div>
        <div class="r bad"><div class="k">모놀리식 원가</div><div class="v">$${m.toFixed(0)}</div></div>
        <div class="r good"><div class="k">칩렛 ×${v.n} 원가</div><div class="v">$${c.toFixed(0)}</div></div>
        <div class="r ${save > 0 ? 'good' : 'bad'}"><div class="k">절감</div><div class="v">${save.toFixed(0)}<small>%</small></div></div>`;
      st.redraw();
      return { wc: '$' + v.wc.toLocaleString(), A: v.A + ' mm²', d0: v.d0.toFixed(2) + ' /cm²', n: v.n + '개' };
    });
  })();

  SB.quiz(document.getElementById('quiz'), [
    { q: '칩 면적 2 cm², 결함 밀도 0.5 /cm²일 때 푸아송 수율은?', o: ['약 90%', '약 61%', '약 37%', '약 14%'], a: 2, why: 'A·D₀ = 1 → e⁻¹ ≈ 36.8%.' },
    { q: '같은 결함 수라도 결함이 뭉쳐 있으면 수율은 무작위 분포에 비해?', o: ['낮아진다', '높아진다', '같다', '0이 된다'], a: 1, why: '여러 결함이 한 다이에 몰리면 불량 다이 수 자체는 줄어듭니다. 음이항 모델의 α가 작을수록 이 효과가 큽니다.' },
    { q: '웨이퍼 맵에서 불량이 일직선으로 늘어서 있다면 가장 의심되는 원인은?', o: ['무작위 파티클', '웨이퍼 스크래치', '가장자리 식각 불균일', '설계 버그'], a: 1, why: '선형 패턴은 이송 중 긁힘이나 CMP 스크래치의 전형적인 지문입니다.' },
    { q: '큰 칩을 칩렛으로 나누면 원가가 줄어드는 주된 이유는?', o: ['웨이퍼가 싸져서', '작은 다이는 수율이 지수적으로 높고 가장자리 손실도 적어서', '테스트가 필요 없어서', '패키징이 공짜라서'], a: 1, why: '수율이 면적에 지수적으로 의존하므로, 작게 나눈 칩렛들은 각각 훨씬 높은 수율을 보입니다. 대신 조립 비용과 D2D 면적이 추가됩니다.' },
  ]);
})();
