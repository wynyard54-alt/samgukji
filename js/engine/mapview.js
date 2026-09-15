const MapView = (function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const viewportEl = document.getElementById('explore-viewport');
  const TILE = 40;
  const DEFAULT_VIEW_W = 800;
  const DEFAULT_VIEW_H = 480;

  const TILE_BLOCKED = { 2:true, 3:true, 4:true };
  const TILE_ROUGH = { 5:true }; // 산악/강물 등 험지 - 통행 가능하지만 이동력 2배 소모
  const PALETTES = {
    ash:   { robe:'#78766f', dark:'#504f4a', trim:'#aaa69b', skin:'#d1ab82' },
    earth: { robe:'#7b6652', dark:'#51453b', trim:'#9b8a73', skin:'#cfaa83' },
    dust:  { robe:'#89837a', dark:'#5a5752', trim:'#aca59a', skin:'#d5af88' },
    iron:  { robe:'#666c6b', dark:'#3d4344', trim:'#8f9692', skin:'#c99f78' },
  };

  let map = null;
  let mapId = null;
  let player = { x:0, y:0, dir:'down' };
  let camera = { x:0, y:0, w:DEFAULT_VIEW_W, h:DEFAULT_VIEW_H };
  let onInteract = null;
  let onApBlocked = null;
  let onApSpent = null;
  let onStep = null; // onApSpent와 달리 행동력 소모 여부와 무관하게 실제로 한 칸 움직일 때마다 불린다 (미니맵 등 즉각 갱신용)
  let onAmbientInteract = null;
  let onAllyEngage = null; // 플레이어가 아닌 아군(회남 벌판의 유비군 등)이 자기 목표를 향해 다가가 인접하면 호출된다
  let spawnDeadlineAbs = null; // 랜덤 등장 장수가 마감 기한의 50% 안쪽에 나오도록 하는 절대 개월수 상한
  // 회남 벌판의 속도순 전투에서 유비군 차례가 되면, WASD 조작 대상을 문자
  // 그대로의 player 대신 이 id의 npc로 잠깐 바꾼다(setControlledUnit 참고).
  // null이면 지금까지처럼 player가 조작 대상이다.
  let controlledId = null;
  let liveNpcs = [];
  let crowd = [];
  let crowdTimer = null;
  let animFrame = 0;
  let ambientEvents = []; // [{ index, kind }] - 지나가던 백성 중 최대 2명에게 지금 걸린 말풍선 이벤트
  const AMBIENT_EVENT_CHANCE = 0.8;
  const AMBIENT_EVENT_MAX = 2;
  window.addEventListener('fieldassetload', () => { if (map) render(); });

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function worldX(tx) { return tx * TILE - camera.x; }
  function worldY(ty) { return ty * TILE - camera.y; }

  // 화면이 세로로 길고 좁을 때(모바일을 세로로 들고 있을 때)는 CSS에서 body 전체를
  // 90도 회전시켜 처음부터 가로 게임 화면처럼 보여준다 (css/style.css의 회전 규칙 참고).
  // 그 상태에서는 실제로 화면에 보이는 가로/세로 폭이 물리적 세로/가로 길이와 서로
  // 맞바뀌므로, 캔버스 크기도 window.innerWidth/innerHeight를 바꿔 넣어 계산해야 한다.
  // vw/vh 같은 CSS 뷰포트 단위는 회전 트랜스폼 아래에서 실기기 브라우저마다 다르게
  // 계산되는 경우가 있어(카카오톡 인앱 브라우저 등), 여기서는 JS로 직접 픽셀 값을
  // 계산해 #explore-viewport에 그대로 적용한다 - 여백을 최소화해 화면을 최대한 채운다.
  const MAX_DESKTOP_VIEW_W = 1400; // 데스크톱에서 창이 아주 커도 지나치게 확대되지 않도록 두는 상한

  // css/style.css의 회전 규칙(@media (orientation:portrait) and (max-width:1024px))과
  // 정확히 같은 조건이어야 한다 - 실제로 body가 90도 돌아가 있는 상태를 판단하는 데
  // 쓰인다.
  function isRotatedPresentation() {
    return window.innerWidth > 0 && window.innerHeight > 0 &&
      window.innerWidth < window.innerHeight && window.innerWidth <= 1024;
  }

  function computeCameraSize(map) {
    const baseW = (map.camera && map.camera.viewportW) || Math.min(DEFAULT_VIEW_W, map.width * TILE);
    const baseH = (map.camera && map.camera.viewportH) || Math.min(DEFAULT_VIEW_H, map.height * TILE);
    const isRotated = isRotatedPresentation();
    if (isRotated) {
      // 회전된 상태의 가용 가로폭은 물리적 세로 길이, 가용 세로폭은 물리적 가로
      // 길이에서 안내문구 한 줄 정도의 최소 공간만 뺀 값이다. 타일 카메라는
      // 정해진 그림이 아니라 격자를 그대로 보여주는 창이라 가로세로 비율을
      // 지킬 필요가 없다(격자를 더 보여주거나 덜 보여줄 뿐 찌그러지지 않는다).
      // 예전에는 baseW/baseH 비율을 억지로 지키려고 letterbox(빈 여백)를
      // 남겼는데, 그게 세로 모바일(특히 웹뷰로 감싼 APK)에서 화면 위아래에
      // 큰 여백이 남는 원인이었다 - 비율 맞추기를 포기하고 가로/세로 각각
      // 꽉 채운다.
      // body에 준 안전영역 패딩(css/style.css의 회전 규칙 참고 - 안드로이드
      // 내비게이션 바 위에 버튼이 겹쳐 눌리지 않도록 둔 여백)만큼도 실제
      // 가용 공간에서 빼야 화면 밖으로 밀려나거나 다시 겹치지 않는다.
      const bodyStyle = getComputedStyle(document.body);
      const padX = (parseFloat(bodyStyle.paddingLeft) || 0) + (parseFloat(bodyStyle.paddingRight) || 0);
      const padY = (parseFloat(bodyStyle.paddingTop) || 0) + (parseFloat(bodyStyle.paddingBottom) || 0);
      const availW = window.innerHeight * 0.995 - padX;
      const availH = Math.max(200, window.innerWidth - 30 - padY);
      const w = Math.min(baseW * 1.6, availW);
      const h = Math.min(baseH * 1.6, availH);
      return { w: Math.round(w), h: Math.round(h) };
    }
    // 데스크톱/일반 가로화면: 지도 설계 비율(letterbox)을 유지한 채 창 크기에
    // 맞춘다 - 예전에는 항상 baseW(보통 800)로 고정되어 큰 창에서 여백이
    // 크게 남았다.
    const ratio = baseW / baseH;
    const availW = window.innerWidth * 0.98;
    const availH = Math.max(200, window.innerHeight - 40);
    let w = Math.min(MAX_DESKTOP_VIEW_W, availW);
    let h = w / ratio;
    if (h > availH) { h = availH; w = h * ratio; }
    return { w: Math.round(w), h: Math.round(h) };
  }

  const COMPACT_HUD_THRESHOLD = 700; // 실제 렌더링된 지도 폭이 이보다 좁으면 HUD를 컴팩트 배치로 전환

  // computeCameraSize의 결과를 캔버스 내부 해상도와 #explore-viewport의 실제 표시
  // 크기 양쪽에 그대로 반영한다 - CSS min()/vw/vh 계산에 기대지 않고 항상 일치시킨다.
  // 컴팩트 HUD 여부도 (창 너비가 아니라) 실제로 계산된 지도 폭을 기준으로 판단한다 -
  // 창은 넓어도 세로 공간이 부족해 지도가 좁게 그려지는 경우(가로로 든 폰 등)가 있어서다.
  function applyCameraSize() {
    if (!map) return;
    const size = computeCameraSize(map);
    camera.w = size.w;
    camera.h = size.h;
    canvas.width = camera.w;
    canvas.height = camera.h;
    // CSS의 #game-canvas{width:100%;height:auto}가 내부 해상도(camera.w/h)
    // 비율로 알아서 표시 크기를 맞춰주는 데 기대는 대신, 여기서 직접
    // 픽셀로 못박는다 - handleCanvasTap이 canvas.getBoundingClientRect()로
    // 되돌려 계산하는 sx/sy 배율이 이 표시 크기에 그대로 의존하므로, 자동
    // 계산이 어긋나는 환경(카카오톡 인앱 브라우저 등)에서는 클릭이 전부
    // 엉뚱한 칸으로 판정될 수 있다.
    canvas.style.width = camera.w + 'px';
    canvas.style.height = camera.h + 'px';
    if (viewportEl) {
      viewportEl.style.width = camera.w + 'px';
      // 높이는 CSS의 #game-canvas{height:auto}가 캔버스 width/height 속성
      // 비율로부터 알아서 계산해주는 데 맡겨왔는데, 그 계산을 신뢰할 수
      // 없는 웹뷰(카카오톡 인앱 브라우저 등)에서는 여기서 구한 camera.w/h
      // 비율과 실제 화면에 그려지는 높이가 어긋날 수 있다 - 그러면 클릭
      // 핸들러가 canvas.getBoundingClientRect()로 되돌려 계산하는 sx/sy
      // 배율 전체가 틀어져, 화면에 보이는 범위 하이라이트와 달리 클릭이
      // 전부 엉뚱한 칸으로 판정될 수 있다. width처럼 height도 직접 픽셀로
      // 못박아 그 계산 자체를 없앤다.
      viewportEl.style.height = camera.h + 'px';
      viewportEl.classList.toggle('compact', camera.w < COMPACT_HUD_THRESHOLD);
      // 회전 프리젠테이션(세로로 든 모바일)은 계산된 지도 폭 자체는 넓게 잡힐 때가
      // 많아 .compact(폭 기준)가 안 걸리지만, 실기기 화면은 작으므로 인물 스텟
      // 패널만이라도 항상 작게 줄인다 - 다른 컴팩트 레이아웃(하단 메뉴/터치패드
      // 위치 등)까지 건드리면 폭이 넓은 회전 화면에서 오히려 어긋날 수 있어
      // 패널 하나로 범위를 좁혔다.
      viewportEl.classList.toggle('player-compact', isRotatedPresentation());
    }
    updateCamera(true);
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (!map) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { applyCameraSize(); render(); }, 120);
  });
  window.addEventListener('orientationchange', () => {
    if (!map) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { applyCameraSize(); render(); }, 120);
  });

  function load(id, opts) {
    // 이전 지도에서 진행 중이던 컷신 연출(카메라 고정/군세 술렁임)이 있었다면
    // 새 지도로 넘어갈 때 확실히 정리한다.
    if (cameraPanTimer) { clearInterval(cameraPanTimer); cameraPanTimer = null; }
    if (stirTimer) { clearInterval(stirTimer); stirTimer = null; }
    stirHomes = null;
    cameraFocus = null;
    mapId = id;
    map = MAPS[id];
    player = { x:map.playerStart.x, y:map.playerStart.y, dir:'down' };
    footTileCount = 0;
    onInteract = (opts && opts.onInteract) || null;
    onApBlocked = (opts && opts.onApBlocked) || null;
    onApSpent = (opts && opts.onApSpent) || null;
    onStep = (opts && opts.onStep) || null;
    onAmbientInteract = (opts && opts.onAmbientInteract) || null;
    onAllyEngage = (opts && opts.onAllyEngage) || null;
    spawnDeadlineAbs = (opts && opts.spawnDeadlineAbsMonth) || null;
    ambientEvents = [];

    liveNpcs = map.npcs.filter((n) => {
      const rd = ROSTER[n.id];
      if (rd && rd.chance != null) {
        if (!(n.id in GameState.npcVisible)) GameState.npcVisible[n.id] = Math.random() < rd.chance;
        if (!GameState.npcVisible[n.id]) return false;
      }
      const status = GameState.npcStatus[n.id];
      const fixedInTown =
        (id === 'takhyeon' && (n.id === 'yubi' || n.id === 'yuwongi')) ||
        (id === 'pyeongwon' && n.id === 'yubi') ||
        id === 'habi'; // 관청 안의 인물들은 등용/처치 상태와 무관하게 늘 그 자리에 있다
      if (status === 'dead' || status === 'fled') return false;
      if ((status === 'recruited' || status === 'resolved') && !fixedInTown && !n.residence) return false;
      if (n.randomSpawn && !GameState.npcSpawnPos[n.id]) return false; // 아직 등장 시점이 되지 않음
      if (n.storyGate && !GameState.flags[n.storyGate]) return false; // 특정 스토리 이벤트 전에는 등장하지 않음
      // 아직 만나지 않은 상태로 장순의 난이 이미 끝났다면(제안의 명분 자체가 사라졌으므로)
      // 더는 새로 등장시키지 않는다. 이미 만난 뒤라면(관계가 진행 중이므로) 그대로 둔다.
      if (n.hideAfterJangsun && !status && GameState.npcStatus['jangsun'] === 'resolved') return false;
      return true;
    });
    for (const n of liveNpcs) {
      if (n.randomSpawn && GameState.npcSpawnPos[n.id]) { n.x = GameState.npcSpawnPos[n.id].x; n.y = GameState.npcSpawnPos[n.id].y; }
    }
    // chance 판정에서 이번 회차에 아예 등장하지 않기로 정해진 인물은 예약 대상에서도 제외한다.
    for (const n0 of map.npcs) {
      if (!n0.randomSpawn || GameState.npcStatus[n0.id] || isRolledInvisible(n0.id)) continue;
      scheduleSpawn(n0.id);
    }

    crowd = (map.ambient || []).map((a, i) => ({ ...a, _id:`ambient_${i}`, _homeX:a.x, _homeY:a.y, _dir:'down' }));

    applyCameraSize();
    startCrowd();
    render();
  }

  function startCrowd() {
    if (crowdTimer) clearInterval(crowdTimer);
    if (!crowd.length) return;
    crowdTimer = setInterval(() => {
      animFrame++;
      for (const p of crowd) {
        if (Math.random() > 0.58) continue;
        const dirs = [[0,-1,'up'],[0,1,'down'],[-1,0,'left'],[1,0,'right']];
        const [dx,dy,dir] = dirs[Math.floor(Math.random()*dirs.length)];
        const nx = p.x + dx, ny = p.y + dy;
        const radius = p.wander == null ? 2 : p.wander;
        if (Math.abs(nx-p._homeX) > radius || Math.abs(ny-p._homeY) > radius) continue;
        if (!isNpcWalkable(p, nx, ny)) continue;
        if (Math.round(nx) === player.x && Math.round(ny) === player.y) continue;
        p.x = nx; p.y = ny; p._dir = dir;
      }
      render();
    }, 720);
  }

  // 지금 WASD로 실제 조작하는 대상 - controlledId가 없으면(대부분의 지도)
  // 지금까지처럼 player 그대로다. 회남 벌판에서 유비군 차례가 되면 이 함수가
  // liveNpcs 안의 'yubi' npc를 대신 반환해, 이동/카메라 로직이 손대지 않고도
  // 자연스럽게 그쪽을 따라가게 한다.
  function activeMover() {
    return controlledId ? liveNpcs.find((n) => n.id === controlledId) : player;
  }

  // 회남 벌판의 속도순 전투 전용 - 조작 대상을 player 대신 다른 npc(유비 등)로
  // 바꾼다. id가 null/미지정이면 다시 player로 되돌아온다.
  function setControlledUnit(id) {
    controlledId = id || null;
    updateCamera(true);
    render();
  }

  // 컷신 중 잠시 카메라를 플레이어가 아닌 다른 지점(예: 성벽 밖 적 군세)에
  // 고정해두고 싶을 때 쓰는 오버라이드. null이면 평소대로 조작 대상(player 또는
  // controlledId가 가리키는 npc)을 따라간다.
  let cameraFocus = null;
  function updateCamera(snap) {
    if (!map) return;
    const mover = activeMover() || player;
    const fx = cameraFocus ? cameraFocus.x : mover.x;
    const fy = cameraFocus ? cameraFocus.y : mover.y;
    const targetX = fx*TILE + TILE/2 - camera.w/2;
    const targetY = fy*TILE + TILE/2 - camera.h/2;
    const maxX = Math.max(0, map.width*TILE - camera.w);
    const maxY = Math.max(0, map.height*TILE - camera.h);
    camera.x = clamp(targetX, 0, maxX);
    camera.y = clamp(targetY, 0, maxY);
    if (!snap) { camera.x = Math.round(camera.x); camera.y = Math.round(camera.y); }
  }

  // 카메라를 (x,y) 타일로 부드럽게 이동시켜 그 지점에 고정한다 - 대사 도중 화면
  // 전환 없이 "성벽 밖 적진을 비춘다" 같은 연출에 쓴다. clearCameraFocus()를
  // 부르기 전까지는 플레이어가 움직여도 카메라가 따라가지 않는다.
  let cameraPanTimer = null;
  function panCameraTo(x, y, durationMs) {
    if (!map) return;
    if (cameraPanTimer) { clearInterval(cameraPanTimer); cameraPanTimer = null; }
    const startX = camera.x, startY = camera.y;
    const maxX = Math.max(0, map.width*TILE - camera.w);
    const maxY = Math.max(0, map.height*TILE - camera.h);
    const endX = clamp(x*TILE + TILE/2 - camera.w/2, 0, maxX);
    const endY = clamp(y*TILE + TILE/2 - camera.h/2, 0, maxY);
    cameraFocus = { x, y };
    const steps = Math.max(1, Math.round((durationMs || 600) / 40));
    let i = 0;
    cameraPanTimer = setInterval(() => {
      i++;
      const t = Math.min(1, i / steps);
      camera.x = startX + (endX - startX) * t;
      camera.y = startY + (endY - startY) * t;
      render();
      if (t >= 1) { clearInterval(cameraPanTimer); cameraPanTimer = null; }
    }, 40);
  }

  function clearCameraFocus() {
    cameraFocus = null;
    if (cameraPanTimer) { clearInterval(cameraPanTimer); cameraPanTimer = null; }
    if (map) { updateCamera(true); render(); }
  }

  // 성벽 밖에 늘어선 서사 전용 군세가 가만히 서있지만 않고 술렁이는 모습을
  // 잠깐 보여주는 연출용 - 각자 원래 자리를 중심으로 radius 칸 안에서만
  // 오간다. stopNpcStir()가 원래 자리로 되돌려놓고 멈춘다.
  let stirTimer = null;
  let stirHomes = null;
  function startNpcStir(ids, opts) {
    stopNpcStir();
    const radius = (opts && opts.radius) || 3;
    const intervalMs = (opts && opts.intervalMs) || 450;
    stirHomes = {};
    for (const id of ids) {
      const n = liveNpcs.find((x) => x.id === id);
      if (n) stirHomes[id] = { x: n.x, y: n.y };
    }
    stirTimer = setInterval(() => {
      for (const id of ids) {
        const n = liveNpcs.find((x) => x.id === id);
        const home = stirHomes[id];
        if (!n || !home) continue;
        const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
        const [dx,dy] = dirs[Math.floor(Math.random()*dirs.length)];
        const nx = n.x+dx, ny = n.y+dy;
        if (Math.abs(nx-home.x) > radius || Math.abs(ny-home.y) > radius) continue;
        if (!isWalkable(nx,ny)) continue;
        if (nx === player.x && ny === player.y) continue;
        n.x = nx; n.y = ny;
      }
      render();
    }, intervalMs);
  }

  function stopNpcStir() {
    if (stirTimer) { clearInterval(stirTimer); stirTimer = null; }
    if (stirHomes) {
      for (const id in stirHomes) {
        const n = liveNpcs.find((x) => x.id === id);
        if (n) { n.x = stirHomes[id].x; n.y = stirHomes[id].y; }
      }
      stirHomes = null;
    }
    if (map) render();
  }

  function effectiveNpc(n) {
    const rd = ROSTER[n.id];
    // 등용된 뒤에도 저택에 그대로 남아 모병/훈련 창구 역할을 한다.
    const metOrRecruited = ['met', 'recruited'].includes(GameState.npcStatus[n.id]);
    if (n.residence && metOrRecruited && rd && rd.kind === 'recruit' && isScholarType(rd)) {
      return { ...n, x:n.residence.x, y:n.residence.y, _atResidence:true, _label:n.residence.label || `${rd.name}의 집` };
    }
    return { ...n, _atResidence:false };
  }

  function npcAt(x, y) {
    return liveNpcs.map(effectiveNpc).find((n) => n.x === x && n.y === y);
  }

  function isWalkable(x, y) {
    if (!map || x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
    const tile = map.tiles[Math.round(y)] && map.tiles[Math.round(y)][Math.round(x)];
    return !TILE_BLOCKED[tile];
  }

  function isNpcWalkable(person, x, y) {
    if (!isWalkable(x, y)) return false;
    if (person && person.roadOnly === false) return true;
    const row = map.tiles[Math.round(y)];
    return !person || !person.roadOnly || (!!row && row[Math.round(x)] === 1);
  }

  function tileMoveCost(x, y) {
    const tile = map.tiles[Math.round(y)] && map.tiles[Math.round(y)][Math.round(x)];
    return TILE_ROUGH[tile] ? 2 : 1;
  }

  // 사거리가 "말로는 맞는데 실제로 눌러보면 안 된다"는 혼선이 반복돼서,
  // 지금 조작 중인 유닛의 실제 공격 가능 범위를 반투명 타일로 화면에 직접
  // 그려준다 - 클릭 판정(handleCanvasTap)과 정확히 같은 controlledArmyRange/
  // inAttackRange를 쓰므로, 여기 칠해진 칸과 실제로 클릭했을 때 반응하는
  // 칸이 어긋날 수가 없다(하나가 달라 보이면 그 자체가 진짜 버그를 잡을
  // 단서가 된다). 이동에 행동력을 쓰는 전쟁 지도(apMovement)에서만 표시한다.
  function drawAttackRangeOverlay() {
    if (!map.apMovement) return;
    const mover = activeMover();
    if (!mover) return;
    const range = controlledArmyRange();
    if (range <= 0) return;
    // 흙길 지형이 이미 노란빛이라 노란/갈색 계열 반투명은 거의 안 보였다 -
    // 지형에 잘 안 섞이는 하늘색 계열로 채우고, 타일마다 얇은 테두리를 더해
    // 배경이 무슨 색이든(어두운 숲/밝은 흙길 등) 구분은 되게 하되, 처음
    // 진단용으로 넣었을 때의 진하고 눈에 확 띄는 색(불투명도 0.38 채움 +
    // 굵은 2px 테두리)은 실제 UI로 계속 쓰기엔 촌스럽다는 피드백을 받아
    // 옅고 은은하게 낮췄다.
    ctx.fillStyle = 'rgba(120, 205, 245, 0.16)';
    ctx.strokeStyle = 'rgba(90, 180, 225, 0.4)';
    ctx.lineWidth = 1;
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        if (dx === 0 && dy === 0) continue;
        const tx = mover.x + dx, ty = mover.y + dy;
        if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
        if (!inAttackRange(mover, { x: tx, y: ty }, range)) continue;
        ctx.fillRect(worldX(tx), worldY(ty), TILE, TILE);
        ctx.strokeRect(worldX(tx) + 1, worldY(ty) + 1, TILE - 2, TILE - 2);
      }
    }
  }

  function render() {
    if (!map) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (map.backgroundKey) drawMapBackground();
    else {
      drawGround();
      drawBackDecor();
    }
    drawFireTiles();
    drawAreaLabels();
    if (map.backgroundKey) drawMapLandmarkLabels();
    drawAttackRangeOverlay();

    const actors = [];
    crowd.forEach((p, idx) => actors.push({ type:'ambient', y:p.y, data:p, idx }));
    for (const n0 of liveNpcs) {
      const n = effectiveNpc(n0);
      actors.push({ type:'npc', y:n.y, data:n });
    }
    actors.push({ type:'player', y:player.y, data:player });
    actors.sort((a,b) => a.y - b.y);

    for (const a of actors) {
      if (a.type === 'ambient') drawAmbient(a.data, ambientEvents.some((e) => e.index === a.idx));
      else if (a.type === 'npc') drawNpc(a.data);
      else drawHero();
    }

    if (map.backgroundKey) drawMapForegroundCrops();
    else drawFrontDecor();
    drawLocationRibbon();
    updateHudFade();
  }

  // 관우가 미션 배너/미니맵/스탯 패널 뒤로 지나가면 그 밑에 가려 안 보이는
  // 문제가 있었다 - 패널 영역과 캐릭터의 화면상 실제 위치(캔버스 CSS 표시
  // 크기 기준으로 환산)가 겹치는 동안만 반투명하게 만들어 인물이 비쳐 보이게 한다.
  // 발밑 한 점만 검사하면(예전 방식) 캐릭터 몸통/머리가 이미 패널에 걸쳐
  // 있어도 발이 패널 바깥이면 안 걸린 걸로 판정돼 실제로는 반쯤 가려진 채
  // 안 뜨는 경우가 있었다 - drawHero()의 스프라이트 앵커(발밑)를 기준으로
  // 캐릭터가 차지하는 대략적인 사각형(좌우 TILE, 위로 2TILE 정도) 전체가
  // 패널과 겹치는지를 본다.
  //
  // player 객체는 항상 관우 한 명만 가리킨다 - 회수평야처럼 유비군을 따로
  // 조작하는 지도에서는 그 turn 동안 실제로 움직이는 쪽이 liveNpcs 안의
  // 'yubi' 항목이라, player만 보면 유비가 패널 뒤로 들어가도 전혀 안 잡혔다.
  // 그래서 관우(player)뿐 아니라 지도에 유비가 있으면 그 위치도 함께 본다.
  const HUD_FADE_PANEL_IDS = ['location-banner', 'minimap-panel', 'player-panel'];
  function actorFadeBox(rect, scaleX, scaleY, tx, ty) {
    const anchorX = worldX(tx) + TILE / 2, anchorY = worldY(ty) + TILE * 0.94;
    return {
      left: rect.left + (anchorX - TILE * 0.6) * scaleX,
      right: rect.left + (anchorX + TILE * 0.6) * scaleX,
      top: rect.top + (anchorY - TILE * 2) * scaleY,
      bottom: rect.top + (anchorY + TILE * 0.3) * scaleY,
    };
  }
  function updateHudFade() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const scaleX = rect.width / camera.w, scaleY = rect.height / camera.h;
    const boxes = [actorFadeBox(rect, scaleX, scaleY, player.x, player.y)];
    const yubi = liveNpcs.find((n) => n.id === 'yubi');
    if (yubi) boxes.push(actorFadeBox(rect, scaleX, scaleY, yubi.x, yubi.y));
    for (const id of HUD_FADE_PANEL_IDS) {
      const el = document.getElementById(id);
      if (!el || el.classList.contains('hidden')) continue;
      const r = el.getBoundingClientRect();
      const over = boxes.some((b) => b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top);
      el.classList.toggle('panel-fade', over);
    }
  }

  function drawMapBackground() {
    FieldAssets.draw(ctx,map.backgroundKey,worldX(0),worldY(0),map.width*TILE,map.height*TILE);
  }

  // 남문 지붕처럼 인물보다 앞에 와야 하는 배경 부분만 같은 좌표에 다시 그린다.
  function drawMapForegroundCrops() {
    const img=FieldAssets.get(map.backgroundKey);
    if (!FieldAssets.ready(img)) return;
    const worldW=map.width*TILE, worldH=map.height*TILE;
    for (const c of (map.foregroundCrops || [])) {
      FieldAssets.draw(ctx,map.backgroundKey,
        worldX(c.x*map.width),worldY(c.y*map.height),c.w*worldW,c.h*worldH,
        c.x*img.naturalWidth,c.y*img.naturalHeight,c.w*img.naturalWidth,c.h*img.naturalHeight,true);
    }
  }

  function drawMapLandmarkLabels() {
    for (const d of (map.decor || [])) {
      if (d.type !== 'mapLabel') continue;
      const label = decorLabel(d);
      if (label) drawTag(worldX(d.x), worldY(d.y), label, 'rgba(50,40,29,.82)');
    }
  }

  function drawGround() {
    const sx = Math.max(0, Math.floor(camera.x/TILE)-1);
    const sy = Math.max(0, Math.floor(camera.y/TILE)-1);
    const ex = Math.min(map.width-1, Math.ceil((camera.x+camera.w)/TILE)+1);
    const ey = Math.min(map.height-1, Math.ceil((camera.y+camera.h)/TILE)+1);
    // 탁현은 그래픽을 초기화한 상태라, 타일 종류에 상관없이 흙바닥 하나로 빈틈없이 덮는다.
    const uniformDirt = mapId === 'takhyeon';
    for (let y=sy; y<=ey; y++) {
      for (let x=sx; x<=ex; x++) {
        const t = map.tiles[y][x];
        const px=worldX(x), py=worldY(y);
        const key = uniformDirt ? 'tile_dirt_rich' : (t===1 ? 'tile_road' : t===3 ? 'tile_water' : t===5 ? 'tile_rough' : 'tile_grass');
        if (!FieldAssets.tile(ctx,key,px,py,TILE)) {
          ctx.fillStyle = uniformDirt ? '#c6b084' : (t===1 ? '#c6b084' : t===3 ? '#678b92' : t===5 ? '#7d7259' : '#829762');
          ctx.fillRect(px,py,TILE,TILE);
        }
      }
    }

    if (uniformDirt) return;
    // 시장 중심부는 흙길을 넓게 깔아 도시 생활권이 한눈에 읽히게 한다. (탁현 외 맵에서만 사용)
    for (let y=6; y<=14; y++) for (let x=4; x<=24; x++) {
      if (map.tiles[y] && map.tiles[y][x] === 0) FieldAssets.tile(ctx,'tile_dirt',worldX(x),worldY(y),TILE);
    }
  }

  // 화염 타일 연출 - 전용 이미지(tile_fire)가 field-assets.js 매니페스트에
  // 등록되면 그걸 그대로 쓰고, 아직 없으면 절차적으로 그린 불꽃으로 대신한다
  // (다른 배경 그래픽들이 PNG 우선/도형 대체로 그려지는 방식과 동일하다).
  function drawFireTiles() {
    if (!mapId) return;
    const tiles = StatusEffects.fireTilesForMap(mapId);
    if (!tiles.length) return;
    const flicker = (animFrame % 2) === 0 ? 1 : 0.88;
    for (const eff of tiles) {
      const px = worldX(eff.x), py = worldY(eff.y);
      if (px < -TILE || py < -TILE || px > camera.w || py > camera.h) continue;
      if (FieldAssets.tile(ctx, 'tile_fire', px, py, TILE)) continue;
      ctx.save();
      ctx.translate(px + TILE / 2, py + TILE * 0.6);
      ctx.scale(flicker, flicker);
      ctx.fillStyle = 'rgba(210,50,20,.5)';
      ctx.beginPath(); ctx.ellipse(0, 3, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,130,30,.88)';
      ctx.beginPath();
      ctx.moveTo(0, -15); ctx.quadraticCurveTo(10, -1, 4, 9); ctx.quadraticCurveTo(9, 3, 0, 11);
      ctx.quadraticCurveTo(-9, 3, -4, 9); ctx.quadraticCurveTo(-10, -1, 0, -15);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,215,90,.92)';
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.quadraticCurveTo(4, 2, 2, 8); ctx.quadraticCurveTo(0, 5, -2, 8); ctx.quadraticCurveTo(-4, 2, 0, -6);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  function decorBuildingKey(d) {
    if (d.type === 'gate') return 'building_gate';
    // 탁현은 새로 그려진 v6 건물 세트를 쓰고, 다른 맵은 기존 건물 스프라이트를 그대로 유지한다
    // (한 맵 안에서 신/구 화풍이 섞이지 않도록).
    if (mapId !== 'takhyeon') {
      if (d.label === '관아') return 'building_yamen';
      if (d.label === '주막') return 'building_tavern';
      if ((d.label || '').includes('상점')) return 'building_shop';
      return 'building_house';
    }
    if (d.label === '세력 막사') return 'v6_camp_yubi';
    if ((d.label || '').includes('상점')) return 'v6_house_side';
    if (d.label === '주막') return 'v6_house_side';
    return 'v6_house_front';
  }

  // residenceIds를 쓰면 진등·진규처럼 한 집을 함께 쓰는 경우도 처리할 수 있다.
  function decorLabel(d) {
    if (d.storyGate && !GameState.flags[d.storyGate]) return null;
    const ids=d.residenceIds || (d.residenceId ? [d.residenceId] : null);
    if (!ids) return d.label;
    const met=ids.some(id => ['met','recruited'].includes(GameState.npcStatus[id]));
    return met ? (d.revealedLabel || null) : d.label;
  }

  function drawBackDecor() {
    for (const d of (map.decor || [])) {
      if (d.type === 'building' || d.type === 'gate') drawRasterBuilding(d);
      else if (d.type === 'stall') drawRasterProp(`stall_${d.tone||'tan'}`,d,96,80,2.15);
      else if (d.type === 'well') drawRasterProp('well',d,80,80,1.0);
      else if (d.type === 'cart') drawRasterProp('cart',d,120,72,1.0);
      else if (d.type === 'crate') drawRasterProp('crate',d,40,40,.9);
      else if (d.type === 'lanterns') drawRasterProp('lanterns',d,160,60,1.0);
    }
  }

  function drawFrontDecor() {
    // Trees are kept in the foreground pass so walking behind a landmark feels spatial.
    for (const d of (map.decor || [])) {
      if (d.type === 'tree') {
        const key = (d.landmark || (d.scale||1)>1.2) ? 'tree_big' : 'tree_small';
        const baseW = key==='tree_big' ? 128 : 72;
        const baseH = key==='tree_big' ? 128 : 84;
        const s = d.scale || 1;
        FieldAssets.draw(ctx,key,worldX(d.x)-baseW*s/2,worldY(d.y)-baseH*s*.78,baseW*s,baseH*s);
      }
    }
  }

  function drawRasterBuilding(d) {
    const key=decorBuildingKey(d);
    const img=FieldAssets.get(key);
    const camp=d.label==='세력 막사';
    const targetW=camp ? 5*TILE : d.w*TILE;
    let targetH=d.h*TILE;
    if (FieldAssets.ready(img)) targetH=targetW*(img.naturalHeight/img.naturalWidth);
    const dx=worldX(camp ? d.x-1 : d.x);
    const footY=worldY(d.y+d.h);
    if (!FieldAssets.draw(ctx,key,dx,footY-targetH,targetW,targetH)) return;
    const label=decorLabel(d);
    if (label) drawTag(dx+targetW/2, footY-targetH+24, label, 'rgba(50,40,29,.86)');
  }

  function drawRasterProp(key,d,baseW,baseH,scale) {
    const s=scale||1;
    const w=baseW*s,h=baseH*s;
    FieldAssets.draw(ctx,key,worldX(d.x)-w/2,worldY(d.y)-h*.65,w,h);
  }

  function drawAreaLabels() {
    for (const l of (map.areaLabels||[])) {
      const x=worldX(l.x), y=worldY(l.y);
      if (x < -100 || x > canvas.width+100 || y < -40 || y > canvas.height+40) continue;
      ctx.fillStyle='rgba(50,42,32,.50)';ctx.fillRect(x-35,y-13,70,19);
      ctx.fillStyle='#f0e3c2';ctx.font='11px "Noto Sans KR",sans-serif';ctx.textAlign='center';ctx.fillText(l.text,x,y+1);
    }
  }

  function drawAmbient(p, hasEvent) {
    const x=worldX(p.x)+TILE/2, y=worldY(p.y)+TILE*.88;
    const role = ['merchant','farmer','woman','elder','guard','child','porter'].includes(p.archetype) ? p.archetype : 'farmer';
    const key=`npc_${role}`;
    if (!FieldAssets.sprite(ctx,key,x,y,p._dir||'down',animFrame,96,96,.67,3,.70)) {
      drawPersonSprite(x,y,{ palette:PALETTES[p.palette]||PALETTES.ash, archetype:p.archetype, scale:.9, dir:p._dir });
    }
    // 가끔 지나가는 백성 중 한 명에게 짧은 대화거리가 생기면, 말 걸 수 있다는 표시로 말풍선을 띄운다.
    if (hasEvent) {
      ctx.fillStyle='rgba(45,40,34,.82)';ctx.beginPath();ctx.roundRect(x-13,worldY(p.y)-18,26,17,7);ctx.fill();
      ctx.fillStyle='#eadfca';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('…',x,worldY(p.y)-6);
    }
  }

  function drawNpc(n) {
    const rd=ROSTER[n.id]; if(!rd) return;
    const x=worldX(n.x)+TILE/2, y=worldY(n.y)+TILE*.9-attackBumpOffset(n.id);
    const met=!!GameState.npcStatus[n.id];
    const hidden=n.discoverable && !met;
    const scholar=isScholarType(rd);
    const role=scholar ? 'scholar' : 'guard';

    // 미발견 인물은 군중처럼 보이고, 발견 뒤에는 ROSTER에 붙어있는 전용/세력별
    // HD 시트로 바뀐다 (스프라이트 스펙 자체는 js/data/roster.js에 정의됨).
    const spec = (!hidden && rd.sprite) ? rd.sprite : { key:`npc_${role}`, fw:96, fh:96, sx:.67, sy:.70 };
    const drawn=FieldAssets.sprite(ctx,spec.key,x,y,'down',animFrame,spec.fw,spec.fh,spec.sx,3,spec.sy);
    if (!drawn) {
      const palette=hidden
        ? {robe:'#72746e',dark:'#474a47',trim:'#9d9e94',skin:'#d1aa80'}
        : scholar
          ? {robe:'#536c73',dark:'#33464b',trim:'#b0c2b5',skin:'#d5ab82'}
          : {robe:'#725245',dark:'#49362f',trim:'#b69b75',skin:'#d0a67d'};
      drawPersonSprite(x,y,{palette,archetype:scholar?'scholar':'warrior',scale:1.04,dir:'down',heroId:n.id});
    }

    // 하비 관청 모병 5인 - 아직 안 써본 인물은 머리 위에 [?], 3달을 기다린
    // 진규만 준비되면 [!]로 바뀌어 "가서 받아오자"를 알려준다.
    const habiMark = (typeof habiRecruitMark === 'function') ? habiRecruitMark(n.id) : null;
    if (habiMark) {
      // 이름표(drawTag)가 y-22~y-4 범위를 차지하므로, 그보다 위에 그려야
      // 이 말풍선이 이름표에 덮여 사라지지 않는다.
      ctx.fillStyle='rgba(45,40,34,.82)';ctx.beginPath();ctx.roundRect(x-13,worldY(n.y)-40,26,17,7);ctx.fill();
      ctx.fillStyle='#eadfca';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText(habiMark,x,worldY(n.y)-28);
    }

    // 등용된 장수는 마을에 남아 모병/훈련을 돕는다 - 이름표에 담당 역할을 표기한다.
    if (GameState.npcStatus[n.id] === 'recruited') {
      drawTag(x, worldY(n.y)-7, `${rd.name} · ${scholar ? '모병' : '훈련'}`, '#2f4d33');
    } else if (n._atResidence) {
      drawTag(x, worldY(n.y)-7, n._label || `${rd.name}의 집`, '#72542f');
    } else if (!hidden) {
      // 거주지 없이 discoverable로만 등장하는 인물(염유/전예 등)은 지도 데이터의
      // label이 발견 전 군중 표시를 위해 빈 문자열이라, 발견된 뒤에도 그대로
      // 빈 값이면 이름표가 영영 안 뜬다 - 그 경우 본명(rd.name)으로 대신한다.
      // 적 군세는 이름표 대신 [잔여병사/무력등급/지력등급]을 표기해 교전 전 전력을 가늠할 수 있게 한다.
      // rd.troop/능력치는 전투 결과에 따라 실시간으로 바뀌므로 매 프레임 다시 계산한다.
      // 유비 마커는 GameState.allyArmy(별도로 편성한 유비군)를 같은 형식으로 보여준다 -
      // 유비 본인(ROSTER.yubi)에는 troop 필드가 없으므로 rd.troop 분기로는 못 잡는다.
      // 특정 지도로 한정하지 않는다 - 유비군이 등장하는 지도라면 어디서든 보여야 한다.
      const baseLabel = n.label || rd.name;
      const label = (rd.kind === 'enemy' && rd.troop != null)
        ? `${baseLabel} · 병${rd.troop} · 무${enemyArmyGrade(rd)} · 지${gradeFor(rd.stats.int, JIRYEOK_GRADES)}`
        : (n.id === 'yubi' && GameState.allyArmy)
          ? `${baseLabel} · 병${GameState.allyArmy.troop} · 무${warArmyGrade({ commanderId:'yubi', army:GameState.allyArmy })} · 지${gradeFor(GameState.allyArmy.deputy && ROSTER[GameState.allyArmy.deputy] ? ROSTER[GameState.allyArmy.deputy].stats.int : 0, JIRYEOK_GRADES)}`
          : baseLabel;
      drawTag(x, worldY(n.y)-7, label, '#40372c');
      drawDamageFloat(n.id, x, worldY(n.y)-22);
    } else if (hidden && Math.abs(n.x-player.x)+Math.abs(n.y-player.y)<=3) {
      ctx.fillStyle='rgba(45,40,34,.82)';ctx.beginPath();ctx.roundRect(x-13,worldY(n.y)-18,26,17,7);ctx.fill();
      ctx.fillStyle='#eadfca';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('…',x,worldY(n.y)-6);
    }
  }

  function drawHero() {
    const id=GameState.mainHero;
    const x=worldX(player.x)+TILE/2, y=worldY(player.y)+TILE*.94;
    const spriteY=y-attackBumpOffset(id);
    const key=id==='gwanwoo' ? 'hero_gwanwoo' : 'hero_jangbi';
    const frame=animFrame%3;
    const drawn = id === 'gwanwoo'
      ? FieldAssets.sprite(ctx,key,x,spriteY,player.dir,frame,136,144,.43,3,.445)
      : FieldAssets.sprite(ctx,key,x,spriteY,player.dir,frame,362,362,.18,3,.18);
    if (!drawn) {
      const palette=id==='gwanwoo'
        ? {robe:'#356547',dark:'#253e31',trim:'#a88749',skin:'#b56d54'}
        : {robe:'#7b4035',dark:'#4d2b27',trim:'#b58c4f',skin:'#bd795e'};
      drawPersonSprite(x,spriteY,{palette,archetype:'hero',scale:1.17,dir:player.dir,heroId:id});
    }
    // Named hero marker stays subtle: unique color/weapon should do most of the work.
    // 출정 중(군세 편성 완료)에는 적 군세와 같은 형식으로 [병력/무력/지력]을 함께 표기한다.
    const army = GameState.army;
    if (army) {
      const deputy = army.deputy ? ROSTER[army.deputy] : null;
      const jiryeok = gradeFor(deputy ? deputy.stats.int : 0, JIRYEOK_GRADES);
      drawTag(x, y-64, `${ROSTER[id].name} · 병${army.troop} · 무${playerArmyGrade()} · 지${jiryeok}`, 'rgba(32,46,31,.82)');
      drawDamageFloat(id, x, y-79);
    } else {
      ctx.fillStyle='rgba(32,46,31,.82)';ctx.beginPath();ctx.roundRect(x-19,y-75,38,16,7);ctx.fill();
      ctx.fillStyle='#e9dcae';ctx.font='bold 10px "Noto Sans KR",sans-serif';ctx.textAlign='center';ctx.fillText(ROSTER[id].name,x,y-64);
    }
  }

  // Fallback procedural person (used only while PNG assets are loading).
  function drawPersonSprite(x,y,opt) {
    const p=opt.palette, s=opt.scale||1;
    ctx.save(); ctx.translate(Math.round(x),Math.round(y)); ctx.scale(s,s);
    ctx.fillStyle='rgba(35,31,26,.22)';ctx.beginPath();ctx.ellipse(0,2,11,5,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=p.dark;ctx.fillRect(-7,-12,5,13);ctx.fillRect(2,-12,5,13);
    ctx.fillStyle=p.robe;ctx.beginPath();ctx.moveTo(-10,-30);ctx.lineTo(10,-30);ctx.lineTo(12,-10);ctx.lineTo(-12,-10);ctx.closePath();ctx.fill();
    ctx.fillStyle=p.trim;ctx.fillRect(-2,-30,4,18);
    ctx.fillStyle=p.skin;ctx.fillRect(-7,-42,14,13);
    ctx.fillStyle=p.dark;ctx.fillRect(-8,-46,16,5);
    if (opt.heroId==='gwanwoo') { ctx.fillStyle='#262523';ctx.fillRect(-5,-29,10,17);ctx.fillRect(13,-43,3,47); }
    ctx.restore();
  }

  function drawTag(x,y,text,bg) {
    ctx.font='11px "Noto Sans KR",sans-serif';
    const w=Math.max(50,ctx.measureText(text).width+14);
    ctx.fillStyle=bg||'rgba(46,40,32,.82)';ctx.fillRect(x-w/2,y-15,w,18);
    ctx.fillStyle='#f3e5c5';ctx.textAlign='center';ctx.fillText(text,x,y-2);
  }

  // 전투로 병력이 줄어들 때 [OO군세 · 병0000명 · 무S · 지B] 이름표 바로 위에
  // "-320" 같은 숫자가 뿅 떠올랐다가 위로 흐르며 사라지는 연출. id별로 하나만
  // 유지한다(턴제라 같은 대상에 두 피해가 겹칠 일이 거의 없어 단순하게 둔다).
  const damageFloats = Object.create(null); // id -> { text, start }
  const DAMAGE_FLOAT_MS = 900;
  const DAMAGE_FLOAT_RISE = 26;
  let damageFloatTimer = null;
  function showDamageFloat(id, amount) {
    if (!id || !amount) return;
    damageFloats[id] = { text: `-${amount}`, start: performance.now() };
    render();
    if (!damageFloatTimer) {
      damageFloatTimer = setInterval(() => {
        const now = performance.now();
        let any = false;
        for (const key in damageFloats) {
          if (now - damageFloats[key].start > DAMAGE_FLOAT_MS) delete damageFloats[key];
          else any = true;
        }
        render();
        if (!any) { clearInterval(damageFloatTimer); damageFloatTimer = null; }
      }, 40);
    }
  }
  function drawDamageFloat(id, x, tagTopY) {
    const f = damageFloats[id];
    if (!f) return;
    const t = Math.min(1, (performance.now() - f.start) / DAMAGE_FLOAT_MS);
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = '#ff5c4d';
    ctx.font = 'bold 13px "Noto Sans KR",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, x, tagTopY - 4 - DAMAGE_FLOAT_RISE * t);
    ctx.restore();
  }

  // 공격할 때 스프라이트가 위로 살짝 까딱 튀었다가 제자리로 돌아오는 아주
  // 단순한 동작(전용 공격 모션 그림 없이도 "쳤다"는 느낌만 준다).
  const attackBumps = Object.create(null); // id -> { start }
  const ATTACK_BUMP_MS = 220;
  const ATTACK_BUMP_HEIGHT = 7;
  let attackBumpTimer = null;
  function showAttackBump(id) {
    if (!id) return;
    attackBumps[id] = { start: performance.now() };
    render();
    if (!attackBumpTimer) {
      attackBumpTimer = setInterval(() => {
        const now = performance.now();
        let any = false;
        for (const key in attackBumps) {
          if (now - attackBumps[key].start > ATTACK_BUMP_MS) delete attackBumps[key];
          else any = true;
        }
        render();
        if (!any) { clearInterval(attackBumpTimer); attackBumpTimer = null; }
      }, 30);
    }
  }
  function attackBumpOffset(id) {
    const b = attackBumps[id];
    if (!b) return 0;
    const t = Math.min(1, (performance.now() - b.start) / ATTACK_BUMP_MS);
    return Math.sin(t * Math.PI) * ATTACK_BUMP_HEIGHT; // 0 -> 최대 -> 0으로 살짝 튀었다 돌아온다
  }

  function drawLocationRibbon() {
    ctx.fillStyle='rgba(34,30,25,.65)';ctx.fillRect(12,12,128,27);
    ctx.fillStyle='#f2e4c5';ctx.font='bold 12px "Noto Sans KR",sans-serif';ctx.textAlign='left';ctx.fillText(map.name||'',23,30);
  }

  const FOOT_TILES_PER_AP = 10; // 군세와 달리 장수 혼자 이동할 때는 10칸마다 행동력 1을 쓴다
  let footTileCount = 0;

  let movementLocked = false;
  function lockMovement(v) { movementLocked = !!v; }

  // 저장 불러오기 등으로 임의의 좌표에 플레이어를 옮겨 세운다 (걸어서 이동하는 게
  // 아니므로 행동력 소모나 NPC 상호작용 판정 없이 위치와 카메라만 갱신한다).
  function setPlayerPos(x, y) {
    if (!map) return;
    player.x = x; player.y = y;
    updateCamera(true);
    render();
  }

  function tryMove(dx, dy) {
    if (!map || movementLocked) return;
    const mover = activeMover();
    if (!mover) return;
    // 지금 조작 중인 쪽의 군세 - 평소엔 관우군(GameState.army), 회남 벌판에서
    // 유비군 차례일 때는 controlledId를 통해 GameState.allyArmy가 된다.
    const activeArmy = controlledId ? (typeof armyFor === 'function' ? armyFor(controlledId) : null) : GameState.army;
    // 혼란에 빠진 군세는 이동할 수 없다.
    if (activeArmy && StatusEffects.isConfused(activeArmy.commanderId)) { render(); return; }
    const nx=mover.x+dx, ny=mover.y+dy;
    mover.dir = dx<0?'left':dx>0?'right':dy<0?'up':'down';
    if (!isWalkable(nx,ny)) { render(); return; }
    // 지금 조작 대상이 player가 아니라면(유비 차례) player가 서 있는 칸으로는
    // 겹쳐 들어갈 수 없다 - player를 조작할 때 다른 npc 칸으로 못 들어가는 것과
    // 대칭이다(그쪽은 아래 npcAt 검사가 이미 막는다).
    if (mover !== player && nx === player.x && ny === player.y) { render(); return; }
    const npc=npcAt(nx,ny);
    if (npc) { interact(npc,false); return; } // 인접칸으로 다가가 공격하는 행동엔 행동력을 소모하지 않는다
    if (map.apMovement) {
      // 적 AI 행동력(computeAiPath)과 동일한 moveCostMult 배율을 플레이어
      // 이동에도 적용한다 - 나중에 적 책사가 플레이어 쪽에 이 디버프를
      // 걸어도(반대로) 같은 함수로 처리되도록. 기병(unitTypeMoveCostMult)도
      // 같은 자리에서 곱해 2행동력에 3칸을 갈 수 있게 한다.
      const unitCostMult = (activeArmy && typeof unitTypeMoveCostMult === 'function') ? unitTypeMoveCostMult(activeArmy.commanderId) : 1;
      const cost = tileMoveCost(nx,ny) * (activeArmy ? StatusEffects.moveCostMult(activeArmy.commanderId) : 1) * unitCostMult;
      // 유비군 차례(controlledId 있음)에는 관우군과 별개인 allyAp 예산을 쓴다 -
      // 그래야 관우가 이번 라운드에 쓴 행동력과 무관하게 유비군도 자기 몫을 쓸 수 있다.
      const spent = controlledId ? GameState.spendAllyAP(cost) : GameState.spendAP(cost);
      if (!spent) { if (onApBlocked) onApBlocked(); render(); return; }
      if (onApSpent) onApSpent();
    } else if (footTileCount + 1 >= FOOT_TILES_PER_AP) {
      // 완전히 무제한으로 돌아다니지는 못하도록, 장수 혼자 걷는 이동도 10칸째마다 행동력을 쓴다.
      if (!GameState.spendAP(1)) { if (onApBlocked) onApBlocked(); render(); return; }
      footTileCount = 0;
      if (onApSpent) onApSpent();
    } else {
      footTileCount++;
    }
    mover.x=nx; mover.y=ny;
    updateCamera();
    render();
    if (onStep) onStep();
    checkProximityDiscovery();
  }

  function checkProximityDiscovery() {
    if (Dialogue.isActive()) return;
    for (const base of liveNpcs) {
      if (!base.discoverable || GameState.npcStatus[base.id]) continue;
      const n=effectiveNpc(base);
      const dist=Math.abs(n.x-player.x)+Math.abs(n.y-player.y);
      if (dist <= (base.discoveryRange || 1)) { interact(n,true); break; }
    }
  }

  function interact(npc, proximity, meta) {
    if (!onInteract) return;
    const firstDiscovery=!!(npc.discoverable && !GameState.npcStatus[npc.id]);
    onInteract(npc.id,{ firstDiscovery, discoveryText:npc.discoveryText||'', proximity:!!proximity, atResidence:!!npc._atResidence, ...(meta||{}) });
  }

  // 지금 조작 중인 대상(player 또는 controlledId)이 실제로 편성된 군세
  // (관우군/유비군)라면 그 군세의 공격 사거리(궁병 2칸, 벽력거/야습 등으로
  // 임시로 늘어난 경우 포함)를, 아니면(마을 npc와 대화 등) 1칸을 돌려준다.
  // interactFacing(정면 상호작용)과 canvas 클릭 판정이 똑같이 이 값을 써야
  // "붙지 않으면 궁병 사거리가 있으나 마나"인 문제가 안 생긴다.
  function controlledArmyRange() {
    const facingId = controlledId || GameState.mainHero;
    const facingArmy = facingId === GameState.mainHero ? GameState.army
      : (GameState.allyArmy && GameState.allyArmy.commanderId === facingId ? GameState.allyArmy : null);
    return (facingArmy && typeof armyAttackRange === 'function') ? armyAttackRange(facingId, facingArmy) : 1;
  }

  function interactFacing() {
    if (movementLocked) return;
    const dirs = player.dir==='up' ? [[0,-1],[-1,0],[1,0],[0,1]] :
      player.dir==='down' ? [[0,1],[-1,0],[1,0],[0,-1]] :
      player.dir==='left' ? [[-1,0],[0,-1],[0,1],[1,0]] : [[1,0],[0,-1],[0,1],[-1,0]];
    // 행동 버튼(정면 상호작용)은 항상 인접 1칸만 본다 - 궁병처럼 사거리가
    // 2 이상인 군세로 먼 적을 공격하는 건 "어느 방향을 보고 있는지"에 기대는
    // 이 버튼보다, 지도에서 적을 직접 클릭하는 쪽이 더 직관적이라 그쪽으로만
    // 열어준다(canvas 클릭 핸들러가 controlledArmyRange()를 그대로 쓴다).
    for (const [dx,dy] of dirs) {
      const npc = npcAt(player.x+dx, player.y+dy);
      if (npc) { interact(npc,false); return; }
    }
    for (const ev of ambientEvents) {
      const p = crowd[ev.index];
      if (!p) continue;
      for (const [dx,dy] of dirs) {
        if (p.x === player.x+dx && p.y === player.y+dy) {
          const kind = ev.kind;
          ambientEvents = ambientEvents.filter((e) => e !== ev);
          render();
          if (onAmbientInteract) onAmbientInteract(kind);
          return;
        }
      }
    }
  }

  // 마을 체류 중 가끔 지나가던 백성 중 한둘에게 짧은 대화거리를 걸어둔다
  // (최대 AMBIENT_EVENT_MAX명까지 동시에, 이미 걸려있는 사람은 다시 뽑지 않는다).
  function rollAmbientEvent(kinds) {
    if (ambientEvents.length >= AMBIENT_EVENT_MAX || !crowd.length || !kinds || !kinds.length) return;
    if (Math.random() >= AMBIENT_EVENT_CHANCE) return;
    const usedIndexes = new Set(ambientEvents.map((e) => e.index));
    const available = crowd.map((_, i) => i).filter((i) => !usedIndexes.has(i));
    if (!available.length) return;
    const index = available[Math.floor(Math.random() * available.length)];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    ambientEvents.push({ index, kind });
    render();
  }

  function removeNpc(id) { liveNpcs=liveNpcs.filter((n)=>n.id!==id); render(); }

  // 정해진 좌표들을 따라 한 칸씩 걸어가는 모습을 보여준 뒤 콜백한다(예: 원술이
  // 순간이동으로 사라지는 대신 성문 안쪽으로 실제로 걸어 들어가는 연출). AI
  // 추적과 달리 경로를 스스로 계산하지 않고 그대로 재생만 하는 단순 스크립트용이다.
  function walkNpcPath(id, path, stepMs, callback) {
    const npc = liveNpcs.find((n) => n.id === id);
    if (!npc || !path || !path.length) { if (callback) callback(); return; }
    let step = 0;
    const tick = () => {
      npc.x = path[step].x; npc.y = path[step].y;
      render();
      step++;
      if (step < path.length) setTimeout(tick, stepMs);
      else if (callback) callback();
    };
    tick();
  }

  // 스토리 진행에 따라 지도에 새 인물을 등장시킨다 (등무 처치 후 정원지 등장 등).
  function addNpc(id) {
    if (!map || liveNpcs.some((n) => n.id === id)) return;
    const n0 = map.npcs.find((n) => n.id === id);
    if (n0) { liveNpcs.push(n0); render(); }
  }

  function absMonth(year, month) { return year * 12 + month; }

  // chance 판정에서 이번 회차에는 등장하지 않기로 정해진 인물인지 (등장 확정 전에는 false를 반환).
  function isRolledInvisible(id) {
    const rd = ROSTER[id];
    return !!(rd && rd.chance != null && GameState.npcVisible[id] === false);
  }

  // 예약된 인물은 늦어도 1~2개월 안에는 등장하도록 한다 - 예전에는 마감기한의 절반까지
  // 늦어질 수 있어 "새 인물이 너무 안 나온다"는 체감으로 이어졌다.
  function scheduleSpawn(id) {
    if (GameState.npcSpawnMonth[id] != null) return;
    const nowAbs = absMonth(GameState.year, GameState.month);
    const cap = spawnDeadlineAbs ? Math.max(1, spawnDeadlineAbs - nowAbs) : 2;
    const maxOffset = Math.max(1, Math.min(2, cap));
    GameState.npcSpawnMonth[id] = nowAbs + 1 + Math.floor(Math.random() * maxOffset);
  }

  function randomWalkableTile() {
    for (let tries = 0; tries < 200; tries++) {
      const x = 1 + Math.floor(Math.random() * (map.width - 2));
      const y = 1 + Math.floor(Math.random() * (map.height - 2));
      if (!isWalkable(x, y)) continue;
      if ((mapId === 'takhyeon' || mapId === 'pyeongwon') && map.tiles[y][x] !== 1) continue;
      // 평원현의 무작위 인물은 성내에서만 발견되며, 성벽 밖 전장은 배회하지 않는다.
      if (mapId === 'pyeongwon' && y >= 14) continue;
      // 남문 통로(x17~18)와 그 바로 안쪽은 성 안팎을 잇는 유일한 길목이라, 무작위
      // 인물이 여기 서버리면 지나갈 수 없게 막혀버린다 - 이 구간은 스폰에서 제외한다.
      if (mapId === 'pyeongwon' && y >= 10 && (x === 17 || x === 18)) continue;
      if (x === player.x && y === player.y) continue;
      if (npcAt(x, y)) continue;
      return { x, y };
    }
    return { x: player.x, y: player.y }; // 극히 드문 실패시 폴백
  }

  // 휴식(다음달) 등으로 시간이 흐를 때 호출 - 이번에 새로 등장한 장수의 id 목록을 반환한다.
  function checkScheduledSpawns() {
    if (!map) return [];
    const nowAbs = absMonth(GameState.year, GameState.month);
    const spawned = [];
    for (const n0 of map.npcs) {
      if (!n0.randomSpawn) continue;
      if (isRolledInvisible(n0.id)) continue; // chance 판정에서 이번 회차에 등장하지 않기로 정해짐
      if (GameState.npcStatus[n0.id]) continue;
      if (GameState.npcSpawnPos[n0.id]) continue; // 이미 등장함
      scheduleSpawn(n0.id);
      if (nowAbs >= GameState.npcSpawnMonth[n0.id]) {
        const pos = randomWalkableTile();
        GameState.npcSpawnPos[n0.id] = pos;
        n0.x = pos.x; n0.y = pos.y;
        liveNpcs.push(n0);
        spawned.push(n0.id);
      }
    }
    if (spawned.length) render();
    return spawned;
  }

  const AI_MOVE_BUDGET = 3; // Tier2 AI 기본 이동력 (병종별 차등은 챕터2에서 반영)
  const AI_STEP_MS = 160; // 한 칸 이동하는 데 걸리는 시간 - 순간이동처럼 보이지 않도록 한 칸씩 애니메이션한다

  // n0을 이번 턴에 플레이어 쪽으로 이동시킬 경로(칸 목록)를 미리 계산한다. n0 자체는 아직 움직이지 않는다.
  // 도발(StatusEffects.isTaunted)에 걸린 군세도 "도발을 건 군세를 쫓아온다"는
  // 별도 분기가 필요 없다 - 책략은 항상 플레이어가 직접 걸고, 적 AI는 원래도
  // 항상 플레이어를 쫓아오기 때문에 이미 같은 동작이다. 나중에 플레이어 외의
  // 대상(동맹군 등)이 도발을 걸 수 있게 되면 여기서 StatusEffects.tauntSourceId로
  // 목적지를 바꿔주면 된다.
  // AI_MOVE_BUDGET이 곧 적 군세의 "행동력"이다 - 십면매복/이사결류 같은 책략의
  // 행동력 디버프(apMult)가 걸리면 그만큼 줄어들고, 이사결류의 "타일이동시
  // 필요 행동력 2배" 같은 효과는 moveCostMult로 타일당 소모량에 곱해진다.
  // 플레이어의 행동력(GameState.ap)과 동일한 배율 방식이라, 나중에 어느
  // 쪽에 걸리든(플레이어 상대 진영도) 같은 함수로 처리된다.
  // target 생략시(기존 호출부 전부) 플레이어를 쫓는다. 회남 벌판의 유비군처럼
  // 아군이 다른 NPC(교유)를 목표로 접근할 때는 target에 그 NPC를 넘긴다 -
  // player든 일반 npc든 {x,y}만 있으면 되므로 그대로 재사용 가능하다.
  // range: 이 유닛(n0)이 목표까지 몇 칸 안에 들어오면 멈추고 공격 태세로
  // 전환할지 - 보병/기병은 1(인접), 궁병은 2(main.js armyAttackRange가 정함).
  // 생략하면 기존처럼 인접(1)까지 다가간다.
  function computeAiPath(n0, target, moveBudget, range) {
    target = target || player;
    range = range || 1;
    const path = [];
    const apScale = StatusEffects.apMult(n0.id);
    const unitCostMult = (typeof unitTypeMoveCostMult === 'function') ? unitTypeMoveCostMult(n0.id) : 1;
    const costScale = StatusEffects.moveCostMult(n0.id) * unitCostMult;
    const budget = moveBudget != null ? moveBudget : AI_MOVE_BUDGET;
    let cx = n0.x, cy = n0.y, steps = Math.max(0, Math.floor(budget * apScale));
    // 사거리 판정은 inAttackRange를 쓴다 - 대각선으로 붙은 8칸은 병종
    // 상관없이 항상 사거리 안(맨해튼 거리만 쓰면 대각선 인접칸이 실제로는
    // 가까운데도 사거리 밖으로 잘못 계산된다)이고, 그 밖은 맨해튼 거리로
    // range 이내인 마름모꼴 - 체스판 거리만 쓰면 사거리 2가 대각선 먼
    // 모서리까지 포함한 5x5 정사각형이 되어버려 의도한 모양보다 넓어진다.
    // 다만 실제로 몇 칸을 "걸어야" 하는지(이동 소모량)는 이동이 4방향뿐이라
    // 여전히 맨해튼 거리가 맞다.
    if (inAttackRange({ x: cx, y: cy }, target, range)) return path; // 이미 사거리 - 이동 없이 대기 후 공격
    while (steps > 0) {
      if (inAttackRange({ x: cx, y: cy }, target, range)) break;
      const dx = Math.sign(target.x-cx), dy = Math.sign(target.y-cy);
      const preferX = Math.abs(target.x-cx) >= Math.abs(target.y-cy);
      const options = preferX ? [[dx,0],[0,dy]] : [[0,dy],[dx,0]];
      let moved = false;
      for (const [ddx,ddy] of options) {
        if (!ddx && !ddy) continue;
        const tx=cx+ddx, ty=cy+ddy;
        if (!isWalkable(tx,ty)) continue;
        if (tx===target.x && ty===target.y) continue; // 목표 타일로는 이동하지 않는다(인접까지만)
        if (npcAt(tx,ty)) continue;
        const cost = tileMoveCost(tx,ty) * costScale;
        if (cost > steps) continue;
        cx=tx; cy=ty; steps-=cost; moved=true; path.push({x:cx,y:cy}); break;
      }
      if (!moved) break; // 막혔거나 이동력이 모자라 대기
    }
    return path;
  }

  // 지도 위에서 지금 "플레이어 편"으로 칠 수 있는 목표들 - 문자 그대로 조작
  // 중인 장수(player) 하나뿐이던 것을, 회남 벌판의 유비군처럼 플레이어가
  // 편성한 다른 군세가 지도에 함께 있으면 그것도 목표 후보에 넣는다.
  // playerArmies()/army.commanderId는 main.js가 이미 관우군/유비군을
  // { commanderId, troop, ... } 한 모양으로 다루려고 만들어둔 추상화를
  // 그대로 재사용한 것 - 나중에 플레이어가 세 번째, 네 번째 군세를 더
  // 갖게 되어도 이 함수는 손댈 필요가 없다.
  function friendlyTargets() {
    const targets = [];
    // 회수평야에서 관우가 미끼로 쓰이다 군세가 무너지면(main.js
    // handleHoesuArmyDown), 관우는 더는 유효한 목표가 아니다 - 안 그러면
    // 적 AI가 이미 병력이 0인 관우에게 계속 몰려들어 유비군을 놓아준다.
    const gwanwooDown = !!GameState.flags.hoesuGwanwooDown;
    const armies = (typeof playerArmies === 'function') ? playerArmies() : [];
    for (const army of armies) {
      const cid = army.commanderId;
      if (cid === GameState.mainHero && gwanwooDown) continue;
      const pos = (cid === GameState.mainHero) ? { x: player.x, y: player.y } : liveNpcs.find((n) => n.id === cid);
      if (pos) targets.push({ id: cid, x: pos.x, y: pos.y, troop: army.troop });
    }
    // 아직 군세를 편성하기 전이거나 위 목록에서 어떤 이유로든 빠졌더라도,
    // 문자 그대로의 조작 캐릭터는 항상 최소한의 목표로 남아있어야 한다
    // (예전부터 항상 그래왔던 동작을 그대로 보장) - 단, 관우가 이미
    // 탈락한 상태라면 이 기본값으로도 되살아나면 안 된다.
    if (!gwanwooDown && !targets.some((t) => t.id === GameState.mainHero)) {
      targets.push({ id: GameState.mainHero, x: player.x, y: player.y, troop: Infinity });
    }
    return targets;
  }

  // 이 적이 이번 턴에 노릴 목표를 정한다: 가장 가까운 쪽을 우선하고, 거리가
  // 같으면 병력이 더 적은(약한) 쪽을 노린다 - "무조건 플레이어만 쫓아다니지
  // 말고 가까운/약한 쪽부터 공격하게 해달라"는 요청에 따른 간단한 규칙.
  function pickAiTarget(n0) {
    const targets = friendlyTargets();
    let best = targets[0];
    let bestDist = Math.abs(n0.x-best.x)+Math.abs(n0.y-best.y);
    for (let i = 1; i < targets.length; i++) {
      const t = targets[i];
      const dist = Math.abs(n0.x-t.x)+Math.abs(n0.y-t.y);
      if (dist < bestDist || (dist === bestDist && t.troop < best.troop)) { best = t; bestDist = dist; }
    }
    return best;
  }

  // 플레이어 턴 종료(휴식/다음달)시 호출되는 Tier2 AI: 사거리 안이면 공격, 아니면 접근, 막히면 대기.
  // 이동은 한 칸씩 애니메이션으로 보여준 뒤(순간이동 방지) 완료되면 callback(전투발동여부)를 호출한다.
  // 적이 여러 명이어도 턴 길이가 늘어나지 않도록 전원이 동시에(같은 박자로) 이동한다.
  // onlyIds를 주면(회남 벌판의 속도순 전투처럼 한 번에 하나씩만 움직이는 곳) 그
  // id들만 이번 호출에서 움직인다 - 생략하면 지금까지처럼 적 전원이 대상이다.
  // moveBudget을 주면(회남 벌판에서 플레이어와 같은 조건으로 싸우게 할 때) 그
  // 값을 이번 호출의 이동력으로 쓴다 - 생략하면 기본 AI_MOVE_BUDGET(3칸)이다.
  // callback(battled, meta) - meta는 실제로 교전이 발동했을 때만 채워지며
  // { apUsed, targetId, isMainHero } 모양이다. apUsed는 이번 활성화에서
  // 이동에 실제로 쓴 행동력(moveBudget 중 실제 소모분)으로, 회남 벌판의
  // 속도순 전투가 "이동에 더 쓸지 공격에 더 쓸지" 남은 예산을 계산하는 데 쓴다.
  function runAiTurn(callback, onlyIds, moveBudget) {
    const done = (battled, meta) => { if (callback) callback(battled, meta); };
    if (!map || !map.apMovement) { done(false); return; }
    let hostiles = liveNpcs.filter((n0) => { const rd = ROSTER[n0.id]; return rd && rd.kind === 'enemy'; });
    if (onlyIds) hostiles = hostiles.filter((n0) => onlyIds.includes(n0.id));

    // 계획 단계: 기존처럼 한 명씩 실제 위치를 옮겨가며 서로 겹치지 않는 경로를 계산한 뒤,
    // 다시 시작 위치로 되돌려 전원이 동시에 애니메이션되도록 한다.
    const plans = hostiles.map((n0) => ({
      n0, startX: n0.x, startY: n0.y, path: [], target: pickAiTarget(n0), apUsed: 0,
      // 궁병이면 사거리 2에서 멈춰 화살을 쏘고, 그 외(보병/기병)는 기존처럼 인접(1)까지 다가간다.
      range: (typeof armyAttackRange === 'function' && typeof armyFor === 'function') ? armyAttackRange(n0.id, armyFor(n0.id)) : 1,
    }));
    for (const plan of plans) {
      // 혼란에 빠진 군세는 제자리에서 움직이지 못한다(이미 인접해 있었다면 공격은 그대로 발동).
      plan.path = StatusEffects.isConfused(plan.n0.id) ? [] : computeAiPath(plan.n0, plan.target, moveBudget, plan.range);
      if (plan.path.length) {
        const last = plan.path[plan.path.length - 1]; plan.n0.x = last.x; plan.n0.y = last.y;
        const unitCostMult = (typeof unitTypeMoveCostMult === 'function') ? unitTypeMoveCostMult(plan.n0.id) : 1;
        const costScale = StatusEffects.moveCostMult(plan.n0.id) * unitCostMult;
        plan.apUsed = plan.path.reduce((sum, tile) => sum + tileMoveCost(tile.x, tile.y) * costScale, 0);
      }
      // 견벽거수처럼 "이동하면 사기 감소" 디버프가 걸려 있으면, 실제로 움직인
      // 칸 수만큼 사기를 깎는다 - 얌전히 있으면(경로 길이 0) 손해가 없다.
      const moraleCost = StatusEffects.moveMoraleCost(plan.n0.id);
      if (moraleCost > 0 && plan.path.length) StatusEffects.drainMorale(plan.n0.id, moraleCost * plan.path.length);
    }
    for (const plan of plans) { plan.n0.x = plan.startX; plan.n0.y = plan.startY; }
    render();

    const finishTurn = () => {
      let engaged = false, meta = null;
      for (const { n0, target, apUsed, range } of plans) {
        const n = effectiveNpc(n0);
        if (!inAttackRange(n, target, range)) continue;
        const isMainHero = target.id === GameState.mainHero;
        // 이 활성화에서 이동하고 남은 행동력 - 상대가 관우든 유비군이든, 이
        // 교전에 쓸 수 있는 예산은 결국 "적이 이번 턴에 남긴 몫"으로 똑같다.
        const remainingBudget = moveBudget != null ? Math.max(0, moveBudget - apUsed) : null;
        meta = { apUsed, targetId: target.id, isMainHero };
        if (isMainHero) {
          // 문자 그대로의 플레이어와 붙으면 예전처럼 직접 고를 수 있는 교전
          // 메뉴를 띄운다 - engagedCommanderId를 함께 실어 보내, main.js가
          // (직전이 유비군 차례였더라도) 이번 교전은 항상 관우 쪽임을 정확히
          // 알 수 있게 한다. remainingBudget도 함께 넘겨, 메뉴에서 [일기토]/
          // [전투]/[책략] 중 무엇을 고르든 그 행동력은 관우 자신의 턴 예산이
          // 아니라 "지금 다가와 붙은 적이 남긴 몫"에서 깎이게 한다 - 안 그러면
          // 관우 차례가 아닐 때(적이 먼저 다가온 경우) 관우 자신의 남은
          // 행동력이 0이라 일기토가 부당하게 거절된다.
          interact(n, false, { engagedCommanderId: target.id, remainingBudget });
        } else if (onAllyEngage) {
          // 유비군 같은 아군과 붙었을 때는, 유비군이 먼저 적에게 다가가 붙을 때와
          // 똑같은 콜백(onAllyEngage)을 그대로 재사용해 자동으로 전투를 발동시킨다 -
          // "누가 먼저 다가갔는지"는 결과에 영향이 없어야 하므로. moveBudget이
          // 있으면(회남 벌판) 이동하고 남은 행동력도 함께 넘겨, 그 예산으로
          // 몇 번 더 붙을지는 main.js(handleAllyEngage)가 스스로 정한다.
          onAllyEngage(target.id, n0.id, remainingBudget);
        }
        engaged = true;
        break; // 한 번에 한 전투만 발동
      }
      // 플레이어(또는 유비군)가 적과 붙었더라도 유비군의 추적 턴은 별개로 계속
      // 진행한다 - 안 그러면 누군가 적 옆에 서 있는 동안 아군이 영영
      // 움직이지 못하게 된다.
      runAllyChases((allyEngaged) => done(engaged || allyEngaged, meta));
    };

    const maxLen = plans.reduce((m, p) => Math.max(m, p.path.length), 0);
    if (maxLen === 0) { finishTurn(); return; }
    let step = 0;
    const tick = () => {
      for (const { n0, path } of plans) {
        if (step < path.length) { n0.x = path[step].x; n0.y = path[step].y; }
      }
      render();
      step++;
      if (step < maxLen) setTimeout(tick, AI_STEP_MS);
      else setTimeout(finishTurn, AI_STEP_MS);
    };
    tick();
  }

  // 플레이어가 직접 조종하지 않는 아군(map.allyChases에 등록된 목록, 예:
  // 회남 벌판의 유비군→교유)이 자기 목표를 향해 스스로 걸어가는 턴. 적 AI와
  // 똑같이 한 칸씩 애니메이션한 뒤, 인접하면 onAllyEngage(allyId, targetId)로
  // 알려 실제 전투 판정은 main.js 쪽(resolveArmyBattle)에 맡긴다 - 여기서는
  // "누가 누구에게 다가갔는지"만 판단한다.
  function runAllyChases(callback) {
    const done = (battled) => { if (callback) callback(battled); };
    const chases = (map.allyChases || []).filter(({ allyId, targetId }) =>
      liveNpcs.some((n) => n.id === allyId) && liveNpcs.some((n) => n.id === targetId));
    if (!chases.length) { done(false); return; }

    const plans = chases.map(({ allyId, targetId }) => {
      const allyNpc = liveNpcs.find((n) => n.id === allyId);
      const targetNpc = liveNpcs.find((n) => n.id === targetId);
      const startX = allyNpc.x, startY = allyNpc.y;
      const range = (typeof armyAttackRange === 'function' && typeof armyFor === 'function') ? armyAttackRange(allyId, armyFor(allyId)) : 1;
      const path = StatusEffects.isConfused(allyId) ? [] : computeAiPath(allyNpc, targetNpc, null, range);
      if (path.length) { const last = path[path.length - 1]; allyNpc.x = last.x; allyNpc.y = last.y; }
      allyNpc.x = startX; allyNpc.y = startY;
      return { allyId, targetId, allyNpc, targetNpc, path, range };
    });
    render();

    const finishChase = () => {
      for (const { allyId, targetId, allyNpc, targetNpc, range } of plans) {
        if (inAttackRange(allyNpc, targetNpc, range)) {
          if (onAllyEngage) onAllyEngage(allyId, targetId);
          done(true);
          return; // 한 번에 한 전투만 발동(적 AI와 동일한 규칙)
        }
      }
      done(false);
    };

    const maxLen = plans.reduce((m, p) => Math.max(m, p.path.length), 0);
    if (maxLen === 0) { finishChase(); return; }
    let step = 0;
    const tick = () => {
      for (const { allyNpc, path } of plans) {
        if (step < path.length) { allyNpc.x = path[step].x; allyNpc.y = path[step].y; }
      }
      render();
      step++;
      if (step < maxLen) setTimeout(tick, AI_STEP_MS);
      else setTimeout(finishChase, AI_STEP_MS);
    };
    tick();
  }

  window.addEventListener('keydown',(ev)=>{
    if (Dialogue.isActive()) return;
    if (!document.getElementById('choice-box').classList.contains('hidden')) return;
    if (!document.getElementById('roster-box').classList.contains('hidden')) return;
    if (!document.getElementById('army-box').classList.contains('hidden')) return;
    if (!document.getElementById('bag-box').classList.contains('hidden')) return;
    if (!document.getElementById('battle-screen').classList.contains('hidden')) return;
    if (!document.getElementById('screen-explore').classList.contains('active')) return;
    let handled=true;
    switch(ev.key){
      case 'ArrowUp':case 'w':case 'W':tryMove(0,-1);break;
      case 'ArrowDown':case 's':case 'S':tryMove(0,1);break;
      case 'ArrowLeft':case 'a':case 'A':tryMove(-1,0);break;
      case 'ArrowRight':case 'd':case 'D':tryMove(1,0);break;
      case 'Enter':case ' ':interactFacing();break;
      default:handled=false;
    }
    if(handled)ev.preventDefault();
  });

  // drawNpc가 그리는 이름표(전투력 정보) 문구를 클릭 판정에서도 그대로
  // 재현한다 - 실제 렌더링(drawNpc, 630~649줄 근방)과 분기가 완전히
  // 같아야 이름표가 눈에 보이는 범위와 클릭 가능한 범위가 어긋나지 않는다.
  function clickableLabelFor(n, rd) {
    const met = !!GameState.npcStatus[n.id];
    const hidden = n.discoverable && !met;
    if (GameState.npcStatus[n.id] === 'recruited') return `${rd.name} · ${isScholarType(rd) ? '모병' : '훈련'}`;
    if (n._atResidence) return n._label || `${rd.name}의 집`;
    if (hidden) return null;
    const baseLabel = n.label || rd.name;
    if (rd.kind === 'enemy' && rd.troop != null) {
      return `${baseLabel} · 병${rd.troop} · 무${enemyArmyGrade(rd)} · 지${gradeFor(rd.stats.int, JIRYEOK_GRADES)}`;
    }
    if (n.id === 'yubi' && GameState.allyArmy) {
      return `${baseLabel} · 병${GameState.allyArmy.troop} · 무${warArmyGrade({ commanderId:'yubi', army:GameState.allyArmy })} · 지${gradeFor(GameState.allyArmy.deputy && ROSTER[GameState.allyArmy.deputy] ? ROSTER[GameState.allyArmy.deputy].stats.int : 0, JIRYEOK_GRADES)}`;
    }
    return baseLabel;
  }
  // 이름표(drawTag)는 실제 스프라이트보다 훨씬 넓게 그려져서(병력/등급 정보가
  // 다 들어가다 보니 타일 2~3개 폭) 플레이어가 작은 스프라이트 대신 그
  // 이름표를 누르는 게 오히려 자연스럽다 - 정확히 그 타일을 클릭하지
  // 않아도 이름표가 실제로 그려지는 영역이면 같은 유닛으로 인식한다.
  function npcAtLabel(wx, wy) {
    // wx/wy는 클릭 핸들러가 넘겨주는 "카메라 보정을 더한" 순수 월드 픽셀
    // 좌표(=npcAt이 타일로 나누는 것과 같은 좌표계)다 - worldX/worldY는
    // 반대로 카메라를 뺀 "캔버스 그리기용" 좌표라 여기서 그대로 쓰면 안 된다.
    for (const n0 of liveNpcs) {
      const n = effectiveNpc(n0);
      const rd = ROSTER[n.id]; if (!rd) continue;
      const text = clickableLabelFor(n, rd);
      if (!text) continue;
      const x = n.x * TILE + TILE / 2, y = n.y * TILE - 7;
      ctx.font = '11px "Noto Sans KR",sans-serif';
      const w = Math.max(50, ctx.measureText(text).width + 14);
      if (wx >= x - w / 2 && wx <= x + w / 2 && wy >= y - 15 && wy <= y + 3) return n;
      // 이름표 판정과 타일(npcAt) 판정 사이에 좁은 틈이 있다 - 캐릭터
      // 스프라이트는 drawNpc에서 footY(타일 하단 근처) 기준으로 위쪽으로
      // 그려지는데(기본 96x96, sx.67/sy.70 → 폭 64px·높이 67px), 그 머리
      // 꼭대기 근방(대략 타일 위쪽 9px)은 이름표 박스도 타일 박스도 못
      // 덮는다. 실기기에서 캐릭터 그림 위쪽을 눌렀는데 안 먹힌다는 제보가
      // 있었던 게 이 틈일 수 있어 drawNpc와 똑같은 계산으로 스프라이트
      // 그려진 영역 전체를 클릭 판정에 포함시킨다.
      const hidden = n.discoverable && !GameState.npcStatus[n.id];
      const spec = (!hidden && rd.sprite) ? rd.sprite : { fw:96, fh:96, sx:.67, sy:.70 };
      const footY = n.y * TILE + TILE * 0.9;
      const dw = Math.round(spec.fw * (spec.sx || 1));
      const dh = Math.round(spec.fh * (spec.sy == null ? (spec.sx || 1) : spec.sy));
      if (wx >= x - dw / 2 && wx <= x + dw / 2 && wy >= footY - dh && wy <= footY) return n;
    }
    return null;
  }

  // css/style.css의 회전 규칙(body{transform:rotate(90deg)})이 걸려 있으면
  // canvas.getBoundingClientRect()가 돌려주는 rect는 이미 회전이 적용된
  // "화면에 보이는 그대로"의 값이라, rect.width는 캔버스 내부 세로
  // 해상도(camera.h)에 대응하고 rect.height는 내부 가로 해상도(camera.w)에
  // 대응한다 - 그리고 clientX는 캔버스 내부 y축, clientY는 내부 x축에
  // (부호까지 바뀌어) 대응한다. 이전에는 회전이 없을 때와 똑같이
  // clientX↔내부x, clientY↔내부y로 그대로 계산했는데, 실기기 스크린샷에
  // "보이는 범위 안인데 하나도 안 눌린다"는 제보가 계속돼 실제로 캔버스에
  // 알려진 위치에 색칠한 사각형을 그려두고 스크린샷 픽셀을 직접 검사해
  // 봤더니, 이 축 자체가 뒤바뀌어 있었다(이전에 "회전 좌표 계산을
  // 검증했다"고 한 테스트는 이 핸들러가 계산한 좌표를 그대로 역산해서
  // 되돌리는 자기 자신과의 비교였을 뿐, 실제 렌더링된 화면과는 한 번도
  // 대조해본 적이 없었다 - 그래서 틀린 걸 못 잡았다). 아래 공식이 그
  // 픽셀 검증으로 확인한 올바른 역변환이다.
  function handleCanvasTap(clientX, clientY) {
    const rect=canvas.getBoundingClientRect();
    let wx, wy;
    if (isRotatedPresentation()) {
      wx = (clientY - rect.top) * (canvas.width / rect.height) + camera.x;
      wy = (rect.right - clientX) * (canvas.height / rect.width) + camera.y;
    } else {
      const sx=canvas.width/rect.width, sy=canvas.height/rect.height;
      wx = (clientX-rect.left)*sx + camera.x;
      wy = (clientY-rect.top)*sy + camera.y;
    }
    const x=Math.floor(wx/TILE), y=Math.floor(wy/TILE);
    const npc=npcAt(x,y) || npcAtLabel(wx,wy);
    const mover=activeMover();
    const range=controlledArmyRange();
    const inRange = !!(npc && mover && inAttackRange(npc, mover, range));
    // touchend/click 이벤트 자체는 도달하는데 판정이 왜 실패하는지 눈으로
    // 볼 수 있게, 실제로 계산된 타일/찾은 npc/사거리 판정 결과까지 로그에
    // 남긴다 - 원인이 확정되면 이 호출도 함께 지운다.
    logCanvasTapDebug(rect, x, y, npc, mover, range, inRange);
    // 궁병처럼 사거리가 1보다 넓은 군세는 인접칸이 아니어도(사거리 안이기만
    // 하면) 적을 클릭해서 바로 교전 메뉴를 띄울 수 있어야 한다 - 안 그러면
    // "붙어야만 공격 커맨드가 뜨는" 예전 문제가 그대로 남는다. 거리 판정은
    // inAttackRange를 써서, 대각선으로 붙은 8칸은 항상 사거리 안(맨해튼
    // 거리만 쓰면 대각선 인접칸이 사거리 밖으로 잘못 밀려난다)이면서도
    // 사거리 2가 대각선 먼 모서리까지 정사각형으로 넓어지지는 않게 한다.
    if(inRange){interact(npc,false);return;}
    // 적이 아니라 지금 조작 중인 문자 그대로의 플레이어(관우) 자신을 클릭해도
    // 책략만 바로 쓸 수 있게 한다(의병모집처럼 아군 대상 책략은 적과 붙어있을
    // 필요가 없다) - 유비처럼 실제 npc가 있는 경우는 위 분기에서 이미 자기
    // 자신과의 거리 0으로 잡혀 처리되므로(그의 interactNPC 쪽에서 갈라진다),
    // 여기서는 npc가 따로 없는 관우만 대상이 된다.
    if(!controlledId && mover===player && x===mover.x && y===mover.y && onInteract) onInteract(GameState.mainHero,{selfClick:true});
  }

  // 실기기 터치에서는 'click'이 합성되지 않거나 크게 늦게 오는 경우가 있다 -
  // index.html의 document 레벨 touchmove 핸들러가 당겨서 새로고침 방지를
  // 위해 이동이 조금이라도 있으면 preventDefault를 거는데, 그게 걸린
  // 터치 시퀀스 뒤에는 일부 브라우저/웹뷰가 뒤이은 click 자체를 만들어주지
  // 않는다(실제 손가락 탭은 완전히 고정된 채로 떼지는 경우가 거의 없어서
  // 거의 매번 이 조건에 걸린다). 그래서 touchend에서 직접 같은 판정을
  // 수행하고, 뒤이어 올 수도 있는 "유령 클릭"은 preventDefault + 짧은
  // 시간 잠금으로 중복 처리되지 않게 막는다.
  let lastTouchTapAt = 0;

  // 캔버스를 눌러도 "완전히 무반응"이라는 제보가 이어지는데, 실기기에
  // 원격 디버거를 연결할 방법이 없어 touchstart/touchend/click 중
  // 어디까지 실제로 도달하는지조차 알 수 없었다 - 화면에 직접 최근
  // 이벤트 로그를 몇 줄 찍어서, 다음에 또 안 눌릴 때 그 화면을 캡처해
  // 보내주면 "터치 자체가 캔버스에 안 닿는 건지" "닿긴 하는데 판정이
  // 틀린 건지"를 바로 구분할 수 있게 하는 임시 진단 도구다. 원인이
  // 확정되면 지운다.
  const touchDebugEl = document.getElementById('touch-debug-log');
  function logTouchDebug(label, clientX, clientY) {
    if (!touchDebugEl) return;
    const line = `${label} (${Math.round(clientX)},${Math.round(clientY)})`;
    const prev = touchDebugEl.textContent ? touchDebugEl.textContent.split('\n').slice(0, 4) : [];
    touchDebugEl.textContent = [line, ...prev].join('\n');
  }
  // handleCanvasTap이 실제로 계산해낸 결과(타일 좌표/찾은 npc/사거리
  // 판정)까지 같은 로그에 보태 찍는다 - touchend는 도달하는데 왜 아무
  // 일도 안 일어나는지, 엉뚱한 타일을 짚는 건지 사거리 판정이 실패하는
  // 건지를 구분하는 용도다.
  function logCanvasTapDebug(rect, tileX, tileY, npc, mover, range, inRange) {
    if (!touchDebugEl) return;
    const rectStr = `rect ${Math.round(rect.width)}x${Math.round(rect.height)}`;
    const npcStr = npc ? npc.id : '없음';
    const moverStr = mover ? `(${mover.x},${mover.y})` : '없음';
    const line = `→tile(${tileX},${tileY}) npc=${npcStr} mover=${moverStr} r=${range} 판정=${inRange}`;
    const prev = touchDebugEl.textContent ? touchDebugEl.textContent.split('\n').slice(0, 5) : [];
    touchDebugEl.textContent = [line, rectStr, ...prev].join('\n');
  }

  canvas.addEventListener('touchstart', (ev) => {
    const t = ev.touches[0];
    if (t) logTouchDebug('touchstart', t.clientX, t.clientY);
  }, { passive: true });

  canvas.addEventListener('touchend', (ev) => {
    if (ev.changedTouches.length !== 1) return; // 멀티터치(핀치 등)는 탭으로 보지 않는다
    ev.preventDefault();
    lastTouchTapAt = performance.now();
    const t = ev.changedTouches[0];
    logTouchDebug('touchend', t.clientX, t.clientY);
    handleCanvasTap(t.clientX, t.clientY);
  }, { passive: false });

  canvas.addEventListener('touchcancel', (ev) => {
    const t = ev.changedTouches[0];
    if (t) logTouchDebug('touchcancel', t.clientX, t.clientY);
  }, { passive: true });

  canvas.addEventListener('click', (ev) => {
    logTouchDebug('click', ev.clientX, ev.clientY);
    if (performance.now() - lastTouchTapAt < 500) return; // 방금 터치로 이미 처리한 탭의 유령 클릭
    handleCanvasTap(ev.clientX, ev.clientY);
  });

  // 회수평야 탈출씬처럼 "특정 npc(유비군 등)가 목적지에 도착했는지"를
  // main.js 쪽에서 판정해야 할 때 쓰는 범용 위치 조회 - 없으면 null.
  function npcPos(id) {
    const n = liveNpcs.find((x) => x.id === id);
    return n ? { x: n.x, y: n.y } : null;
  }

  return {
    load,render,removeNpc,addNpc,walkNpcPath,tryMove,interactFacing,runAiTurn,checkScheduledSpawns,rollAmbientEvent,lockMovement,setPlayerPos,
    panCameraTo,clearCameraFocus,startNpcStir,stopNpcStir,showDamageFloat,showAttackBump,setControlledUnit,npcPos,
    get currentMapId(){return mapId;},
    get camera(){return {...camera};},
    get playerPos(){return {x:player.x,y:player.y,dir:player.dir};},
    get mapSize(){return map ? {w:map.width,h:map.height} : {w:1,h:1};},
    get liveNpcIds(){return liveNpcs.map((n) => n.id);},
    get controlledUnitId(){return controlledId;},
  };
})();
