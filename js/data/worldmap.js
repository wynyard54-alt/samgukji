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
  yueon: '#633487',        // 유언 (보라)
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
  gongyung: '#c4a4f2',
  yuyo: '#f2e9d5',
  sunce: '#b23a2e',
  sunquan: '#b23a2e',
  yujang: '#633487',
  jangje: '#454545',
  jangsu: '#454545',
  neutral: '#8a8478',      // 기타/미상 (짙은 회색)
};

const WORLDMAP_FACTION_NAMES = {
  dongtak: '동탁', wonso: '원소', wonsul: '원술', gongsonchan: '공손찬', jojo: '조조',
  songgyeon: '손견', yupyo: '유표', yueon: '유언', seoryang: '마등·한수', yubi: '유비',
  dogyeom: '도겸', hwangeonjeok: '황건적', jangno: '장로', sasup: '사섭', yuwu: '유우',
  gongyung: '공융', yuyo: '유요', sunce: '손책', sunquan: '손권', yujang: '유장',
  jangje: '장제', jangsu: '장수',
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
  { id: 'bukpyeong', name: '북평', type: 'city', faction: 'hanna', x: 79.4, y: 9.2, troops: 1950, defCur: 2100, defMax: 2900, rice: 2900 },
  { id: 'jinyang', name: '진양', type: 'city', faction: 'hanna', x: 63.5, y: 17.5, troops: 2400, defCur: 3400, defMax: 4800, rice: 4600 },
  { id: 'gye', name: '계', type: 'city', faction: 'hanna', x: 72.5, y: 12, troops: 2750, defCur: 4400, defMax: 4900, rice: 4900 },
  { id: 'takhyeontown', name: '탁현', type: 'fort', faction: 'hanna', x: 76.0, y: 9.2, troops: 1250, defCur: 1700, defMax: 2300, rice: 5300 },
  { id: 'takhyeon', name: '서평', type: 'fort', faction: 'hanna', x: 26.2, y: 17.5, troops: 550, defCur: 1000, defMax: 1400, rice: 1400 },
  { id: 'jungsan', name: '중산', type: 'fort', faction: 'hanna', x: 69.4, y: 12.9, troops: 1300, defCur: 1600, defMax: 2400, rice: 5000 },
  { id: 'muwi', name: '무위', type: 'fort', faction: 'hanna', x: 28.3, y: 8.7, troops: 600, defCur: 800, defMax: 1200, rice: 1400 },
  { id: 'jangan', name: '장안', type: 'city', faction: 'hanna', x: 45.6, y: 35.9, troops: 4300, defCur: 6500, defMax: 8100, rice: 10900 },
  { id: 'geumseong', name: '금성', type: 'city', faction: 'hanna', x: 32.8, y: 20.3, troops: 1900, defCur: 1900, defMax: 2800, rice: 2700 },
  { id: 'anjeong', name: '안정', type: 'city', faction: 'hanna', x: 44.2, y: 26.7, troops: 1550, defCur: 1800, defMax: 3100, rice: 2700 },
  { id: 'hamgokgwan', name: '함곡관', type: 'fort', faction: 'hanna', x: 51.8, y: 35, troops: 900, defCur: 900, defMax: 1600, rice: 2800 },
  { id: 'nampi', name: '남피', type: 'city', faction: 'hanna', x: 71.8, y: 22.1, troops: 3150, defCur: 3200, defMax: 5800, rice: 7900 },
  { id: 'georok', name: '거록', type: 'fort', faction: 'hanna', x: 66.6, y: 23, troops: 1200, defCur: 2500, defMax: 2800, rice: 4700 },
  { id: 'hogwan', name: '호로관', type: 'fort', faction: 'hanna', x: 56.6, y: 35, troops: 850, defCur: 1700, defMax: 1900, rice: 3200 },
  { id: 'sangdang', name: '상당', type: 'fort', faction: 'hanna', x: 60.8, y: 25.8, troops: 1100, defCur: 2100, defMax: 2700, rice: 5500 },
  { id: 'pyeongwon2', name: '평원', type: 'city', faction: 'hanna', x: 69.8, y: 26.2, troops: 3550, defCur: 4200, defMax: 6200, rice: 7600 },
  { id: 'bukhae', name: '북해', type: 'city', faction: 'hanna', x: 77.3, y: 27.6, troops: 3600, defCur: 4400, defMax: 6400, rice: 7400 },
  { id: 'eop', name: '업', type: 'city', faction: 'hanna', x: 66.3, y: 28.5, troops: 4000, defCur: 7100, defMax: 8300, rice: 12100 },
  { id: 'cheonsu', name: '천수', type: 'city', faction: 'hanna', x: 35.9, y: 27.6, troops: 1850, defCur: 2400, defMax: 2900, rice: 3400 },
  { id: 'hanae', name: '하내', type: 'fort', faction: 'hanna', x: 60.1, y: 31.8, troops: 1600, defCur: 2500, defMax: 2900, rice: 7600 },
  { id: 'baengma', name: '백마', type: 'fort', faction: 'hanna', x: 66.3, y: 32.2, troops: 1650, defCur: 2100, defMax: 3000, rice: 8300 },
  { id: 'habi', name: '하비', type: 'city', faction: 'hanna', x: 73.2, y: 37.8, troops: 3300, defCur: 3800, defMax: 5200, rice: 7800 },
  { id: 'sopae', name: '소패', type: 'fort', faction: 'hanna', x: 69.8, y: 35.5, troops: 1550, defCur: 2900, defMax: 3300, rice: 8200 },
  { id: 'jinchang', name: '진류', type: 'fort', faction: 'hanna', x: 62.8, y: 35, troops: 2250, defCur: 2600, defMax: 4400, rice: 13100 },
  { id: 'nangya', name: '낭야', type: 'fort', faction: 'hanna', x: 76.7, y: 35, troops: 1650, defCur: 2700, defMax: 3200, rice: 8000 },
  { id: 'nakyang', name: '낙양', type: 'city', faction: 'hanna', x: 54.2, y: 34.5, troops: 4150, defCur: 4800, defMax: 7200, rice: 12200 },
  { id: 'mudo', name: '무도', type: 'city', faction: 'hanna', x: 35.9, y: 36.4, troops: 2300, defCur: 3800, defMax: 4600, rice: 4900 },
  { id: 'heochang', name: '허창', type: 'city', faction: 'hanna', x: 61.1, y: 38.2, troops: 4100, defCur: 6500, defMax: 8500, rice: 12200 },
  { id: 'cho', name: '초', type: 'fort', faction: 'hanna', x: 65.3, y: 37.3, troops: 1600, defCur: 2900, defMax: 3400, rice: 7300 },
  { id: 'yeonam', name: '여남', type: 'city', faction: 'hanna', x: 64.9, y: 42.4, troops: 3750, defCur: 7100, defMax: 8200, rice: 11800 },
  { id: 'sangyong', name: '상용', type: 'fort', faction: 'hanna', x: 49.4, y: 45.1, troops: 1350, defCur: 1800, defMax: 2400, rice: 4900 },
  { id: 'gwangneung', name: '광릉', type: 'fort', faction: 'hanna', x: 77, y: 42.8, troops: 1700, defCur: 2500, defMax: 2900, rice: 8000 },
  { id: 'sujun', name: '수춘', type: 'city', faction: 'hanna', x: 69.6, y: 42.4, troops: 4500, defCur: 5200, defMax: 6800, rice: 11400 },
  { id: 'wan', name: '완', type: 'city', faction: 'hanna', x: 56.3, y: 40.5, troops: 4300, defCur: 5000, defMax: 7200, rice: 12700 },
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
  { id: 'bogyang', name: '복양', type: 'city', faction: 'hanna', x: 69.1, y: 30.4, troops: 3350, defCur: 4200, defMax: 5700, rice: 8300 },
];

// 챕터 1의 기존 황건적 거점. 이후 사건에서 바뀐 곳만 덮어쓴다.
const WORLDMAP_YELLOW_TURBAN = {
  gye:'hwangeonjeok', nampi:'hwangeonjeok', georok:'hwangeonjeok', pyeongwon2:'hwangeonjeok',
  eop:'hwangeonjeok', baengma:'hwangeonjeok', jinchang:'hwangeonjeok', heochang:'hwangeonjeok',
  wan:'hwangeonjeok', bogyang:'hwangeonjeok',
};
const WORLDMAP_YOU_ZHOU = { gye:'yuwu', takhyeontown:'yuwu', bukpyeong:'gongsonchan' };
const WORLDMAP_WEST = { muwi:'seoryang', geumseong:'seoryang', takhyeon:'seoryang' };
const WORLDMAP_YI_ZHOU = ['jadong', 'myeonjukgwan', 'seongdo', 'gangju', 'yeongan'];
const WORLDMAP_XU_ZHOU = ['habi', 'sopae', 'nangya', 'gwangneung'];
const WORLDMAP_JING_ZHOU = {
  yangyang:'yupyo', sinya:'yupyo', ganghwa:'yupyo', gangneung:'yupyo', jeokbyeok:'yupyo',
  iryeong:'yupyo', jangsa:'yupyo', mureung:'yupyo', yeongneung:'yupyo', gyeyang:'yupyo',
};
const WORLDMAP_COALITION = {
  ...WORLDMAP_YOU_ZHOU, ...WORLDMAP_WEST, ...WORLDMAP_JING_ZHOU,
  nampi:'wonso', jungsan:'hanbok', georok:'hanbok', eop:'hanbok', bukhae:'gongyung',
  pyeongwon2:'yubi', wan:'wonsul', gyoji:'sasup',
  jangan:'dongtak', hamgokgwan:'dongtak', nakyang:'dongtak', hogwan:'dongtak',
};
const WORLDMAP_CHAPTER_TWO = {
  ...WORLDMAP_WEST, ...WORLDMAP_JING_ZHOU,
  gye:'gongsonchan', takhyeontown:'gongsonchan', bukpyeong:'gongsonchan',
  nampi:'wonso', jungsan:'wonso', georok:'wonso', eop:'wonso', bukhae:'gongyung',
  pyeongwon2:'yubi', hanae:'yeopo', jinchang:'jojo', baengma:'jojo', bogyang:'jojo',
  jangan:'ijgwak', hamgokgwan:'ijgwak', sujun:'wonsul', wan:'yupyo',
  hanjung:'jangno', yangpyeonggwan:'jangno', geoneop:'yuyo', gyoji:'sasup',
};

function worldMapTimeline(stage, mapId, flags) {
  const factions = {};
  const labels = {};
  const notes = {};
  let flag;

  if (stage === 'changan' || stage === 'changan_departed') {
    Object.assign(factions, WORLDMAP_COALITION);
    factions.hogwan = 'hanna';
    factions.jangan = flags.changanAlarm ? 'ijgwak' : flags.changanOrdersReady ? 'hanna' : 'dongtak';
    if (flags.changanAlarm) notes.jangan = '이각·곽사군 진입';
    if (stage === 'changan_departed') notes.jangan = '동문으로 철수 · 무관 방면';
    return { factions, labels, notes, flag:'jangan' };
  }

  if (stage === 'hanae' || stage === 'hanae_departed') {
    Object.assign(factions, WORLDMAP_COALITION, { jangan:'ijgwak', hamgokgwan:'ijgwak', hanae:'hanna' });
    notes.hanae = '장양의 거점 · 여포군 의탁';
    if (stage === 'hanae_departed') notes.bogyang = '여포군이 장막의 전갈을 받고 출발';
    return { factions, labels, notes, flag:stage === 'hanae_departed' ? 'bogyang' : 'hanae' };
  }

  const chapterTwo = ['seoju_free', 'habi_camp', 'sopae_free', 'sopae_finale', 'heodo_departure'].includes(stage)
    || (stage === 'warmap' && ['hoenam', 'hoesu'].includes(mapId));
  if (!chapterTwo) {
    Object.assign(factions, WORLDMAP_YELLOW_TURBAN);
    if (stage === 'takhyeon_free') {
      flag = 'takhyeontown';
      notes.georok = '황건 봉기';
      notes.eop = '황건 봉기';
    } else if (stage === 'pyeongwon_free') {
      Object.assign(factions, WORLDMAP_YOU_ZHOU, WORLDMAP_WEST);
      flag = 'gye';
      notes.gye = '어양 방면';
      if (flags.pyeongwonGranted) factions.pyeongwon2 = 'yubi';
    } else if (['camp', 'sasugwan', 'warmap', 'hogwan_epilogue'].includes(stage)) {
      Object.assign(factions, WORLDMAP_COALITION);
      for (const id of WORLDMAP_XU_ZHOU) factions[id] = 'dogyeom';
      for (const id of WORLDMAP_YI_ZHOU) factions[id] = 'yueon';
      flag = 'hogwan';
      if (stage === 'sasugwan') notes.hogwan = '사수관 방면';
      if (stage === 'hogwan_epilogue') {
        factions.hogwan = 'hanna';
        notes.hogwan = '여포 퇴각';
      }
    }
    return { factions, labels, notes, flag };
  }

  Object.assign(factions, WORLDMAP_CHAPTER_TWO);
  flag = 'habi';
  for (const id of WORLDMAP_YI_ZHOU) factions[id] = flags.dogyeomDied ? 'yujang' : 'yueon';
  for (const id of WORLDMAP_XU_ZHOU) factions[id] = flags.dogyeomDied ? 'yubi' : 'dogyeom';

  const inHabiOrLater = stage !== 'seoju_free';
  if (inHabiOrLater) {
    factions.yeogang = 'wonsul';
  } else if (mapId === 'seoju') {
    factions.bogyang = 'yeopo';
    notes.bogyang = '여포의 연주 습격';
  }
  if (flags.dogyeomDied) factions.pyeongwon2 = 'hanna';

  if (flags.habiStep >= 1 || ['hoenam', 'hoesu', 'sopae'].includes(mapId)) {
    factions.sopae = 'yeopo';
    notes.sopae = '여포 주둔';
  }
  if (flags.habiStep >= 2 || ['hoenam', 'hoesu', 'sopae'].includes(mapId)) {
    factions.heochang = 'jojo';
    factions.bukhae = 'wonso';
    notes.bukhae = '원담이 북해를 차지함';
    labels.heochang = '허도';
    factions.wan = mapId === 'habi' ? 'jangje' : 'jangsu';
    factions.geoneop = 'sunce';
    factions.o = 'sunce';
  }
  if (mapId === 'hoenam') flag = 'sujun';
  if (flags.wonsulRetreated || ['hoesu', 'sopae'].includes(mapId)) {
    factions.habi = 'yeopo';
    factions.nangya = 'hanna';
    factions.gwangneung = 'hanna';
    notes.nangya = notes.gwangneung = '서주 일대 · 여포 영향권';
  }
  if (mapId === 'hoesu') {
    flag = 'gwangneung';
    notes.gwangneung = '회수평야 · 광릉 방면';
  }
  if (mapId === 'sopae') flag = 'sopae';
  if (mapId === 'sopae' || flags.sopaeGranted) {
    factions.sopae = 'yubi';
    notes.sopae = flags.sopaeBesieged ? '여포군 포위' : '유비 주둔';
  }
  if (flags.sopaeInvasionResolved) factions.hoegye = 'sunce';
  if (stage === 'heodo_departure') {
    factions.sopae = 'yeopo';
    notes.sopae = '여포군 점령';
    notes.heochang = '허도로 향하는 중';
    flag = 'heochang';
  }
  return { factions, labels, notes, flag };
}
