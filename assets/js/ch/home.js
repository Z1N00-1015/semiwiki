/* Home page: hero wafer, process map, chapter cards */
(function () {
  const { CHAPTERS, css, canvas, animate } = SB;

  /* ---------- hero wafer ---------- */
  const heroEl = document.getElementById('hero');
  const dies = [];
  const N = 15;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = (i + 0.5) / N * 2 - 1, y = (j + 0.5) / N * 2 - 1;
    const cx = Math.abs(x) + 1 / N, cy = Math.abs(y) + 1 / N;
    if (cx * cx + cy * cy < 0.88) dies.push({ x, y, p: Math.random() * Math.PI * 2 });
  }
  let ang = 0, time = 0;
  const hero = canvas(heroEl, (ctx, w, h) => {
    const R = Math.min(w, h) * 0.44, cx = w / 2, cy = h / 2;
    const dark = SB.isDark();
    ctx.save();
    ctx.translate(cx, cy);
    // glow
    const glow = ctx.createRadialGradient(0, 0, R * .6, 0, 0, R * 1.15);
    glow.addColorStop(0, 'rgba(122,108,240,0)');
    glow.addColorStop(1, dark ? 'rgba(122,108,240,.18)' : 'rgba(122,108,240,.10)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, R * 1.15, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(ang);
    // wafer body with iridescent conic gradient
    const g = ctx.createConicGradient ? ctx.createConicGradient(time * 0.3, 0, 0) : null;
    if (g) {
      const stops = ['#b9c2d6', '#c9b6e8', '#a6d8e6', '#d9d0f0', '#b0e0cf', '#c3c8e2', '#b9c2d6'];
      stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
      ctx.fillStyle = g;
    } else ctx.fillStyle = '#bcc3d6';
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    // notch
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(0, R, R * 0.035, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // dies
    const s = (2 / N) * R;
    dies.forEach(d => {
      const px = d.x * R - s / 2, py = d.y * R - s / 2;
      const k = 0.5 + 0.5 * Math.sin(time * 1.6 + d.p + d.x * 2);
      ctx.fillStyle = `rgba(40,30,110,${0.10 + 0.22 * k})`;
      ctx.fillRect(px + 1.2, py + 1.2, s - 2.4, s - 2.4);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.6;
      ctx.strokeRect(px + 1.2, py + 1.2, s - 2.4, s - 2.4);
      // tiny circuit lines
      ctx.strokeStyle = `rgba(255,255,255,${0.15 + 0.25 * k})`;
      ctx.beginPath();
      ctx.moveTo(px + s * .25, py + s * .3); ctx.lineTo(px + s * .75, py + s * .3);
      ctx.moveTo(px + s * .25, py + s * .55); ctx.lineTo(px + s * .6, py + s * .55);
      ctx.moveTo(px + s * .25, py + s * .75); ctx.lineTo(px + s * .7, py + s * .75);
      ctx.stroke();
    });
    // specular sweep
    const sweep = ctx.createLinearGradient(-R, -R, R, R);
    const sp = (Math.sin(time * 0.7) * 0.5 + 0.5);
    sweep.addColorStop(Math.max(0, sp - .15), 'rgba(255,255,255,0)');
    sweep.addColorStop(sp, 'rgba(255,255,255,.35)');
    sweep.addColorStop(Math.min(1, sp + .15), 'rgba(255,255,255,0)');
    ctx.fillStyle = sweep; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, R - 0.75, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }, { ratio: 1 });
  animate(heroEl, dt => { ang += dt * 0.08; time += dt; hero.redraw(); });

  /* ---------- process map ---------- */
  const steps = [
    { t: '웨이퍼 제조', i: '💿', ch: 'wafer' },
    { t: '산화', i: '🔥', ch: 'oxidation' },
    { t: '포토', i: '🔦', ch: 'lithography' },
    { t: '식각', i: '⚡', ch: 'etching' },
    { t: '증착·이온주입', i: '🧬', ch: 'deposition' },
    { t: '금속 배선', i: '🔗', ch: 'metallization' },
    { t: 'EDS 테스트', i: '🧪', ch: 'yield' },
    { t: '패키징', i: '📦', ch: 'packaging' },
  ];
  const svg = document.getElementById('flowmap');
  let s = `<defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker>
    <linearGradient id="fe" x1="0" x2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".12"/><stop offset="1" stop-color="var(--teal)" stop-opacity=".12"/></linearGradient></defs>`;
  const X = i => 68 + i * 135;
  s += `<rect x="${X(1) - 58}" y="20" width="${X(5) - X(1) + 116}" height="245" rx="18" fill="url(#fe)" stroke="var(--accent)" stroke-opacity=".3" stroke-dasharray="4 4"/>`;
  s += `<text x="${(X(1) + X(5)) / 2}" y="42" text-anchor="middle" font-size="13" fill="var(--accent)" font-weight="700">전공정 (Fab) — 수십~수백 회 반복</text>`;
  s += `<text x="${(X(6) + X(7)) / 2}" y="42" text-anchor="middle" font-size="13" fill="var(--teal)" font-weight="700">후공정</text>`;
  for (let i = 0; i < steps.length - 1; i++) s += `<line x1="${X(i) + 44}" y1="110" x2="${X(i + 1) - 46}" y2="110" stroke="var(--muted)" stroke-width="2" marker-end="url(#ar)"/>`;
  s += `<path d="M ${X(5)} 190 C ${X(5)} 240, ${X(1)} 240, ${X(1)} 190" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="6 5" marker-end="url(#ar)"><animate attributeName="stroke-dashoffset" from="22" to="0" dur="1.2s" repeatCount="indefinite"/></path>`;
  s += `<text x="${(X(1) + X(5)) / 2}" y="254" text-anchor="middle" font-size="12.5" fill="var(--accent)">레이어마다 반복 ↺</text>`;
  steps.forEach((st, i) => {
    s += `<a href="chapters/${CHAPTERS.find(c => c.id === st.ch).file}" class="node"><g transform="translate(${X(i)},110)" style="cursor:pointer">
      <circle r="42" fill="var(--surface)" stroke="var(--border-2)" stroke-width="1.5"/>
      <circle r="42" fill="none" stroke="var(--accent)" stroke-width="2.5" opacity="0" class="ring"/>
      <text y="9" text-anchor="middle" font-size="28">${st.i}</text>
      <text y="66" text-anchor="middle" font-size="14" font-weight="700" fill="var(--text)">${st.t}</text>
      <text y="-52" text-anchor="middle" font-size="11" font-family="var(--mono)" fill="var(--muted)">STEP ${i + 1}</text></g></a>`;
  });
  svg.innerHTML = s;
  const st = document.createElement('style');
  st.textContent = '#flowmap a.node:hover .ring{opacity:1} #flowmap a.node:hover circle:first-child{fill:var(--accent-soft)}';
  document.head.appendChild(st);

  /* ---------- toc cards ---------- */
  const art = {
    intro: '<svg viewBox="0 0 120 60"><rect x="10" y="40" width="100" height="14" fill="var(--fig-si)"/><rect x="10" y="33" width="100" height="7" fill="var(--fig-oxide)"/><rect x="30" y="20" width="16" height="13" fill="var(--fig-poly)"/><rect x="74" y="20" width="16" height="13" fill="var(--fig-poly)"/><rect x="18" y="40" width="10" height="5" fill="var(--fig-ndope)"/><rect x="48" y="40" width="10" height="5" fill="var(--fig-ndope)"/><rect x="62" y="40" width="10" height="5" fill="var(--fig-pdope)"/><rect x="92" y="40" width="10" height="5" fill="var(--fig-pdope)"/><path d="M38 20V8h44v12" stroke="var(--fig-metal)" stroke-width="3" fill="none"/></svg>',
    wafer: '<svg viewBox="0 0 120 60"><rect x="52" y="4" width="16" height="44" rx="3" fill="var(--fig-si)"/><path d="M60 4V0" stroke="var(--muted)"/><ellipse cx="60" cy="52" rx="34" ry="6" fill="var(--fig-pr)" opacity=".7"/><ellipse cx="60" cy="48" rx="8" ry="2.5" fill="var(--fig-si-2)"/></svg>',
    oxidation: '<svg viewBox="0 0 120 60"><defs><linearGradient id="ox" x1="0" x2="1"><stop offset="0" stop-color="#c79a5a"/><stop offset=".25" stop-color="#7a3d8f"/><stop offset=".5" stop-color="#3b6fd6"/><stop offset=".75" stop-color="#9ccf6a"/><stop offset="1" stop-color="#e8b33c"/></linearGradient></defs><rect x="8" y="16" width="104" height="20" rx="4" fill="url(#ox)"/><rect x="8" y="38" width="104" height="14" fill="var(--fig-si)"/></svg>',
    lithography: '<svg viewBox="0 0 120 60"><path d="M30 2L60 26L90 2" fill="var(--accent)" opacity=".18"/><rect x="20" y="22" width="80" height="4" fill="var(--text-2)"/><rect x="44" y="22" width="12" height="4" fill="var(--surface)"/><rect x="64" y="22" width="12" height="4" fill="var(--surface)"/><rect x="10" y="40" width="100" height="6" fill="var(--fig-pr)"/><rect x="44" y="40" width="12" height="6" fill="var(--fig-pr-exposed)"/><rect x="64" y="40" width="12" height="6" fill="var(--fig-pr-exposed)"/><rect x="10" y="46" width="100" height="10" fill="var(--fig-si)"/></svg>',
    etching: '<svg viewBox="0 0 120 60"><path d="M10 20h30v6q0 22 20 22q20 0 20-22v-6h30v36H10z" fill="var(--fig-si)"/><rect x="10" y="14" width="30" height="6" fill="var(--fig-pr)"/><rect x="80" y="14" width="30" height="6" fill="var(--fig-pr)"/><g fill="var(--accent)"><circle cx="55" cy="6" r="2"/><circle cx="62" cy="12" r="2"/><circle cx="68" cy="4" r="2"/></g></svg>',
    deposition: '<svg viewBox="0 0 120 60"><path d="M10 22h34v28h32V22h34v34H10z" fill="var(--fig-si)"/><path d="M10 18h38v28h24V18h38v4H76v28H44V22H10z" fill="var(--fig-metal)"/><g fill="var(--fig-metal)"><circle cx="30" cy="6" r="2"/><circle cx="60" cy="9" r="2"/><circle cx="90" cy="5" r="2"/></g></svg>',
    implant: '<svg viewBox="0 0 120 60"><rect x="8" y="28" width="104" height="28" fill="var(--fig-si)"/><path d="M8 30 C40 30 50 52 60 52 C70 52 80 30 112 30" fill="var(--fig-ndope)" opacity=".7"/><g stroke="var(--fig-ndope)" stroke-width="2"><path d="M30 2v18M50 2v18M70 2v18M90 2v18"/></g></svg>',
    metallization: '<svg viewBox="0 0 120 60"><rect x="8" y="10" width="104" height="44" fill="var(--fig-oxide)" opacity=".55"/><rect x="18" y="16" width="30" height="8" fill="var(--fig-metal)"/><rect x="62" y="16" width="40" height="8" fill="var(--fig-metal)"/><rect x="28" y="24" width="8" height="12" fill="var(--fig-metal)"/><rect x="80" y="24" width="8" height="12" fill="var(--fig-metal)"/><rect x="14" y="36" width="92" height="8" fill="var(--fig-metal)"/></svg>',
    yield: '<svg viewBox="0 0 120 60"><circle cx="60" cy="30" r="26" fill="var(--surface)" stroke="var(--border-2)"/><g id="yd"></g>' + (() => { let r = ''; for (let i = -3; i < 3; i++) for (let j = -3; j < 3; j++) { const x = 60 + i * 8, y = 30 + j * 8; if ((x + 4 - 60) ** 2 + (y + 4 - 30) ** 2 < 500) r += `<rect x="${x + .5}" y="${y + .5}" width="7" height="7" fill="${(i * 7 + j * 3) % 5 === 0 ? 'var(--rose)' : 'var(--green)'}" opacity=".75"/>`; } return r; })() + '</svg>',
    packaging: '<svg viewBox="0 0 120 60"><rect x="14" y="46" width="92" height="8" fill="var(--fig-nitride)"/><rect x="22" y="38" width="76" height="6" fill="var(--fig-si-2)"/><g fill="var(--accent)" opacity=".8"><rect x="28" y="30" width="20" height="6"/><rect x="28" y="23" width="20" height="6"/><rect x="28" y="16" width="20" height="6"/><rect x="28" y="9" width="20" height="6"/></g><rect x="56" y="22" width="36" height="14" fill="var(--teal)" opacity=".8"/></svg>',
    transistor: '<svg viewBox="0 0 120 60"><rect x="10" y="44" width="100" height="10" fill="var(--fig-si)"/><g fill="var(--fig-si-2)"><rect x="28" y="16" width="10" height="28"/><rect x="55" y="16" width="10" height="28"/><rect x="82" y="16" width="10" height="28"/></g><path d="M18 30h84v8H18z" fill="var(--fig-poly)" opacity=".85"/></svg>',
    glossary: '<svg viewBox="0 0 120 60"><rect x="36" y="8" width="48" height="44" rx="4" fill="var(--accent-soft)" stroke="var(--accent)"/><path d="M44 20h32M44 28h32M44 36h20" stroke="var(--accent)" stroke-width="2"/></svg>',
  };
  const grid = document.getElementById('tocgrid');
  const done = SB.store.get('done', {});
  grid.innerHTML = CHAPTERS.map(c => `
    <a class="toc-card" href="chapters/${c.file}">
      <div class="art">${art[c.id] || ''}</div>
      <span class="n">CHAPTER ${c.n}${done[c.id] ? ' · ✓ 완료' : ''}</span>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <div class="labs">${c.labs.map(l => `<span>${l}</span>`).join('')}</div>
    </a>`).join('');
  const nLabs = CHAPTERS.reduce((a, c) => a + c.labs.length, 0);
  document.getElementById('st-lab').textContent = nLabs + '+';
  document.getElementById('st-ch').textContent = CHAPTERS.filter(c => c.id !== 'glossary').length;
})();
