// ---------------- 대지도(하단메뉴 "지도") 데이터 ----------------
// 좌표는 assets/illust/worldmap.jpg 위의 상대 위치(가로/세로 %)다. 사용자가
// 엑셀 시트(Sheet2_좌표수정)에서 직접 x_px/y_px를 고쳐서 돌려준 값을 그대로
// 반영한 것이다.

const WORLDMAP_FACTION_COLORS = {
  dongtak: '#b23a2e',      // 동탁 (빨강)
  wonso: '#2f5fa8',        // 원소 (파랑)
  wonsul: '#7a3fa0',       // 원술 (보라)
  gongsonchan: '#4fa8c9',  // 공손찬 (하늘색)
  jojo: '#2b2b2b',         // 조조 (검정)
  songgyeon: '#2f8f4e',    // 손견/강동 (초록)
  yupyo: '#d97b29',        // 유표 (주황)
  yueon: '#8a5a2b',        // 유언 (갈색)
  seoryang: '#9c9c8f',     // 마등·한수 서량 (회색)
  neutral: '#8a8478',      // 기타/미상 (짙은 회색)
};

// type: 'city'(2중네모, 성) | 'fort'(네모, 요새/관문) | 'port'(세모, 항구)
const WORLDMAP_LOCATIONS = [
  { id: 'bukpyeong', name: '북평', type: 'city', faction: 'gongsonchan', x: 79.4, y: 9.2 },
  { id: 'jinyang', name: '진양', type: 'city', faction: 'wonso', x: 63.5, y: 17.5 },
  { id: 'gye', name: '계', type: 'city', faction: 'gongsonchan', x: 72.5, y: 12 },
  { id: 'takhyeon', name: '서평', type: 'fort', faction: 'seoryang', x: 26.2, y: 17.5 },
  { id: 'jungsan', name: '중산', type: 'fort', faction: 'wonso', x: 68, y: 12.9 },
  { id: 'muwi', name: '무위', type: 'fort', faction: 'seoryang', x: 28.3, y: 8.7 },
  { id: 'jangan', name: '장안', type: 'city', faction: 'dongtak', x: 45.6, y: 35.9 },
  { id: 'geumseong', name: '금성', type: 'city', faction: 'seoryang', x: 32.8, y: 20.3 },
  { id: 'anjeong', name: '안정', type: 'city', faction: 'seoryang', x: 44.2, y: 26.7 },
  { id: 'hamgokgwan', name: '함곡관', type: 'fort', faction: 'dongtak', x: 51.8, y: 35 },
  { id: 'nampi', name: '남피', type: 'city', faction: 'wonso', x: 71.8, y: 22.1 },
  { id: 'georok', name: '거록', type: 'fort', faction: 'wonso', x: 66.6, y: 23 },
  { id: 'hogwan', name: '호로관', type: 'fort', faction: 'dongtak', x: 56.6, y: 35 },
  { id: 'sangdang', name: '상당', type: 'fort', faction: 'wonso', x: 60.8, y: 25.8 },
  { id: 'pyeongwon2', name: '평원', type: 'city', faction: 'wonso', x: 69.8, y: 26.2 },
  { id: 'bukhae', name: '북해', type: 'city', faction: 'wonso', x: 77.3, y: 27.6 },
  { id: 'eop', name: '업', type: 'city', faction: 'wonso', x: 66.3, y: 28.5 },
  { id: 'cheonsu', name: '천수', type: 'city', faction: 'seoryang', x: 35.9, y: 27.6 },
  { id: 'hanae', name: '하내', type: 'fort', faction: 'jojo', x: 60.1, y: 25.8 },
  { id: 'baengma', name: '백마', type: 'fort', faction: 'jojo', x: 66.3, y: 32.2 },
  { id: 'habi', name: '하비', type: 'city', faction: 'neutral', x: 73.2, y: 37.8 },
  { id: 'sopae', name: '소패', type: 'fort', faction: 'neutral', x: 69.8, y: 35.5 },
  { id: 'jinchang', name: '진류', type: 'fort', faction: 'seoryang', x: 62.8, y: 35 },
  { id: 'nangya', name: '낭야', type: 'fort', faction: 'neutral', x: 76.7, y: 35 },
  { id: 'nakyang', name: '낙양', type: 'city', faction: 'dongtak', x: 54.2, y: 34.5 },
  { id: 'mudo', name: '무도', type: 'city', faction: 'yueon', x: 35.9, y: 36.4 },
  { id: 'heochang', name: '허창', type: 'city', faction: 'wonsul', x: 61.1, y: 38.2 },
  { id: 'cho', name: '초', type: 'fort', faction: 'wonsul', x: 65.3, y: 37.3 },
  { id: 'yeonam', name: '여남', type: 'city', faction: 'wonsul', x: 64.9, y: 42.4 },
  { id: 'sangyong', name: '상용', type: 'fort', faction: 'yupyo', x: 49.4, y: 45.1 },
  { id: 'gwangneung', name: '광릉', type: 'fort', faction: 'neutral', x: 77, y: 42.8 },
  { id: 'sujun', name: '수춘', type: 'city', faction: 'wonsul', x: 69.6, y: 42.4 },
  { id: 'wan', name: '완', type: 'city', faction: 'yupyo', x: 56.3, y: 40.5 },
  { id: 'sinya', name: '신야', type: 'fort', faction: 'yupyo', x: 59.7, y: 44.2 },
  { id: 'hanjung', name: '한중', type: 'city', faction: 'yueon', x: 40.4, y: 43.7 },
  { id: 'yangyang', name: '양양', type: 'city', faction: 'yupyo', x: 55.6, y: 46 },
  { id: 'ganghwa', name: '강하', type: 'port', faction: 'yupyo', x: 64.2, y: 47.9 },
  { id: 'jadong', name: '자동', type: 'city', faction: 'yueon', x: 33.5, y: 49.7 },
  { id: 'yeogang', name: '여강', type: 'city', faction: 'songgyeon', x: 69.9, y: 49.7 },
  { id: 'geoneop', name: '건업', type: 'city', faction: 'songgyeon', x: 76.7, y: 47.9 },
  { id: 'yangpyeonggwan', name: '양평관', type: 'fort', faction: 'yueon', x: 38, y: 45.1 },
  { id: 'yeongan', name: '영안', type: 'fort', faction: 'yueon', x: 45.6, y: 51.6 },
  { id: 'iryeong', name: '이릉', type: 'fort', faction: 'yupyo', x: 53.2, y: 52 },
  { id: 'hoegye', name: '회계', type: 'city', faction: 'songgyeon', x: 82.2, y: 54.3 },
  { id: 'gangneung', name: '강릉', type: 'city', faction: 'yupyo', x: 59.4, y: 52.5 },
  { id: 'sisang', name: '시상', type: 'city', faction: 'songgyeon', x: 69.1, y: 55.7 },
  { id: 'seongdo', name: '성도', type: 'city', faction: 'yueon', x: 31.4, y: 55.7 },
  { id: 'gangju', name: '강주', type: 'city', faction: 'yueon', x: 38, y: 58.9 },
  { id: 'geonan', name: '건안', type: 'city', faction: 'songgyeon', x: 77.3, y: 63.5 },
  { id: 'mureung', name: '무릉', type: 'fort', faction: 'yupyo', x: 51.1, y: 60.3 },
  { id: 'jeokbyeok', name: '적벽', type: 'fort', faction: 'songgyeon', x: 64.2, y: 55.7 },
  { id: 'geomgak', name: '검각', type: 'fort', faction: 'yueon', x: 35.9, y: 46 },
  { id: 'yeongchang', name: '영창', type: 'city', faction: 'yupyo', x: 26.9, y: 68.1 },
  { id: 'yeongneung', name: '영릉', type: 'city', faction: 'yupyo', x: 53.9, y: 67.2 },
  { id: 'geonnyeong', name: '건녕', type: 'fort', faction: 'yupyo', x: 31.4, y: 68.6 },
  { id: 'gyeyang', name: '계양', type: 'city', faction: 'yupyo', x: 59, y: 69.1 },
  { id: 'jangsa', name: '장사', type: 'port', faction: 'yupyo', x: 59.4, y: 59.9 },
  { id: 'namhae', name: '남해', type: 'city', faction: 'yupyo', x: 65.6, y: 78.3 },
  { id: 'gyoji', name: '교지', type: 'city', faction: 'yupyo', x: 46.3, y: 87.5 },
];
