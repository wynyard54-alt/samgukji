// GPT Field Art Pack v1 — reusable raster asset loader/drawer.
// Pure presentation layer: no game-state or balance logic.
const FieldAssets = (function () {
  const ROOT = 'assets/field/';
  const cache = Object.create(null);
  const manifest = {
    hero_gwanwoo:'hero_gwanwoo.png',
    hero_jangbi:'hero_jangbi.png',
    npc_farmer:'npc_farmer.png',
    npc_woman:'npc_woman.png',
    npc_merchant:'npc_merchant.png',
    npc_scholar:'npc_scholar.png',
    npc_elder:'npc_elder.png',
    npc_guard:'npc_guard.png',
    npc_child:'npc_child.png',
    npc_porter:'npc_porter.png',
    building_yamen:'building_yamen.png',
    building_tavern:'building_tavern.png',
    building_house:'building_house.png',
    building_shop:'building_shop.png',
    building_gate:'building_gate.png',
    stall_red:'stall_red.png',
    stall_tan:'stall_tan.png',
    stall_green:'stall_green.png',
    tree_big:'tree_big.png',
    tree_small:'tree_small.png',
    well:'well.png',
    cart:'cart.png',
    crate:'crate.png',
    lanterns:'lanterns.png',
    tile_dirt:'tile_dirt.png',
    tile_road:'tile_road.png',
    tile_grass:'tile_grass.png',
    tile_water:'tile_water.png',
  };

  function get(key) {
    if (!manifest[key]) return null;
    if (cache[key]) return cache[key];
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => window.dispatchEvent(new CustomEvent('fieldassetload'));
    img.src = ROOT + manifest[key];
    cache[key] = img;
    return img;
  }

  function ready(img) { return !!(img && img.complete && img.naturalWidth); }

  function draw(ctx, key, dx, dy, dw, dh, sx, sy, sw, sh) {
    const img = get(key);
    if (!ready(img)) return false;
    ctx.imageSmoothingEnabled = false;
    if (sx == null) ctx.drawImage(img, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
    else ctx.drawImage(img, sx, sy, sw, sh, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
    return true;
  }

  function tile(ctx, key, x, y, size) {
    return draw(ctx, key, x, y, size, size);
  }

  function sprite(ctx, key, x, footY, direction, frame, frameW, frameH, scale, columns) {
    const img = get(key);
    if (!ready(img)) return false;
    const rows = { down:0, up:1, left:2, right:3 };
    const row = rows[direction] == null ? 0 : rows[direction];
    const col = Math.abs(frame || 0) % columns;
    const dw = Math.round(frameW * (scale || 1));
    const dh = Math.round(frameH * (scale || 1));
    return draw(ctx, key, x - dw/2, footY - dh, dw, dh, col*frameW, row*frameH, frameW, frameH);
  }

  return { get, ready, draw, tile, sprite };
})();
