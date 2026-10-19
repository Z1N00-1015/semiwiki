/* Glossary */
(function () {
  const G = [
    ['밴드갭', 'Band gap', 'intro', '가전자대 꼭대기와 전도대 바닥 사이의 에너지 차이. 실리콘은 1.12 eV.'],
    ['도핑', 'Doping', 'implant', '반도체에 불순물을 의도적으로 넣어 전기적 성질(n형/p형)과 전도도를 조절하는 것.'],
    ['FEOL / BEOL', 'Front/Back-End-Of-Line', 'intro', 'FEOL은 트랜지스터를 만드는 공정, BEOL은 그 위에 금속 배선을 쌓는 공정.'],
    ['단결정', 'Single crystal', 'wafer', '원자 배열이 시료 전체에서 끊김 없이 한 방향으로 정렬된 결정.'],
    ['초크랄스키법', 'Czochralski (CZ)', 'wafer', '녹은 실리콘에 종자 결정을 담갔다 회전시키며 끌어올려 단결정 잉곳을 만드는 방법.'],
    ['잉곳', 'Ingot', 'wafer', '결정 성장으로 만든 원기둥 모양의 단결정 실리콘 덩어리. 이를 얇게 잘라 웨이퍼를 만든다.'],
    ['노치', 'Notch', 'wafer', '웨이퍼 가장자리의 작은 V자 홈. 결정 방향을 표시한다.'],
    ['밀러 지수', 'Miller index', 'wafer', '결정면을 (hkl)로 표기하는 방법. CMOS는 주로 (100) 웨이퍼를 사용.'],
    ['다이', 'Die', 'wafer', '웨이퍼에서 잘라 낸 칩 한 개.'],
    ['열산화', 'Thermal oxidation', 'oxidation', '고온에서 실리콘을 O₂ 또는 H₂O와 반응시켜 SiO₂를 기르는 공정.'],
    ['Deal–Grove 모델', 'Deal–Grove model', 'oxidation', '산화막 성장을 확산과 계면 반응의 직렬 과정으로 설명하는 모델. x² + Ax = B(t+τ).'],
    ['LOCOS', 'Local Oxidation of Silicon', 'oxidation', '질화막으로 가린 곳 외에만 두꺼운 산화막을 길러 소자를 격리하는 방식. 버즈비크가 단점.'],
    ['STI', 'Shallow Trench Isolation', 'oxidation', '실리콘에 얕은 트렌치를 파고 산화막을 채워 소자를 격리하는 방식.'],
    ['포토레지스트 (감광액)', 'Photoresist (PR)', 'lithography', '빛을 받으면 현상액에 대한 용해도가 바뀌는 고분자 막.'],
    ['노광', 'Exposure', 'lithography', '마스크 패턴을 빛으로 감광액에 옮기는 단계.'],
    ['스캐너', 'Scanner', 'lithography', '슬릿 모양 빛으로 마스크와 웨이퍼를 동시에 움직이며 노광하는 장비.'],
    ['레일리 공식', 'Rayleigh criterion', 'lithography', '해상도 CD = k₁λ/NA. 초점 심도 DOF = k₂λ/NA².'],
    ['개구수', 'Numerical Aperture (NA)', 'lithography', '렌즈가 빛을 모으는 각도의 척도. n·sin θ.'],
    ['액침 노광', 'Immersion lithography', 'lithography', '렌즈와 웨이퍼 사이를 물로 채워 NA를 1 이상(최대 1.35)으로 높인 노광.'],
    ['EUV', 'Extreme Ultraviolet', 'lithography', '파장 13.5 nm 극자외선 노광. 진공·반사 광학계를 사용.'],
    ['OPC', 'Optical Proximity Correction', 'lithography', '회절로 왜곡될 패턴을 미리 보정해 마스크를 설계하는 기법.'],
    ['위상 반전 마스크', 'Phase Shift Mask (PSM)', 'lithography', '빛의 위상을 180° 바꿔 인접 패턴 간 간섭을 이용해 해상도를 높이는 마스크.'],
    ['오버레이', 'Overlay', 'lithography', '현재 층 패턴과 아래층 패턴 사이의 정렬 오차.'],
    ['CD', 'Critical Dimension', 'lithography', '패턴의 임계 치수(선폭).'],
    ['식각', 'Etching', 'etching', '패턴을 따라 막을 제거하는 공정. 습식과 건식(플라즈마)으로 나뉜다.'],
    ['이방성', 'Anisotropy', 'etching', '식각이 방향에 따라 다른 정도. 수직으로만 깎이면 이방성.'],
    ['선택비', 'Selectivity', 'etching', '두 재료의 식각 속도 비.'],
    ['RIE', 'Reactive Ion Etching', 'etching', '플라즈마 라디칼의 화학 반응과 이온 충돌을 함께 이용하는 건식 식각.'],
    ['쉬스', 'Sheath', 'etching', '플라즈마와 전극 사이의 얇은 전하 공간 영역. 강한 전기장이 이온을 가속.'],
    ['Bosch 공정', 'Bosch process / DRIE', 'etching', '식각과 보호막 증착을 반복해 실리콘을 깊고 수직으로 파는 방식.'],
    ['엔드포인트', 'Endpoint detection', 'etching', '플라즈마 발광 등을 감시해 식각 종료 시점을 판단하는 기술.'],
    ['PVD', 'Physical Vapor Deposition', 'deposition', '스퍼터링·증발 등 물리적 방법으로 원자를 날려 막을 쌓는 방식.'],
    ['CVD', 'Chemical Vapor Deposition', 'deposition', '기체 전구체의 표면 화학 반응으로 막을 쌓는 방식.'],
    ['ALD', 'Atomic Layer Deposition', 'deposition', '두 전구체를 번갈아 공급해 자기 제한 반응으로 원자층 단위로 쌓는 방식.'],
    ['스텝 커버리지', 'Step coverage', 'deposition', '단차 구조의 바닥/측벽 두께와 윗면 두께의 비.'],
    ['보이드', 'Void', 'deposition', '막이 입구를 먼저 막아 내부에 생긴 빈 공간.'],
    ['스퍼터링', 'Sputtering', 'deposition', '이온으로 타깃을 때려 원자를 튕겨 내 기판에 쌓는 PVD.'],
    ['이온 주입', 'Ion implantation', 'implant', '도펀트를 이온화·가속해 실리콘에 박아 넣는 도핑 방법.'],
    ['도즈', 'Dose', 'implant', '단위 면적당 주입된 이온 수 (cm⁻²).'],
    ['투사 거리', 'Projected range (Rp)', 'implant', '주입 이온이 멈추는 평균 깊이.'],
    ['채널링', 'Channeling', 'implant', '이온이 결정 축을 따라 원자 열 사이로 깊이 파고드는 현상.'],
    ['어닐링', 'Annealing', 'implant', '열처리로 결정 손상을 회복하고 도펀트를 활성화하는 공정.'],
    ['RTA', 'Rapid Thermal Annealing', 'implant', '수 초 이내의 급속 열처리로 확산을 최소화.'],
    ['접합 깊이', 'Junction depth (xj)', 'implant', '도펀트 농도가 기판 농도와 같아지는 깊이.'],
    ['다마신', 'Damascene', 'metallization', '절연막에 홈을 파고 금속을 채운 뒤 연마하는 배선 형성 방식.'],
    ['TSV', 'Through-Silicon Via', 'packaging', '실리콘 다이를 수직으로 관통하는 전극.'],
    ['CMP', 'Chemical Mechanical Polishing', 'metallization', '슬러리와 패드로 표면을 화학적·기계적으로 평탄화하는 공정.'],
    ['프레스턴 방정식', 'Preston equation', 'metallization', 'CMP 제거 속도 RR = Kp·P·V.'],
    ['디싱 / 에로전', 'Dishing / Erosion', 'metallization', 'CMP 시 넓은 금속이 파이는 현상 / 조밀 영역 전체가 내려앉는 현상.'],
    ['low-k', 'Low-k dielectric', 'metallization', '유전율이 낮은 절연막. 배선 기생 정전용량을 줄인다.'],
    ['전자 이동', 'Electromigration', 'metallization', '전자 흐름이 금속 원자를 밀어 배선이 끊어지거나 튀어나오는 고장.'],
    ['EDS', 'Electrical Die Sorting', 'yield', '웨이퍼 상태에서 각 다이를 전기적으로 검사해 양품을 판별하는 공정.'],
    ['프로브 카드', 'Probe card', 'yield', '다이 패드에 접촉하는 미세 바늘이 달린 테스트 인터페이스.'],
    ['수율', 'Yield', 'yield', '전체 다이 중 양품의 비율.'],
    ['결함 밀도', 'Defect density (D₀)', 'yield', '단위 면적당 치명적 결함 수 (/cm²).'],
    ['칩렛', 'Chiplet', 'yield', '큰 시스템을 여러 개의 작은 다이로 나눠 패키지에서 결합하는 방식.'],
    ['와이어 본딩', 'Wire bonding', 'packaging', '가는 금속선으로 칩 패드와 기판을 연결하는 방법.'],
    ['플립칩', 'Flip chip', 'packaging', '칩을 뒤집어 범프로 기판에 직접 연결하는 방식.'],
    ['인터포저', 'Interposer', 'packaging', '여러 칩을 나란히 올려 미세 배선으로 연결하는 중간 기판 (2.5D).'],
    ['HBM', 'High Bandwidth Memory', 'packaging', 'D램을 TSV로 적층해 초광대역으로 연결한 메모리.'],
    ['하이브리드 본딩', 'Hybrid bonding', 'packaging', '범프 없이 구리 패드와 절연막을 동시에 직접 접합하는 기술.'],
    ['MOSFET', 'Metal-Oxide-Semiconductor FET', 'transistor', '게이트 전압으로 채널을 제어하는 전계 효과 트랜지스터.'],
    ['문턱 전압', 'Threshold voltage (Vt)', 'transistor', '채널이 형성되기 시작하는 게이트 전압.'],
    ['핀치오프', 'Pinch-off', 'transistor', 'V_DS가 커져 드레인 쪽 채널이 사라지는 상태. 이후 전류 포화.'],
    ['DIBL', 'Drain-Induced Barrier Lowering', 'transistor', '드레인 전압이 소스 장벽을 낮춰 문턱 전압이 떨어지는 단채널 효과.'],
    ['서브문턱 기울기', 'Subthreshold swing (SS)', 'transistor', '전류를 10배 늘리는 데 필요한 게이트 전압. 실온 한계 60 mV/dec.'],
    ['FinFET', 'Fin Field-Effect Transistor', 'transistor', '지느러미 모양 채널을 게이트가 3면에서 감싸는 트랜지스터.'],
    ['GAA', 'Gate-All-Around', 'transistor', '게이트가 채널(나노시트·나노와이어)의 4면을 모두 감싸는 트랜지스터.'],
    ['CPP', 'Contacted Poly Pitch', 'transistor', '게이트와 게이트 사이의 간격. 실제 미세화 척도.'],
    ['후면 전력 공급', 'Backside Power Delivery', 'transistor', '웨이퍼 뒷면에 전원 배선을 만드는 기술.'],
  ];
  const C = Object.fromEntries(SB.CHAPTERS.map(c => [c.id, c]));
  let q = '', f = 'all';
  const gf = document.getElementById('gf');
  const used = [...new Set(G.map(g => g[2]))];
  gf.innerHTML = `<button data-v="all" class="on">전체</button>` + used.map(id => `<button data-v="${id}">${C[id].short}</button>`).join('');
  SB.seg(gf, v => { f = v; render(); });
  const inp = document.getElementById('q');
  inp.addEventListener('input', () => { q = inp.value.trim().toLowerCase(); render(); });
  const hl = s => q ? s.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>') : s;
  function render() {
    const list = G.filter(g => (f === 'all' || g[2] === f) && (!q || (g[0] + g[1] + g[3]).toLowerCase().includes(q)))
      .sort((a, b) => a[0].localeCompare(b[0], 'ko'));
    document.getElementById('gcount').textContent = `${list.length}개 용어`;
    document.getElementById('gl').innerHTML = list.map(g => `<div class="gloss-item"><b>${hl(g[0])}</b><span class="en">${hl(g[1])}</span><p>${hl(g[3])}</p><a class="ch" href="${C[g[2]].file}">→ ${C[g[2]].n}장 ${C[g[2]].title}</a></div>`).join('') || '<p class="muted">검색 결과가 없습니다.</p>';
  }
  render();
})();
