// 타일: 0=흙/마당 1=길 2=건물(막힘) 3=물(막힘) 4=나무/장애물(막힘)
function rectFill(grid, x0, y0, x1, y1, v) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = v;
}

function makeGrid(w, h, base) {
  const g = [];
  for (let y = 0; y < h; y++) g.push(new Array(w).fill(base));
  return g;
}

const MAPS = {};

// ---------------- 탁현 : 확장 성읍 v2 ----------------
// 28x20(560칸)에서 40x28(1120칸)로 확장. 정확히 2배 면적이다.
(function () {
  const w = 40, h = 28;
  const grid = makeGrid(w, h, 0);

  // 성벽/외곽
  rectFill(grid, 0, 0, w - 1, 0, 4);
  rectFill(grid, 0, h - 1, w - 1, h - 1, 4);
  rectFill(grid, 0, 0, 0, h - 1, 4);
  rectFill(grid, w - 1, 0, w - 1, h - 1, 4);

  // 큰길: 북문 -> 중앙 장터 -> 남쪽 외곽, 동서 생활권 연결.
  for (let y = 1; y < h - 1; y++) {
    grid[y][19] = 1; grid[y][20] = 1;
  }
  for (let x = 1; x < w - 1; x++) {
    grid[13][x] = 1; grid[14][x] = 1;
  }
  for (let x = 3; x <= 35; x++) grid[20][x] = 1;
  for (let y = 14; y <= 24; y++) grid[y][30] = 1;

  // 건물 충돌 영역: 주택을 여러 거리로 분산하여 발견형 자택을 배정할 여지를 둔다.
  rectFill(grid, 3, 3, 9, 7, 2);     // 관아
  rectFill(grid, 12, 3, 16, 6, 2);   // 서북 민가 A (노식 후보)
  rectFill(grid, 24, 3, 28, 6, 2);   // 북동 민가 B (공융 후보)
  rectFill(grid, 32, 4, 37, 8, 2);   // 동쪽 민가 C
  rectFill(grid, 4, 19, 10, 23, 2);  // 주막
  rectFill(grid, 24, 19, 29, 23, 2); // 상점가
  rectFill(grid, 11, 18, 15, 21, 2); // 서남 민가 D
  rectFill(grid, 32, 10, 37, 13, 2); // 유비 세력 막사

  // 큰 느티나무, 우물, 연못, 남동 숲과 황건적 소굴 후방.
  rectFill(grid, 27, 9, 28, 10, 4);
  rectFill(grid, 17, 22, 19, 24, 3);
  grid[10][8] = 4;
  rectFill(grid, 36, 22, 38, 26, 2);
  for (const [x,y] of [[32,22],[33,24],[34,26],[38,20],[35,21],[37,25]]) grid[y][x]=4;

  MAPS.takhyeon = {
    name: '탁현 · 장터',
    width: w, height: h,
    tiles: grid,
    playerStart: { x: 19, y: 17 },
    camera: { viewportW: 800, viewportH: 480 },

    // 배경을 한 장으로 굳히지 않고 재사용 가능한 오브젝트 조합으로 구성한다.
    decor: [
      { type:'gate', x:17, y:0, w:6, h:2, label:'탁현 북문' },
      { type:'building', x:3, y:3, w:7, h:5, label:'관아' },
      { type:'building', x:12, y:3, w:5, h:4, label:'민가', residenceId:'noshik' },
      { type:'building', x:24, y:3, w:5, h:4, label:'민가', residenceId:'gongyung' },
      { type:'building', x:32, y:4, w:6, h:5, label:'민가' },
      { type:'building', x:4, y:19, w:7, h:5, label:'주막' },
      { type:'building', x:24, y:19, w:6, h:5, label:'상점가' },
      { type:'building', x:11, y:18, w:5, h:4, label:'민가' },
      { type:'building', x:32, y:10, w:6, h:4, label:'세력 막사' },
      { type:'stall', x:10, y:11, w:2, tone:'red' },
      { type:'stall', x:14, y:11, w:2, tone:'tan' },
      { type:'stall', x:23, y:10, w:2, tone:'green' },
      { type:'stall', x:27, y:12, w:2, tone:'tan' },
      { type:'stall', x:9, y:16, w:2, tone:'green' },
      { type:'stall', x:24, y:16, w:2, tone:'red' },
      { type:'tree', x:27.5, y:9.5, scale:1.45, landmark:true },
      { type:'tree', x:8.2, y:10.0, scale:1.0 },
      { type:'tree', x:34.0, y:22.0, scale:1.0 },
      { type:'tree', x:38.0, y:20.0, scale:1.0 },
      { type:'well', x:16.0, y:15.8 },
      { type:'cart', x:28.0, y:14.8 },
      { type:'crate', x:7.8, y:17.7 },
      { type:'crate', x:8.5, y:17.6 },
      { type:'lanterns', x:5, y:18.5, count:5 },
    ],

    areaLabels: [
      { x:6, y:8.5, text:'관아 거리' },
      { x:19.5, y:10.0, text:'탁현 장터' },
      { x:7.0, y:24.2, text:'주막 거리' },
      { x:34.5, y:19.5, text:'남동 숲길' },
      { x:35.5, y:25.8, text:'황건적 소굴' },
    ],

    // 기존 스토리 NPC는 유지하되 공간 속 역할에 맞게 재배치.
    // discoverable + residence: 첫 발견 전에는 인파 속 인물, 발견 후에는 집이 이름을 얻는다.
    npcs: [
      { id:'yubi', x:34, y:14, label:'유비 (세력 막사)' },
      { id:'chujeong', x:13, y:14, label:'추정', randomSpawn:true },
      {
        id:'noshik', x:27, y:12, label:'', discoverable:true,
        discoveryRange:2,
        discoveryText:'시장 모퉁이의 큰 느티나무 아래, 소란에는 아랑곳하지 않고 책을 읽는 범상치 않은 선비가 보인다.',
        residence:{ x:14, y:7, label:'노식의 집' }
      },
      { id:'yuwongi', x:21, y:14, label:'유원기' },
      { id:'sossangJangsepyeong', x:24, y:13, label:'소쌍·장세평' },
      {
        id:'gongyung', x:14, y:12, label:'', discoverable:true, discoveryRange:2,
        discoveryText:'비단 좌판 옆에서 사람들의 언쟁을 조용히 듣던 선비가, 문득 핵심을 찌르는 한마디를 던진다.',
        residence:{ x:26, y:7, label:'공융이 머무는 집' }
      },
      { id:'deungmu', x:34, y:23, label:'등무(황건적 두목)' },
    ],

    // 일반 백성은 무채색/저채도 의복. 전부 장수가 아니며 공간을 살아 있게 만드는 군중이다.
    ambient: [
      { archetype:'merchant', x:11, y:12, palette:'ash', wander:2 },
      { archetype:'farmer', x:14, y:15, palette:'earth', wander:3 },
      { archetype:'woman', x:17, y:12, palette:'ash', wander:2 },
      { archetype:'elder', x:21, y:12, palette:'earth', wander:1 },
      { archetype:'porter', x:22, y:16, palette:'ash', wander:3 },
      { archetype:'farmer', x:25, y:15, palette:'earth', wander:2 },
      { archetype:'merchant', x:8, y:16, palette:'ash', wander:2 },
      { archetype:'child', x:17, y:17, palette:'dust', wander:3 },
      { archetype:'guard', x:18, y:3, palette:'iron', wander:1 },
      { archetype:'guard', x:21, y:3, palette:'iron', wander:1 },
      { archetype:'woman', x:28, y:15, palette:'dust', wander:2 },
      { archetype:'porter', x:29, y:17, palette:'earth', wander:2 },
      { archetype:'farmer', x:6, y:14, palette:'ash', wander:2 },
      { archetype:'merchant', x:26, y:13, palette:'earth', wander:2 },
      { archetype:'woman', x:12, y:20, palette:'dust', wander:2 },
      { archetype:'child', x:22, y:20, palette:'dust', wander:2 },
      { archetype:'guard', x:31, y:14, palette:'iron', wander:1 },
    ],
  };
})();

// ---------------- 평원현 (기존 구조 유지) ----------------
(function () {
  const w = 14, h = 10;
  const grid = makeGrid(w, h, 0);
  rectFill(grid, 0, 0, w - 1, 0, 4);
  rectFill(grid, 0, h - 1, w - 1, h - 1, 4);
  rectFill(grid, 0, 0, 0, h - 1, 4);
  rectFill(grid, w - 1, 0, w - 1, h - 1, 4);
  rectFill(grid, 2, 2, 4, 3, 2); // 관아
  rectFill(grid, 9, 6, 11, 7, 2); // 객잔
  rectFill(grid, 10, 1, 12, 3, 2); // 세력 막사
  for (let x = 1; x < w - 1; x++) grid[5][x] = 1;

  MAPS.pyeongwon = {
    name: '평원현',
    width: w, height: h,
    tiles: grid,
    playerStart: { x:6, y:5 },
    decor: [
      { type:'building', x:2, y:2, w:3, h:2, roof:'charcoal', label:'관아', sign:'官' },
      { type:'building', x:9, y:6, w:3, h:2, roof:'red', sign:'客' }, // 미축 등 인접 NPC 이름표와 겹치지 않도록 건물 라벨은 생략
      { type:'building', x:10, y:1, w:3, h:3, roof:'charcoal', label:'세력 막사', sign:'營' },
    ],
    npcs: [
      { id:'yubi', x:11, y:4, label:'유비 (세력 막사)' },
      { id:'jeonhae', x:3, y:5, label:'전해', randomSpawn:true },
      { id:'gwanjeong', x:6, y:2, label:'관정', randomSpawn:true },
      { id:'eomgang', x:9, y:3, label:'엄강', randomSpawn:true },
      { id:'jowoon', x:12, y:6, label:'조운(?)' },
      { id:'mijuk', x:10, y:7, label:'미축' },
      { id:'mibang', x:11, y:7, label:'미방' },
      { id:'songgeon', x:2, y:7, label:'손건' },
      { id:'ganong', x:3, y:8, label:'간옹' },
      { id:'jindeung', x:8, y:8, label:'진등' },
    ],
  };
})();

// ---------------- 반동탁연합 진영 ----------------
(function () {
  const w = 16, h = 11;
  const grid = makeGrid(w, h, 0);
  rectFill(grid, 0, 0, w - 1, 0, 4);
  rectFill(grid, 0, h - 1, w - 1, h - 1, 4);
  rectFill(grid, 0, 0, 0, h - 1, 4);
  rectFill(grid, w - 1, 0, w - 1, h - 1, 4);
  rectFill(grid, 6, 1, 9, 2, 2);   // 원소 맹주 막사
  rectFill(grid, 1, 4, 3, 5, 2);   // 조조 막사
  rectFill(grid, 12, 4, 14, 5, 2); // 공손찬 막사
  rectFill(grid, 6, 7, 9, 8, 2);   // 손견 막사
  for (let x = 1; x < w - 1; x++) grid[6][x] = 1;

  MAPS.camp = {
    name: '반동탁연합 진영',
    width: w, height: h,
    tiles: grid,
    playerStart: { x:7, y:6 },
    npcs: [
      { id:'wonso', x:7, y:3, label:'원소' },
      { id:'jojo', x:2, y:6, label:'조조' },
      { id:'gongsonchan', x:13, y:6, label:'공손찬' },
      { id:'songyeon', x:7, y:9, label:'손견' },
    ],
  };
})();

// ---------------- 호로관 전선 (사수관 이후 잔당 소탕 + 여포) ----------------
(function () {
  const w = 20, h = 11;
  const grid = makeGrid(w, h, 0);
  rectFill(grid, 0, 0, w - 1, 0, 4);
  rectFill(grid, 0, h - 1, w - 1, h - 1, 4);
  rectFill(grid, 0, 0, 0, h - 1, 4);
  rectFill(grid, w - 1, 0, w - 1, h - 1, 4);
  rectFill(grid, 9, 0, 10, 2, 2);  // 호로관 관문
  for (let x = 1; x < w - 1; x++) grid[8][x] = 1;
  rectFill(grid, 13, 1, 15, 3, 5); // 산악지형 (이동력 2배)
  rectFill(grid, 6, 9, 8, 9, 5);   // 강물지형 (이동력 2배)

  MAPS.warmap = {
    name: '호로관 전선',
    width: w, height: h,
    tiles: grid,
    apMovement: true, // 이동시 행동력을 소모하는 전쟁맵 (일반타일 1, 험지 2배)
    playerStart: { x:2, y:8 },
    npcs: [
      { id:'jojo', x:3, y:5, label:'조조 군세' },
      { id:'wonso', x:3, y:3, label:'원소 군세' },
      { id:'hojin', x:8, y:6, label:'호진 군세' },
      { id:'songheon', x:12, y:4, label:'송헌 군세' },
      { id:'wisok', x:12, y:9, label:'위속 군세' },
      { id:'yeopo', x:17, y:6, label:'여포 군세' },
    ],
  };
})();

