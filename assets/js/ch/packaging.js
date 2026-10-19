/* Chapter 09 — packaging */
(function () {
  const { css, canvas, bind, clamp, alpha } = SB;

  /* ---------- Figure 9-1: back-end flow ---------- */
  (function () {
    const steps = [
      ['백그라인딩', '<ellipse cx="0" cy="10" rx="36" ry="9" fill="var(--fig-si)"/><rect x="-30" y="-30" width="60" height="14" rx="4" fill="var(--muted)"/><path d="M-20 -14 v10 M0 -14 v10 M20 -14 v10" stroke="var(--muted)" stroke-dasharray="2 2"/>'],
      ['다이싱', '<ellipse cx="0" cy="10" rx="36" ry="9" fill="var(--fig-si)"/><path d="M-30 10 H30 M-15 2 L-15 18 M15 2 L15 18" stroke="var(--surface)" stroke-width="1.5"/><circle cx="18" cy="-18" r="14" fill="none" stroke="var(--rose)" stroke-width="3"/><circle cx="18" cy="-18" r="3" fill="var(--rose)"/>'],
      ['다이 접착', '<rect x="-34" y="6" width="68" height="10" fill="var(--fig-nitride)"/><rect x="-16" y="-4" width="32" height="10" fill="var(--fig-si-2)"/><path d="M0 -34 v20" stroke="var(--muted)" stroke-width="3"/><path d="M-6 -20 L0 -12 L6 -20" fill="none" stroke="var(--muted)" stroke-width="2"/>'],
      ['와이어 본딩', '<rect x="-34" y="6" width="68" height="10" fill="var(--fig-nitride)"/><rect x="-16" y="-4" width="32" height="10" fill="var(--fig-si-2)"/><path d="M-12 -4 Q-24 -26 -30 6 M12 -4 Q24 -26 30 6" stroke="#d4a72c" stroke-width="2" fill="none"/>'],
      ['몰딩', '<rect x="-34" y="6" width="68" height="10" fill="var(--fig-nitride)"/><path d="M-34 6 V-18 Q-34 -24 -28 -24 H28 Q34 -24 34 -18 V6 z" fill="#2b2d38"/><text x="0" y="-4" text-anchor="middle" font-size="9" fill="#aaa">EMC</text>'],
      ['솔더볼', '<rect x="-34" y="-14" width="68" height="20" fill="#2b2d38"/><rect x="-34" y="6" width="68" height="8" fill="var(--fig-nitride)"/>' + [-26, -13, 0, 13, 26].map(x => `<circle cx="${x}" cy="19" r="5" fill="#c0c4cc"/>`).join('')],
      ['최종 테스트', '<rect x="-30" y="-10" width="60" height="22" fill="#2b2d38"/><text x="0" y="5" text-anchor="middle" font-size="10" fill="#ddd" font-weight="700">CHIP</text><circle cx="24" cy="-22" r="10" fill="var(--green)"/><path d="M19 -22 l4 4 l7 -8" stroke="#fff" stroke-width="2.4" fill="none"/>'],
    ];
    const svg = document.getElementById('pflow');
    let s = '<defs><marker id="ar9" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>';
    steps.forEach(([t, g], i) => {
      const x = 62 + i * 126;
      s += `<g transform="translate(${x},86)">${g}</g><text x="${x}" y="160" text-anchor="middle" font-size="13.5" font-weight="700" fill="var(--text)">${t}</text><text x="${x}" y="30" text-anchor="middle" font-size="11" font-family="var(--mono)" fill="var(--muted)">${i + 1}</text>`;
      if (i < steps.length - 1) s += `<line x1="${x + 44}" y1="88" x2="${x + 80}" y2="88" stroke="var(--muted)" stroke-width="1.6" marker-end="url(#ar9)"/>`;
    });
    svg.innerHTML = s;
  })();

  /* ---------- LAB 9-1: package evolution ---------- */
  (function () {
    const pcb = '<rect x="20" y="268" width="820" height="24" rx="3" fill="#2e7d4f"/><text x="30" y="285" font-size="12" fill="#fff" font-weight="700">메인보드 PCB</text>';
    const balls = (x0, x1, y, r, n) => { let s = ''; for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + 0.5) / n; s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#c0c4cc" stroke="#9aa0ab"/>`; } return s; };
    const bumps = (x0, x1, y, r, n, col) => { let s = ''; for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + 0.5) / n; s += `<rect x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" rx="${r * 0.6}" fill="${col || '#c0c4cc'}"/>`; } return s; };
    const lab = (x, y, t, anchor) => `<text x="${x}" y="${y}" font-size="12.5" fill="var(--text-2)" font-weight="600" text-anchor="${anchor || 'start'}">${t}</text>`;
    const T = [
      { id: 'qfp', n: '리드프레임 (QFP)', io: '~200', pitch: '400–650 µm', yr: '1980s~', txt: '칩을 금속 리드프레임에 붙이고 가장자리 패드를 금선으로 리드에 연결합니다. 저렴하지만 칩 둘레만 쓸 수 있어 I/O가 제한됩니다. 지금도 전력·아날로그 칩에 널리 쓰입니다.',
        svg: () => `${pcb}<path d="M260 150 H600 V230 H260 z" fill="#2b2d38"/><rect x="380" y="196" width="100" height="10" fill="#b0905a"/><rect x="390" y="180" width="80" height="16" fill="var(--fig-si-2)"/>
          <path d="M395 180 Q340 150 300 205 M465 180 Q520 150 560 205" stroke="#d4a72c" stroke-width="2" fill="none"/>
          <path d="M260 205 H230 Q220 205 220 215 V258 Q220 266 210 266 H190" stroke="#b0905a" stroke-width="7" fill="none"/><path d="M600 205 H630 Q640 205 640 215 V258 Q640 266 650 266 H670" stroke="#b0905a" stroke-width="7" fill="none"/>
          ${lab(400, 140, '금선 (와이어)')}${lab(640, 196, '리드')}${lab(270, 170, 'EMC 몰드')}${lab(486, 192, '다이')}` },
      { id: 'wb', n: '와이어본드 BGA', io: '~600', pitch: '0.5–1 mm 볼', yr: '1990s~', txt: '리드 대신 기판 바닥 전체에 솔더볼을 배열해 I/O를 늘렸습니다. 칩 연결은 여전히 와이어 본딩입니다. 모바일 D램·낸드에 여러 칩을 쌓아 와이어로 연결하는 형태로 많이 씁니다.',
        svg: () => `${pcb}<rect x="240" y="226" width="380" height="16" fill="var(--fig-nitride)"/>${balls(250, 610, 254, 9, 12)}<path d="M250 226 V170 Q250 160 260 160 H600 Q610 160 610 170 V226 z" fill="#2b2d38"/>
          <rect x="350" y="206" width="160" height="20" fill="var(--fig-si-2)"/><path d="M356 206 Q300 170 280 226 M504 206 Q560 170 580 226" stroke="#d4a72c" stroke-width="2" fill="none"/>
          ${lab(630, 238, '패키지 기판')}${lab(630, 262, '솔더볼')}${lab(520, 200, '다이')}` },
      { id: 'fc', n: '플립칩 BGA', io: '~5,000', pitch: '130–200 µm 범프', yr: '2000s~', txt: '칩을 뒤집어 칩 전면의 범프를 기판에 직접 붙입니다. 칩 전체 면적을 I/O로 쓰고 배선 길이가 짧아 빠릅니다. 칩 뒷면은 위를 향해 히트스프레더로 열을 빼냅니다. CPU·GPU의 표준입니다.',
        svg: () => `${pcb}<rect x="200" y="222" width="460" height="20" fill="var(--fig-nitride)"/>${balls(210, 650, 254, 9, 15)}
          <rect x="320" y="180" width="220" height="28" fill="var(--fig-si-2)"/>${bumps(326, 534, 214, 5, 18)}<rect x="316" y="208" width="228" height="14" fill="#7d8a9e" opacity=".35"/>
          <path d="M220 222 V150 H640 V222 H620 V170 H240 V222 z" fill="#b8bec9"/>
          ${lab(670, 236, '기판')}${lab(560, 196, '다이 (뒤집힘)')}${lab(560, 218, 'C4 범프 + 언더필')}${lab(650, 160, '히트스프레더')}` },
      { id: '25d', n: '2.5D (인터포저)', io: '~100,000', pitch: '40–55 µm 마이크로범프', yr: '2012~', txt: '실리콘 인터포저 위에 GPU와 HBM을 나란히 놓고, 인터포저 속 미세 배선으로 수천 개의 신호를 연결합니다. TSMC CoWoS가 대표적이며 AI 가속기의 핵심 기술입니다.',
        svg: () => `${pcb}<rect x="110" y="226" width="640" height="16" fill="var(--fig-nitride)"/>${balls(120, 740, 254, 8, 22)}
          <rect x="160" y="198" width="540" height="16" fill="#9aa3b8"/>${bumps(166, 694, 220, 3.5, 40)}${Array.from({ length: 16 }, (_, i) => `<rect x="${178 + i * 33}" y="198" width="3" height="16" fill="#d39b4a"/>`).join('')}
          <rect x="320" y="150" width="220" height="40" fill="var(--accent)" opacity=".85"/>${bumps(326, 534, 194, 2.5, 30, '#d39b4a')}
          ${[180, 570].map(x => Array.from({ length: 6 }, (_, k) => `<rect x="${x}" y="${182 - k * 9}" width="110" height="8" fill="var(--teal)" opacity="${0.6 + k * 0.06}"/>`).join('') + bumps(x + 4, x + 106, 194, 2.5, 12, '#d39b4a')).join('')}
          ${lab(430, 175, 'GPU / SoC', 'middle').replace('var(--text-2)', '#fff')}${lab(235, 120, 'HBM', 'middle')}${lab(625, 120, 'HBM', 'middle')}${lab(710, 210, '실리콘 인터포저 (TSV)')}${lab(760, 238, '기판')}` },
      { id: '3d', n: '3D (하이브리드 본딩)', io: '>1,000,000', pitch: '1–10 µm Cu–Cu', yr: '2022~', txt: '칩 위에 칩을 직접 쌓고 구리 패드끼리 원자 수준으로 붙입니다(하이브리드 본딩). 범프가 없어 피치가 수 µm까지 줄고, 두 칩이 사실상 하나처럼 동작합니다. 캐시 적층(AMD 3D V-Cache), 이미지 센서, 차세대 HBM에 쓰입니다.',
        svg: () => `${pcb}<rect x="220" y="222" width="420" height="20" fill="var(--fig-nitride)"/>${balls(230, 630, 254, 9, 14)}
          <rect x="300" y="184" width="260" height="30" fill="var(--accent)" opacity=".85"/>${bumps(306, 554, 218, 4, 16)}
          <rect x="320" y="150" width="220" height="32" fill="var(--teal)" opacity=".85"/>
          ${Array.from({ length: 40 }, (_, i) => `<rect x="${323 + i * 5.4}" y="181" width="2.6" height="5" fill="#d39b4a"/>`).join('')}
          ${Array.from({ length: 8 }, (_, i) => `<rect x="${330 + i * 30}" y="184" width="3" height="30" fill="#d39b4a"/>`).join('')}
          ${lab(560, 166, '상부 다이 (SRAM 캐시)')}${lab(570, 204, '하부 다이 (CPU) · TSV')}<line x1="430" y1="183" x2="430" y2="120" stroke="var(--rose)"/>${lab(436, 118, 'Cu–Cu 직접 접합면')}` },
    ];
    const tabs = document.getElementById('evo-tabs');
    tabs.innerHTML = T.map(t => `<button data-tab="${t.id}">${t.n}</button>`).join('');
    const svg = document.getElementById('evo-svg');
    function show(id) {
      const t = T.find(x => x.id === id);
      [...tabs.children].forEach(b => b.classList.toggle('on', b.dataset.tab === id));
      svg.innerHTML = t.svg();
      document.getElementById('evo-out').innerHTML = `<div class="r"><div class="k">I/O 수 (대략)</div><div class="v">${t.io}</div></div><div class="r"><div class="k">연결 피치</div><div class="v" style="font-size:14px">${t.pitch}</div></div><div class="r"><div class="k">등장</div><div class="v" style="font-size:14px">${t.yr}</div></div>`;
      document.getElementById('evo-text').innerHTML = `<b class="t">${t.n}</b>${t.txt}`;
    }
    tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.tab); });
    show('25d');
  })();

  /* ---------- LAB 9-2: HBM 3D exploded view ---------- */
  (function () {
    const stage = document.getElementById('stage'), scene = document.getElementById('scene');
    let rx = 60, rz = -32, P = { ex: 0.35, n: 12, gen: 'hbm3e' }, sel = null;
    const GEN = { hbm3: { bw: 819, die: 2, w: 1024 }, hbm3e: { bw: 1229, die: 3, w: 1024 }, hbm4: { bw: 2048, die: 4, w: 2048 } };
    const INFO = {
      sub: ['패키지 기판', '유기 기판(ABF). 인터포저와 메인보드 사이에서 전원·신호를 분배합니다. 아래에 수천 개의 솔더볼이 있습니다.'],
      int: ['실리콘 인터포저', 'GPU와 HBM을 잇는 수만 개의 미세 배선과 아래로 내려가는 TSV가 있는 실리콘 판. 크기가 노광 한계(레티클)의 3~4배에 달합니다.'],
      gpu: ['GPU / AI 가속기 다이', '수백억 개의 트랜지스터가 있는 연산 칩. 최첨단 공정(3~5 nm)으로 만들며, 6~8개의 HBM 스택과 연결됩니다.'],
      base: ['HBM 베이스(로직) 다이', '스택 맨 아래의 로직 다이. 1,024(또는 2,048)개 데이터 선의 PHY와 테스트·리페어 회로가 있습니다. HBM4부터는 파운드리 로직 공정으로 만듭니다.'],
      dram: ['D램 코어 다이', '두께 약 30~40 µm로 얇게 간 D램 다이. 수천 개의 TSV가 다이를 관통해 위아래로 신호와 전원을 전달하고, 다이 사이는 마이크로범프 또는 하이브리드 본딩으로 붙입니다.'],
    };
    function slab(x, y, z, w, d, t, color, key, label) {
      const el = document.createElement('div');
      el.className = 'slab' + (sel === key ? ' sel' : '');
      el.style.width = w + 'px'; el.style.height = d + 'px';
      el.style.transform = `translate3d(${x - w / 2}px, ${y - d / 2}px, ${z}px)`;
      const dark = c => `linear-gradient(rgba(0,0,0,.28), rgba(0,0,0,.28)), ${c}`;
      el.innerHTML = `<div class="f top" style="background:${color};transform:translateZ(${t}px)">${label ? `<span class="lbl">${label}</span>` : ''}</div>
        <div class="f" style="width:${w}px;height:${t}px;background:${dark(color)};transform-origin:top left;transform:translate3d(0,${d}px,${t}px) rotateX(-90deg)"></div>
        <div class="f" style="width:${t}px;height:${d}px;background:${dark(color)};filter:brightness(.85);transform-origin:top left;transform:translate3d(${w}px,0,${t}px) rotateY(90deg)"></div>`;
      el.addEventListener('click', e => { e.stopPropagation(); sel = key; const [a, b] = INFO[key]; document.getElementById('hb-info').innerHTML = `<b class="t">${a}</b>${b}`; build(); });
      stage.appendChild(el);
    }
    function build() {
      stage.innerHTML = '';
      stage.style.transform = `rotateX(${rx}deg) rotateZ(${rz}deg)`;
      const E = P.ex;
      slab(0, 0, 0, 440, 300, 14, '#2e7d4f', 'sub', '패키지 기판');
      const zi = 14 + 30 * E;
      slab(0, 0, zi, 360, 210, 8, 'linear-gradient(135deg,#aab2c5,#8790a6)', 'int', '실리콘 인터포저');
      const zt = zi + 8 + 30 * E;
      slab(0, 0, zt, 150, 150, 12, 'linear-gradient(135deg,#7a6cf0,#4b3cc4)', 'gpu', 'GPU');
      [-125, 125].forEach((x, si) => {
        [-52, 52].forEach((y, sj) => {
          let z = zt;
          slab(x, y, z, 70, 86, 5, 'linear-gradient(135deg,#25a596,#157e73)', 'base', si === 1 && sj === 0 ? '베이스' : '');
          z += 5 + 4 + 26 * E;
          for (let k = 0; k < P.n; k++) {
            slab(x, y, z, 70, 86, 3.2, `linear-gradient(135deg,hsl(${172 + k * 3},55%,${52 - k * 1.2}%),hsl(${172 + k * 3},55%,${40 - k}%))`, 'dram', si === 1 && sj === 0 && k === P.n - 1 ? `D램 ×${P.n}` : '');
            z += 3.2 + 1.2 + 14 * E;
          }
        });
      });
    }
    bind('#lab-hbm', v => {
      P = v;
      const g = GEN[v.gen];
      const tb = g.bw / 1000;
      document.getElementById('hb-bw').innerHTML = (g.bw >= 1000 ? (g.bw / 1000).toFixed(2) + ' <small>TB/s</small>' : g.bw + ' <small>GB/s</small>');
      document.getElementById('hb-cap').innerHTML = (g.die * v.n) + ' <small>GB</small>';
      document.getElementById('hb-tot').innerHTML = (tb * 6).toFixed(1) + ' <small>TB/s</small>';
      build();
      return { ex: (v.ex * 100).toFixed(0) + '%', n: v.n + '단' };
    });
    let drag = null;
    scene.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, rx, rz]; scene.setPointerCapture(e.pointerId); });
    scene.addEventListener('pointermove', e => {
      if (!drag) return;
      rz = drag[3] + (e.clientX - drag[0]) * 0.4; rx = clamp(drag[2] - (e.clientY - drag[1]) * 0.3, 10, 85);
      stage.style.transform = `rotateX(${rx}deg) rotateZ(${rz}deg)`;
    });
    scene.addEventListener('pointerup', () => { drag = null; });
  })();

  /* ---------- LAB 9-3: interconnect density ---------- */
  (function () {
    const el = document.getElementById('bump');
    let p = 40;
    const st = canvas(el, (ctx, w, h) => {
      const S = Math.min(h - 40, w * 0.55), x0 = 16, y0 = 24;
      const n = 1000 / p;
      ctx.fillStyle = css('--fig-si-2'); ctx.fillRect(x0, y0, S, S);
      ctx.fillStyle = css('--text-2'); ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('1 mm × 1 mm', x0, y0 - 8);
      const cell = S / n;
      if (cell >= 2.2) {
        ctx.fillStyle = '#d39b4a';
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { ctx.beginPath(); ctx.arc(x0 + (i + 0.5) * cell, y0 + (j + 0.5) * cell, Math.max(0.6, cell * 0.28), 0, Math.PI * 2); ctx.fill(); }
      } else {
        ctx.fillStyle = alpha('#d39b4a', 0.8); ctx.fillRect(x0, y0, S, S);
        ctx.fillStyle = css('--surface'); ctx.font = '600 13px ' + css('--font'); ctx.textAlign = 'center';
        ctx.fillText('너무 촘촘해 표시 불가 →', x0 + S / 2, y0 + S / 2);
      }
      // zoom inset: 10 × 10 pitches
      const zx = x0 + S + 30, zs = Math.min(w - zx - 16, S);
      ctx.strokeStyle = css('--accent'); ctx.lineWidth = 1.5;
      const regionPx = Math.min(S, cell * 10);
      ctx.strokeRect(x0, y0, regionPx, regionPx);
      ctx.beginPath(); ctx.moveTo(x0 + regionPx, y0); ctx.lineTo(zx, y0); ctx.moveTo(x0 + regionPx, y0 + regionPx); ctx.lineTo(zx, y0 + zs); ctx.stroke();
      ctx.fillStyle = css('--fig-si-2'); ctx.fillRect(zx, y0, zs, zs); ctx.strokeRect(zx, y0, zs, zs);
      const zc = zs / 10;
      for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) {
        const cx = zx + (i + 0.5) * zc, cy = y0 + (j + 0.5) * zc;
        const g = ctx.createRadialGradient(cx - zc * 0.1, cy - zc * 0.1, 1, cx, cy, zc * 0.3);
        g.addColorStop(0, '#f6d7a0'); g.addColorStop(1, '#c08a3e');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, zc * 0.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = css('--text-2'); ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText(`확대: ${(p * 10).toFixed(p < 1 ? 1 : 0)} µm 영역`, zx, y0 - 8);
    });
    const root = document.getElementById('lab-bump');
    const ctl = bind(root, v => {
      p = v.p;
      const n = Math.pow(1000 / p, 2);
      document.getElementById('bp-n').textContent = n >= 1e4 ? SB.sci(n, 1) : Math.round(n).toLocaleString();
      const e = 0.02 * Math.pow(p, 0.75);
      document.getElementById('bp-e').innerHTML = e.toFixed(e < 0.1 ? 3 : 2) + ' <small>pJ/bit</small>';
      st.redraw();
      return { p: v.p + ' µm' };
    });
    SB.seg(document.getElementById('bump-preset'), v => { root.querySelector('[name=p]').value = v; ctl.update(); });
  })();

  SB.quiz(document.getElementById('quiz'), [
    { q: '플립칩 패키지가 와이어 본딩보다 I/O를 훨씬 많이 만들 수 있는 이유는?', o: ['칩이 더 커서', '칩 가장자리뿐 아니라 전체 면적에 범프를 배치할 수 있어서', '금선을 더 가늘게 써서', '몰딩이 없어서'], a: 1, why: '와이어 본딩은 둘레(∝ 길이)만, 플립칩은 면적(∝ 길이²) 전체를 연결에 쓸 수 있습니다.' },
    { q: 'HBM에서 D램 다이들을 수직으로 연결하는 구조는?', o: ['금선', 'TSV (실리콘 관통 전극)', '리드프레임', '광섬유'], a: 1, why: '다이를 관통하는 수천 개의 구리 기둥(TSV)이 층과 층을 잇습니다.' },
    { q: '범프 피치를 40 µm에서 4 µm로 줄이면 단위 면적당 연결 수는?', o: ['10배', '40배', '100배', '1,000배'], a: 2, why: '피치가 1/10이면 가로·세로 각각 10배 → 100배.' },
    { q: '2.5D 패키지에서 GPU와 HBM을 나란히 올려 연결하는 판은?', o: ['PCB', '실리콘 인터포저', '리드프레임', '히트싱크'], a: 1, why: '실리콘 인터포저는 반도체 공정으로 만든 미세 배선을 가져 수만 개의 신호선을 연결할 수 있습니다.' },
  ]);
})();
