// 책사형 인물들의 책략(전략기) 목록 - 사용자가 제공한 등급표(S~D)를 그대로 데이터화한다.
// 이 파일은 "이름/등급/설명/보유 인물" 정보만 갖는 카탈로그다. 실제 전투 효과
// 구현은 main.js의 attemptStrategy 쪽에서 STRATEGY_EFFECTS로 등급별/스킬별로
// 붙여나간다 - S급 6개는 이미 이 세션에서 여러 차례 확인받은 대로 완전히
// 구현되어 있고, A~D급은 카탈로그(이름/설명/보유자 표시)만 우선 채워져 있으며
// 실제 발동 효과는 순차적으로 이어서 구현한다.
//
// S급 책사는 "전투당 1회"인 자기 S급 책략을 이미 썼으면 그 전투에서 완전히
// 할 게 없어 보이는 문제가 있어, bonus 필드로 C/D급 책략을 하나 더 얹어준다
// (예: 사마의 - 견벽거수(S) 다 쓰면 견수(C)를 대신 쓸 수 있음).
const STRATEGIES = {
  // ---- S급 ----
  sinpung: { name: '신풍', grade: 'S', desc: '아군 전체 무력·지력 한 등급 상승(5턴 지속), 동시에 적 전체 사기 20 감소. 전투당 1회', characters: ['jegallyang'] },
  sinhwagye: { name: '신화계(神火計)', grade: 'S', desc: '적 군세 타일에 화염 피해. 이미 혼란/화염 상태면 피해 50% 증가. 전투당 1회', characters: ['juyu', 'yukson'] },
  sipmyeonmaebok: { name: '십면매복', grade: 'S', desc: '적 전체에 20% 즉시 피해 + 행동력 50% 감소(2턴), 동시에 적 2명 무작위 3턴 혼란. 전투당 1회', characters: ['jeongwook'] },
  isagyeollyu: { name: '이사결류', grade: 'S', desc: '적 전체에 20% 즉시 피해, 5턴간 행동력 50% 감소 + 타일이동시 필요 행동력 2배 증가. 전투당 1회', characters: ['gwakga'] },
  gyeonbyeokgeosu: { name: '견벽거수', grade: 'S', desc: '3턴간 아군 전체 받는 데미지 30% 감소, 모든 적 책략 성공률 50% 감소, 3턴간 적이 1타일 이동할 때마다 사기 -1. 전투당 1회', characters: ['samaui'] },
  jeonggunsuseup: { name: '정군수습', grade: 'S', desc: '아군 군세 전원 병력 40% 회복 + 모든 상태이상 해제. 전투당 1회', characters: ['sunyu'] },

  // ---- A급 ----
  palmungeumswaejin: { name: '팔문금쇄진', grade: 'A', desc: '3턴간 타겟 적군세 인접 3칸 영역의 모든 적 군세 무력 한 등급 감소, 책략 성공률 50% 감소. 월 1회', characters: ['seoseo'] },
  yeonhwangye: { name: '연환계', grade: 'A', desc: '3턴간 적 군세 5개를 연환 상태로 연결, 한 명이 받는 피해의 30%를 나머지도 공유. 월 1회', characters: ['bangtong'] },
  igangye: { name: '이간계', grade: 'A', desc: '타겟 적이 인접한 다른 적을 공격하게 함. 인접한 적이 다수면 전부 1회씩 공격(반격도 동일하게 받음). 월 1회', characters: ['gahu'] },
  ildaeilro: { name: '일대일로', grade: 'A', desc: '아군 전체가 1턴간 50% 확률로 상대 공격 회피, 회피 성공시 아군 다음 공격에 1.5배 피해 증가. 월 1회', characters: ['beopjeong'] },
  baesujin: { name: '배수진', grade: 'A', desc: '소속 군세 주는피해 20% 증가·받는피해 10% 증가, 사기가 100 미만일수록 추가 피해 증가(100/현재사기 배율, 100 이상일 땐 너프 없음). 월 1회', characters: ['jingung'] },
  gunsimjangak: { name: '군심장악', grade: 'A', desc: '아군 전체 사기 +40, 혼란·공포·도발 해제, 3턴간 혼란·공포·도발 면역. 월 1회', characters: ['sunwook'] },

  // ---- B급 ----
  heosiljeonhwan: { name: '허실전환', grade: 'B', desc: '적 모든 버프를 제거하고 동일한 종류의 버프를 아군에게 복사', characters: ['jeonpung'] },
  toerobongswae: { name: '퇴로봉쇄', grade: 'B', desc: '2턴 내 적 군세를 제거하면 그 군세 내 장수를 반드시 포박', characters: ['nosuk'] },
  yueonbieo: { name: '유언비어', grade: 'B', desc: '적 전체 사기 10 감소, 사기 50 이하인 적은 혼란 발동', characters: ['goewol'] },
  gongsimgye: { name: '공심계', grade: 'B', desc: '적 전체 사기 10 감소, 사기 20 이하인 적은 퇴각 발동', characters: ['maseok'] },
  gomu: { name: '고무', grade: 'B', desc: '아군 전체 사기 +20', characters: ['biwi'] },
  bangye: { name: '반계', grade: 'B', desc: '다음에 자신에게 사용되는 적 책략을 무효화하고 시전자에게 되돌림', characters: ['jindeung'] },
  banmok: { name: '반목', grade: 'B', desc: '타겟 적이 인접한 다른 적 1명을 공격(반격도 동일하게 받음)', characters: ['gwakdo'] },
  heobo: { name: '허보', grade: 'B', desc: '타겟 적을 퇴각시킴 (전투중 1회 사용)', characters: ['dongso', 'gamtaek'] },
  eungbyeonjin: { name: '응변진', grade: 'B', desc: '병종간 상성 역전(책략 부대가 무조건 상성 우위)', characters: ['jeonpung'] },
  cheolbyeoksuseong: { name: '철벽수성', grade: 'B', desc: '병종 상성 불리 무효화, 아군이 성/요새 타일일 경우 받는피해 -50% 감소', characters: ['mancheong', 'simbae'] },
  byeokryeokgeo: { name: '벽력거', grade: 'B', desc: '병종 궁병 군세에 적용, 사거리 10칸으로 증가, 주는피해 30% 증가, 타겟 타일이 성/요새일 경우 최대 내구력의 10% 피해', characters: ['yuyeop'] },
  ganpa: { name: '간파', grade: 'B', desc: '2턴간 적의 책략을 100% 회피', characters: ['jeosu', 'ubeon', 'yangsu'] },
  gullyangbogeup: { name: '군량보급', grade: 'B', desc: '아군 군세 현재 군량의 50%를 증가시킴', characters: ['jangwan', 'janggwang', 'maryang'] },
  gullyangchadan: { name: '군량차단', grade: 'B', desc: '타겟 적 군세 현재 군량을 30% 감소시킴', characters: ['jongyo', 'heoyu'] },
  uibyeongmojip: { name: '의병모집', grade: 'B', desc: '아군 현재 병력의 20% 회복 + 사기 10 상승', characters: ['jegalgeun', 'jingun', 'noshik'] },
  yaseup: { name: '야습', grade: 'B', desc: '공격 가능 범위가 인접칸에서 인접 5칸으로 증가(병종 무관), 공격시 반격당하지 않음', characters: ['iyu'] },

  // ---- C급 ----
  giseup: { name: '기습', grade: 'C', desc: '전투 시작시 반드시 선제공격, 적 행동력 50% 감소', characters: ['huijijae', 'bonggi', 'seonggongyeong', 'jeongtak', 'gwakga'] },
  yeonnojihwi: { name: '연노지휘', grade: 'C', desc: '병종 궁병 군세에 적용, 다음 궁병 공격이 2회 발동', characters: ['gyun', 'jegalgak', 'yukjeok', 'ichan'] },
  sugong: { name: '수공', grade: 'C', desc: '3턴간 타겟 적 행동력 30% 감소, 타일이동시 필요 행동력 1.5배 증가', characters: ['jangso', 'bojeul', 'banjun', 'yukgae'] },
  hwagong: { name: '화공', grade: 'C', desc: '지정한 적 군세 타일을 화염화', characters: ['jangon', 'nakthong', 'ochan', 'hwahaek', 'juyu', 'yukson'] },
  hollan: { name: '혼란', grade: 'C', desc: '2턴간 타겟 적 혼란 상태', characters: ['wangyun', 'yangsong', 'jingyu', 'wanghae', 'heosa', 'hwanbeom'] },
  dobal: { name: '도발', grade: 'C', desc: '2턴간 타겟 적 도발 상태', characters: ['wangrang', 'yehyeong', 'imak', 'wangru', 'jinbok'] },
  // 공성계(空城計) - 서성에서 사마의를 상대로 성문을 열어두고 거문고를 탄
  // 일화를 반영해 제갈량에게도 배정한다(신풍(S) 보너스 - chaeryakbongswae는
  // 아직 구현 불가라 이걸로 교체).
  heojangseongse: { name: '허장성세', grade: 'C', desc: '2턴간 타겟 적 공포 상태', characters: ['eompo', 'sunsim', 'jangsong', 'gabeom', 'yunjik', 'gachung', 'jegallyang'] },
  maebok: { name: '매복', grade: 'C', desc: '다음 턴 공격에 적 반격 없음', characters: ['goeryang', 'busun', 'nugyu', 'sinpyeong', 'isuk', 'jeonju', 'jeongwook'] },
  gyeongryeo: { name: '격려', grade: 'C', desc: '아군 1명의 주는 데미지 10% 증가 + 사기 15 상승, 2턴', characters: ['ijeok', 'ganong', 'songgeon', 'michuk', 'dongyun', 'goong', 'deungyun', 'jobi'] },
  gyeonsu: { name: '견수', grade: 'C', desc: '아군 1명의 방어력 35% 증가, 2턴', characters: ['donghwa', 'dugi', 'yubok', 'goyu', 'wangryeon', 'yangui', 'samaui'] },
  chaeryakbongswae: { name: '책략봉쇄', grade: 'C', desc: '적 책사 1명이 2턴간 책략 사용 불가', characters: ['mogae', 'choeyeom', 'hwaheum', 'sinbi', 'jangje_wi', 'jingyo'] },
  wibo: { name: '위보', grade: 'C', desc: '적 1명의 공격력·지력 15% 감소, 3턴', characters: ['yeomsang', 'yanghong', 'paengyang', 'yupa', 'wonhwan', 'jubi'] },
  chiryo: { name: '치료', grade: 'C', desc: '아군 현재 병력 10% 회복', characters: ['yeoye', 'eomjun', 'dumi', 'jangye', 'wangryeol', 'sunyu'] },
  seondong: { name: '선동', grade: 'C', desc: '적 병력 일부 감소, 사기 -10 감소', characters: ['jinrim', 'chaeong', 'heoso', 'yangbu', 'sasonseo'] },
  jilju: { name: '질주', grade: 'C', desc: '아군 1명의 행동 게이지(행동력) 50% 증가', characters: ['deungji', 'jinjin', 'jongye', 'hansung'] },

  // ---- D급 ----
  gyeongmun: { name: '격문', grade: 'D', desc: '적 전체 사기 -5', characters: ['chojoo', 'geukjeong', 'naemin', 'yunmuk', 'bisi', 'heojeong', 'wangchan', 'eombaekho', 'heogong', 'jangmak'] },
  eungwon: { name: '응원', grade: 'D', desc: '아군 1명 사기 +10', characters: ['gwakyuji', 'beongeon', 'ibok', 'hajong', 'maenggwang', 'samarang', 'jangbeom', 'yuyo', 'wanggwang', 'dogyeom'] },
  eunggeupcheochi: { name: '응급처치', grade: 'D', desc: '아군 현재 병력 5% 회복', characters: ['janggi', 'onhoe', 'joeom', 'dooseop', 'wigi', 'jeonghon'] },
};

const STRATEGY_GRADE_ORDER = ['S', 'A', 'B', 'C', 'D'];

// 해당 인물이 보유한 책략 id 목록 (여러 개일 수 있다 - 예: 정욱은 십면매복(S)과
// 매복(C) 둘 다 등재돼 있다). 등급이 높은 순으로 정렬해서 돌려준다.
function strategiesFor(characterId) {
  const found = Object.keys(STRATEGIES).filter((sid) => STRATEGIES[sid].characters.includes(characterId));
  return found.sort((a, b) => STRATEGY_GRADE_ORDER.indexOf(STRATEGIES[a].grade) - STRATEGY_GRADE_ORDER.indexOf(STRATEGIES[b].grade));
}
