// ---------------- 대지도(하단메뉴 "지도") 데이터 ----------------
// 좌표는 assets/illust/worldmap.jpg 위의 상대 위치(가로/세로 %)다. 사용자가
// 엑셀 시트(Sheet2_좌표수정)에서 직접 x_px/y_px를 고쳐서 돌려준 값을 그대로
// 반영한 것이다.

const WORLDMAP_FACTION_COLORS = {
  dongtak: '#2b2b2b',      // 동탁 (검정)
  wonso: '#e8c93a',        // 원소 (노랑)
  wonsul: '#e0679b',       // 원술 (핑크)
  gongsonchan: '#d97b29',  // 공손찬 (주황)
  jojo: '#2f5fa8',         // 조조 (파랑)
  songgyeon: '#b23a2e',    // 손견 (빨강)
  yupyo: '#4fa8c9',        // 유표 (하늘색)
  yueon: '#7a3fa0',        // 유언 (보라)
  seoryang: '#8a5a2b',     // 마등·한수 서량 (갈색)
  yubi: '#2f8f4e',         // 유비 (초록)
  dogyeom: '#a3c93a',      // 도겸 (연두)
  hwangeonjeok: '#ffe600', // 황건적 (밝은 노랑)
  jangno: '#2a9d8f',       // 장로 (청록)
  sasup: '#d8c9a3',        // 사섭 (베이지)
  yuwu: '#ff2d95',         // 유우 (핫핑크)
  hanbok: '#5a3a1a',       // 한복 (짙은 갈색)
  yeopo: '#9c2b2b',        // 여포 (적갈색)
  ijgwak: '#4a4a63',       // 이각·곽사(장안 조정) (남회색)
  hanna: '#ffffff',        // 한나라(세력 미정 지역) (하양)
  neutral: '#8a8478',      // 기타/미상 (짙은 회색)
};

const WORLDMAP_FACTION_NAMES = {
  dongtak: '동탁', wonso: '원소', wonsul: '원술', gongsonchan: '공손찬', jojo: '조조',
  songgyeon: '손견', yupyo: '유표', yueon: '유언', seoryang: '마등·한수', yubi: '유비',
  dogyeom: '도겸', hwangeonjeok: '황건적', jangno: '장로', sasup: '사섭', yuwu: '유우',
  hanbok: '한복', yeopo: '여포', ijgwak: '이각·곽사', hanna: '한나라', neutral: '미상',
};

// [병력]/[농업량] 보기 모드에서 값 구간별로 쓰는 색상(연한 -> 진한). 마지막
// 구간을 넘으면 마지막(가장 진한) 색을 쓴다.
const WORLDMAP_TROOPS_THRESHOLDS = [500, 1000, 5000, 10000, 30000, 50000, 100000];
const WORLDMAP_TROOPS_COLORS = [
  '#fdeceb', '#fac9c5', '#f5a29c', '#ee7972', '#e04f47', '#c62f28', '#a11e19', '#7a1410',
];

const WORLDMAP_RICE_THRESHOLDS = [1000, 2000, 3000, 5000, 7000, 10000, 12000];
const WORLDMAP_RICE_COLORS = [
  '#eef7ea', '#d7edc9', '#b9e0a0', '#96d073', '#6ebd49', '#4a9f2e', '#337a1e', '#1f5511',
];

function worldmapTierColor(value, thresholds, colors) {
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return colors[i];
  }
  return colors[colors.length - 1];
}

// type: 'city'(2중네모, 성) | 'fort'(네모, 요새/관문) | 'port'(세모, 항구)
const WORLDMAP_LOCATIONS = [
  { id: 'bukpyeong', name: '북평', type: 'city', faction: 'gongsonchan', x: 79.4, y: 9.2, troops: 1950, defCur: 2100, defMax: 2900, rice: 2900 },
  { id: 'jinyang', name: '진양', type: 'city', faction: 'hanna', x: 63.5, y: 17.5, troops: 2400, defCur: 3400, defMax: 4800, rice: 4600 },
  { id: 'gye', name: '계', type: 'city', faction: 'hwangeonjeok', x: 72.5, y: 12, troops: 2750, defCur: 4400, defMax: 4900, rice: 4900 },
  { id: 'takhyeontown', name: '탁현', type: 'fort', faction: 'hanna', x: 76.0, y: 9.2, troops: 1250, defCur: 1700, defMax: 2300, rice: 5300 },
  { id: 'takhyeon', name: '서평', type: 'fort', faction: 'seoryang', x: 26.2, y: 17.5, troops: 550, defCur: 1000, defMax: 1400, rice: 1400 },
  { id: 'jungsan', name: '중산', type: 'fort', faction: 'hanna', x: 69.4, y: 12.9, troops: 1300, defCur: 1600, defMax: 2400, rice: 5000 },
  { id: 'muwi', name: '무위', type: 'fort', faction: 'seoryang', x: 28.3, y: 8.7, troops: 600, defCur: 800, defMax: 1200, rice: 1400 },
  { id: 'jangan', name: '장안', type: 'city', faction: 'hanna', x: 45.6, y: 35.9, troops: 4300, defCur: 6500, defMax: 8100, rice: 10900 },
  { id: 'geumseong', name: '금성', type: 'city', faction: 'seoryang', x: 32.8, y: 20.3, troops: 1900, defCur: 1900, defMax: 2800, rice: 2700 },
  { id: 'anjeong', name: '안정', type: 'city', faction: 'dongtak', x: 44.2, y: 26.7, troops: 1550, defCur: 1800, defMax: 3100, rice: 2700 },
  { id: 'hamgokgwan', name: '함곡관', type: 'fort', faction: 'hanna', x: 51.8, y: 35, troops: 900, defCur: 900, defMax: 1600, rice: 2800 },
  { id: 'nampi', name: '남피', type: 'city', faction: 'hwangeonjeok', x: 71.8, y: 22.1, troops: 3150, defCur: 3200, defMax: 5800, rice: 7900 },
  { id: 'georok', name: '거록', type: 'fort', faction: 'hwangeonjeok', x: 66.6, y: 23, troops: 1200, defCur: 2500, defMax: 2800, rice: 4700 },
  { id: 'hogwan', name: '호로관', type: 'fort', faction: 'hanna', x: 56.6, y: 35, troops: 850, defCur: 1700, defMax: 1900, rice: 3200 },
  { id: 'sangdang', name: '상당', type: 'fort', faction: 'hanna', x: 60.8, y: 25.8, troops: 1100, defCur: 2100, defMax: 2700, rice: 5500 },
  { id: 'pyeongwon2', name: '평원', type: 'city', faction: 'hwangeonjeok', x: 69.8, y: 26.2, troops: 3550, defCur: 4200, defMax: 6200, rice: 7600 },
  { id: 'bukhae', name: '북해', type: 'city', faction: 'hanna', x: 77.3, y: 27.6, troops: 3600, defCur: 4400, defMax: 6400, rice: 7400 },
  { id: 'eop', name: '업', type: 'city', faction: 'hwangeonjeok', x: 66.3, y: 28.5, troops: 4000, defCur: 7100, defMax: 8300, rice: 12100 },
  { id: 'cheonsu', name: '천수', type: 'city', faction: 'dongtak', x: 35.9, y: 27.6, troops: 1850, defCur: 2400, defMax: 2900, rice: 3400 },
  { id: 'hanae', name: '하내', type: 'fort', faction: 'hanna', x: 60.1, y: 31.8, troops: 1600, defCur: 2500, defMax: 2900, rice: 7600 },
  { id: 'baengma', name: '백마', type: 'fort', faction: 'hwangeonjeok', x: 66.3, y: 32.2, troops: 1650, defCur: 2100, defMax: 3000, rice: 8300 },
  { id: 'habi', name: '하비', type: 'city', faction: 'songgyeon', x: 73.2, y: 37.8, troops: 3300, defCur: 3800, defMax: 5200, rice: 7800 },
  { id: 'sopae', name: '소패', type: 'fort', faction: 'hanna', x: 69.8, y: 35.5, troops: 1550, defCur: 2900, defMax: 3300, rice: 8200 },
  { id: 'jinchang', name: '진류', type: 'fort', faction: 'hwangeonjeok', x: 62.8, y: 35, troops: 2250, defCur: 2600, defMax: 4400, rice: 13100 },
  { id: 'nangya', name: '낭야', type: 'fort', faction: 'hanna', x: 76.7, y: 35, troops: 1650, defCur: 2700, defMax: 3200, rice: 8000 },
  { id: 'nakyang', name: '낙양', type: 'city', faction: 'hanna', x: 54.2, y: 34.5, troops: 4150, defCur: 4800, defMax: 7200, rice: 12200 },
  { id: 'mudo', name: '무도', type: 'city', faction: 'hanna', x: 35.9, y: 36.4, troops: 2300, defCur: 3800, defMax: 4600, rice: 4900 },
  { id: 'heochang', name: '허창', type: 'city', faction: 'hwangeonjeok', x: 61.1, y: 38.2, troops: 4100, defCur: 6500, defMax: 8500, rice: 12200 },
  { id: 'cho', name: '초', type: 'fort', faction: 'hanna', x: 65.3, y: 37.3, troops: 1600, defCur: 2900, defMax: 3400, rice: 7300 },
  { id: 'yeonam', name: '여남', type: 'city', faction: 'hanna', x: 64.9, y: 42.4, troops: 3750, defCur: 7100, defMax: 8200, rice: 11800 },
  { id: 'sangyong', name: '상용', type: 'fort', faction: 'hanna', x: 49.4, y: 45.1, troops: 1350, defCur: 1800, defMax: 2400, rice: 4900 },
  { id: 'gwangneung', name: '광릉', type: 'fort', faction: 'hanna', x: 77, y: 42.8, troops: 1700, defCur: 2500, defMax: 2900, rice: 8000 },
  { id: 'sujun', name: '수춘', type: 'city', faction: 'hanna', x: 69.6, y: 42.4, troops: 4500, defCur: 5200, defMax: 6800, rice: 11400 },
  { id: 'wan', name: '완', type: 'city', faction: 'hwangeonjeok', x: 56.3, y: 40.5, troops: 4300, defCur: 5000, defMax: 7200, rice: 12700 },
  { id: 'sinya', name: '신야', type: 'fort', faction: 'hanna', x: 59.7, y: 44.2, troops: 1750, defCur: 2300, defMax: 3200, rice: 7600 },
  { id: 'hanjung', name: '한중', type: 'city', faction: 'hanna', x: 40.4, y: 43.7, troops: 2650, defCur: 3200, defMax: 4100, rice: 4400 },
  { id: 'yangyang', name: '양양', type: 'city', faction: 'hanna', x: 55.6, y: 46, troops: 4550, defCur: 6700, defMax: 8600, rice: 11400 },
  { id: 'ganghwa', name: '강하', type: 'port', faction: 'hanna', x: 64.2, y: 47.9, troops: 1950, defCur: 3000, defMax: 3700, rice: 8400 },
  { id: 'jadong', name: '자동', type: 'city', faction: 'hanna', x: 35.6, y: 51.6, troops: 3000, defCur: 5200, defMax: 6400, rice: 8700 },
  { id: 'yeogang', name: '여강', type: 'city', faction: 'hanna', x: 69.9, y: 49.7, troops: 4550, defCur: 5200, defMax: 7300, rice: 12200 },
  { id: 'geoneop', name: '건업', type: 'city', faction: 'hanna', x: 76.7, y: 47.9, troops: 4400, defCur: 5100, defMax: 7400, rice: 11000 },
  { id: 'yangpyeonggwan', name: '양평관', type: 'fort', faction: 'hanna', x: 37.3, y: 46.0, troops: 650, defCur: 1100, defMax: 1200, rice: 1500 },
  { id: 'yeongan', name: '영안', type: 'fort', faction: 'hanna', x: 45.6, y: 51.6, troops: 1150, defCur: 1800, defMax: 2700, rice: 4900 },
  { id: 'iryeong', name: '이릉', type: 'fort', faction: 'hanna', x: 53.2, y: 52, troops: 1050, defCur: 1400, defMax: 2200, rice: 5200 },
  { id: 'hoegye', name: '회계', type: 'city', faction: 'hanna', x: 82.2, y: 54.3, troops: 3100, defCur: 4400, defMax: 5900, rice: 7600 },
  { id: 'gangneung', name: '강릉', type: 'city', faction: 'hanna', x: 59.4, y: 52.5, troops: 4350, defCur: 4700, defMax: 7000, rice: 12100 },
  { id: 'sisang', name: '시상', type: 'city', faction: 'hanna', x: 69.1, y: 55.7, troops: 2950, defCur: 4300, defMax: 5300, rice: 7300 },
  { id: 'seongdo', name: '성도', type: 'city', faction: 'hanna', x: 31.4, y: 55.7, troops: 4600, defCur: 7000, defMax: 7900, rice: 11400 },
  { id: 'gangju', name: '강주', type: 'city', faction: 'hanna', x: 38, y: 58.9, troops: 3400, defCur: 3700, defMax: 5800, rice: 7400 },
  { id: 'geonan', name: '건안', type: 'city', faction: 'hanna', x: 77.3, y: 63.5, troops: 2900, defCur: 3600, defMax: 5300, rice: 8600 },
  { id: 'mureung', name: '무릉', type: 'fort', faction: 'hanna', x: 51.1, y: 60.3, troops: 1150, defCur: 1800, defMax: 2400, rice: 5100 },
  { id: 'jeokbyeok', name: '적벽', type: 'port', faction: 'hanna', x: 64.2, y: 55.7, troops: 1850, defCur: 2700, defMax: 4000, rice: 8700 },
  { id: 'myeonjukgwan', name: '면죽관', type: 'fort', faction: 'hanna', x: 31.8, y: 46.0, troops: 650, defCur: 900, defMax: 1300, rice: 1400 },
  { id: 'yeongchang', name: '영창', type: 'city', faction: 'hanna', x: 26.9, y: 68.1, troops: 1850, defCur: 1700, defMax: 3000, rice: 3000 },
  { id: 'yeongneung', name: '영릉', type: 'city', faction: 'hanna', x: 53.9, y: 67.2, troops: 2400, defCur: 3400, defMax: 4800, rice: 4900 },
  { id: 'geonnyeong', name: '건녕', type: 'fort', faction: 'hanna', x: 31.4, y: 68.6, troops: 800, defCur: 1300, defMax: 1600, rice: 3300 },
  { id: 'gyeyang', name: '계양', type: 'city', faction: 'hanna', x: 59, y: 69.1, troops: 2250, defCur: 3300, defMax: 4900, rice: 4800 },
  { id: 'jangsa', name: '장사', type: 'port', faction: 'hanna', x: 59.4, y: 59.9, troops: 1550, defCur: 2400, defMax: 2800, rice: 5400 },
  { id: 'namhae', name: '남해', type: 'city', faction: 'hanna', x: 65.6, y: 78.3, troops: 2350, defCur: 3300, defMax: 4000, rice: 4700 },
  { id: 'gyoji', name: '교지', type: 'city', faction: 'hanna', x: 46.3, y: 87.5, troops: 1850, defCur: 2000, defMax: 2800, rice: 3200 },
  { id: 'o', name: '오', type: 'city', faction: 'hanna', x: 83.2, y: 48.8, troops: 4750, defCur: 4100, defMax: 7300, rice: 11800 },
  { id: 'bogyang', name: '복양', type: 'city', faction: 'hwangeonjeok', x: 69.1, y: 30.4, troops: 3350, defCur: 4200, defMax: 5700, rice: 8300 },
];

// 씬(진행 단계)별로 지도 색이 달라지는 곳만 여기 덮어쓴다. 목록에 없는 곳은
// 위 WORLDMAP_LOCATIONS의 faction(챕터1 탁현/어양 시점 기준)을 그대로 쓴다.
// camp(반동탁연합 진영)와 warmap(호로관 전선)은 같은 시점이라 표를 공유한다.
const WORLDMAP_SCENE_FACTIONS_CAMP = {
  cheonsu: 'dongtak', anjeong: 'dongtak', jangan: 'dongtak', hamgokgwan: 'dongtak',
  nakyang: 'dongtak', hogwan: 'dongtak',
  yangyang: 'yupyo',
  muwi: 'seoryang', takhyeon: 'seoryang', geumseong: 'seoryang',
  hanjung: 'jangno',
  jadong: 'yueon', seongdo: 'yueon', gangju: 'yueon',
  gyoji: 'sasup',
  gangneung: 'songgyeon',
  wan: 'wonsul',
  pyeongwon2: 'yubi',
  gye: 'yuwu',
  nampi: 'wonso',
  bukpyeong: 'gongsonchan',
  eop: 'hanbok',
  jinchang: 'jojo',
  habi: 'dogyeom', sopae: 'dogyeom', nangya: 'dogyeom',
};

// 챕터2(194년 3월, 군웅할거 시점) 세력도. 삼국지10 194년 시나리오 참고 +
// 연의/사서 기준으로 정리했다. 동탁은 192년에 죽고 이각·곽사가 장안 조정을
// 장악한 상태(ijgwak)이고, 여포는 아직 자기 세력이 없이 장양에게 몸을 의탁해
// 하내에 머무는 시점(하내=여포로 표시, 장료도 이 시점 여포 밑에 있다).
// 유우는 193년에 공손찬에게 죽어 유주가 공손찬 손에 넘어갔고, 손견도 191년에
// 죽어 남양은 원술이 아닌 유표 쪽으로 넘어간 상태다. 확신이 서지 않는 변방
// 소도시는 굳이 덮어쓰지 않고 기존 hanna(세력 미정)로 남겨둔다.
const WORLDMAP_SCENE_FACTIONS_CH2 = {
  // 사예/관중 (이각·곽사가 헌제를 낀 장안 조정을 장악)
  jangan: 'ijgwak', hamgokgwan: 'ijgwak', nakyang: 'ijgwak', hogwan: 'ijgwak',
  // 유주 (공손찬, 유우를 죽이고 병합)
  gye: 'gongsonchan', takhyeontown: 'gongsonchan',
  // 기주 (원소)
  nampi: 'wonso', georok: 'wonso', jungsan: 'wonso', eop: 'wonso',
  // 평원 (유비, 공손찬 휘하 평원상)
  pyeongwon2: 'yubi',
  // 하내 (여포, 장양에게 의탁 중 - 아직 독립 세력 아님)
  hanae: 'yeopo',
  // 연주 (조조)
  jinchang: 'jojo', baengma: 'jojo', bogyang: 'jojo',
  // 양주/서량 (마등·한수)
  muwi: 'seoryang', takhyeon: 'seoryang', geumseong: 'seoryang', anjeong: 'seoryang', cheonsu: 'seoryang',
  // 서주 (도겸)
  habi: 'dogyeom', sopae: 'dogyeom', nangya: 'dogyeom', gwangneung: 'dogyeom',
  // 회남 (원술, 남양에서 밀려나 수춘으로 근거지를 옮긴 상태)
  sujun: 'wonsul', yeogang: 'wonsul',
  // 형주 (유표, 원술 퇴각 이후 남양까지 8군을 통합)
  yangyang: 'yupyo', wan: 'yupyo', ganghwa: 'yupyo', jangsa: 'yupyo',
  gangneung: 'yupyo', yeongneung: 'yupyo', gyeyang: 'yupyo', mureung: 'yupyo', iryeong: 'yupyo',
  // 익주 (유언)
  yangpyeonggwan: 'yueon', myeonjukgwan: 'yueon', jadong: 'yueon', seongdo: 'yueon', gangju: 'yueon', yeongan: 'yueon',
  // 한중 (장로)
  hanjung: 'jangno',
  // 교주 (사섭)
  gyoji: 'sasup',
  // 시대 특성상 194년엔 이미 진압된 황건적 표기라 세력 미정으로 되돌림
  heochang: 'hanna',
};

const WORLDMAP_SCENE_FACTIONS = {
  camp: WORLDMAP_SCENE_FACTIONS_CAMP,
  warmap: WORLDMAP_SCENE_FACTIONS_CAMP,
  hoenam: WORLDMAP_SCENE_FACTIONS_CH2,
  seoju_free: WORLDMAP_SCENE_FACTIONS_CH2,
  habi_camp: WORLDMAP_SCENE_FACTIONS_CH2,
};

// 씬별로 "지금 여기" 깃발을 표시할 위치.
const WORLDMAP_SCENE_FLAG = {
  takhyeon_free: 'takhyeontown',
  pyeongwon_free: 'gye',
  camp: 'hogwan',
  warmap: 'hogwan',
  hoenam: 'sujun',
  seoju_free: 'habi',
  habi_camp: 'habi',
};
