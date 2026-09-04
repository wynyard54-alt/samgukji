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

  // 엑셀로 한 칸씩 검토해 보정한 결과.
  for (const [x,y,v] of [
    [1,4,4],[3,4,2],[4,4,2],[5,4,2],[14,4,4],[1,5,4],[14,5,4],[1,6,4],[14,6,4],[1,7,4],
    [14,7,4],[20,7,0],[21,7,0],[1,8,4],[14,8,4],[16,8,4],[20,8,0],[21,8,0],[24,8,1],[25,8,1],
    [26,8,1],[27,8,1],[28,8,1],[29,8,0],[30,8,1],[31,8,1],[32,8,1],[33,8,1],[34,8,1],[35,8,1],
    [1,9,4],[14,9,4],[15,9,4],[16,9,4],[24,9,1],[25,9,1],[26,9,1],[27,9,1],[28,9,1],[30,9,1],
    [31,9,1],[32,9,1],[33,9,1],[34,9,1],[35,9,1],[37,9,1],[1,10,4],[2,10,2],[3,10,2],[4,10,2],
    [5,10,2],[11,10,2],[12,10,2],[13,10,2],[28,10,1],[35,10,1],[37,10,1],[24,11,2],[25,11,2],[26,11,2],
    [27,11,2],[30,11,2],[31,11,2],[32,11,2],[33,11,2],[34,11,2],[37,11,1],[37,12,1],[19,13,1],[20,13,1],
    [21,13,1],[37,13,1],[2,14,2],[3,14,2],[4,14,2],[5,14,1],[6,14,1],[8,14,2],[13,14,2],[19,14,1],
    [22,14,4],[37,14,1],[2,15,2],[3,15,2],[4,15,2],[5,15,1],[6,15,1],[8,15,2],[13,15,2],[20,15,4],
    [21,15,4],[22,15,4],[37,15,1],[14,16,1],[15,16,1],[37,16,1],[37,17,1],[2,18,4],[3,18,2],[4,18,2],
    [5,18,2],[6,18,2],[7,18,2],[8,18,2],[9,18,4],[10,18,2],[11,18,2],[12,18,2],[13,18,2],[14,18,2],
    [15,18,2],[16,18,1],[37,18,1],[15,19,2],[16,19,1],[24,19,2],[25,19,2],[26,19,2],[36,19,0],[24,20,2],
    [27,20,1],[35,20,0],[1,21,4],[21,21,0],[22,21,0],[24,21,2],[27,21,1],[28,21,1],[29,21,1],[1,22,4],
    [25,22,1],[26,22,1],[27,22,1],[28,22,1],[29,22,1],[1,23,4],[2,23,4],[3,23,4],[4,23,4],[5,23,4],
    [6,23,4],[1,24,4],[2,24,4],[3,24,4],[4,24,4],[5,24,4],[6,24,4],[27,24,1],[29,24,1],[6,25,1],
    [7,25,1],[8,25,1],[9,25,1],[10,25,1],[11,25,1],[12,25,1],[13,25,1],[14,25,1],[15,25,1],[16,25,1],
    [17,25,1],[18,25,1],[19,25,1],[20,25,1],[21,25,1],[22,25,1],[23,25,1],[24,25,1],[25,25,1],[26,25,1],
    [27,25,1],[28,25,1],[29,25,1],[30,25,1],[31,25,1],[32,25,1],[33,25,1],[34,25,1],
  ]) grid[y][x] = v;

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
      { id:'muangug', x:22, y:8, label:'무안국' },
      { id:'deungmu', x:30, y:21, label:'등무(황건적 잔당)', fixed:true },
      { id:'jeongwonji', x:33, y:23, label:'정원지(황건적 두목)' },
      // 정원지(두목)를 처치하고 유비에게 보고하면 등장하는 두 번째 사건.
      { id:'goseung', x:23, y:18, label:'고승(황건적 잔당)', storyGate:'goseungEvent' },
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

// ---------------- 유주 어양 (구 평원현 배경 재사용) : 성내와 남문, 평야, 장순의 난 ----------------
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

  // 엑셀로 한 칸씩 검토해 보정한 결과.
  for (const [x,y,v] of [
    [1,1,0],[4,1,0],[13,1,0],[17,1,0],[24,1,0],[26,1,0],[37,1,0],[4,2,0],[16,2,0],[17,2,0],
    [24,2,0],[4,3,0],[17,3,0],[24,3,0],[2,4,1],[14,4,1],[24,5,1],[2,7,0],[29,7,0],[32,10,1],
    [33,10,1],[34,10,1],[35,10,1],[36,10,1],[37,10,1],[3,11,1],[4,11,1],[5,11,1],[6,11,1],[7,11,1],
    [8,11,1],[9,11,1],[27,11,1],[28,11,1],[29,11,1],[30,11,1],[31,11,1],[32,11,1],[33,11,1],[3,12,1],
    [9,12,1],[23,12,1],[3,13,1],[9,13,1],[36,13,1],[38,13,1],[13,17,1],[1,19,0],[2,19,1],[3,19,1],
    [4,19,1],[5,19,1],[6,19,1],[7,19,1],[8,19,1],[9,19,1],[10,19,1],[32,19,0],[1,20,0],[4,20,0],
    [5,20,0],[6,20,0],[7,20,0],[8,20,0],[9,20,0],[10,20,0],[11,20,0],[1,21,0],[4,21,0],[5,21,0],
    [6,21,0],[7,21,0],[8,21,0],[9,21,0],[10,21,0],[36,21,0],[1,22,0],[2,22,0],[3,22,0],[4,22,0],
    [5,22,0],[6,22,0],[7,22,0],[8,22,0],[9,22,0],[10,22,0],[1,23,0],[2,23,0],[3,23,0],[4,23,0],
    [5,23,0],[6,23,0],[7,23,0],[8,23,0],[9,23,0],[10,23,0],[14,23,0],[1,24,0],[2,24,0],[3,24,0],
    [4,24,0],[5,24,0],[6,24,0],[7,24,0],[8,24,0],[9,24,0],[10,24,0],[1,25,0],[2,25,0],[3,25,0],
    [4,25,0],[5,25,0],[6,25,0],[7,25,0],[8,25,0],[9,25,0],[10,25,0],[20,25,1],[1,26,0],[2,26,0],
    [3,26,0],[4,26,0],[5,26,0],[6,26,0],[7,26,0],[8,26,0],[9,26,0],[10,26,0],[0,27,0],[1,27,0],
    [2,27,0],[3,27,0],[4,27,0],[5,27,0],[6,27,0],[7,27,0],[8,27,0],[9,27,0],[10,27,0],[11,27,0],
    [12,27,0],[13,27,0],[14,27,0],[15,27,0],[16,27,0],[17,27,1],
  ]) grid[y][x] = v;

  MAPS.pyeongwon = {
    name:'유주 · 어양', width:w, height:h, tiles:grid,
    backgroundKey:'pyeongwon_city_overview',
    playerStart:{ x:18, y:17 },
    camera:{ viewportW:800, viewportH:480 },
    foregroundCrops:[{ x:.39, y:.425, w:.13, h:.12 }],
    decor:[
      { type:'mapLabel', x:8.5, y:3.55, label:'민가', residenceIds:['yuyo'], revealedLabel:'유요의 집' },
      { type:'mapLabel', x:21.0, y:3.55, label:'민가', residenceIds:['jeonju'], revealedLabel:'전주의 집' },
      { type:'mapLabel', x:33.0, y:3.55, label:'민가', residenceIds:['choeyeom'], revealedLabel:'최염의 집' },
      { type:'mapLabel', x:18.8, y:8.75, label:'어양 주막' },
      { type:'mapLabel', x:29.5, y:11.3, label:'어양 관청' },
      { type:'mapLabel', x:18.0, y:16.0, label:'어양 남문' },
      { type:'mapLabel', x:26.0, y:20.4, label:'유비 세력 막사' },
      { type:'mapLabel', x:5.5, y:24.8, label:'어양 들판' },
      { type:'mapLabel', x:34.0, y:26.0, label:'장순 반란군 진지', storyGate:'jangsunAppeared' },
    ],
    areaLabels:[
      { x:18.5, y:13.4, text:'남문대로' },
      { x:18.5, y:19.2, text:'출정로' },
      { x:25.0, y:22.0, text:'어양 들길' },
    ],
    npcs:[
      { id:'yubi', x:24, y:20, label:'유비', fixed:true },
      { id:'jeonhae', x:13, y:12, label:'전해', randomSpawn:true },
      { id:'gwanjeong', x:18, y:5, label:'관정', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'주막으로 향하던 선비가 관우의 걸음을 유심히 바라본다.',
        residence:{ x:18, y:10, label:'관정' } },
      { id:'eomgang', x:28, y:5, label:'엄강', randomSpawn:true },
      { id:'jowoon', x:35, y:12, label:'조운(?)', randomSpawn:true },
      { id:'jeonju', x:20, y:12, label:'', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'마을에서 떠들썩한 소리가 들린다. "선생님, 이제 세상에 나가셔야죠." "자네만한 인재가 없는데 왜 이곳에서 서책만 읽는가?"',
        residence:{ x:20, y:5, label:'전주' } },
      { id:'songgeon', x:14, y:5, label:'손건', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'주막 앞에서 죽간을 든 선비가 지나가는 소문을 기록하고 있다.',
        residence:{ x:20, y:10, label:'손건' } },
      { id:'jeonye', x:27, y:21, label:'', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'유비 세력 막사 근처를 서성이던 젊은 학자가, 삼형제를 유심히 바라보다 다가온다.' },
      { id:'yeomyu', x:36, y:16, label:'', randomSpawn:true, discoverable:true, discoveryRange:2, hideAfterJangsun:true,
        discoveryText:'성벽 밖에서 병사들이 수군거린다. "오환을 움직여 이 반란을 잠재우려면, 그 사람밖에 없다는데."' },
      { id:'jangpae', x:11, y:12, label:'장패', randomSpawn:true },
      { id:'taesaja', x:36, y:5, label:'태사자', randomSpawn:true },
      { id:'yuyo', x:16, y:5, label:'유요', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'기품 있는 선비가 한실의 소식을 묻고 다닌다.',
        residence:{ x:8, y:5, label:'유요' } },
      { id:'choeyeom', x:34, y:12, label:'최염', randomSpawn:true, discoverable:true, discoveryRange:2,
        discoveryText:'수염을 단정히 기른 선비가 거리의 풍속을 말없이 살피고 있다.',
        residence:{ x:33, y:5, label:'최염' } },
      { id:'yuwoo', x:25, y:13, label:'유우', fixed:true },
      { id:'jangsun', x:30, y:27, label:'장순(반란군)', fixed:true, storyGate:'jangsunAppeared' },
      { id:'gwanhae', x:6, y:22, label:'관해(황건적 잔당)' },
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
  const w = 24, h = 16;
  const grid = makeGrid(w, h, 0);

  // 외곽 숲/바위. 남쪽 정문(관문)만 열어둔다.
  rectFill(grid, 0, 0, w - 1, 0, 4);
  rectFill(grid, 0, h - 1, w - 1, h - 1, 4);
  rectFill(grid, 0, 0, 0, h - 1, 4);
  rectFill(grid, w - 1, 0, w - 1, h - 1, 4);
  rectFill(grid, 11, h - 1, 13, h - 1, 0); // 남문 통로

  // 배경 그림의 5개 막사 자리만 막고, 나머지 지면은 전부 트여있게 두어
  // 어디로 가든 걸리지 않는 동선을 확보한다. 남쪽의 두 막사(손견/유비)는
  // 지도 남쪽 외곽과 가까워 한 칸만 얕게 잡아 문 앞에 설 자리를 남긴다.
  rectFill(grid, 10, 0, 14, 3, 2);  // 원소 맹주 막사 (12시)
  rectFill(grid, 1, 3, 6, 7, 2);    // 조조 막사 (10시)
  rectFill(grid, 17, 3, 22, 7, 2);  // 공손찬 막사 (2시)
  rectFill(grid, 1, 10, 6, 13, 2);  // 손견 막사 (7시)
  rectFill(grid, 17, 10, 22, 13, 2); // 유비 막사 (5시)

  MAPS.camp = {
    name: '반동탁연합 진영',
    width: w, height: h,
    tiles: grid,
    backgroundKey: 'camp_overview',
    playerStart: { x:12, y:14 },
    camera: { viewportW:800, viewportH:480 },
    decor: [
      { type:'mapLabel', x:12.0, y:1.5, label:'원소 맹주 막사' },
      { type:'mapLabel', x:3.5, y:5.0, label:'조조 막사' },
      { type:'mapLabel', x:19.5, y:5.0, label:'공손찬 막사' },
      { type:'mapLabel', x:3.5, y:12.0, label:'손견 막사' },
      { type:'mapLabel', x:19.5, y:12.0, label:'유비 막사' },
    ],
    // 다섯 명 모두 각자 막사의 문 앞, 대로로 이어지는 길목에 세운다.
    npcs: [
      { id:'wonso', x:12, y:4, label:'원소', fixed:true },
      { id:'jojo', x:4, y:8, label:'조조', fixed:true },
      { id:'gongsonchan', x:19, y:8, label:'공손찬', fixed:true },
      { id:'songyeon', x:4, y:14, label:'손견', fixed:true },
      { id:'yubi', x:19, y:14, label:'유비', fixed:true },
    ],
  };
})();

// ---------------- 호로관 전선 (사수관 이후 잔당 소탕 + 여포) ----------------
(function () {
  const w = 40, h = 28;
  const grid = makeGrid(w, h, 0);

  // 우측은 그대로 절벽지대라 전부 이동불가. 좌측도 절벽이지만 장식용 오솔길이
  // 하나 있어 그 한 칸 폭만 남기고 나머지는 막는다 (실제 진행로로는 쓰지 않음).
  rectFill(grid, 32, 0, w - 1, h - 1, 4);
  rectFill(grid, 0, 0, 6, h - 1, 4);
  const leftTrail = [
    [1,27],[2,25],[3,23],[2,21],[3,19],[4,17],[3,15],
    [2,13],[3,11],[2,9],[3,7],[2,5],[3,3],[2,1],
  ];
  for (let i = 0; i < leftTrail.length - 1; i++) {
    const [x0,y0] = leftTrail[i], [x1,y1] = leftTrail[i + 1];
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let s = 0; s <= steps; s++) {
      grid[Math.round(y0 + (y1 - y0) * s / steps)][Math.round(x0 + (x1 - x0) * s / steps)] = 0;
    }
  }

  // 상단 호로관 성벽/관문. 실제 통과 지점이 아니라 배경 그대로 막힌 벽으로 둔다.
  rectFill(grid, 7, 0, 31, 4, 2);

  // 하단 출정로 목책 두 무더기. 사이와 바깥쪽 동선은 그대로 열어둔다.
  rectFill(grid, 13, 24, 16, 26, 4);
  rectFill(grid, 24, 24, 27, 26, 4);

  MAPS.warmap = {
    name: '호로관 전선',
    width: w, height: h,
    tiles: grid,
    backgroundKey: 'warmap_overview',
    apMovement: true, // 이동시 행동력을 소모하는 전쟁맵 (일반타일 1, 험지 2배)
    playerStart: { x:20, y:26 },
    camera: { viewportW:800, viewportH:480 },
    decor: [
      { type:'mapLabel', x:20, y:2.0, label:'호로관' },
      { type:'mapLabel', x:20, y:25.5, label:'출정로' },
    ],
    npcs: [
      { id:'jojo', x:17, y:25, label:'조조 군세', fixed:true },
      { id:'wonso', x:23, y:25, label:'원소 군세', fixed:true },
      { id:'hojin', x:20, y:20, label:'호진 군세', fixed:true },
      { id:'songheon', x:20, y:15, label:'송헌 군세', fixed:true },
      { id:'wisok', x:20, y:11, label:'위속 군세', fixed:true },
      { id:'yeopo', x:20, y:7, label:'여포 군세', fixed:true },
      // 함곡관에서 정식으로 맞붙기 전, 성 뒤쪽에 대기 중인 모습만 보여주는
      // 장식용 NPC. 대화만 있고 여기서 전투/등용은 일어나지 않는다.
      { id:'igak', x:15, y:5, label:'이각', fixed:true },
      { id:'gwaksa', x:25, y:5, label:'곽사', fixed:true },
    ],
  };
})();
