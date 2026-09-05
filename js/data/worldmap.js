// ---------------- 대지도(하단메뉴 "지도") 데이터 ----------------
// 좌표는 assets/illust/worldmap.jpg 위의 상대 위치(가로/세로 %)다. 사용자가
// 실제 역사 지도(삼국지13 도시 위치 참고자료)를 보고 픽셀 눈금 위에 직접
// 손으로 찍어준 위치를 그대로 옮긴 값이라, 1차 추정치보다 훨씬 정밀하다.

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
  { id: 'muwi', name: '무위', type: 'city', faction: 'seoryang', x: 11.7, y: 12.4 },
  { id: 'seoryang', name: '서량', type: 'fort', faction: 'seoryang', x: 6.9, y: 16.6 },
  { id: 'geumseong', name: '금성', type: 'city', faction: 'seoryang', x: 29.7, y: 16.1 },
  { id: 'anjeong', name: '안정', type: 'city', faction: 'seoryang', x: 42.1, y: 16.1 },
  { id: 'cheonsu', name: '천수', type: 'city', faction: 'seoryang', x: 33.8, y: 24.9 },
  { id: 'jinchang', name: '진창', type: 'fort', faction: 'seoryang', x: 30.0, y: 29.9 },
  { id: 'jangan', name: '장안', type: 'city', faction: 'dongtak', x: 34.9, y: 13.8 },
  { id: 'donggwan', name: '동관', type: 'fort', faction: 'dongtak', x: 31.8, y: 21.2 },
  { id: 'hamgokgwan', name: '함곡관', type: 'fort', faction: 'dongtak', x: 39.4, y: 16.6 },
  { id: 'nakyang', name: '낙양', type: 'city', faction: 'dongtak', x: 48.0, y: 32.2 },
  { id: 'hogwan', name: '호로관', type: 'fort', faction: 'dongtak', x: 45.2, y: 19.3 },
  { id: 'sasugwan', name: '사수관', type: 'fort', faction: 'dongtak', x: 45.2, y: 20.7 },
  { id: 'jinyang', name: '진양', type: 'city', faction: 'wonso', x: 34.9, y: 6.9 },
  { id: 'sangdang', name: '상당', type: 'fort', faction: 'wonso', x: 49.7, y: 22.1 },
  { id: 'eop', name: '업', type: 'city', faction: 'wonso', x: 60.8, y: 23.9 },
  { id: 'pyeongwon2', name: '평원', type: 'city', faction: 'wonso', x: 61.8, y: 23.0 },
  { id: 'bukhae', name: '북해', type: 'city', faction: 'wonso', x: 68.7, y: 23.0 },
  { id: 'nampi', name: '남피', type: 'city', faction: 'wonso', x: 61.8, y: 17.5 },
  { id: 'georok', name: '거록', type: 'city', faction: 'wonso', x: 60.8, y: 18.9 },
  { id: 'jungsan', name: '중산', type: 'city', faction: 'wonso', x: 55.2, y: 10.1 },
  { id: 'gye', name: '계', type: 'city', faction: 'gongsonchan', x: 61.8, y: 8.3 },
  { id: 'bukpyeong', name: '북평', type: 'fort', faction: 'gongsonchan', x: 69.8, y: 5.1 },
  { id: 'anhui', name: '안희현(어양)', type: 'city', faction: 'gongsonchan', x: 58.0, y: 12.0 },
  { id: 'takhyeon', name: '탁현', type: 'city', faction: 'gongsonchan', x: 58.7, y: 8.7 },
  { id: 'gyeonseong', name: '견성', type: 'city', faction: 'jojo', x: 48.0, y: 29.5 },
  { id: 'hanae', name: '하내', type: 'city', faction: 'jojo', x: 51.1, y: 27.6 },
  { id: 'baengma', name: '백마', type: 'fort', faction: 'jojo', x: 60.8, y: 27.6 },
  { id: 'sopae', name: '소패', type: 'city', faction: 'neutral', x: 63.9, y: 29.5 },
  { id: 'nangya', name: '낭야', type: 'city', faction: 'neutral', x: 68.4, y: 30.8 },
  { id: 'habi', name: '하비', type: 'city', faction: 'neutral', x: 64.6, y: 27.6 },
  { id: 'gwangneung', name: '광릉', type: 'city', faction: 'neutral', x: 68.0, y: 36.4 },
  { id: 'heochang', name: '허창', type: 'city', faction: 'wonsul', x: 54.6, y: 34.1 },
  { id: 'cho', name: '초', type: 'city', faction: 'wonsul', x: 57.7, y: 34.1 },
  { id: 'yeonam', name: '여남', type: 'city', faction: 'wonsul', x: 59.0, y: 35.9 },
  { id: 'sujun', name: '수춘', type: 'city', faction: 'wonsul', x: 62.2, y: 36.4 },
  { id: 'mudo', name: '무도', type: 'city', faction: 'yueon', x: 32.1, y: 32.7 },
  { id: 'hanjung', name: '한중', type: 'city', faction: 'yueon', x: 35.6, y: 37.3 },
  { id: 'jadong', name: '자동', type: 'city', faction: 'yueon', x: 29.0, y: 41.0 },
  { id: 'seongdo', name: '성도', type: 'city', faction: 'yueon', x: 30.4, y: 48.8 },
  { id: 'gangju', name: '강주', type: 'city', faction: 'yueon', x: 34.5, y: 49.7 },
  { id: 'yeongan', name: '영안', type: 'fort', faction: 'yueon', x: 35.6, y: 45.1 },
  { id: 'geomgak', name: '검각', type: 'fort', faction: 'yueon', x: 22.8, y: 52.0 },
  { id: 'yangpyeonggwan', name: '양평관', type: 'fort', faction: 'yueon', x: 25.2, y: 44.2 },
  { id: 'gamaenggwan', name: '가맹관', type: 'fort', faction: 'yueon', x: 21.1, y: 52.0 },
  { id: 'baekjeseong', name: '백제성', type: 'fort', faction: 'yueon', x: 20.0, y: 64.9 },
  { id: 'sangyong', name: '상용', type: 'city', faction: 'yupyo', x: 42.5, y: 35.9 },
  { id: 'yangyang', name: '양양', type: 'city', faction: 'yupyo', x: 43.5, y: 37.8 },
  { id: 'wan', name: '완', type: 'city', faction: 'yupyo', x: 48.3, y: 36.4 },
  { id: 'sinya', name: '신야', type: 'fort', faction: 'yupyo', x: 51.1, y: 36.4 },
  { id: 'beonseong', name: '번성', type: 'fort', faction: 'yupyo', x: 45.2, y: 38.7 },
  { id: 'jangpanpa', name: '장판파', type: 'fort', faction: 'yupyo', x: 42.1, y: 42.4 },
  { id: 'ganghwa', name: '강하', type: 'port', faction: 'yupyo', x: 55.2, y: 40.5 },
  { id: 'iryeong', name: '이릉', type: 'fort', faction: 'yupyo', x: 47.3, y: 46.0 },
  { id: 'gangneung', name: '강릉', type: 'city', faction: 'yupyo', x: 54.9, y: 47.0 },
  { id: 'mureung', name: '무릉', type: 'city', faction: 'yupyo', x: 43.9, y: 51.1 },
  { id: 'jangsa', name: '장사', type: 'city', faction: 'yupyo', x: 40.1, y: 63.5 },
  { id: 'yeongneung', name: '영릉', type: 'city', faction: 'yupyo', x: 44.5, y: 56.2 },
  { id: 'gyeyang', name: '계양', type: 'city', faction: 'yupyo', x: 52.5, y: 57.1 },
  { id: 'yeongchang', name: '영창', type: 'city', faction: 'yupyo', x: 22.8, y: 55.2 },
  { id: 'geonnyeong', name: '건녕', type: 'city', faction: 'yupyo', x: 28.0, y: 56.2 },
  { id: 'namhae', name: '남해', type: 'port', faction: 'yupyo', x: 59.0, y: 64.5 },
  { id: 'gyoji', name: '교지', type: 'port', faction: 'yupyo', x: 41.4, y: 70.9 },
  { id: 'yeogang', name: '여강', type: 'city', faction: 'songgyeon', x: 62.2, y: 41.4 },
  { id: 'geoneop', name: '건업', type: 'city', faction: 'songgyeon', x: 67.3, y: 41.4 },
  { id: 'yusugu', name: '유수구', type: 'fort', faction: 'songgyeon', x: 59.0, y: 47.4 },
  { id: 'sisang', name: '시상', type: 'port', faction: 'songgyeon', x: 55.6, y: 47.9 },
  { id: 'jeokbyeok', name: '적벽', type: 'fort', faction: 'songgyeon', x: 57.3, y: 51.1 },
  { id: 'hoegye', name: '회계', type: 'port', faction: 'songgyeon', x: 71.1, y: 46.5 },
  { id: 'geonan', name: '건안', type: 'city', faction: 'songgyeon', x: 68.0, y: 50.2 },
];
