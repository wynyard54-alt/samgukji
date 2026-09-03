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

// ---------------- 탁현 : 이전 빈 바탕 자료 (비활성, 좌표 이력 보존용) ----------------
// 28x20(560칸)에서 40x28(1120칸)로 확장. 정확히 2배 면적이다.
// 건물/좌판/나무 등 개별 그래픽은 전부 제거하고, 성벽으로 둘러싼 흙바닥만 남겨
// 다음 라운드에 그래픽을 하나씩 다시 얹기 위한 깨끗한 바탕으로 삼는다.
if (false) (function () {
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

// ---------------- 탁현 : 조망도 기반 통합 성읍 ----------------
// 완성된 조망도를 38x26 격자와 맞춘다. 그림과 충돌/인물은 별도 레이어다.
(function () {
  const w = 38, h = 26;
  const grid = makeGrid(w, h, 0);

  // 도로망: 북문-장터 주도로, 동서대로, 관아/민가/주막/막사/숲길.
  for (const r of [
    [17,2,20,25],[1,11,36,13],[2,14,16,17],[21,14,31,17],[21,18,34,20],
    [28,20,34,24],[4,8,16,10],[23,8,36,10],[25,5,26,10],[32,5,33,10],
  ]) rectFill(grid, ...r, 1);

  // 외곽, 관아, 북동 민가, 장터, 주막, 유원기 집, 유비 막사, 작은 황건적 은신처.
  // 장터 나무·유비 막사 주변은 그림 속 나무갓/평상 등 눈에 보이는 것보다 충돌
  // 범위가 넓게 잡혀 있어, 실제로는 지나갈 수 있어야 할 자리까지 막혀 있었다.
  // 나무는 굵은 몸통 부분만, 유비 막사는 천막 지붕 부분만 막도록 좁혔다.
  for (const r of [
    [0,0,w-1,0,4],[0,h-1,w-1,h-1,4],[0,0,0,h-1,4],[w-1,0,w-1,h-1,4],
    [1,1,16,3,4],[21,1,36,3,4],
    [6,4,13,7,2],[3,5,5,7,2],[2,3,15,3,4],[2,4,2,9,4],[15,4,15,8,4],
    [24,4,28,7,2],[30,4,35,7,2],[24,8,28,10,2],[30,8,35,10,2],
    [19,13,21,14,4],[5,14,7,15,2],[9,14,12,15,2],[14,14,15,16,2],
    [3,19,9,20,2],[19,19,23,21,2],[25,20,27,22,2],[28,14,31,16,2],
    [31,21,32,22,2],[35,22,36,24,2],
    [28,21,29,22,4], // 남동 숲, 등무 은신처로 가는 길목의 큰 나무 밑동
    [20,7,21,8,4], // 장터 우물
    [1,19,2,20,4], // 주막 옆 항아리 무더기
  ]) rectFill(grid, r[0], r[1], r[2], r[3], r[4]);
  for (const [x,y] of [[29,24],[35,20],[36,19],[36,22],[27,24]]) grid[y][x] = 4;
  // 북동 민가 두 줄(위/아래) 사이에 사람이 지나다닐 골목을 낸다.
  rectFill(grid, 24, 7, 28, 7, 1);
  rectFill(grid, 30, 7, 35, 7, 1);

  MAPS.takhyeon = {
    name:'탁현 · 장터', width:w, height:h, tiles:grid,
    backgroundKey:'takhyeon_city_overview',
    playerStart:{ x:18, y:16 },
    camera:{ viewportW:800, viewportH:480 },
    decor:[
      { type:'mapLabel', x:9.0, y:8.5, label:'탁현 관아' },
      { type:'mapLabel', x:7.5, y:23.5, label:'주막' },
      { type:'mapLabel', x:23.0, y:23.0, label:'유원기의 집' },
      { type:'mapLabel', x:31.0, y:18.2, label:'유비 세력 막사' },
      { type:'mapLabel', x:25.5, y:8.4, label:'민가', residenceId:'noshik' },
      { type:'mapLabel', x:32.5, y:8.4, label:'민가', residenceId:'gongyung' },
      { type:'mapLabel', x:33.2, y:24.0, label:'황건적 은신처' },
    ],
    areaLabels:[
      { x:9, y:10.4, text:'관아 앞길' }, { x:18.8, y:10.4, text:'탁현 장터' },
      { x:29.2, y:10.4, text:'민가 골목' }, { x:30.0, y:20.1, text:'남동 숲길' },
    ],
    npcs:[
      { id:'yubi', x:29, y:18, label:'유비', fixed:true },
      { id:'chujeong', x:14, y:12, label:'추정', randomSpawn:true },
      { id:'noshik', x:16, y:12, label:'', discoverable:true, fixed:true, discoveryRange:2,
        discoveryText:'장터의 큰 나무 곁에서 소란에 아랑곳하지 않고 책을 읽는 범상치 않은 선비가 보인다.',
        residence:{ x:25, y:11, label:'노식의 집' } },
      { id:'yuwongi', x:22, y:24, label:'유원기', fixed:true },
      { id:'sossang', x:12, y:16, label:'소쌍', fixed:true },
      { id:'jangsepyeong', x:14, y:17, label:'장세평', fixed:true },
      { id:'gongyung', x:11, y:12, label:'', discoverable:true, fixed:true, discoveryRange:2,
        discoveryText:'시장 좌판 옆에서 사람들의 언쟁을 조용히 듣던 선비가 문득 핵심을 찌르는 말을 던진다.',
        residence:{ x:32, y:11, label:'공융이 머무는 집' } },
      { id:'ganong', x:18, y:12, label:'간옹', randomSpawn:true },
      { id:'gwanhae', x:30, y:21, label:'관해(황건적 잔당)' },
      { id:'muangug', x:27, y:13, label:'무안국' },
      { id:'deungmu', x:33, y:23, label:'등무(황건적 두목)', fixed:true },
      { id:'jeongwonji', x:23, y:18, label:'정원지(황건적 잔당)', storyGate:'jeongwonjiEvent' },
    ],
    ambient:[
      ['merchant',8,13,'ash',2],['farmer',12,12,'earth',3],['woman',15,13,'ash',2],
      ['elder',18,9,'earth',2],['porter',22,13,'ash',3],['farmer',25,12,'earth',2],
      ['merchant',7,16,'ash',2],['child',17,16,'dust',2],['guard',18,4,'iron',2],
      ['guard',20,4,'iron',2],['woman',27,13,'dust',2],['porter',23,18,'earth',2],
      ['farmer',4,12,'ash',2],['merchant',14,17,'earth',2],
    ].map(([archetype,x,y,palette,wander]) => ({ archetype,x,y,palette,wander,roadOnly:true })),
  };
})();

// ---------------- 평원현 : 성내와 남문, 평야, 장순의 난 ----------------
(function () {
  const w = 40, h = 28;
  const grid = makeGrid(w, h, 0);

  // 성내 대로와 남문 출정로. 평원 바깥 길은 막사와 장순 진지로 이어진다.
  for (const r of [
    [17,0,20,27],[1,4,38,5],[1,10,38,13],[11,12,16,18],
    [2,16,16,18],[20,16,30,22],[28,21,36,25],
  ]) rectFill(grid, ...r, 1);

  // 배경의 가로 성벽과 정확히 맞춘 충돌. 남문 통로 두 칸(x17~18)만 통과 가능하다.
  rectFill(grid,0,14,16,15,4);
  rectFill(grid,19,14,39,15,4);

  // 성내 건물과 시장. 계단/문 앞의 길은 막지 않아 대화 위치로 사용할 수 있다.
  for (const r of [
    [4,1,12,3,2],[17,1,24,3,2],[29,1,35,3,2],
    [5,6,12,9,2],[15,6,22,9,2],[23,6,27,9,2],[32,7,37,10,2],
    [3,11,9,13,2],[27,11,33,13,2],
  ]) rectFill(grid,r[0],r[1],r[2],r[3],r[4]);

  // 큰 나무와 수풀도 몸으로 통과하지 못하게 한다. 작은 풀/돌은 장식으로 남긴다.
  for (const [x,y] of [
    [1,1],[13,1],[16,2],[26,1],[37,1],[2,4],[2,7],[14,4],[24,5],
    [29,7],[23,12],[36,13],[38,13],[13,17],[11,20],[32,19],[36,21],
    [14,23],[20,25],[35,26],
  ]) grid[y][x]=4;

  // 농경지/수로, 유비 막사, 장순의 불법 진지는 내부를 통과할 수 없다.
  rectFill(grid,1,19,10,26,4);
  rectFill(grid,22,16,29,19,2);
  rectFill(grid,31,23,37,26,2);
  rectFill(grid,0,27,17,27,3);

  MAPS.pyeongwon = {
    name:'평원현 · 남문과 평야', width:w, height:h, tiles:grid,
    backgroundKey:'pyeongwon_city_overview',
    playerStart:{ x:18, y:17 },
    camera:{ viewportW:800, viewportH:480 },
    foregroundCrops:[{ x:.39, y:.425, w:.13, h:.12 }],
    decor:[
      { type:'mapLabel', x:8.5, y:3.55, label:'민가', residenceIds:['yuyo'], revealedLabel:'유요의 집' },
      { type:'mapLabel', x:21.0, y:3.55, label:'민가', residenceIds:['jindeung','jingyu'], revealedLabel:'진등·진규의 집' },
      { type:'mapLabel', x:33.0, y:3.55, label:'민가', residenceIds:['choeyeom'], revealedLabel:'최염의 집' },
      { type:'mapLabel', x:8.5, y:8.75, label:'민가', residenceIds:['mijuk'], revealedLabel:'미축의 집' },
      { type:'mapLabel', x:18.8, y:8.75, label:'평원 주막' },
      { type:'mapLabel', x:29.5, y:11.3, label:'평원현 관아' },
      { type:'mapLabel', x:18.0, y:16.0, label:'평원현 남문' },
      { type:'mapLabel', x:26.0, y:20.4, label:'유비 세력 막사' },
      { type:'mapLabel', x:5.5, y:24.8, label:'평원 들판' },
      { type:'mapLabel', x:34.0, y:26.0, label:'장순 반란군 진지', storyGate:'jangsunAppeared' },
    ],
    areaLabels:[
      { x:18.5, y:13.4, text:'남문대로' },
      { x:18.5, y:19.2, text:'출정로' },
      { x:25.0, y:22.0, text:'평원 들길' },
    ],
    npcs:[
      { id:'yubi', x:30, y:20, label:'유비', fixed:true },
      { id:'jeonhae', x:13, y:12, label:'전해', randomSpawn:true },
      { id:'gwanjeong', x:18, y:5, label:'관정', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'주막으로 향하던 선비가 관우의 걸음을 유심히 바라본다.',
        residence:{ x:18, y:10, label:'관정' } },
      { id:'eomgang', x:28, y:5, label:'엄강', randomSpawn:true },
      { id:'jowoon', x:35, y:12, label:'조운(?)', randomSpawn:true },
      { id:'mijuk', x:26, y:12, label:'미축', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'단정한 차림의 상인이 장터의 물가와 사람들을 꼼꼼히 살피고 있다.',
        residence:{ x:8, y:10, label:'미축' } },
      { id:'mibang', x:25, y:12, label:'미방', randomSpawn:true },
      { id:'songgeon', x:14, y:5, label:'손건', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'주막 앞에서 죽간을 든 선비가 지나가는 소문을 기록하고 있다.',
        residence:{ x:20, y:10, label:'손건' } },
      { id:'jindeung', x:20, y:12, label:'진등', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'젊은 선비가 농지와 수로를 번갈아 보며 무언가를 계산하고 있다.',
        residence:{ x:20, y:5, label:'진등' } },
      { id:'jingyu', x:18, y:12, label:'진규', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'경륜 있어 보이는 노선비가 아들과 함께 세상 돌아가는 일을 논하고 있다.',
        residence:{ x:22, y:5, label:'진규' } },
      { id:'jangpae', x:11, y:12, label:'장패', randomSpawn:true },
      { id:'taesaja', x:36, y:5, label:'태사자', randomSpawn:true },
      { id:'yuyo', x:16, y:5, label:'유요', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'기품 있는 선비가 한실의 소식을 묻고 다닌다.',
        residence:{ x:8, y:5, label:'유요' } },
      { id:'choeyeom', x:34, y:12, label:'최염', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'수염을 단정히 기른 선비가 거리의 풍속을 말없이 살피고 있다.',
        residence:{ x:33, y:5, label:'최염' } },
      { id:'yujapyeong', x:15, y:12, label:'유자평', fixed:true },
      { id:'jangsun', x:30, y:24, label:'장순(반란군)', fixed:true, storyGate:'jangsunAppeared' },
    ],
    ambient:[
      ['merchant',13,5,'ash',2],['farmer',20,5,'earth',2],['woman',27,5,'ash',2],
      ['elder',14,12,'earth',2],['porter',22,12,'ash',2],['woman',25,12,'dust',2],
      ['guard',17,13,'iron',1],['guard',20,13,'iron',1],['child',11,12,'dust',2],
      ['farmer',16,17,'earth',2],['porter',20,18,'ash',2],['merchant',35,12,'earth',2],
    ].map(([archetype,x,y,palette,wander]) => ({ archetype,x,y,palette,wander,roadOnly:true })),
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
