const MapView = (function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const TILE = 40;
  const DEFAULT_VIEW_W = 800;
  const DEFAULT_VIEW_H = 480;

  const TILE_BLOCKED = { 2:true, 3:true, 4:true };
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
  let liveNpcs = [];
  let crowd = [];
  let crowdTimer = null;
  let animFrame = 0;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function worldX(tx) { return tx * TILE - camera.x; }
  function worldY(ty) { return ty * TILE - camera.y; }

  function load(id, opts) {
    mapId = id;
    map = MAPS[id];
    player = { x:map.playerStart.x, y:map.playerStart.y, dir:'down' };
    onInteract = (opts && opts.onInteract) || null;

    liveNpcs = map.npcs.filter((n) => {
      const rd = ROSTER[n.id];
      if (rd && rd.chance != null) {
        if (!(n.id in GameState.npcVisible)) GameState.npcVisible[n.id] = Math.random() < rd.chance;
        if (!GameState.npcVisible[n.id]) return false;
      }
      const status = GameState.npcStatus[n.id];
      if (status === 'recruited' || status === 'resolved' || status === 'dead' || status === 'fled') return false;
      return true;
    });

    crowd = (map.ambient || []).map((a, i) => ({ ...a, _id:`ambient_${i}`, _homeX:a.x, _homeY:a.y, _dir:'down' }));

    camera.w = (map.camera && map.camera.viewportW) || Math.min(DEFAULT_VIEW_W, map.width * TILE);
    camera.h = (map.camera && map.camera.viewportH) || Math.min(DEFAULT_VIEW_H, map.height * TILE);
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
    const met = GameState.npcStatus[n.id] === 'met';
    if (n.residence && met && rd && rd.kind === 'recruit' && isScholarType(rd)) {
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

  function render() {
    if (!map) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();
    drawBackDecor();
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

  function drawGround() {
    const sx = Math.max(0, Math.floor(camera.x/TILE)-1);
    const sy = Math.max(0, Math.floor(camera.y/TILE)-1);
    const ex = Math.min(map.width-1, Math.ceil((camera.x+camera.w)/TILE)+1);
    const ey = Math.min(map.height-1, Math.ceil((camera.y+camera.h)/TILE)+1);
    for (let y=sy; y<=ey; y++) {
      for (let x=sx; x<=ex; x++) {
        const t = map.tiles[y][x];
        const px=worldX(x), py=worldY(y);
        if (t === 1) {
          ctx.fillStyle = '#b9a176';
          ctx.fillRect(px,py,TILE,TILE);
          ctx.fillStyle = ((x+y)%3===0) ? 'rgba(100,77,48,.09)' : 'rgba(255,255,255,.045)';
          ctx.fillRect(px+4,py+8,7,3); ctx.fillRect(px+26,py+28,5,2);
        } else if (t === 3) {
          ctx.fillStyle='#70939a'; ctx.fillRect(px,py,TILE,TILE);
          ctx.strokeStyle='rgba(220,240,230,.28)'; ctx.beginPath(); ctx.moveTo(px+4,py+13);ctx.lineTo(px+31,py+13);ctx.stroke();
        } else {
          ctx.fillStyle = '#98a879';
          ctx.fillRect(px,py,TILE,TILE);
          if ((x*13+y*7)%5===0) { ctx.fillStyle='rgba(62,89,52,.18)'; ctx.fillRect(px+7,py+19,2,5); ctx.fillRect(px+10,py+17,2,7); }
        }
      }
    }

    // 큰 길의 밝은 중앙부로 시장 동선을 읽기 쉽게 한다.
    ctx.fillStyle='rgba(207,181,130,.15)';
    ctx.fillRect(worldX(13), worldY(1), TILE*2, TILE*(map.height-2));
    ctx.fillRect(worldX(1), worldY(10), TILE*(map.width-2), TILE*2);
  }

  function drawBackDecor() {
    for (const d of (map.decor || [])) {
      if (d.type === 'building') drawBuilding(d, false);
      else if (d.type === 'gate') drawGate(d, false);
      else if (d.type === 'stall') drawStall(d);
      else if (d.type === 'well') drawWell(d);
      else if (d.type === 'cart') drawCart(d);
      else if (d.type === 'crate') drawCrate(d);
      else if (d.type === 'lanterns') drawLanterns(d);
    }
  }

  function drawFrontDecor() {
    for (const d of (map.decor || [])) {
      if (d.type === 'tree') drawTree(d);
      else if (d.type === 'building') drawBuilding(d, true);
      else if (d.type === 'gate') drawGate(d, true);
    }
  }

  function drawBuilding(d, frontOnly) {
    const x=worldX(d.x), y=worldY(d.y), w=d.w*TILE, h=d.h*TILE;
    const roofColors = { red:['#7d3d32','#a45b42'], charcoal:['#434743','#62665e'], brown:['#624b3b','#80634b'] };
    const rc = roofColors[d.roof] || roofColors.brown;
    if (!frontOnly) {
      ctx.fillStyle='#d1b982'; ctx.fillRect(x+8,y+38,w-16,h-42);
      ctx.fillStyle='#5e4835';
      for (let i=0;i<Math.max(1,d.w-1);i++) ctx.fillRect(x+22+i*46,y+h-58,23,58);
      ctx.fillStyle='#2f2b27'; ctx.fillRect(x+w/2-12,y+h-47,24,47);
      if (d.sign) {
        ctx.fillStyle='#68432d'; ctx.fillRect(x+w/2-16,y+h-76,32,24);
        ctx.fillStyle='#ead6a5'; ctx.font='bold 16px serif'; ctx.textAlign='center'; ctx.fillText(d.sign,x+w/2,y+h-58);
      }
    } else {
      // 기와지붕을 전경에 다시 그려 캐릭터가 건물 뒤로 지나갈 때 자연스럽게 가려진다.
      ctx.fillStyle=rc[0];
      ctx.beginPath(); ctx.moveTo(x-8,y+44); ctx.lineTo(x+w/2,y+4); ctx.lineTo(x+w+8,y+44); ctx.lineTo(x+w-2,y+66); ctx.lineTo(x+2,y+66); ctx.closePath(); ctx.fill();
      ctx.fillStyle=rc[1]; ctx.fillRect(x-4,y+56,w+8,11);
      ctx.strokeStyle='rgba(235,211,164,.24)';
      for(let xx=x+6;xx<x+w;xx+=16){ctx.beginPath();ctx.moveTo(xx,y+49);ctx.lineTo(xx+8,y+63);ctx.stroke();}
      if (d.label) {
        ctx.fillStyle='rgba(43,35,26,.78)'; ctx.fillRect(x+w/2-34,y+69,68,20);
        ctx.fillStyle='#f1dfb5'; ctx.font='12px "Noto Sans KR",sans-serif'; ctx.textAlign='center'; ctx.fillText(d.label,x+w/2,y+84);
      }
    }
  }

  function drawGate(d, frontOnly) {
    const x=worldX(d.x), y=worldY(d.y), w=d.w*TILE;
    if (!frontOnly) {
      ctx.fillStyle='#9b8b6b'; ctx.fillRect(x,y+34,w,TILE*1.45);
      ctx.fillStyle='#42382d'; ctx.fillRect(x+w/2-42,y+50,84,TILE*1.1);
    } else {
      ctx.fillStyle='#4e4740';
      ctx.beginPath();ctx.moveTo(x-16,y+34);ctx.lineTo(x+w/2,y);ctx.lineTo(x+w+16,y+34);ctx.lineTo(x+w+5,y+50);ctx.lineTo(x-5,y+50);ctx.closePath();ctx.fill();
      ctx.fillStyle='#715840';ctx.fillRect(x-8,y+46,w+16,10);
      ctx.fillStyle='#e2d2a9';ctx.fillRect(x+w/2-42,y+13,84,23);
      ctx.fillStyle='#463a2c';ctx.font='bold 15px "Song Myung",serif';ctx.textAlign='center';ctx.fillText(d.label||'성문',x+w/2,y+30);
    }
  }

  function drawStall(d) {
    const x=worldX(d.x), y=worldY(d.y), w=(d.w||2)*TILE;
    const tones={red:'#8b4c3f',tan:'#a38a61',green:'#677b58'};
    ctx.fillStyle='#6a4e34'; ctx.fillRect(x+8,y+21,w-16,34);
    ctx.fillStyle=tones[d.tone]||tones.tan; ctx.fillRect(x,y+10,w,15);
    ctx.fillStyle='#d5bd8b'; for(let i=0;i<4;i++) ctx.fillRect(x+10+i*16,y+35,8,6);
    ctx.fillStyle='#59412e';ctx.fillRect(x+8,y+55,5,19);ctx.fillRect(x+w-13,y+55,5,19);
  }

  function drawTree(d) {
    const x=worldX(d.x), y=worldY(d.y), s=d.scale||1;
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle='#5d4733';ctx.fillRect(-5,4,10,45);
    ctx.fillStyle='#4d6f42';
    const blobs=[[-18,-3,18],[-3,-13,22],[17,-2,18],[-8,6,21],[10,9,18]];
    for(const b of blobs){ctx.beginPath();ctx.arc(b[0],b[1],b[2],0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='rgba(151,177,111,.28)';ctx.beginPath();ctx.arc(-8,-14,11,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  function drawWell(d){const x=worldX(d.x),y=worldY(d.y);ctx.fillStyle='#78736a';ctx.beginPath();ctx.ellipse(x,y,20,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3f5557';ctx.beginPath();ctx.ellipse(x,y-2,13,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5f4a37';ctx.fillRect(x-17,y-28,4,27);ctx.fillRect(x+13,y-28,4,27);ctx.fillRect(x-17,y-29,34,4)}
  function drawCart(d){const x=worldX(d.x),y=worldY(d.y);ctx.fillStyle='#725238';ctx.fillRect(x-23,y-14,48,22);ctx.strokeStyle='#433328';ctx.lineWidth=4;for(const q of [-15,16]){ctx.beginPath();ctx.arc(x+q,y+12,9,0,Math.PI*2);ctx.stroke();}ctx.fillRect(x+23,y-4,27,4)}
  function drawCrate(d){const x=worldX(d.x),y=worldY(d.y);ctx.fillStyle='#7f6042';ctx.fillRect(x,y,22,18);ctx.strokeStyle='#4e3a2b';ctx.strokeRect(x,y,22,18);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+22,y+18);ctx.moveTo(x+22,y);ctx.lineTo(x,y+18);ctx.stroke()}
  function drawLanterns(d){const x=worldX(d.x),y=worldY(d.y);ctx.strokeStyle='#5c4632';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(d.count||4)*28,y);ctx.stroke();for(let i=0;i<(d.count||4);i++){ctx.fillStyle='#9c4938';ctx.fillRect(x+10+i*28,y+3,10,14)}}

  function drawAreaLabels() {
    for (const l of (map.areaLabels||[])) {
      const x=worldX(l.x), y=worldY(l.y);
      if (x < -100 || x > canvas.width+100 || y < -40 || y > canvas.height+40) continue;
      ctx.fillStyle='rgba(50,42,32,.50)';ctx.fillRect(x-35,y-13,70,19);
      ctx.fillStyle='#f0e3c2';ctx.font='11px "Noto Sans KR",sans-serif';ctx.textAlign='center';ctx.fillText(l.text,x,y+1);
    }
  }

  function drawAmbient(p) {
    const x=worldX(p.x)+TILE/2, y=worldY(p.y)+TILE*0.77;
    drawPersonSprite(x,y,{ palette:PALETTES[p.palette]||PALETTES.ash, archetype:p.archetype, scale:.9, dir:p._dir });
  }

  function drawNpc(n) {
    const rd=ROSTER[n.id]; if(!rd) return;
    const x=worldX(n.x)+TILE/2, y=worldY(n.y)+TILE*0.78;
    const met=!!GameState.npcStatus[n.id];
    const hidden=n.discoverable && !met;
    let palette;
    if (hidden) palette={robe:'#72746e',dark:'#474a47',trim:'#9d9e94',skin:'#d1aa80'};
    else if (isScholarType(rd)) palette={robe:'#536c73',dark:'#33464b',trim:'#b0c2b5',skin:'#d5ab82'};
    else palette={robe:'#725245',dark:'#49362f',trim:'#b69b75',skin:'#d0a67d'};
    drawPersonSprite(x,y,{palette,archetype:isScholarType(rd)?'scholar':'warrior',scale:1.04,dir:'down',heroId:n.id});

    if (n._atResidence) {
      drawTag(x, worldY(n.y)-7, n._label || `${rd.name}의 집`, '#72542f');
    } else if (!hidden && n.label) {
      drawTag(x, worldY(n.y)-7, n.label, '#40372c');
    } else if (hidden && Math.abs(n.x-player.x)+Math.abs(n.y-player.y)<=3) {
      ctx.fillStyle='rgba(45,40,34,.78)';ctx.beginPath();ctx.roundRect(x-13,worldY(n.y)-18,26,17,7);ctx.fill();
      ctx.fillStyle='#eadfca';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('…',x,worldY(n.y)-6);
    }
  }

  function drawHero() {
    const id=GameState.mainHero;
    const x=worldX(player.x)+TILE/2, y=worldY(player.y)+TILE*.80;
    const palette=id==='gwanwoo'
      ? {robe:'#356547',dark:'#253e31',trim:'#a88749',skin:'#b56d54'}
      : {robe:'#7b4035',dark:'#4d2b27',trim:'#b58c4f',skin:'#bd795e'};
    drawPersonSprite(x,y,{palette,archetype:'hero',scale:1.17,dir:player.dir,heroId:id});
  }

  function drawPersonSprite(x,y,opt) {
    const p=opt.palette, s=opt.scale||1;
    ctx.save(); ctx.translate(Math.round(x),Math.round(y)); ctx.scale(s,s);
    // 그림자
    ctx.fillStyle='rgba(35,31,26,.22)';ctx.beginPath();ctx.ellipse(0,2,11,5,0,0,Math.PI*2);ctx.fill();
    // 다리/신발
    ctx.fillStyle=p.dark;ctx.fillRect(-7,-12,5,13);ctx.fillRect(2,-12,5,13);ctx.fillStyle='#332e2a';ctx.fillRect(-8,-2,7,4);ctx.fillRect(1,-2,7,4);
    // 의복 몸통
    ctx.fillStyle=p.robe;ctx.beginPath();ctx.moveTo(-10,-30);ctx.lineTo(10,-30);ctx.lineTo(12,-10);ctx.lineTo(-12,-10);ctx.closePath();ctx.fill();
    ctx.fillStyle=p.trim;ctx.fillRect(-2,-30,4,18);
    // 팔
    ctx.fillStyle=p.robe;ctx.fillRect(-14,-27,5,14);ctx.fillRect(9,-27,5,14);
    // 머리
    ctx.fillStyle=p.skin;ctx.fillRect(-7,-42,14,13);
    ctx.fillStyle=p.dark;ctx.fillRect(-8,-46,16,5);
    if (opt.archetype==='scholar' || opt.archetype==='elder') {ctx.fillRect(-3,-51,6,6);ctx.fillRect(-8,-47,16,3);}
    if (opt.archetype==='merchant') {ctx.fillStyle='#59554d';ctx.fillRect(-10,-47,20,3);ctx.fillRect(-7,-51,14,4);}
    if (opt.archetype==='guard' || opt.archetype==='warrior' || opt.archetype==='hero') {ctx.fillStyle='#444843';ctx.fillRect(-9,-48,18,5);ctx.fillRect(-5,-52,10,4);}
    if (opt.archetype==='woman') {ctx.fillStyle='#50483f';ctx.fillRect(-10,-45,20,7);}
    if (opt.archetype==='child') {ctx.scale(.82,.82);}
    // 수염/무기 — 장수 실루엣을 일반인보다 확실히 구분
    if (opt.heroId==='gwanwoo') {
      ctx.fillStyle='#262523';ctx.fillRect(-5,-29,10,17);ctx.fillRect(-3,-12,6,10);
      ctx.fillStyle='#504330';ctx.fillRect(13,-43,3,47);ctx.fillStyle='#a6a8a0';ctx.beginPath();ctx.moveTo(14,-50);ctx.lineTo(8,-40);ctx.lineTo(14,-43);ctx.lineTo(20,-40);ctx.closePath();ctx.fill();
    } else if (opt.heroId==='jangbi') {
      ctx.fillStyle='#23211f';ctx.fillRect(-7,-30,14,7);ctx.fillRect(13,-46,3,49);ctx.fillStyle='#a9aaa5';ctx.beginPath();ctx.moveTo(14,-53);ctx.lineTo(9,-44);ctx.lineTo(19,-44);ctx.closePath();ctx.fill();
    } else if (opt.archetype==='warrior') {
      ctx.fillStyle='#5a4a34';ctx.fillRect(12,-38,2,35);
    } else if (opt.archetype==='scholar') {
      ctx.fillStyle='#d8cda8';ctx.fillRect(9,-24,7,9);ctx.strokeStyle='#655d4e';ctx.strokeRect(9,-24,7,9);
    }
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
    if (npc) { interact(npc,false); return; }
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

  window.addEventListener('keydown',(ev)=>{
    if (Dialogue.isActive()) return;
    if (!document.getElementById('choice-box').classList.contains('hidden')) return;
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
    load,render,removeNpc,tryMove,interactFacing,
    get currentMapId(){return mapId;},
    get camera(){return {...camera};},
  };
})();
