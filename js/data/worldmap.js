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
  hanna: '#ffffff',        // 한나라(세력 미정 지역) (하양)
  neutral: '#8a8478',      // 기타/미상 (짙은 회색)
};

// type: 'city'(2중네모, 성) | 'fort'(네모, 요새/관문) | 'port'(세모, 항구)
const WORLDMAP_LOCATIONS = [
  { id: 'bukpyeong', name: '북평', type: 'city', faction: 'gongsonchan', x: 79.4, y: 9.2 },
  { id: 'jinyang', name: '진양', type: 'city', faction: 'hanna', x: 63.5, y: 17.5 },
  { id: 'gye', name: '계', type: 'city', faction: 'hwangeonjeok', x: 72.5, y: 12 },
  { id: 'takhyeontown', name: '탁현', type: 'fort', faction: 'hanna', x: 76.0, y: 9.2 },
  { id: 'takhyeon', name: '서평', type: 'fort', faction: 'seoryang', x: 26.2, y: 17.5 },
  { id: 'jungsan', name: '중산', type: 'fort', faction: 'hanna', x: 69.4, y: 12.9 },
  { id: 'muwi', name: '무위', type: 'fort', faction: 'seoryang', x: 28.3, y: 8.7 },
  { id: 'jangan', name: '장안', type: 'city', faction: 'hanna', x: 45.6, y: 35.9 },
  { id: 'geumseong', name: '금성', type: 'city', faction: 'seoryang', x: 32.8, y: 20.3 },
  { id: 'anjeong', name: '안정', type: 'city', faction: 'dongtak', x: 44.2, y: 26.7 },
  { id: 'hamgokgwan', name: '함곡관', type: 'fort', faction: 'hanna', x: 51.8, y: 35 },
  { id: 'nampi', name: '남피', type: 'city', faction: 'hwangeonjeok', x: 71.8, y: 22.1 },
  { id: 'georok', name: '거록', type: 'fort', faction: 'hwangeonjeok', x: 66.6, y: 23 },
  { id: 'hogwan', name: '호로관', type: 'fort', faction: 'hanna', x: 56.6, y: 35 },
  { id: 'sangdang', name: '상당', type: 'fort', faction: 'hanna', x: 60.8, y: 25.8 },
  { id: 'pyeongwon2', name: '평원', type: 'city', faction: 'hwangeonjeok', x: 69.8, y: 26.2 },
  { id: 'bukhae', name: '북해', type: 'city', faction: 'hanna', x: 77.3, y: 27.6 },
  { id: 'eop', name: '업', type: 'city', faction: 'hwangeonjeok', x: 66.3, y: 28.5 },
  { id: 'cheonsu', name: '천수', type: 'city', faction: 'dongtak', x: 35.9, y: 27.6 },
  { id: 'hanae', name: '하내', type: 'fort', faction: 'hanna', x: 60.1, y: 31.8 },
  { id: 'baengma', name: '백마', type: 'fort', faction: 'hwangeonjeok', x: 66.3, y: 32.2 },
  { id: 'habi', name: '하비', type: 'city', faction: 'songgyeon', x: 73.2, y: 37.8 },
  { id: 'sopae', name: '소패', type: 'fort', faction: 'hanna', x: 69.8, y: 35.5 },
  { id: 'jinchang', name: '진류', type: 'fort', faction: 'hwangeonjeok', x: 62.8, y: 35 },
  { id: 'nangya', name: '낭야', type: 'fort', faction: 'hanna', x: 76.7, y: 35 },
  { id: 'nakyang', name: '낙양', type: 'city', faction: 'hanna', x: 54.2, y: 34.5 },
  { id: 'mudo', name: '무도', type: 'city', faction: 'hanna', x: 35.9, y: 36.4 },
  { id: 'heochang', name: '허창', type: 'city', faction: 'hwangeonjeok', x: 61.1, y: 38.2 },
  { id: 'cho', name: '초', type: 'fort', faction: 'hanna', x: 65.3, y: 37.3 },
  { id: 'yeonam', name: '여남', type: 'city', faction: 'hanna', x: 64.9, y: 42.4 },
  { id: 'sangyong', name: '상용', type: 'fort', faction: 'hanna', x: 49.4, y: 45.1 },
  { id: 'gwangneung', name: '광릉', type: 'fort', faction: 'hanna', x: 77, y: 42.8 },
  { id: 'sujun', name: '수춘', type: 'city', faction: 'hanna', x: 69.6, y: 42.4 },
  { id: 'wan', name: '완', type: 'city', faction: 'hwangeonjeok', x: 56.3, y: 40.5 },
  { id: 'sinya', name: '신야', type: 'fort', faction: 'hanna', x: 59.7, y: 44.2 },
  { id: 'hanjung', name: '한중', type: 'city', faction: 'hanna', x: 40.4, y: 43.7 },
  { id: 'yangyang', name: '양양', type: 'city', faction: 'hanna', x: 55.6, y: 46 },
  { id: 'ganghwa', name: '강하', type: 'port', faction: 'hanna', x: 64.2, y: 47.9 },
  { id: 'jadong', name: '자동', type: 'city', faction: 'hanna', x: 35.6, y: 51.6 },
  { id: 'yeogang', name: '여강', type: 'city', faction: 'hanna', x: 69.9, y: 49.7 },
  { id: 'geoneop', name: '건업', type: 'city', faction: 'hanna', x: 76.7, y: 47.9 },
  { id: 'yangpyeonggwan', name: '양평관', type: 'fort', faction: 'hanna', x: 37.3, y: 46.0 },
  { id: 'yeongan', name: '영안', type: 'fort', faction: 'hanna', x: 45.6, y: 51.6 },
  { id: 'iryeong', name: '이릉', type: 'fort', faction: 'hanna', x: 53.2, y: 52 },
  { id: 'hoegye', name: '회계', type: 'city', faction: 'hanna', x: 82.2, y: 54.3 },
  { id: 'gangneung', name: '강릉', type: 'city', faction: 'hanna', x: 59.4, y: 52.5 },
  { id: 'sisang', name: '시상', type: 'city', faction: 'hanna', x: 69.1, y: 55.7 },
  { id: 'seongdo', name: '성도', type: 'city', faction: 'hanna', x: 31.4, y: 55.7 },
  { id: 'gangju', name: '강주', type: 'city', faction: 'hanna', x: 38, y: 58.9 },
  { id: 'geonan', name: '건안', type: 'city', faction: 'hanna', x: 77.3, y: 63.5 },
  { id: 'mureung', name: '무릉', type: 'fort', faction: 'hanna', x: 51.1, y: 60.3 },
  { id: 'jeokbyeok', name: '적벽', type: 'port', faction: 'hanna', x: 64.2, y: 55.7 },
  { id: 'myeonjukgwan', name: '면죽관', type: 'fort', faction: 'hanna', x: 31.8, y: 46.0 },
  { id: 'yeongchang', name: '영창', type: 'city', faction: 'hanna', x: 26.9, y: 68.1 },
  { id: 'yeongneung', name: '영릉', type: 'city', faction: 'hanna', x: 53.9, y: 67.2 },
  { id: 'geonnyeong', name: '건녕', type: 'fort', faction: 'hanna', x: 31.4, y: 68.6 },
  { id: 'gyeyang', name: '계양', type: 'city', faction: 'hanna', x: 59, y: 69.1 },
  { id: 'jangsa', name: '장사', type: 'port', faction: 'hanna', x: 59.4, y: 59.9 },
  { id: 'namhae', name: '남해', type: 'city', faction: 'hanna', x: 65.6, y: 78.3 },
  { id: 'gyoji', name: '교지', type: 'city', faction: 'hanna', x: 46.3, y: 87.5 },
  { id: 'o', name: '오', type: 'city', faction: 'hanna', x: 83.2, y: 48.8 },
  { id: 'bogyang', name: '복양', type: 'city', faction: 'hwangeonjeok', x: 69.1, y: 30.4 },
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

const WORLDMAP_SCENE_FACTIONS = {
  camp: WORLDMAP_SCENE_FACTIONS_CAMP,
  warmap: WORLDMAP_SCENE_FACTIONS_CAMP,
};

// 씬별로 "지금 여기" 깃발을 표시할 위치.
const WORLDMAP_SCENE_FLAG = {
  takhyeon_free: 'takhyeontown',
  pyeongwon_free: 'gye',
  camp: 'hogwan',
  warmap: 'hogwan',
};
