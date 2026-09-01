const MapView = (function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const TILE = 40;

  const TILE_COLOR = { 0: '#6fae5c', 1: '#cbb183', 2: '#6b5842', 3: '#4a7fae', 4: '#2f5e34' };
  const TILE_BLOCKED = { 2: true, 3: true, 4: true };

  let map = null;
  let mapId = null;
  let player = { x: 0, y: 0 };
  let onInteract = null; // (npcId) => {}
  let liveNpcs = [];

  function npcColor(id) {
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
    return `hsl(${h},55%,55%)`;
  }

  function load(id, opts) {
    mapId = id;
    map = MAPS[id];
    player = { x: map.playerStart.x, y: map.playerStart.y };
    onInteract = (opts && opts.onInteract) || null;

    liveNpcs = map.npcs.filter((n) => {
      const rd = ROSTER[n.id];
      if (rd && rd.chance != null) {
        if (!(n.id in GameState.npcVisible)) {
          GameState.npcVisible[n.id] = Math.random() < rd.chance;
        }
        if (!GameState.npcVisible[n.id]) return false;
      }
      if (GameState.npcStatus[n.id] === 'recruited' || GameState.npcStatus[n.id] === 'resolved' ||
          GameState.npcStatus[n.id] === 'dead' || GameState.npcStatus[n.id] === 'fled') {
        return false;
      }
      return true;
    });

    canvas.width = map.width * TILE;
    canvas.height = map.height * TILE;
    render();
  }

  function render() {
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        ctx.fillStyle = TILE_COLOR[map.tiles[y][x]] || '#6fae5c';
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
      }
    }

    for (const n of liveNpcs) {
      const rd = ROSTER[n.id];
      const isResidence = GameState.npcStatus[n.id] === 'met' && rd.kind === 'recruit' && isScholarType(rd);
      const label = isResidence ? `${rd.name}의 저택` : (n.label || rd.name);
      drawToken(n.x, n.y, isResidence ? '#8a6a3a' : npcColor(n.id), rd.name);
      ctx.fillStyle = '#2b2620';
      ctx.font = '11px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, n.x * TILE + TILE / 2, n.y * TILE - 4);
    }

    const heroName = ROSTER[GameState.mainHero].name;
    drawToken(player.x, player.y, GameState.mainHero === 'gwanwoo' ? '#2f6d3f' : '#8a3b2a', heroName);
  }

  function drawToken(x, y, color, label) {
    const cx = x * TILE + TILE / 2, cy = y * TILE + TILE / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, TILE * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2b2620';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label[0], cx, cy + 1);
    ctx.textBaseline = 'alphabetic';
  }

  function npcAt(x, y) {
    return liveNpcs.find((n) => n.x === x && n.y === y);
  }

  function tryMove(dx, dy) {
    const nx = player.x + dx, ny = player.y + dy;
    if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) return;
    const npc = npcAt(nx, ny);
    if (npc) { interact(npc); return; }
    if (TILE_BLOCKED[map.tiles[ny][nx]]) return;
    player.x = nx; player.y = ny;
    render();
  }

  function interact(npc) {
    if (onInteract) onInteract(npc.id);
  }

  function interactFacing() {
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      const npc = npcAt(player.x + dx, player.y + dy);
      if (npc) { interact(npc); return; }
    }
  }

  function removeNpc(id) {
    liveNpcs = liveNpcs.filter((n) => n.id !== id);
    render();
  }

  window.addEventListener('keydown', (ev) => {
    if (Dialogue.isActive()) return;
    if (!document.getElementById('screen-explore').classList.contains('active')) return;
    switch (ev.key) {
      case 'ArrowUp': case 'w': tryMove(0, -1); break;
      case 'ArrowDown': case 's': tryMove(0, 1); break;
      case 'ArrowLeft': case 'a': tryMove(-1, 0); break;
      case 'ArrowRight': case 'd': tryMove(1, 0); break;
      case 'Enter': case ' ': interactFacing(); break;
    }
  });

  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((ev.clientX - rect.left) / TILE);
    const y = Math.floor((ev.clientY - rect.top) / TILE);
    const npc = npcAt(x, y);
    if (npc && Math.abs(npc.x - player.x) + Math.abs(npc.y - player.y) === 1) interact(npc);
  });

  return { load, render, removeNpc, get currentMapId() { return mapId; } };
})();
