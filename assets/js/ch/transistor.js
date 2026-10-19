/* Chapter 10 — advanced transistors */
(function () {
  const { css, canvas, animate, plot, bind, clamp, lerp, rng, alpha, sci } = SB;

  /* ---------- LAB 10-1: MOSFET ---------- */
  (function () {
    const VT = 0.4, K = 2e-3, LAM = 0.12;
    let P = { vg: 0.9, vd: 0.3 };
    const id = (vg, vd) => {
      const ov = vg - VT;
      if (ov <= 0) return 1e-9 * Math.exp(ov / 0.035) * (1 - Math.exp(-vd / 0.026));
      return vd < ov ? K * (ov * vd - vd * vd / 2) * (1 + LAM * vd) : K / 2 * ov * ov * (1 + LAM * vd);
    };
    const el = document.getElementById('mos'), el2 = document.getElementById('idvd');
    const r = rng(8);
    const elec = [];
    let geo = null;
    function charge(u) {
      const ov = P.vg - VT; if (ov <= 0) return 0;
      const ve = Math.min(P.vd, ov);
      const pin = P.vd > ov ? 1 - Math.min(0.25, (P.vd - ov) * 0.35) : 1;
      if (u > pin) return 0;
      const uu = u / pin;
      const V = ov - Math.sqrt(Math.max(0, ov * ov - (2 * ov * ve - ve * ve) * uu));
      return Math.max(0, ov - V) / ov;
    }
    const st = canvas(el, (ctx, w, h) => {
      ctx.save(); ctx.scale(w / 600, h / 372);
      const C = { si: css('--fig-si'), n: css('--fig-ndope'), ox: css('--fig-oxide'), poly: css('--fig-poly'), m: css('--fig-metal'), t: css('--text') };
      ctx.fillStyle = C.si; ctx.fillRect(0, 180, 600, 192);
      // depletion region
      const ov = P.vg - VT;
      const dep = 18 + 22 * Math.sqrt(Math.max(0, Math.min(P.vg, VT + 0.2)));
      ctx.fillStyle = alpha('#ffffff', 0.18);
      ctx.beginPath(); ctx.moveTo(150, 180); ctx.lineTo(450, 180);
      ctx.lineTo(450, 180 + dep + 26 * Math.sqrt(P.vd)); ctx.quadraticCurveTo(300, 180 + dep + 10, 150, 180 + dep); ctx.closePath(); ctx.fill();
      // S/D
      ctx.fillStyle = C.n;
      ctx.beginPath(); ctx.moveTo(30, 180); ctx.lineTo(175, 180); ctx.quadraticCurveTo(175, 236, 130, 240); ctx.lineTo(30, 240); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(570, 180); ctx.lineTo(425, 180); ctx.quadraticCurveTo(425, 236, 470, 240); ctx.lineTo(570, 240); ctx.closePath(); ctx.fill();
      // channel
      const L0 = 172, L1 = 428;
      ctx.fillStyle = alpha(C.n, 0.9);
      ctx.beginPath(); ctx.moveTo(L0, 180);
      for (let i = 0; i <= 60; i++) { const u = i / 60; ctx.lineTo(L0 + (L1 - L0) * u, 180 + 16 * charge(u)); }
      ctx.lineTo(L1, 180); ctx.closePath(); ctx.fill();
      // oxide + gate + contacts
      ctx.fillStyle = C.ox; ctx.fillRect(165, 168, 270, 12);
      ctx.fillStyle = C.poly; ctx.fillRect(170, 108, 260, 60);
      ctx.fillStyle = C.m; ctx.fillRect(70, 120, 40, 60); ctx.fillRect(490, 120, 40, 60); ctx.fillRect(280, 70, 40, 38);
      ctx.fillStyle = '#fff'; ctx.font = '700 16px ' + css('--font'); ctx.textAlign = 'center';
      ctx.fillText('n⁺', 80, 222); ctx.fillText('n⁺', 520, 222); ctx.fillText('게이트', 300, 145);
      ctx.fillText('p-Si', 300, 350);
      ctx.fillStyle = C.t; ctx.font = '700 15px ' + css('--font');
      ctx.fillText('S  0 V', 90, 110); ctx.fillText('D  ' + P.vd.toFixed(2) + ' V', 510, 110); ctx.fillText('G  ' + P.vg.toFixed(2) + ' V', 300, 60);
      // electrons
      ctx.fillStyle = '#fff';
      elec.forEach(e => { const x = L0 + (L1 - L0) * e.u, y = 180 + 3 + e.v * Math.max(4, 14 * charge(e.u)); ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); });
      if (P.vd > ov && ov > 0) { ctx.fillStyle = css('--rose'); ctx.font = '600 13px ' + css('--font'); ctx.fillText('핀치오프', 405, 266); }
      ctx.restore();
      geo = { w, h };
    });
    const st2 = canvas(el2, (ctx, w, h) => {
      const vgs = [0.6, 0.8, 1.0, 1.2];
      const series = vgs.map(vg => { const d = []; for (let v = 0; v <= 1.2; v += 0.01) d.push([v, id(vg, v) * 1e3]); return { data: d, color: alpha(css('--muted'), 0.6), width: 1.4 }; });
      const cur = []; for (let v = 0; v <= 1.2; v += 0.01) cur.push([v, id(P.vg, v) * 1e3]);
      series.push({ data: cur, color: css('--accent'), width: 3 });
      const loc = []; for (let v = 0; v <= 0.8; v += 0.01) loc.push([v, id(v + VT, v) * 1e3]);
      series.push({ data: loc, color: css('--rose'), width: 1.3, dash: [4, 4] });
      plot(ctx, w, h, {
        x: { min: 0, max: 1.2, label: 'V_DS (V)' }, y: { min: 0, max: id(1.2, 1.2) * 1e3 * 1.08, label: 'I_D (mA/µm)' },
        series, marks: [{ x: P.vd, y: id(P.vg, P.vd) * 1e3, color: css('--accent'), r: 6 }],
      });
      ctx.fillStyle = css('--rose'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'left'; ctx.fillText('- - 포화 경계 V_DS = V_GS − V_t', 66, 26);
      ctx.fillStyle = css('--muted'); ctx.fillText('회색: V_GS = 0.6 / 0.8 / 1.0 / 1.2 V', 66, 42);
    });
    bind('#lab-mos', v => {
      P = v;
      const I = id(v.vg, v.vd), ov = v.vg - VT;
      document.getElementById('ms-reg').textContent = ov <= 0 ? '차단 (서브문턱)' : v.vd < ov ? '선형 (트라이오드)' : '포화';
      document.getElementById('ms-id').innerHTML = I >= 1e-5 ? (I * 1e3).toFixed(3) + ' <small>mA</small>' : sci(I, 1) + ' <small>A</small>';
      document.getElementById('ms-ov').innerHTML = ov.toFixed(2) + ' <small>V</small>';
      st.redraw(); st2.redraw();
      return { vg: v.vg.toFixed(2) + ' V', vd: v.vd.toFixed(2) + ' V' };
    });
    animate(el, dt => {
      const I = id(P.vg, P.vd);
      const n = Math.round(clamp(I / 4e-4 * 12, 0, 40));
      while (elec.length < n) elec.push({ u: r() * 0.2, v: r() });
      while (elec.length > n) elec.pop();
      elec.forEach(e => {
        const q = Math.max(0.08, charge(e.u));
        e.u += dt * clamp(I / 1e-3, 0.05, 1.5) * 0.35 / q;
        if (e.u > 1) { e.u = 0; e.v = r(); }
      });
      st.redraw();
    });
  })();

  /* ---------- LAB 10-2: gate geometry + Laplace solver ---------- */
  (function () {
    const NX = 80, NY = 48, H = 0.5, LAMB = 5; // cell 0.5 nm, natural length 5 nm
    const svg = document.getElementById('g3d');
    const el = document.getElementById('gpot');
    let P = { st: 'fin', t: 7 }, phi = new Float32Array(NX * NY), type = new Uint8Array(NX * NY); // 0 Si, 1 oxide, 2 gate(1V), 3 body(0V)
    function build() {
      type.fill(1);
      const set = (x0, x1, y0, y1, v) => { for (let y = Math.max(0, y0); y < Math.min(NY, y1); y++) for (let x = Math.max(0, x0); x < Math.min(NX, x1); x++) type[y * NX + x] = v; };
      const tc = Math.round(P.t / H);
      if (P.st === 'planar') {
        set(10, 70, 0, 8, 2); set(0, NX, 10, NY, 0); set(0, NX, NY - 1, NY, 3);
      } else if (P.st === 'fin') {
        const c = NX / 2, x0 = Math.round(c - tc / 2), x1 = x0 + tc;
        set(0, NX, 0, 36, 2);                 // gate everywhere above STI
        set(x0 - 2, x1 + 2, 10, 36, 1);       // oxide shell
        set(x0, x1, 12, 42, 0);               // fin
        set(0, NX, 36, 42, 1); set(x0, x1, 36, 42, 0); // STI
        set(0, NX, 42, NY, 0); set(0, NX, NY - 1, NY, 3);
      } else {
        const y0 = Math.round(NY / 2 - tc / 2), y1 = y0 + tc;
        set(0, NX, 0, NY, 2);
        set(18, 62, y0 - 2, y1 + 2, 1);
        set(20, 60, y0, y1, 0);
      }
    }
    function solve() {
      for (let i = 0; i < phi.length; i++) phi[i] = type[i] === 2 ? 1 : type[i] === 3 ? 0 : 0.5;
      const k2 = (H * H) / (LAMB * LAMB);
      for (let it = 0; it < 500; it++) {
        for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
          const i = y * NX + x, t = type[i]; if (t >= 2) continue;
          const l = x > 0 ? phi[i - 1] : phi[i + 1], rr = x < NX - 1 ? phi[i + 1] : phi[i - 1];
          const u = y > 0 ? phi[i - NX] : phi[i + NX], d = y < NY - 1 ? phi[i + NX] : phi[i - NX];
          const v = (l + rr + u + d) / (4 + (t === 0 ? k2 : 0));
          phi[i] += 1.6 * (v - phi[i]);
        }
      }
    }
    function channelMask(i) {
      const x = i % NX, y = (i / NX) | 0;
      if (type[i] !== 0) return false;
      if (P.st === 'planar') return x >= 10 && x < 70 && y >= 10 && y < 10 + Math.round(P.t / H);
      if (P.st === 'fin') return y < 36;
      return true;
    }
    const cmap = v => { // dark violet → teal → yellow
      v = clamp(v, 0, 1);
      const stops = [[0, [32, 18, 77]], [0.35, [72, 52, 170]], [0.65, [33, 160, 150]], [1, [250, 222, 80]]];
      for (let k = 1; k < stops.length; k++) if (v <= stops[k][0]) { const [a, ca] = stops[k - 1], [b, cb] = stops[k], t = (v - a) / (b - a); return ca.map((c, j) => Math.round(c + (cb[j] - c) * t)); }
      return stops[3][1];
    };
    const off = document.createElement('canvas'); off.width = NX; off.height = NY;
    const octx = off.getContext('2d'); const img = octx.createImageData(NX, NY);
    const st = canvas(el, (ctx, w, h) => {
      const d = img.data;
      for (let i = 0; i < NX * NY; i++) {
        let c;
        if (type[i] === 2) c = [176, 112, 112];
        else if (type[i] === 3) c = [90, 96, 110];
        else if (type[i] === 1) c = [170, 210, 230];
        else c = cmap(phi[i]);
        d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      const sc = Math.min(w / NX, h / NY), ox = (w - NX * sc) / 2 - 30, oy = (h - NY * sc) / 2;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, ox, oy, NX * sc, NY * sc);
      // colour bar
      const bx = ox + NX * sc + 14, bh = NY * sc;
      for (let y = 0; y < bh; y++) { const c = cmap(1 - y / bh); ctx.fillStyle = `rgb(${c})`; ctx.fillRect(bx, oy + y, 14, 1.2); }
      ctx.fillStyle = css('--text-2'); ctx.font = '11px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('1 V', bx + 18, oy + 10); ctx.fillText('0 V', bx + 18, oy + bh);
      ctx.fillText('게이트', ox + 6, oy + 12);
      ctx.fillStyle = css('--muted'); ctx.fillText('채널 단면 (전류는 화면 안쪽으로)', ox, h - 4);
    });
    // isometric 3D drawing
    function iso(x, y, z) { const s = 9; return [260 + (x - y) * 0.866 * s, 120 + (x + y) * 0.5 * s - z * s]; }
    function box(x0, x1, y0, y1, z0, z1, col, op) {
      const pts = a => a.map(p => iso(...p).join(',')).join(' ');
      const shade = (c, k) => `color-mix(in srgb, ${c} ${k}%, #000)`;
      return `<g opacity="${op || 1}"><polygon points="${pts([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]])}" fill="${shade(col, 72)}"/>` +
        `<polygon points="${pts([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]])}" fill="${shade(col, 86)}"/>` +
        `<polygon points="${pts([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]])}" fill="${col}" stroke="rgba(255,255,255,.25)" stroke-width=".6"/></g>`;
    }
    function draw3d() {
      const si = 'var(--fig-si)', g = 'var(--fig-poly)', sd = 'var(--fig-ndope)', ch = '#e8c86a';
      let s = '';
      if (P.st === 'planar') {
        s += box(-12, 12, -10, 10, -4, 0, si);
        s += box(-12, -3, -6, 6, -0.5, 0.3, sd) + box(3, 12, -6, 6, -0.5, 0.3, sd);
        s += box(-3, 3, -6, 6, -0.3, 0.05, ch);
        s += box(-2.6, 2.6, -8, 8, 0.4, 4, g);
      } else if (P.st === 'fin') {
        s += box(-12, 12, -10, 10, -4, 0, si);
        [-3.5, 2.5].forEach(y => { s += box(-12, 12, y, y + 1, 0, 6, si); });
        s += box(-2.6, 2.6, -8, 8, 0, 7.5, g, 0.92);
        [-3.5, 2.5].forEach(y => { s += box(2.6, 12, y, y + 1, 0, 6, sd); });
      } else {
        s += box(-12, 12, -10, 10, -4, 0, si);
        [1.2, 3.4, 5.6].forEach(z => { s += box(-12, -2.6, -4, 4, z, z + 0.9, sd); });
        s += box(-2.6, 2.6, -6, 6, 0, 7.6, g, 0.55);
        [1.2, 3.4, 5.6].forEach(z => { s += box(-2.6, 2.6, -4, 4, z, z + 0.9, ch, 0.95); s += box(2.6, 12, -4, 4, z, z + 0.9, sd); });
      }
      const name = { planar: 'Planar — 게이트가 1면 제어', fin: 'FinFET — 게이트가 3면을 감쌈', gaa: 'GAA 나노시트 — 4면 모두 감쌈' }[P.st];
      s += `<text x="12" y="22" font-size="14" font-weight="700" fill="var(--text)">${name}</text>`;
      s += `<text x="12" y="240" font-size="12" fill="var(--muted)">빨강: 게이트 · 파랑: 소스/드레인 · 노랑: 채널</text>`;
      svg.innerHTML = s;
    }
    bind('#lab-gate', v => {
      P = v; build(); solve(); draw3d();
      let sum = 0, n = 0, mn = 1;
      for (let i = 0; i < NX * NY; i++) if (channelMask(i)) { sum += phi[i]; n++; mn = Math.min(mn, phi[i]); }
      const eff = n ? sum / n : 0;
      const e = document.getElementById('gt-eff');
      e.innerHTML = (eff * 100).toFixed(0) + '<small>%</small>';
      e.parentElement.className = 'r ' + (eff > 0.8 ? 'good' : eff < 0.55 ? 'bad' : '');
      document.getElementById('gt-min').innerHTML = mn.toFixed(2) + ' <small>V</small>';
      st.redraw();
      return { t: v.t + ' nm' };
    });
  })();

  /* ---------- LAB 10-3: Id–Vg ---------- */
  (function () {
    const D = [
      { n: 'Planar', ss: 95, dibl: 0.11, ion: 0.9e-3, col: '--blue' },
      { n: 'FinFET', ss: 68, dibl: 0.04, ion: 1.3e-3, col: '--teal' },
      { n: 'GAA', ss: 63, dibl: 0.025, ion: 1.5e-3, col: '--accent' },
    ];
    const VT0 = 0.33;
    let P = { vd: 0.75, T: 300 };
    const phit = T => 8.617e-5 * T;
    function I(d, vg, vd, T) {
      const n = d.ss / (59.6), vt = VT0 - d.dibl * vd - 0.0008 * (T - 300);
      const f = v => Math.pow(Math.log(1 + Math.exp((v - (VT0 - d.dibl * 0.75)) / (2 * n * phit(300)))), 2) * (1 - Math.exp(-0.75 / phit(300)));
      const Is = d.ion / f(0.75);
      return Is * Math.pow(Math.log(1 + Math.exp((vg - vt) / (2 * n * phit(T)))), 2) * (1 - Math.exp(-vd / phit(T)));
    }
    const el = document.getElementById('idvg');
    const st = canvas(el, (ctx, w, h) => {
      const series = D.map(d => { const a = []; for (let v = 0; v <= 0.8; v += 0.005) a.push([v, I(d, v, P.vd, P.T)]); return { data: a, color: css(d.col), width: 2.6 }; });
      plot(ctx, w, h, {
        x: { min: 0, max: 0.8, label: 'V_GS (V)' }, y: { min: 1e-12, max: 1e-2, log: true, label: 'I_D (A/µm)' },
        series,
        hlines: [{ y: 1e-7, color: css('--muted'), label: '문턱 기준 100 nA/µm' }],
      });
      ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'left';
      D.forEach((d, i) => { ctx.fillStyle = css(d.col); ctx.fillText('— ' + d.n, 68, 26 + i * 16); });
    });
    bind('#lab-idvg', v => {
      P = v;
      document.getElementById('iv-out').innerHTML = D.map(d => {
        const on = I(d, P.vd, P.vd, P.T), offc = I(d, 0, P.vd, P.T);
        const ss = d.ss * P.T / 300;
        return `<div class="r"><div class="k" style="color:var(${d.col});font-weight:700">${d.n}</div><div class="v" style="font-size:13px">SS ${ss.toFixed(0)} mV/dec<br>I<sub>on</sub>/I<sub>off</sub> ${sci(on / offc, 0)}</div></div>`;
      }).join('');
      st.redraw();
      return { vd: v.vd.toFixed(2) + ' V', T: v.T + ' K' };
    });
  })();

  /* ---------- LAB 10-4: roadmap ---------- */
  (function () {
    const N = [
      ['130 nm', 2001, 130, 320, 0.8, 'planar', '구리 배선 본격 도입, 300 mm 웨이퍼 양산 시작'],
      ['90 nm', 2004, 90, 260, 1.5, 'planar', '변형 실리콘(strained Si)으로 이동도 향상'],
      ['65 nm', 2006, 65, 220, 2.1, 'planar', 'low-k 절연막 확대'],
      ['45 nm', 2008, 45, 160, 3.3, 'planar', 'High-k 메탈 게이트(HKMG) 도입 — 게이트 누설 문제 해결'],
      ['32 nm', 2010, 32, 112, 7.5, 'planar', 'ArF 액침 노광 + 더블 패터닝'],
      ['22 nm', 2012, 22, 90, 15, 'fin', 'Intel, 세계 최초 FinFET(Tri-Gate) 양산'],
      ['14 nm', 2014, 14, 70, 37, 'fin', 'FinFET 2세대, 파운드리 FinFET 진입'],
      ['10 nm', 2017, 10, 54, 52, 'fin', '셀프얼라인 쿼드러플 패터닝(SAQP)'],
      ['7 nm', 2018, 7, 57, 91, 'fin', 'TSMC N7. N7+부터 EUV 일부 레이어 적용'],
      ['5 nm', 2020, 5, 51, 138, 'fin', 'EUV 본격 적용 (10+ 레이어)'],
      ['3 nm', 2022, 3, 48, 190, 'fin', 'TSMC N3 FinFET 최종 세대 · 삼성 3 nm는 GAA(MBCFET) 최초 양산'],
      ['2 nm', 2025, 2, 45, 240, 'gaa', 'TSMC N2 나노시트 GAA 양산'],
      ['A16', 2026, 1.6, 45, 270, 'gaa', '후면 전력 공급(Super Power Rail) 도입'],
      ['A14', 2028, 1.4, 42, 320, 'proj', 'High-NA EUV 검토, 2세대 GAA (전망)'],
      ['A10 / CFET', 2031, 1.0, 40, 450, 'proj', 'NMOS/PMOS 수직 적층 CFET (전망)'],
    ];
    const col = s => css(s === 'planar' ? '--blue' : s === 'fin' ? '--teal' : s === 'gaa' ? '--accent' : '--muted');
    const el = document.getElementById('road');
    let mode = 'cpp', hover = -1, geo = null;
    const st = canvas(el, (ctx, w, h) => {
      const cpp = mode === 'cpp';
      const series = cpp ? [{ data: N.map(n => [n[1], n[2]]), color: alpha(css('--rose'), 0.7), width: 1.8, dash: [5, 4] }, { data: N.map(n => [n[1], n[3]]), color: alpha(css('--text-2'), 0.4), width: 1.4 }] : [{ data: N.map(n => [n[1], n[4]]), color: alpha(css('--text-2'), 0.4), width: 1.4 }];
      const marks = N.map((n, i) => ({ x: n[1], y: cpp ? n[3] : n[4], color: col(n[5]), r: i === hover ? 8 : 5.5, label: i === hover ? n[0] : null, bold: true, align: n[1] > 2020 ? 'right' : 'left' }));
      if (cpp) N.forEach(n => marks.push({ x: n[1], y: n[2], color: alpha(css('--rose'), 0.75), r: 3 }));
      geo = plot(ctx, w, h, {
        x: { min: 1999, max: 2033, label: '양산 연도', ticks: [2000, 2005, 2010, 2015, 2020, 2025, 2030] },
        y: cpp ? { min: 0.8, max: 500, log: true, label: '길이 (nm)', logFmt: 'plain' } : { min: 0.5, max: 1000, log: true, label: '로직 밀도 (MTr/mm²)', logFmt: 'plain' },
        series, marks,
      });
      ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'left';
      if (cpp) { ctx.fillStyle = css('--rose'); ctx.fillText('- - 노드 이름의 숫자', geo.pad.l + 8, h - 52); ctx.fillStyle = css('--text-2'); ctx.fillText('● 실제 게이트 피치(CPP)', geo.pad.l + 8, h - 68); }
    });
    function info(i) {
      const n = N[i];
      const sname = { planar: 'Planar', fin: 'FinFET', gaa: 'GAA 나노시트', proj: '전망' }[n[5]];
      document.getElementById('rd-info').innerHTML = `<b class="t">${n[0]} · ${n[1]}년</b><span class="tag">${sname}</span><br>게이트 피치 ≈ <b>${n[3]} nm</b> · 밀도 ≈ <b>${n[4]} MTr/mm²</b><br><span class="muted">${n[6]}</span><br><span class="muted" style="font-size:12.5px">노드 이름 대비 실제 피치: ×${(n[3] / n[2]).toFixed(1)}</span>`;
    }
    function pick(e) {
      if (!geo) return;
      const r = el.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      let best = -1, bd = 500;
      N.forEach((n, i) => { const dx = geo.xs(n[1]) - mx, dy = geo.ys(mode === 'cpp' ? n[3] : n[4]) - my; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } });
      if (best !== hover && best >= 0) { hover = best; info(best); st.redraw(); }
    }
    el.addEventListener('pointermove', pick); el.addEventListener('pointerdown', pick);
    bind('#lab-road', v => { mode = v.m; st.redraw(); });
    info(10); hover = 10; st.redraw();
  })();

  SB.quiz(document.getElementById('quiz'), [
    { q: 'NMOS에서 V_GS = 1.0 V, V_t = 0.4 V, V_DS = 0.8 V일 때 동작 영역은?', o: ['차단', '선형', '포화', '항복'], a: 2, why: 'V_DS(0.8) > V_GS − V_t(0.6) 이므로 드레인 쪽 채널이 핀치오프된 포화 영역입니다.' },
    { q: 'FinFET이 평면 트랜지스터보다 누설 전류가 적은 근본 이유는?', o: ['핀이 금속이라서', '게이트가 채널을 3면에서 감싸 정전기적 제어력이 강해서', '채널이 더 길어서', '산화막이 더 두꺼워서'], a: 1, why: '게이트가 채널을 여러 면에서 감쌀수록 드레인의 영향(DIBL)을 누르고 채널 전체를 확실히 끌 수 있습니다.' },
    { q: '실온에서 MOSFET 서브문턱 기울기(SS)의 이론적 최솟값은?', o: ['약 6 mV/dec', '약 60 mV/dec', '약 600 mV/dec', '0 mV/dec'], a: 1, why: '(kT/q)·ln10 ≈ 59.6 mV/dec. 볼츠만 분포에서 오는 한계로, 이를 넘으려면 터널 FET 같은 새로운 원리가 필요합니다.' },
    { q: '"3나노 공정"에 대한 설명으로 옳은 것은?', o: ['게이트 길이가 정확히 3 nm다', '배선 폭이 3 nm다', '세대를 나타내는 이름이며 실제 게이트 피치는 약 45~50 nm다', '원자 3개 크기다'], a: 2, why: 'LAB 10-4에서 보듯 노드 이름과 실제 치수는 10배 이상 차이가 납니다.' },
  ]);
})();
