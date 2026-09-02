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

// ---------------- 탁현 : 확장 성읍 v2 (그래픽 초기화 - 흙바닥+성벽만 남긴 상태) ----------------
// 28x20(560칸)에서 40x28(1120칸)로 확장. 정확히 2배 면적이다.
// 건물/좌판/나무 등 개별 그래픽은 전부 제거하고, 성벽으로 둘러싼 흙바닥만 남겨
// 다음 라운드에 그래픽을 하나씩 다시 얹기 위한 깨끗한 바탕으로 삼는다.
(function () {
  const w = 40, h = 28;
  const grid = makeGrid(w, h, 0); // 내부는 전부 흙바닥(0)으로 트여있다.

  // 성벽/외곽만 남긴다 (내부 건물/장애물 충돌은 전부 제거).
  rectFill(grid, 0, 0, w - 1, 0, 4);
  rectFill(grid, 0, h - 1, w - 1, h - 1, 4);
  rectFill(grid, 0, 0, 0, h - 1, 4);
  rectFill(grid, w - 1, 0, w - 1, h - 1, 4);

  MAPS.takhyeon = {
    name: '탁현 · 장터',
    width: w, height: h,
    tiles: grid,
    playerStart: { x: 19, y: 17 },
    camera: { viewportW: 800, viewportH: 480 },

    // 북/남 성문만 남기고 나머지 건물/좌판/나무/소품 그래픽은 전부 제거했다.
    decor: [
      // 북문 이미지는 세로로 3.5칸을 차지하는데, 카메라가 지도 맨 위(0행)보다 위로는
      // 절대 스크롤되지 않으므로 y:0에 두면 지붕 윗부분이 화면 밖으로 잘려 항상 안 보인다.
      // 성문 발판을 아래로 내려서 이미지 전체가 카메라 안에 들어오게 한다.
      { type:'gate', x:17, y:2, w:6, h:2, label:'탁현 북문' },
      { type:'gate', x:17, y:h-3, w:6, h:2, label:'탁현 남문' },
    ],

    areaLabels: [],

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
      { id:'yuwongi', x:8, y:9, label:'유원기' },
      { id:'sossang', x:23, y:13, label:'소쌍' },
      { id:'jangsepyeong', x:25, y:13, label:'장세평' },
      {
        id:'gongyung', x:14, y:12, label:'', discoverable:true, discoveryRange:2,
        discoveryText:'비단 좌판 옆에서 사람들의 언쟁을 조용히 듣던 선비가, 문득 핵심을 찌르는 한마디를 던진다.',
        residence:{ x:26, y:7, label:'공융이 머무는 집' }
      },
      { id:'ganong', x:18, y:9, label:'간옹', randomSpawn:true },
      { id:'gwanhae', x:9, y:19, label:'관해(황건적 잔당)' },
      { id:'muangug', x:30, y:9, label:'무안국' },
      { id:'deungmu', x:34, y:23, label:'등무(황건적 두목)' },
      // 등무 처치 보고 후에만 등장하는 두 번째 사건 - 시장 한복판에 나타난 황건적 잔당.
      { id:'jeongwonji', x:23, y:16, label:'정원지(황건적 잔당)', storyGate:'jeongwonjiEvent' },
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

// ---------------- 평원현 (탁현과 동일 크기로 확장 - 배치는 이후 라운드에서 다듬는다) ----------------
(function () {
  const w = 40, h = 28;
  const grid = makeGrid(w, h, 0);
  rectFill(grid, 0, 0, w - 1, 0, 4);
  rectFill(grid, 0, h - 1, w - 1, h - 1, 4);
  rectFill(grid, 0, 0, 0, h - 1, 4);
  rectFill(grid, w - 1, 0, w - 1, h - 1, 4);
  rectFill(grid, 5, 3, 9, 6, 2);   // 관아
  rectFill(grid, 20, 17, 24, 20, 2); // 객잔
  rectFill(grid, 30, 4, 35, 8, 2);   // 세력 막사
  for (let x = 1; x < w - 1; x++) grid[14][x] = 1;

  MAPS.pyeongwon = {
    name: '평원현',
    width: w, height: h,
    tiles: grid,
    playerStart: { x:17, y:14 },
    decor: [
      { type:'building', x:5, y:3, w:4, h:3, roof:'charcoal', label:'관아', sign:'官' },
      { type:'building', x:20, y:17, w:4, h:3, roof:'red', sign:'客' }, // 미축 등 인접 NPC 이름표와 겹치지 않도록 건물 라벨은 생략
      { type:'building', x:30, y:4, w:5, h:4, roof:'charcoal', label:'세력 막사', sign:'營' },
    ],
    npcs: [
      { id:'yubi', x:32, y:9, label:'유비 (세력 막사)' },
      { id:'jeonhae', x:9, y:14, label:'전해', randomSpawn:true },
      { id:'gwanjeong', x:17, y:6, label:'관정', randomSpawn:true },
      { id:'eomgang', x:26, y:8, label:'엄강', randomSpawn:true },
      { id:'jowoon', x:34, y:17, label:'조운(?)', randomSpawn:true },
      { id:'mijuk', x:29, y:20, label:'미축', randomSpawn:true },
      { id:'mibang', x:31, y:20, label:'미방', randomSpawn:true },
      { id:'songgeon', x:6, y:20, label:'손건', randomSpawn:true },
      { id:'jindeung', x:23, y:22, label:'진등', randomSpawn:true },
      { id:'jingyu', x:20, y:22, label:'진규', randomSpawn:true },
      { id:'jangpae', x:12, y:20, label:'장패', randomSpawn:true },
      { id:'taesaja', x:36, y:22, label:'태사자', randomSpawn:true },
      { id:'yuyo', x:14, y:24, label:'유요', randomSpawn:true },
      { id:'choeyeom', x:27, y:24, label:'최염', randomSpawn:true },
      { id:'yujapyeong', x:7, y:8, label:'유자평' },
      // 유자평과의 대화로 장순의 난이 시작되기 전까지는 등장하지 않는다.
      { id:'jangsun', x:35, y:20, label:'장순(반란군)', storyGate:'jangsunAppeared' },
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

