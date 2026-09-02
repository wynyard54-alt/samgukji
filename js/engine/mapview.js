const MapView = (function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
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
  let spawnDeadlineAbs = null; // 랜덤 등장 장수가 마감 기한의 50% 안쪽에 나오도록 하는 절대 개월수 상한
  let liveNpcs = [];
  let crowd = [];
  let crowdTimer = null;
  let animFrame = 0;
  window.addEventListener('fieldassetload', () => { if (map) render(); });

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function worldX(tx) { return tx * TILE - camera.x; }
  function worldY(ty) { return ty * TILE - camera.y; }

  // 데스크톱(가로 화면)에서는 기존 맵 지정값(주로 5:3 가로 비율)을 그대로 쓰지만,
  // 세로가 긴 모바일 화면에서는 그 비율 그대로 폭에 맞추면 캔버스 높이가 크게 줄어들어
  // 화면 아래쪽 대부분이 빈 배경으로 남는다. 세로 화면에서는 카메라 자체를 더 세로로
  // 길게 잡아 화면을 실제로 채우도록 한다 (렌더링/충돌 로직은 그대로, 보이는 범위만 조정).
  function computeCameraSize(map) {
    const baseW = (map.camera && map.camera.viewportW) || Math.min(DEFAULT_VIEW_W, map.width * TILE);
    const baseH = (map.camera && map.camera.viewportH) || Math.min(DEFAULT_VIEW_H, map.height * TILE);
    const isPortrait = window.innerWidth > 0 && window.innerWidth < window.innerHeight;
    if (!isPortrait) return { w: baseW, h: baseH };
    const w = Math.min(baseW, 480);
    const h = Math.min(900, Math.max(baseH, Math.round(w * 1.45)));
    return { w, h };
  }

  function load(id, opts) {
    mapId = id;
    map = MAPS[id];
    player = { x:map.playerStart.x, y:map.playerStart.y, dir:'down' };
    onInteract = (opts && opts.onInteract) || null;
    onApBlocked = (opts && opts.onApBlocked) || null;
    onApSpent = (opts && opts.onApSpent) || null;
    spawnDeadlineAbs = (opts && opts.spawnDeadlineAbsMonth) || null;

    liveNpcs = map.npcs.filter((n) => {
      const rd = ROSTER[n.id];
      if (rd && rd.chance != null) {
        if (!(n.id in GameState.npcVisible)) GameState.npcVisible[n.id] = Math.random() < rd.chance;
        if (!GameState.npcVisible[n.id]) return false;
      }
      const status = GameState.npcStatus[n.id];
      if (status === 'recruited' || status === 'resolved' || status === 'dead' || status === 'fled') return false;
      if (n.randomSpawn && !GameState.npcSpawnPos[n.id]) return false; // 아직 등장 시점이 되지 않음
      return true;
    });
    for (const n of liveNpcs) {
      if (n.randomSpawn && GameState.npcSpawnPos[n.id]) { n.x = GameState.npcSpawnPos[n.id].x; n.y = GameState.npcSpawnPos[n.id].y; }
    }
    for (const n0 of map.npcs) { if (n0.randomSpawn && !GameState.npcStatus[n0.id]) scheduleSpawn(n0.id); }

    crowd = (map.ambient || []).map((a, i) => ({ ...a, _id:`ambient_${i}`, _homeX:a.x, _homeY:a.y, _dir:'down' }));

    const size = computeCameraSize(map);
    camera.w = size.w;
    camera.h = size.h;
    canvas.width = camera.w;
    canvas.height = camera.h;
    updateCamera(true);
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
        if (!isWalkable(nx, ny)) continue;
        if (Math.round(nx) === player.x && Math.round(ny) === player.y) continue;
        p.x = nx; p.y = ny; p._dir = dir;
      }
      render();
    }, 720);
  }

  function updateCamera(snap) {
    const targetX = player.x*TILE + TILE/2 - camera.w/2;
    const targetY = player.y*TILE + TILE/2 - camera.h/2;
    const maxX = Math.max(0, map.width*TILE - camera.w);
    const maxY = Math.max(0, map.height*TILE - camera.h);
    camera.x = clamp(targetX, 0, maxX);
    camera.y = clamp(targetY, 0, maxY);
    if (!snap) { camera.x = Math.round(camera.x); camera.y = Math.round(camera.y); }
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

  function tileMoveCost(x, y) {
    const tile = map.tiles[Math.round(y)] && map.tiles[Math.round(y)][Math.round(x)];
    return TILE_ROUGH[tile] ? 2 : 1;
  }

  function render() {
    if (!map) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();
    drawV6GroundDressing();
    drawBackDecor();
    drawV6BackDressing();
    drawAreaLabels();

    const actors = [];
    for (const p of crowd) actors.push({ type:'ambient', y:p.y, data:p });
    for (const n0 of liveNpcs) {
      const n = effectiveNpc(n0);
      actors.push({ type:'npc', y:n.y, data:n });
    }
    actors.push({ type:'player', y:player.y, data:player });
    actors.sort((a,b) => a.y - b.y);

    for (const a of actors) {
      if (a.type === 'ambient') drawAmbient(a.data);
      else if (a.type === 'npc') drawNpc(a.data);
      else drawHero();
    }

    drawFrontDecor();
    drawLocationRibbon();
  }

  function drawNatural(key, tileX, tileY, width, anchor=.72) {
    const img=FieldAssets.get(key);
    if (!FieldAssets.ready(img)) return false;
    const height=width*(img.naturalHeight/img.naturalWidth);
    return FieldAssets.draw(ctx,key,worldX(tileX)-width/2,worldY(tileY)-height*anchor,width,height);
  }

  function drawV6GroundDressing() {
    if (mapId!=='takhyeon') return;
    ctx.save(); ctx.globalAlpha=.82;
    drawNatural('v6_ground_market',20.0,15.0,760,.53);
    drawNatural('v6_ground_dirt',10.0,13.0,280,.55);
    drawNatural('v6_ground_dirt',29.0,15.5,250,.55);
    drawNatural('v6_edge_grass',27.5,18.2,270,.55);
    drawNatural('v6_edge_stone',20.0,8.5,280,.55);
    drawNatural('v6_path_curve',7.0,18.0,210,.55);
    drawNatural('v6_drain',25.0,14.0,190,.55);
    drawNatural('v6_shadow_tree',27.6,11.2,290,.55);
    drawNatural('v6_shadow_roof',7.0,20.5,280,.55);
    drawNatural('v6_weeds',33.0,21.0,145,.62);
    ctx.restore();
  }

  function drawV6BackDressing() {
    if (mapId!=='takhyeon') return;
    // These fill the visual gaps without changing the collision grid or quest positions.
    drawNatural('v6_wall_gate',20.0,8.2,250,.72);
    drawNatural('v6_fence_alley',11.0,9.0,195,.72);
    drawNatural('v6_tavern_seats',7.5,22.8,190,.72);
    drawNatural('v6_stall_vegetable',25.5,17.2,200,.72);
    drawNatural('v6_stall_grain',15.5,11.8,190,.72);
    drawNatural('v6_weapon_rack',34.0,15.0,165,.72);
    drawNatural('v6_supply_cluster',32.5,16.2,155,.72);
    drawNatural('v6_stable',27.5,23.5,200,.72);
    drawNatural('v6_awning_lantern',12.8,12.0,155,.72);
    drawNatural('v7_yellowturban_lair',35.3,26.0,440,.78);
    // v6_idle_* (학자/아이/상인/짐꾼/경비/물장수/마부 등) 고정 배경인물 장식은 전부 뺀다 -
    // 실제 배회하는 NPC/군중 캐릭터와 크기·화풍이 안 맞고, 상호작용도 안 되는데
    // 마치 또 다른 사람이 서 있는 것처럼 보여 혼동을 준다. 사람은 항상 실제 NPC/군중
    // 시스템(drawNpc/drawAmbient)이 그리게 하고, 여기는 건물/소품/지형만 남긴다.
  }

  function drawGround() {
    const sx = Math.max(0, Math.floor(camera.x/TILE)-1);
    const sy = Math.max(0, Math.floor(camera.y/TILE)-1);
    const ex = Math.min(map.width-1, Math.ceil((camera.x+camera.w)/TILE)+1);
    const ey = Math.min(map.height-1, Math.ceil((camera.y+camera.h)/TILE)+1);
    for (let y=sy; y<=ey; y++) {
      for (let x=sx; x<=ex; x++) {
        const t = map.tiles[y][x];
        const px=worldX(x), py=worldY(y);
        const key = t===1 ? 'tile_road' : t===3 ? 'tile_water' : t===5 ? 'tile_rough' : 'tile_grass';
        if (!FieldAssets.tile(ctx,key,px,py,TILE)) {
          ctx.fillStyle = t===1 ? '#c6b084' : t===3 ? '#678b92' : t===5 ? '#7d7259' : '#829762';
          ctx.fillRect(px,py,TILE,TILE);
        }
      }
    }

    // 시장 중심부는 흙길을 넓게 깔아 도시 생활권이 한눈에 읽히게 한다.
    for (let y=6; y<=14; y++) for (let x=4; x<=24; x++) {
      if (map.tiles[y] && map.tiles[y][x] === 0) FieldAssets.tile(ctx,'tile_dirt',worldX(x),worldY(y),TILE);
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

  // 주인 없는 민가(residenceId)는 해당 책사를 발견하기 전엔 무명 '민가'로 표기한다.
  // 발견(met/recruited) 후에는 그 장수 본인이 집 앞으로 옮겨와 자기 이름표를 달기 때문에
  // (drawNpc의 _atResidence 라벨), 건물 쪽 라벨은 중복되지 않도록 감춘다.
  function decorLabel(d) {
    if (!d.residenceId) return d.label;
    const met = ['met', 'recruited'].includes(GameState.npcStatus[d.residenceId]);
    return met ? null : d.label;
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

  function drawAmbient(p) {
    const x=worldX(p.x)+TILE/2, y=worldY(p.y)+TILE*.88;
    const role = ['merchant','farmer','woman','elder','guard','child','porter'].includes(p.archetype) ? p.archetype : 'farmer';
    const key=`npc_${role}`;
    if (!FieldAssets.sprite(ctx,key,x,y,p._dir||'down',animFrame,32,48,.92,3)) {
      drawPersonSprite(x,y,{ palette:PALETTES[p.palette]||PALETTES.ash, archetype:p.archetype, scale:.9, dir:p._dir });
    }
  }

  function drawNpc(n) {
    const rd=ROSTER[n.id]; if(!rd) return;
    const x=worldX(n.x)+TILE/2, y=worldY(n.y)+TILE*.9;
    const met=!!GameState.npcStatus[n.id];
    const hidden=n.discoverable && !met;
    const scholar=isScholarType(rd);
    const role=scholar ? 'scholar' : 'guard';

    // Undiscovered named characters intentionally blend into the crowd.
    // Discovered Liu Bei and Lu Bu use their own character sheets.
    const uniqueKey=!hidden && (n.id==='yubi' || n.id==='yeopo') ? `hero_${n.id}` : null;
    const drawn=uniqueKey
      ? FieldAssets.sprite(ctx,uniqueKey,x,y,'down',animFrame,48,64,.88,3)
      : (!hidden && rd.kind==='enemy')
        ? FieldAssets.sprite(ctx,'enemy_yellowturban',x,y,'down',animFrame,32,48,1.04,3)
        : FieldAssets.sprite(ctx,`npc_${role}`,x,y,'down',animFrame,32,48,hidden?.95:1.04,3);
    if (!drawn) {
      const palette=hidden
        ? {robe:'#72746e',dark:'#474a47',trim:'#9d9e94',skin:'#d1aa80'}
        : scholar
          ? {robe:'#536c73',dark:'#33464b',trim:'#b0c2b5',skin:'#d5ab82'}
          : {robe:'#725245',dark:'#49362f',trim:'#b69b75',skin:'#d0a67d'};
      drawPersonSprite(x,y,{palette,archetype:scholar?'scholar':'warrior',scale:1.04,dir:'down',heroId:n.id});
    }

    // 등용된 장수는 마을에 남아 모병/훈련을 돕는다 - 이름표에 담당 역할을 표기한다.
    if (GameState.npcStatus[n.id] === 'recruited') {
      drawTag(x, worldY(n.y)-7, `${rd.name} · ${isScholarType(rd) ? '모병' : '훈련'}`, '#2f4d33');
    } else if (n._atResidence) {
      drawTag(x, worldY(n.y)-7, n._label || `${rd.name}의 집`, '#72542f');
    } else if (!hidden && n.label) {
      // 적 군세는 이름표 대신 [잔여병사/무력등급/지력등급]을 표기해 교전 전 전력을 가늠할 수 있게 한다.
      // rd.troop/능력치는 전투 결과에 따라 실시간으로 바뀌므로 매 프레임 다시 계산한다.
      const label = (rd.kind === 'enemy' && rd.troop != null)
        ? `${n.label} · 병${rd.troop} · 무${enemyArmyGrade(rd)} · 지${gradeFor(rd.stats.int, JIRYEOK_GRADES)}`
        : n.label;
      drawTag(x, worldY(n.y)-7, label, '#40372c');
    } else if (hidden && Math.abs(n.x-player.x)+Math.abs(n.y-player.y)<=3) {
      ctx.fillStyle='rgba(45,40,34,.82)';ctx.beginPath();ctx.roundRect(x-13,worldY(n.y)-18,26,17,7);ctx.fill();
      ctx.fillStyle='#eadfca';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('…',x,worldY(n.y)-6);
    }
  }

  function drawHero() {
    const id=GameState.mainHero;
    const x=worldX(player.x)+TILE/2, y=worldY(player.y)+TILE*.94;
    const key=id==='gwanwoo' ? 'hero_gwanwoo' : 'hero_jangbi';
    const frame=animFrame%3;
    if (!FieldAssets.sprite(ctx,key,x,y,player.dir,frame,48,64,1.05,3)) {
      const palette=id==='gwanwoo'
        ? {robe:'#356547',dark:'#253e31',trim:'#a88749',skin:'#b56d54'}
        : {robe:'#7b4035',dark:'#4d2b27',trim:'#b58c4f',skin:'#bd795e'};
      drawPersonSprite(x,y,{palette,archetype:'hero',scale:1.17,dir:player.dir,heroId:id});
    }
    // Named hero marker stays subtle: unique color/weapon should do most of the work.
    // 출정 중(군세 편성 완료)에는 적 군세와 같은 형식으로 [병력/무력/지력]을 함께 표기한다.
    const army = GameState.army;
    if (army) {
      const deputy = army.deputy ? ROSTER[army.deputy] : null;
      const jiryeok = gradeFor(deputy ? deputy.stats.int : 0, JIRYEOK_GRADES);
      drawTag(x, y-64, `${ROSTER[id].name} · 병${army.troop} · 무${playerArmyGrade()} · 지${jiryeok}`, 'rgba(32,46,31,.82)');
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

  function drawLocationRibbon() {
    ctx.fillStyle='rgba(34,30,25,.65)';ctx.fillRect(12,12,128,27);
    ctx.fillStyle='#f2e4c5';ctx.font='bold 12px "Noto Sans KR",sans-serif';ctx.textAlign='left';ctx.fillText(map.name||'',23,30);
  }

  function tryMove(dx, dy) {
    if (!map) return;
    const nx=player.x+dx, ny=player.y+dy;
    player.dir = dx<0?'left':dx>0?'right':dy<0?'up':'down';
    if (!isWalkable(nx,ny)) { render(); return; }
    const npc=npcAt(nx,ny);
    if (npc) { interact(npc,false); return; } // 인접칸으로 다가가 공격하는 행동엔 행동력을 소모하지 않는다
    if (map.apMovement) {
      const cost = tileMoveCost(nx,ny);
      if (!GameState.spendAP(cost)) { if (onApBlocked) onApBlocked(); render(); return; }
      if (onApSpent) onApSpent();
    }
    player.x=nx; player.y=ny;
    updateCamera();
    render();
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

  function interact(npc, proximity) {
    if (!onInteract) return;
    const firstDiscovery=!!(npc.discoverable && !GameState.npcStatus[npc.id]);
    onInteract(npc.id,{ firstDiscovery, discoveryText:npc.discoveryText||'', proximity:!!proximity, atResidence:!!npc._atResidence });
  }

  function interactFacing() {
    const dirs = player.dir==='up' ? [[0,-1],[-1,0],[1,0],[0,1]] :
      player.dir==='down' ? [[0,1],[-1,0],[1,0],[0,-1]] :
      player.dir==='left' ? [[-1,0],[0,-1],[0,1],[1,0]] : [[1,0],[0,-1],[0,1],[-1,0]];
    for (const [dx,dy] of dirs) {
      const npc=npcAt(player.x+dx,player.y+dy);
      if(npc){interact(npc,false);return;}
    }
  }

  function removeNpc(id) { liveNpcs=liveNpcs.filter((n)=>n.id!==id); render(); }

  function absMonth(year, month) { return year * 12 + month; }

  // 등장 시점을 (현재로부터 마감까지 남은 기간의) 50% 이내로 제한해, 마을 체류기한 막판에야
  // 겨우 등장하는 일이 없도록 한다.
  function scheduleSpawn(id) {
    if (GameState.npcSpawnMonth[id] != null) return;
    const nowAbs = absMonth(GameState.year, GameState.month);
    const deadlineAbs = spawnDeadlineAbs || (nowAbs + 24);
    const windowMonths = Math.max(2, deadlineAbs - nowAbs);
    const maxOffset = Math.max(1, Math.floor(windowMonths * 0.5));
    GameState.npcSpawnMonth[id] = nowAbs + 1 + Math.floor(Math.random() * maxOffset);
  }

  function randomWalkableTile() {
    for (let tries = 0; tries < 200; tries++) {
      const x = 1 + Math.floor(Math.random() * (map.width - 2));
      const y = 1 + Math.floor(Math.random() * (map.height - 2));
      if (!isWalkable(x, y)) continue;
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
  function computeAiPath(n0) {
    const path = [];
    let cx = n0.x, cy = n0.y, steps = AI_MOVE_BUDGET;
    if (Math.abs(cx-player.x)+Math.abs(cy-player.y) <= 1) return path; // 이미 사거리 - 이동 없이 대기 후 공격
    while (steps > 0) {
      const dist = Math.abs(cx-player.x)+Math.abs(cy-player.y);
      if (dist <= 1) break;
      const dx = Math.sign(player.x-cx), dy = Math.sign(player.y-cy);
      const preferX = Math.abs(player.x-cx) >= Math.abs(player.y-cy);
      const options = preferX ? [[dx,0],[0,dy]] : [[0,dy],[dx,0]];
      let moved = false;
      for (const [ddx,ddy] of options) {
        if (!ddx && !ddy) continue;
        const tx=cx+ddx, ty=cy+ddy;
        if (!isWalkable(tx,ty)) continue;
        if (tx===player.x && ty===player.y) continue; // 플레이어 타일로는 이동하지 않는다
        if (npcAt(tx,ty)) continue;
        const cost = tileMoveCost(tx,ty);
        if (cost > steps) continue;
        cx=tx; cy=ty; steps-=cost; moved=true; path.push({x:cx,y:cy}); break;
      }
      if (!moved) break; // 막혔거나 이동력이 모자라 대기
    }
    return path;
  }

  // 플레이어 턴 종료(휴식/다음달)시 호출되는 Tier2 AI: 사거리 안이면 공격, 아니면 접근, 막히면 대기.
  // 이동은 한 칸씩 애니메이션으로 보여준 뒤(순간이동 방지) 완료되면 callback(전투발동여부)를 호출한다.
  // 적이 여러 명이어도 턴 길이가 늘어나지 않도록 전원이 동시에(같은 박자로) 이동한다.
  function runAiTurn(callback) {
    const done = (battled) => { if (callback) callback(battled); };
    if (!map || !map.apMovement) { done(false); return; }
    const hostiles = liveNpcs.filter((n0) => { const rd = ROSTER[n0.id]; return rd && rd.kind === 'enemy'; });

    // 계획 단계: 기존처럼 한 명씩 실제 위치를 옮겨가며 서로 겹치지 않는 경로를 계산한 뒤,
    // 다시 시작 위치로 되돌려 전원이 동시에 애니메이션되도록 한다.
    const plans = hostiles.map((n0) => ({ n0, startX: n0.x, startY: n0.y, path: [] }));
    for (const plan of plans) {
      plan.path = computeAiPath(plan.n0);
      if (plan.path.length) { const last = plan.path[plan.path.length - 1]; plan.n0.x = last.x; plan.n0.y = last.y; }
    }
    for (const plan of plans) { plan.n0.x = plan.startX; plan.n0.y = plan.startY; }
    render();

    const finishTurn = () => {
      for (const { n0 } of plans) {
        const n = effectiveNpc(n0);
        if (Math.abs(n.x-player.x)+Math.abs(n.y-player.y) === 1) { interact(n,false); done(true); return; } // 한 번에 한 전투만 발동
      }
      done(false);
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

  window.addEventListener('keydown',(ev)=>{
    if (Dialogue.isActive()) return;
    if (!document.getElementById('choice-box').classList.contains('hidden')) return;
    if (!document.getElementById('roster-box').classList.contains('hidden')) return;
    if (!document.getElementById('army-box').classList.contains('hidden')) return;
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

  canvas.addEventListener('click',(ev)=>{
    const rect=canvas.getBoundingClientRect();
    const sx=canvas.width/rect.width, sy=canvas.height/rect.height;
    const wx=((ev.clientX-rect.left)*sx)+camera.x;
    const wy=((ev.clientY-rect.top)*sy)+camera.y;
    const x=Math.floor(wx/TILE), y=Math.floor(wy/TILE);
    const npc=npcAt(x,y);
    if(npc && Math.abs(npc.x-player.x)+Math.abs(npc.y-player.y)===1)interact(npc,false);
  });

  return {
    load,render,removeNpc,tryMove,interactFacing,runAiTurn,checkScheduledSpawns,
    get currentMapId(){return mapId;},
    get camera(){return {...camera};},
    get playerPos(){return {x:player.x,y:player.y,dir:player.dir};},
    get mapSize(){return map ? {w:map.width,h:map.height} : {w:1,h:1};},
  };
})();
