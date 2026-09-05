// ---------------- 대지도(하단메뉴 "지도") 데이터 ----------------
// 좌표는 assets/illust/worldmap.jpg 위의 상대 위치(가로/세로 %)다. 실제 역사
// 지리를 그대로 옮긴 게 아니라, 이 그림의 산맥/강줄기 배치를 보고 대략적인
// 위치 관계(장안-낙양이 강 상류~중류, 성도는 서쪽 산맥 안쪽, 형주는 남쪽
// 강 유역 등)를 살려 잡은 값이라 필요하면 얼마든지 조정 가능하다.

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
  // ---- 사예/관중 (동탁 치하) ----
  { id: 'jangan', name: '장안', type: 'city', faction: 'dongtak', x: 38, y: 16 },
  { id: 'nakyang', name: '낙양', type: 'city', faction: 'dongtak', x: 49, y: 20 },
  { id: 'hamgokgwan', name: '함곡관', type: 'fort', faction: 'dongtak', x: 43, y: 19 },
  { id: 'hogwan', name: '호로관', type: 'fort', faction: 'dongtak', x: 54, y: 22 },
  { id: 'sasugwan', name: '사수관', type: 'fort', faction: 'dongtak', x: 52, y: 24 },
  { id: 'donggwan', name: '동관', type: 'fort', faction: 'dongtak', x: 35, y: 20 },

  // ---- 유주 (공손찬) ----
  { id: 'takhyeon', name: '탁현', type: 'city', faction: 'gongsonchan', x: 71, y: 9 },
  { id: 'gye', name: '계', type: 'city', faction: 'gongsonchan', x: 76, y: 6 },
  { id: 'anhui', name: '안희현(어양)', type: 'city', faction: 'gongsonchan', x: 63, y: 15 },
  { id: 'bukpyeong', name: '북평', type: 'fort', faction: 'gongsonchan', x: 78, y: 9 },

  // ---- 기주/병주 (원소) ----
  { id: 'eop', name: '업', type: 'city', faction: 'wonso', x: 59, y: 25 },
  { id: 'jinyang', name: '진양', type: 'city', faction: 'wonso', x: 40, y: 8 },

  // ---- 연주 (조조) ----
  { id: 'gyeonseong', name: '견성', type: 'city', faction: 'jojo', x: 55, y: 31 },

  // ---- 예주 (원술 초기 근거지) ----
  { id: 'yeonam', name: '여남', type: 'city', faction: 'wonsul', x: 52, y: 40 },
  { id: 'sujun', name: '수춘', type: 'city', faction: 'wonsul', x: 58, y: 43 },

  // ---- 청주/서주 (독자세력/중립) ----
  { id: 'imchi', name: '임치', type: 'city', faction: 'neutral', x: 76, y: 16 },
  { id: 'seoju', name: '서주(하비)', type: 'city', faction: 'neutral', x: 71, y: 33 },
  { id: 'imchihang', name: '청주항', type: 'port', faction: 'neutral', x: 79, y: 13 },

  // ---- 양주(涼)/서량 (마등·한수) ----
  { id: 'muwi', name: '무위', type: 'city', faction: 'seoryang', x: 12, y: 15 },
  { id: 'seoryang', name: '서량', type: 'fort', faction: 'seoryang', x: 8, y: 20 },
  { id: 'jinchang', name: '진창', type: 'fort', faction: 'seoryang', x: 30, y: 29 },

  // ---- 익주 (유언) ----
  { id: 'seongdo', name: '성도', type: 'city', faction: 'yueon', x: 16, y: 59 },
  { id: 'hanjung', name: '한중', type: 'city', faction: 'yueon', x: 27, y: 42 },
  { id: 'geomgak', name: '검각', type: 'fort', faction: 'yueon', x: 22, y: 47 },
  { id: 'yangpyeonggwan', name: '양평관', type: 'fort', faction: 'yueon', x: 25, y: 44 },
  { id: 'gamaenggwan', name: '가맹관', type: 'fort', faction: 'yueon', x: 21, y: 52 },
  { id: 'baekjeseong', name: '백제성', type: 'fort', faction: 'yueon', x: 20, y: 65 },

  // ---- 형주 (유표) ----
  { id: 'yangyang', name: '양양', type: 'city', faction: 'yupyo', x: 36, y: 54 },
  { id: 'wan', name: '완', type: 'city', faction: 'yupyo', x: 44, y: 47 },
  { id: 'gangneung', name: '강릉', type: 'city', faction: 'yupyo', x: 33, y: 64 },
  { id: 'jangsa', name: '장사', type: 'city', faction: 'yupyo', x: 44, y: 73 },
  { id: 'sinya', name: '신야', type: 'fort', faction: 'yupyo', x: 33, y: 50 },
  { id: 'beonseong', name: '번성', type: 'fort', faction: 'yupyo', x: 37, y: 55 },
  { id: 'jangpanpa', name: '장판파', type: 'fort', faction: 'yupyo', x: 37, y: 60 },
  { id: 'iryeong', name: '이릉', type: 'fort', faction: 'yupyo', x: 30, y: 68 },
  { id: 'jeokbyeok', name: '적벽', type: 'fort', faction: 'yupyo', x: 51, y: 64 },
  { id: 'orim', name: '오림', type: 'fort', faction: 'yupyo', x: 49, y: 62 },
  { id: 'ganghwa', name: '강하', type: 'port', faction: 'yupyo', x: 56, y: 61 },

  // ---- 강동/오 (손견) ----
  { id: 'geoneop', name: '건업', type: 'city', faction: 'songgyeon', x: 66, y: 55 },
  { id: 'oe', name: '오', type: 'city', faction: 'songgyeon', x: 72, y: 58 },
  { id: 'sisang', name: '시상', type: 'port', faction: 'songgyeon', x: 62, y: 65 },
  { id: 'ohanggu', name: '오 항구', type: 'port', faction: 'songgyeon', x: 68, y: 57 },
  { id: 'hoegyehang', name: '회계항', type: 'port', faction: 'songgyeon', x: 74, y: 60 },

  // ---- 양주(揚) 북부 (원술 남하 후) ----
  { id: 'hapbi', name: '합비', type: 'fort', faction: 'wonsul', x: 62, y: 48 },
  { id: 'yusugu', name: '유수구', type: 'fort', faction: 'wonsul', x: 63, y: 51 },
  { id: 'soyojin', name: '소요진', type: 'fort', faction: 'wonsul', x: 62, y: 50 },

  // ---- 교주 (독자세력) ----
  { id: 'beonu', name: '번우(광주)', type: 'city', faction: 'neutral', x: 55, y: 89 },
  { id: 'beonuhang', name: '교주항', type: 'port', faction: 'neutral', x: 50, y: 90 },
];
