/* Chapter 00 — intro */
(function () {
  const { css, canvas, animate, plot, bind, clamp, lerp, ease, sci, alpha } = SB;

  /* ============ LAB 0-1: band gap ============ */
  (function () {
    const MATS = {
      metal: { name: '구리', eg: () => 0, Nc: 0, Nv: 0 },
      si: { name: '실리콘', eg: T => 1.17 - 4.73e-4 * T * T / (T + 636), Nc: 2.8e19, Nv: 1.04e19 },
      gaas: { name: 'GaAs', eg: T => 1.519 - 5.405e-4 * T * T / (T + 204), Nc: 4.7e17, Nv: 7e18 },
      oxide: { name: 'SiO₂', eg: () => 9.0, Nc: 1e19, Nv: 1e19 },
    };
    const el = document.getElementById('band');
    let mat = 'si', T = 300, nEx = 0;
    const slots = [];
    for (let i = 0; i < 48; i++) slots.push({ u: (i % 12 + 0.5) / 12, v: Math.floor(i / 12) / 4 + 0.12 });
    const free = []; // excited electrons {x,y,vx,vy,slot}
    let tm = 0;

    function ni(m, T) {
      const M = MATS[m];
      if (m === 'metal') return Infinity;
      const kT = 8.617e-5 * T;
      return Math.sqrt(M.Nc * M.Nv) * Math.pow(T / 300, 1.5) * Math.exp(-M.eg(T) / (2 * kT));
    }
    function targetCount() {
      if (mat === 'metal') return 0;
      const n = ni(mat, T);
      return n > 0 ? clamp(Math.round(Math.log10(n) - 3), 0, 16) : 0;
    }
    const st = canvas(el, (ctx, w, h) => {
      const L = 70, R = w - 24;
      const eg = MATS[mat].eg(T);
      const gapPx = mat === 'metal' ? -30 : clamp(26 + 62 * Math.sqrt(eg), 30, h * 0.52);
      const bandH = h * 0.2;
      const vbTop = h / 2 + gapPx / 2, cbBot = h / 2 - gapPx / 2;
      const text = css('--text-2');
      ctx.font = '13px ' + css('--font');
      // energy axis
      ctx.strokeStyle = css('--fig-axis'); ctx.fillStyle = text; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(40, h - 12); ctx.lineTo(40, 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(34, 22); ctx.lineTo(40, 12); ctx.lineTo(46, 22); ctx.stroke();
      ctx.save(); ctx.translate(22, h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('전자 에너지 E', 0, 0); ctx.restore();
      // bands
      ctx.fillStyle = alpha(css('--blue'), 0.10); ctx.strokeStyle = alpha(css('--blue'), 0.5);
      ctx.fillRect(L, cbBot - bandH, R - L, bandH); ctx.strokeRect(L, cbBot - bandH, R - L, bandH);
      ctx.fillStyle = alpha(css('--rose'), 0.10); ctx.strokeStyle = alpha(css('--rose'), 0.5);
      ctx.fillRect(L, vbTop, R - L, bandH); ctx.strokeRect(L, vbTop, R - L, bandH);
      ctx.fillStyle = text; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('전도대', R - 8, cbBot - bandH + 14);
      ctx.fillText('가전자대', R - 8, vbTop + bandH - 14);
      if (mat !== 'metal') {
        // gap arrow
        const gx = L + 30;
        ctx.strokeStyle = css('--accent'); ctx.fillStyle = css('--accent'); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(gx, cbBot + 3); ctx.lineTo(gx, vbTop - 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx - 5, cbBot + 10); ctx.lineTo(gx, cbBot + 3); ctx.lineTo(gx + 5, cbBot + 10); ctx.fill();
        ctx.beginPath(); ctx.moveTo(gx - 5, vbTop - 10); ctx.lineTo(gx, vbTop - 3); ctx.lineTo(gx + 5, vbTop - 10); ctx.fill();
        ctx.textAlign = 'left'; ctx.font = '600 13px ' + css('--font');
        ctx.fillText('Eg = ' + eg.toFixed(2) + ' eV', gx + 10, h / 2);
      } else {
        ctx.textAlign = 'center'; ctx.fillStyle = css('--accent'); ctx.font = '600 13px ' + css('--font');
        ctx.fillText('밴드가 겹침 → 전자가 자유롭게 이동', (L + R) / 2, h / 2);
      }
      // electrons in valence band
      const r = 5;
      const bx = u => L + 70 + u * (R - L - 110);
      const vy = v => vbTop + 8 + v * (bandH - 16);
      slots.forEach((s, i) => {
        const x = bx(s.u), y = vy(s.v);
        if (s.empty) {
          ctx.strokeStyle = css('--rose'); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        } else {
          ctx.fillStyle = css('--blue');
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
      });
      // free electrons in conduction band (or metal electrons)
      ctx.fillStyle = css('--blue');
      free.forEach(e => {
        const x = L + 60 + e.x * (R - L - 90), y = cbBot - bandH + 8 + e.y * (bandH - 16);
        ctx.shadowColor = css('--blue'); ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        if (e.jump > 0) {
          // jump trail
          const s = slots[e.slot];
          ctx.strokeStyle = alpha(css('--blue'), e.jump); ctx.setLineDash([3, 4]); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(bx(s.u), vy(s.v)); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
        }
      });
      // thermal wiggle indicator
      ctx.fillStyle = css('--muted'); ctx.textAlign = 'left'; ctx.font = '12px ' + css('--font');
      ctx.fillText('T = ' + T + ' K' + (mat === 'metal' ? '' : ' · 들뜬 전자 ' + nEx + '개 (로그 표시)'), L, 16);
    });

    function sync() {
      const want = mat === 'metal' ? 14 : targetCount();
      if (mat === 'metal') {
        slots.forEach(s => (s.empty = false));
        while (free.length < want) free.push({ x: Math.random(), y: Math.random(), vx: 0, vy: 0, slot: 0, jump: 0 });
        while (free.length > want) free.pop();
        nEx = want;
        return;
      }
      if (free.length && free[0].slot == null) free.length = 0;
      while (free.length < want) {
        const empty = slots.map((s, i) => i).filter(i => !slots[i].empty);
        const i = empty[Math.floor(Math.random() * empty.length)];
        slots[i].empty = true;
        free.push({ x: slots[i].u, y: 0.8, vx: 0, vy: 0, slot: i, jump: 1 });
      }
      while (free.length > want) { const e = free.pop(); slots[e.slot].empty = false; }
      nEx = want;
    }
    bind('#lab-band', v => {
      if (v.mat !== mat) { free.length = 0; slots.forEach(s => (s.empty = false)); }
      mat = v.mat; T = v.T;
      sync();
      const eg = MATS[mat].eg(T), n = ni(mat, T);
      document.getElementById('b-eg').innerHTML = mat === 'metal' ? '0 <small>eV</small>' : eg.toFixed(2) + ' <small>eV</small>';
      document.getElementById('b-ni').innerHTML = mat === 'metal' ? '~10²³ <small>cm⁻³</small>' : (n < 1e-3 ? '≈ 0' : sci(n, 1)) + ' <small>cm⁻³</small>';
      document.getElementById('b-kt').innerHTML = (8.617e-5 * T * 1000).toFixed(1) + ' <small>meV</small>';
      st.redraw();
      return { T: T + ' K' };
    });
    animate(el, dt => {
      tm += dt;
      const sp = mat === 'metal' ? 0.6 : 0.25 + T / 1600;
      free.forEach(e => {
        e.vx += (Math.random() - 0.5) * sp * dt * 8; e.vy += (Math.random() - 0.5) * sp * dt * 8;
        e.vx *= 0.96; e.vy *= 0.96;
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.x < 0 || e.x > 1) { e.vx *= -1; e.x = clamp(e.x, 0, 1); }
        if (e.y < 0 || e.y > 1) { e.vy *= -1; e.y = clamp(e.y, 0, 1); }
        e.jump = Math.max(0, e.jump - dt * 0.8);
      });
      st.redraw();
    });
  })();

  /* ============ LAB 0-2: process flow ============ */
  (function () {
    const STEPS = [
      ['P형 실리콘 웨이퍼', '웨이퍼', '붕소(B)가 약하게 도핑된 p형 단결정 실리콘 웨이퍼에서 출발합니다. 표면은 원자 수준으로 평평하게 연마되어 있습니다.'],
      ['열산화 (Thermal Oxidation)', '산화', '약 1000 °C 퍼니스에서 산소와 반응시켜 SiO₂ 필드 산화막을 기릅니다. 이웃 소자 사이를 전기적으로 격리하는 역할입니다.'],
      ['감광액 도포 (PR Coating)', '포토', '웨이퍼를 수천 rpm으로 회전시키며 감광액(포토레지스트)을 1 µm 안팎으로 얇고 균일하게 펴 바릅니다.'],
      ['노광 (Exposure)', '포토', '회로 패턴이 그려진 마스크를 통과한 자외선이 감광액에 닿은 부분만 화학 구조를 바꿉니다.'],
      ['현상 (Develop)', '포토', '현상액에 담그면 빛을 받은 양성(positive) 감광액만 녹아 패턴이 드러납니다.'],
      ['식각 (Etch)', '식각', '남은 감광액을 방패 삼아, 드러난 산화막을 플라즈마로 깎아 트랜지스터가 놓일 활성 영역의 창을 엽니다.'],
      ['감광액 제거 (Strip)', '식각', '역할을 다한 감광액을 산소 플라즈마로 태워(애싱) 없앱니다. 패턴이 산화막으로 옮겨졌습니다.'],
      ['게이트 산화', '산화', '활성 영역에 수 nm 두께의 아주 얇고 깨끗한 게이트 절연막을 기릅니다. 트랜지스터 성능을 좌우하는 막입니다.'],
      ['폴리실리콘 증착 (CVD)', '증착', '게이트 전극이 될 다결정 실리콘을 화학 기상 증착(CVD)으로 웨이퍼 전체에 덮습니다.'],
      ['게이트 패터닝', '포토·식각', '코팅 → 노광 → 현상 → 식각 → 제거 사이클을 한 번 더 거쳐 게이트 모양의 폴리실리콘만 남깁니다.'],
      ['이온 주입 (Ion Implantation)', '이온주입', '비소(As) 이온을 가속해 쏘면 게이트와 필드 산화막이 가리지 않은 곳에만 들어가 n⁺ 소스/드레인이 생깁니다. 게이트가 마스크 역할을 하는 "자기 정렬(self-aligned)" 공정입니다.'],
      ['어닐링 (Annealing)', '열처리', '고온 열처리로 이온 충돌로 깨진 결정을 회복하고 불순물을 전기적으로 활성화합니다. 이때 불순물이 조금 퍼져 게이트 아래로 살짝 들어갑니다.'],
      ['층간 절연막 (ILD) 증착', '증착', '소자와 금속 배선을 분리할 두꺼운 절연막을 덮고 CMP로 평탄하게 갈아 냅니다.'],
      ['콘택 식각 (Contact Etch)', '포토·식각', '소스·게이트·드레인까지 내려가는 깊고 좁은 구멍(콘택 홀)을 뚫습니다.'],
      ['금속 배선 (Metallization)', '배선', '구멍을 텅스텐으로 채우고 위에 금속 배선을 그리면 완성! 소스(S)·게이트(G)·드레인(D) 단자를 가진 NMOS 트랜지스터입니다.'],
    ];
    const el = document.getElementById('flow');
    let k = 0, t = 1, time = 0, playing = false, playTimer = 0;

    const st = canvas(el, (ctx, w, h) => {
      ctx.scale(w / 1000, h / 500);
      const C = {
        si: css('--fig-si'), ox: css('--fig-oxide'), pr: css('--fig-pr'), prx: css('--fig-pr-exposed'),
        poly: css('--fig-poly'), n: css('--fig-ndope'), metal: css('--fig-metal'), bg: css('--surface-2'), text: css('--text'), accent: css('--accent'),
      };
      const d = i => (k > i ? 1 : k === i ? ease(t) : 0);
      // ILD (drawn first so it fills only voids)
      const ild = d(12);
      if (ild > 0) { ctx.fillStyle = alpha(C.ox, 0.5); const top = lerp(300, 170, ild); ctx.fillRect(0, top, 1000, 300 - top); }
      // substrate
      ctx.globalAlpha = k === 0 ? Math.max(0.15, ease(t)) : 1;
      const g = ctx.createLinearGradient(0, 300, 0, 500);
      g.addColorStop(0, C.si); g.addColorStop(1, css('--fig-si-2'));
      ctx.fillStyle = g; ctx.fillRect(0, 300, 1000, 200);
      ctx.globalAlpha = 1;
      // subtle lattice dots
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      for (let y = 320; y < 500; y += 22) for (let x = 12 + ((y / 22) % 2) * 11; x < 1000; x += 22) ctx.fillRect(x, y, 2, 2);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '600 20px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText('p-Si 기판', 24, 475);
      // n+ regions
      const imp = d(10), ann = d(11);
      if (imp > 0) {
        const dep = 22 + 26 * ann, e = 14 * ann;
        ctx.fillStyle = alpha(C.n, 0.25 + 0.6 * imp);
        ctx.beginPath(); ctx.moveTo(300, 300); ctx.lineTo(450 + e, 300); ctx.quadraticCurveTo(450 + e, 300 + dep, 450 + e - dep * 0.8, 300 + dep); ctx.lineTo(300, 300 + dep); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(700, 300); ctx.lineTo(550 - e, 300); ctx.quadraticCurveTo(550 - e, 300 + dep, 550 - e + dep * 0.8, 300 + dep); ctx.lineTo(700, 300 + dep); ctx.closePath(); ctx.fill();
        if (imp > 0.6) { ctx.fillStyle = '#fff'; ctx.font = '600 17px ' + css('--font'); ctx.textAlign = 'center'; ctx.fillText('n⁺', 370, 300 + dep / 2 + 7); ctx.fillText('n⁺', 630, 300 + dep / 2 + 7); }
      }
      // field oxide
      const fo = 50 * d(1), win = fo * (1 - d(5));
      ctx.fillStyle = C.ox;
      ctx.fillRect(0, 300 - fo, 300, fo); ctx.fillRect(700, 300 - fo, 300, fo);
      if (win > 0) ctx.fillRect(300, 300 - win, 400, win);
      // gate oxide
      const go = 8 * d(7);
      if (go > 0) { ctx.fillStyle = alpha(C.ox, 0.95); ctx.fillRect(300, 300 - go, 400, go); ctx.strokeStyle = alpha(C.text, 0.25); ctx.strokeRect(300, 300 - go, 400, go); }
      // photoresist (steps 2-6)
      if (k >= 2 && k <= 6) {
        const spread = k === 2 ? ease(t) : 1;
        const x0 = 500 - 500 * spread, x1 = 500 + 500 * spread;
        const prTop = 250 - 32, prH = 32;
        // outer regions
        const outerA = k === 6 ? 1 - ease(t) : 1;
        ctx.globalAlpha = outerA; ctx.fillStyle = C.pr;
        ctx.fillRect(x0, prTop, Math.max(0, Math.min(300, x1) - x0), prH);
        ctx.fillRect(Math.max(700, x0), prTop, Math.max(0, x1 - Math.max(700, x0)), prH);
        ctx.globalAlpha = 1;
        // window region
        let winA = 1, col = C.pr;
        if (k === 3) col = mix(C.pr, C.prx, ease(t));
        if (k >= 4) { col = C.prx; winA = k === 4 ? 1 - ease(t) : 0; }
        if (winA > 0) { ctx.globalAlpha = winA; ctx.fillStyle = col; ctx.fillRect(Math.max(300, x0), prTop, Math.min(700, x1) - Math.max(300, x0), prH); ctx.globalAlpha = 1; }
        if (k === 2) { // spinning drop
          ctx.fillStyle = C.pr; ctx.beginPath(); ctx.ellipse(500, prTop - 30 + 30 * ease(t), 20 * (1 - t) + 2, 14 * (1 - t) + 1, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      // mask + UV for exposure
      if (k === 3) {
        const a = Math.min(1, t * 3);
        ctx.globalAlpha = a;
        ctx.fillStyle = alpha(css('--text'), 0.85);
        ctx.fillRect(40, 90, 260, 14); ctx.fillRect(700, 90, 260, 14);
        ctx.fillStyle = alpha(css('--oxide') || C.ox, 0.4); ctx.fillRect(300, 90, 400, 14);
        ctx.font = '600 15px ' + css('--font'); ctx.fillStyle = css('--text'); ctx.textAlign = 'left'; ctx.fillText('마스크 (크롬 패턴)', 44, 80);
        ctx.strokeStyle = alpha('#8a5cff', 0.7); ctx.lineWidth = 3; ctx.setLineDash([10, 12]); ctx.lineDashOffset = -time * 80;
        for (let x = 60; x < 960; x += 34) {
          ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, x > 300 && x < 700 ? 218 : 88); ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.fillStyle = '#8a5cff'; ctx.fillText('UV 365 nm', 860, 40);
        ctx.globalAlpha = 1;
      }
      // etch plasma
      if (k === 5 && t < 1) {
        ctx.fillStyle = alpha(C.accent, 0.8);
        for (let i = 0; i < 24; i++) {
          const x = 310 + ((i * 97) % 380), y = 120 + ((time * 260 + i * 53) % 130);
          ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      // poly
      const P = 56 * d(8);
      const pat = d(9);
      if (P > 0) {
        if (pat < 1) {
          ctx.globalAlpha = 1 - pat; ctx.fillStyle = C.poly;
          ctx.beginPath();
          ctx.moveTo(0, 250 - P); ctx.lineTo(300, 250 - P); ctx.lineTo(300 + P, 292 - P); ctx.lineTo(700 - P, 292 - P); ctx.lineTo(700, 250 - P); ctx.lineTo(1000, 250 - P);
          ctx.lineTo(1000, 250); ctx.lineTo(700, 250); ctx.lineTo(700, 292); ctx.lineTo(300, 292); ctx.lineTo(300, 250); ctx.lineTo(0, 250); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (k >= 9) { ctx.fillStyle = C.poly; ctx.fillRect(450, 292 - 56, 100, 56); }
        if (k >= 9 && pat > 0.6) { ctx.fillStyle = '#fff'; ctx.font = '600 15px ' + css('--font'); ctx.textAlign = 'center'; ctx.fillText('Poly', 500, 270); }
      }
      // ion implant
      if (k === 10 && t < 1) {
        ctx.fillStyle = C.n;
        for (let i = 0; i < 70; i++) {
          const x = 8 + ((i * 137) % 990);
          const stop = (x > 450 && x < 550) ? 236 : (x > 300 && x < 700) ? 300 : 250;
          const y = 20 + ((time * 300 + i * 41) % (stop - 20));
          ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(x - 0.7, y - 18, 1.4, 14);
        }
        ctx.font = '600 15px ' + css('--font'); ctx.textAlign = 'left'; ctx.fillText('As⁺ 이온 빔', 20, 20);
      }
      // anneal glow
      if (k === 11 && t < 1) {
        ctx.fillStyle = `rgba(255,110,40,${0.18 * Math.sin(Math.PI * t)})`;
        ctx.fillRect(0, 0, 1000, 500);
      }
      // contacts
      const ct = d(13);
      if (ct > 0) {
        ctx.fillStyle = C.bg;
        const hole = (x0, x1, bot) => ctx.fillRect(x0, 170, x1 - x0, (bot - 170) * ct);
        hole(355, 395, 300); hole(605, 645, 300); hole(485, 515, 236);
      }
      // metal
      const m = d(14);
      if (m > 0) {
        ctx.globalAlpha = m; ctx.fillStyle = C.metal;
        ctx.fillRect(355, 170, 40, 130); ctx.fillRect(605, 170, 40, 130); ctx.fillRect(485, 170, 30, 66);
        ctx.fillRect(320, 138, 110, 32); ctx.fillRect(465, 138, 70, 32); ctx.fillRect(570, 138, 110, 32);
        ctx.fillStyle = C.text; ctx.font = '700 22px ' + css('--font'); ctx.textAlign = 'center';
        ctx.fillText('S', 375, 126); ctx.fillText('G', 500, 126); ctx.fillText('D', 625, 126);
        ctx.globalAlpha = 1;
      }
      // channel indicator in final
      if (k === 14 && t > 0.8) {
        ctx.strokeStyle = C.accent; ctx.setLineDash([6, 5]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(462, 306); ctx.lineTo(538, 306); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.accent; ctx.font = '600 14px ' + css('--font'); ctx.fillText('채널', 500, 326);
      }
      // step badge
      ctx.fillStyle = alpha(C.text, 0.55); ctx.font = '600 16px ' + css('--mono'); ctx.textAlign = 'right';
      ctx.fillText(`STEP ${String(k + 1).padStart(2, '0')} / ${STEPS.length}`, 985, 30);
    });

    function mix(a, b, t) {
      const pa = hex(a), pb = hex(b);
      if (!pa || !pb) return t < .5 ? a : b;
      return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(',')})`;
    }
    function hex(c) { if (!c || c[0] !== '#') return null; let s = c.slice(1); if (s.length === 3) s = s.split('').map(x => x + x).join(''); const n = parseInt(s, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

    const dots = document.getElementById('f-dots');
    STEPS.forEach((s, i) => {
      const b = document.createElement('button');
      b.title = s[0]; b.setAttribute('aria-label', s[0]);
      b.addEventListener('click', () => go(i));
      dots.appendChild(b);
    });
    function go(i) {
      k = clamp(i, 0, STEPS.length - 1); t = 0;
      const [title, tag, txt] = STEPS[k];
      document.getElementById('f-text').innerHTML = `<span class="n">STEP ${k + 1} · <span class="tag">${tag}</span></span><b class="t">${title}</b>${txt}`;
      [...dots.children].forEach((d, j) => d.classList.toggle('on', j === k));
      document.getElementById('f-prev').disabled = k === 0;
      document.getElementById('f-next').disabled = k === STEPS.length - 1;
    }
    document.getElementById('f-prev').onclick = () => { stop(); go(k - 1); };
    document.getElementById('f-next').onclick = () => { stop(); go(k + 1); };
    const playBtn = document.getElementById('f-play');
    function stop() { playing = false; playBtn.textContent = '▶ 자동 재생'; }
    playBtn.onclick = () => {
      playing = !playing; playTimer = 0;
      playBtn.textContent = playing ? '❚❚ 일시정지' : '▶ 자동 재생';
      if (playing && k === STEPS.length - 1) go(0);
    };
    document.addEventListener('keydown', e => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      if (e.target.closest('input, select, textarea')) return;
      if (e.key === 'ArrowRight') { stop(); go(k + 1); }
      if (e.key === 'ArrowLeft') { stop(); go(k - 1); }
    });
    document.getElementById('f-legend').innerHTML = [
      ['--fig-si', 'p형 실리콘'], ['--fig-oxide', '산화막 SiO₂'], ['--fig-pr', '감광액'], ['--fig-poly', '폴리실리콘'], ['--fig-ndope', 'n⁺ 도핑'], ['--fig-metal', '금속'],
    ].map(([c, n]) => `<span><i style="background:var(${c})"></i>${n}</span>`).join('');
    go(0);
    animate(el, dt => {
      time += dt;
      if (t < 1) t = Math.min(1, t + dt / 1.4);
      if (playing) {
        playTimer += dt;
        if (playTimer > 3.2) { playTimer = 0; if (k < STEPS.length - 1) go(k + 1); else stop(); }
      }
      st.redraw();
    });
  })();

  /* ============ LAB 0-3: scale zoom ============ */
  (function () {
    const OBJ = [
      ['300 mm 웨이퍼', 0.3, 'wafer'],
      ['칩(다이) 한 개', 0.012, 'die'],
      ['개미', 0.004, 'circle'],
      ['머리카락 굵기', 8e-5, 'circle'],
      ['먼지 입자', 1e-5, 'circle'],
      ['적혈구', 7.5e-6, 'circle'],
      ['대장균', 2e-6, 'rod'],
      ['i-line 노광 파장', 3.65e-7, 'wave'],
      ['바이러스', 1e-7, 'circle'],
      ['최신 게이트 피치', 4.8e-8, 'pitch'],
      ['EUV 파장', 1.35e-8, 'wave'],
      ['GAA 나노시트 두께', 5e-9, 'bar'],
      ['DNA 이중나선 폭', 2e-9, 'bar'],
      ['게이트 절연막 두께', 1.2e-9, 'bar'],
      ['실리콘 원자 간격', 2.35e-10, 'atoms'],
    ];
    const el = document.getElementById('scale');
    let z = -0.5;
    const pal = ['--accent', '--teal', '--amber', '--rose', '--blue', '--green'];
    function fmtLen(m) {
      const u = [[1, 'm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm'], [1e-12, 'pm']];
      for (const [s, n] of u) if (m >= s * 0.999) { const v = m / s; return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' ' + n; }
      return (m / 1e-12).toFixed(2) + ' pm';
    }
    const st = canvas(el, (ctx, w, h) => {
      const V = Math.pow(10, z);
      const px = m => m / V * w;
      const cy = h * 0.46;
      ctx.font = '13px ' + css('--font');
      let x = 24;
      OBJ.forEach(([name, size, kind], i) => {
        const s = px(size);
        if (s < 3 || s > w * 3) return;
        const col = css(pal[i % pal.length]);
        ctx.save();
        if (kind === 'atoms') {
          ctx.fillStyle = alpha(col, 0.85);
          for (let ax = x + s / 2; ax < w + s; ax += s) for (let ay = cy - s * 3; ay < cy + s * 3.5; ay += s) {
            ctx.beginPath(); ctx.arc(ax, ay, Math.max(1.5, s * 0.22), 0, Math.PI * 2); ctx.fill();
          }
          label(ctx, name + ' · ' + fmtLen(size), x, cy + Math.min(s * 3.5, h * .4) + 18, col);
          ctx.restore();
          x = w; return;
        }
        if (x > w) { ctx.restore(); return; }
        if (s > w * 0.9 && kind !== 'wave' && kind !== 'bar' && kind !== 'pitch') {
          // larger than the screen: draw as a backdrop edge, don't consume layout space
          ctx.fillStyle = alpha(col, 0.08); ctx.strokeStyle = alpha(col, 0.6); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(w * 0.5, cy + s / 2 + h * 0.36, s / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = col; ctx.font = '600 13px ' + css('--font'); ctx.textAlign = 'right';
          ctx.fillText(name + ' 가장자리 (' + fmtLen(size) + ')', w - 12, h - 34);
          ctx.restore(); return;
        }
        const cx = x;
        ctx.fillStyle = alpha(col, 0.22); ctx.strokeStyle = col; ctx.lineWidth = 2;
        if (kind === 'wafer' || kind === 'circle') {
          ctx.beginPath(); ctx.arc(x + s / 2, cy, s / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        } else if (kind === 'die') {
          ctx.fillRect(x, cy - s / 2, s, s); ctx.strokeRect(x, cy - s / 2, s, s);
        } else if (kind === 'rod') {
          rr(ctx, x, cy - s / 5, s, s / 2.5, s / 5); ctx.fill(); ctx.stroke();
        } else if (kind === 'wave') {
          ctx.beginPath();
          const amp = Math.min(30, s / 3);
          for (let i2 = 0; i2 <= 200; i2++) { const xx = x + i2 / 200 * s * 2; ctx.lineTo(xx, cy + amp * Math.sin((xx - x) / s * Math.PI * 2)); }
          ctx.stroke();
        } else if (kind === 'pitch') {
          for (let j = 0; j < 4; j++) { ctx.fillRect(x + j * s, cy - s * 1.2, s * 0.35, s * 2.4); ctx.strokeRect(x + j * s, cy - s * 1.2, s * 0.35, s * 2.4); }
        } else if (kind === 'bar') {
          ctx.fillRect(x, cy - Math.max(s, 2) / 2, Math.max(60, s * 6), Math.max(s, 2));
        }
        const bw = kind === 'wave' ? s * 2 : kind === 'pitch' ? s * 3.4 : kind === 'bar' ? Math.max(60, s * 6) : s;
        const ly = (kind === 'bar' ? cy + 20 : cy + Math.min(s / 2, h * 0.42) + 18);
        label(ctx, name, Math.max(8, cx), Math.min(ly, h - 32), col, true);
        ctx.fillStyle = css('--muted'); ctx.textAlign = 'left';
        ctx.fillText(fmtLen(size), Math.max(8, x), Math.min(ly, h - 32) + 16);
        ctx.restore();
        x += Math.max(bw, ctx.measureText(name).width) + 26;
      });
      // scale bar
      const target = V / 4;
      const e = Math.floor(Math.log10(target));
      const nice = [1, 2, 5].map(m => m * Math.pow(10, e)).reverse().find(v => v <= target) || Math.pow(10, e);
      const bl = px(nice);
      ctx.strokeStyle = css('--text'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(20, h - 14); ctx.lineTo(20 + bl, h - 14); ctx.moveTo(20, h - 20); ctx.lineTo(20, h - 8); ctx.moveTo(20 + bl, h - 20); ctx.lineTo(20 + bl, h - 8); ctx.stroke();
      ctx.fillStyle = css('--text'); ctx.textAlign = 'left'; ctx.font = '600 13px ' + css('--mono');
      ctx.fillText(fmtLen(nice), 28 + bl, h - 10);
      ctx.textAlign = 'right'; ctx.fillStyle = css('--muted');
      ctx.fillText('×' + Math.round(0.3 / V).toLocaleString() + ' (웨이퍼 기준 배율)', w - 12, 20);
    });
    function label(ctx, s, x, y, col, center) {
      ctx.fillStyle = col; ctx.font = '600 13px ' + css('--font'); ctx.textAlign = 'left';
      ctx.fillText(s, Math.max(8, x - (center ? 0 : 0)), y);
    }
    function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    const zoom = document.getElementById('zoom');
    const ctl = bind('#lab-scale', v => { z = v.z; st.redraw(); return { z: fmtLen(Math.pow(10, z)) }; });
    const jumps = [['웨이퍼', -0.4], ['칩', -1.7], ['머리카락', -3.7], ['세포', -4.8], ['EUV 파장', -7.3], ['나노시트', -7.9], ['원자', -9.2]];
    const jr = document.getElementById('scale-jump');
    let anim = null;
    jumps.forEach(([n, v]) => {
      const b = document.createElement('button'); b.className = 'btn'; b.textContent = n;
      b.onclick = () => {
        const from = parseFloat(zoom.value), t0 = performance.now();
        cancelAnimationFrame(anim);
        const stepf = now => {
          const u = Math.min(1, (now - t0) / 900);
          zoom.value = lerp(from, v, ease(u)); ctl.update();
          if (u < 1) anim = requestAnimationFrame(stepf);
        };
        anim = requestAnimationFrame(stepf);
      };
      jr.appendChild(b);
    });
  })();

  /* ============ LAB 0-4: Moore's law ============ */
  (function () {
    const D = [
      ['Intel 4004', 1971, 2300], ['Intel 8080', 1974, 6000], ['Intel 8086', 1978, 29000], ['Intel 80286', 1982, 134000],
      ['Intel 80386', 1985, 275000], ['Intel 80486', 1989, 1.2e6], ['Pentium', 1993, 3.1e6], ['Pentium II', 1997, 7.5e6],
      ['Pentium 4', 2000, 4.2e7], ['Core 2 Duo', 2006, 2.91e8], ['Core i7 (Nehalem)', 2008, 7.31e8], ['Core i7 (Sandy Bridge)', 2011, 1.16e9],
      ['NVIDIA GK110', 2012, 7.08e9], ['Apple A7', 2013, 1e9], ['Apple A11', 2017, 4.3e9], ['NVIDIA GV100', 2017, 2.11e10],
      ['Apple M1', 2020, 1.6e10], ['NVIDIA A100', 2020, 5.42e10], ['Apple M1 Ultra', 2022, 1.14e11], ['NVIDIA H100', 2022, 8e10],
      ['Apple A17 Pro', 2023, 1.9e10], ['Apple M3 Max', 2023, 9.2e10], ['NVIDIA B200', 2024, 2.08e11],
    ];
    const el = document.getElementById('moore');
    let dbl = 2, hover = -1, geo = null;
    const pred = y => 2300 * Math.pow(2, (y - 1971) / dbl);
    const st = canvas(el, (ctx, w, h) => {
      const line = []; for (let y = 1970; y <= 2026; y += 0.5) line.push([y, pred(y)]);
      geo = plot(ctx, w, h, {
        x: { min: 1969, max: 2026, label: '연도', ticks: [1970, 1980, 1990, 2000, 2010, 2020] },
        y: { min: 1e3, max: 1e12, log: true, label: '트랜지스터 수' },
        series: [{ data: line, color: css('--accent'), width: 2, dash: [6, 4] }],
        marks: D.map(([n, y, c], i) => ({ x: y, y: c, r: i === hover ? 7 : 4.5, color: i === hover ? css('--rose') : (n.startsWith('NVIDIA') ? css('--teal') : n.startsWith('Apple') ? css('--amber') : css('--blue')), label: i === hover ? n : null, bold: true, align: y > 2010 ? 'right' : 'left' })),
      });
      ctx.font = '12px ' + css('--font'); ctx.fillStyle = css('--accent'); ctx.textAlign = 'left';
      ctx.fillText(`${dbl.toFixed(2)}년마다 2배`, geo.pad.l + 10, geo.pad.t + 14);
    });
    function errCalc() {
      const e = D.reduce((a, [, y, c]) => a + Math.abs(Math.log10(c / pred(y))), 0) / D.length;
      return Math.pow(10, e);
    }
    bind('#lab-moore', v => {
      dbl = v.dbl;
      document.getElementById('m-pred').textContent = sci(pred(2024), 1);
      const e = errCalc();
      const r = document.getElementById('m-err');
      r.innerHTML = '×' + (e < 100 ? e.toFixed(1) : sci(e, 0));
      r.parentElement.classList.toggle('good', e < 3);
      r.parentElement.classList.toggle('bad', e > 20);
      st.redraw();
      return { dbl: dbl.toFixed(2) + ' 년' };
    });
    function pick(ev) {
      if (!geo) return;
      const r = el.getBoundingClientRect();
      const mx = ev.clientX - r.left, my = ev.clientY - r.top;
      let best = -1, bd = 400;
      D.forEach(([, y, c], i) => { const dx = geo.xs(y) - mx, dy = geo.ys(c) - my; const d2 = dx * dx + dy * dy; if (d2 < bd) { bd = d2; best = i; } });
      if (best !== hover) {
        hover = best; st.redraw();
        if (best >= 0) {
          const [n, y, c] = D[best];
          document.getElementById('m-info').innerHTML = `<b class="t">${n}</b>${y}년 · 트랜지스터 <b>${c.toLocaleString()}</b>개<br><span class="muted">예측 대비 ×${(c / pred(y)).toFixed(2)}</span>`;
        }
      }
    }
    el.addEventListener('pointermove', pick);
    el.addEventListener('pointerdown', pick);
  })();

  SB.quiz(document.getElementById('quiz'), [
    { q: '실리콘이 반도체로 널리 쓰이는 가장 근본적인 물리적 이유는?', o: ['밴드갭이 0이어서 전자가 자유롭다', '밴드갭이 적당히 작아(1.12 eV) 도핑과 전압으로 전도도를 크게 조절할 수 있다', '밴드갭이 매우 커서 전기가 전혀 통하지 않는다', '금속과 같은 결정 구조를 가진다'], a: 1, why: '밴드갭이 0이면 도체, 매우 크면 절연체입니다. 실리콘은 그 중간이라 조절이 가능합니다. 게다가 안정한 산화막(SiO₂)을 쉽게 만들 수 있는 것도 큰 장점입니다.' },
    { q: '하나의 패턴을 새기기 위한 포토 사이클의 올바른 순서는?', o: ['노광 → 코팅 → 식각 → 현상 → 제거', '코팅 → 노광 → 현상 → 식각 → 제거', '식각 → 코팅 → 노광 → 현상 → 제거', '코팅 → 식각 → 노광 → 제거 → 현상'], a: 1, why: '감광액을 바르고(코팅), 빛을 쬐고(노광), 녹여 내고(현상), 드러난 막을 깎은 뒤(식각), 감광액을 벗겨 냅니다(제거).' },
    { q: '이온 주입에서 게이트 전극 자체가 마스크 역할을 하여 소스/드레인이 게이트 양옆에 정확히 맞춰지는 방식을 무엇이라 할까?', o: ['자기 정렬 (self-aligned)', '오버레이 (overlay)', '스텝 커버리지 (step coverage)', '디싱 (dishing)'], a: 0, why: '게이트를 먼저 만들고 그 위로 이온을 쏘면, 게이트가 가린 부분(채널)에는 이온이 들어가지 않아 자동으로 정렬됩니다.' },
    { q: '무어의 법칙에 따라 2년마다 트랜지스터 수가 2배가 된다면 20년 후에는 약 몇 배가 될까?', o: ['20배', '100배', '약 1,000배', '약 1,000,000배'], a: 2, why: '20년 / 2년 = 10번 두 배 → 2¹⁰ = 1024배입니다.' },
  ]);
})();
