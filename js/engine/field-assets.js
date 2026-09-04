// GPT Field Art Pack v1 — reusable raster asset loader/drawer.
// Pure presentation layer: no game-state or balance logic.
const FieldAssets = (function () {
  const ROOT = 'assets/field/';
  const cache = Object.create(null);
  const manifest = {
    hero_gwanwoo:'hero_gwanwoo_hd_simple.png',
    hero_jangbi:'hero_jangbi_hd.png',
    hero_yubi:'hero_yubi_hd.png',
    hero_yeopo:'hero_yeopo_hd.png',
    hero_noshik:'hero_noshik_hd.png',
    enemy_yellowturban:'enemy_yellowturban_hd.png',
    enemy_jangsun:'enemy_jangsun_hd.png',
    officer_coalition:'officer_coalition_hd.png',
    officer_dongtak:'officer_dongtak_hd.png',
    npc_farmer:'npc_farmer_hd.png',
    npc_woman:'npc_woman_hd.png',
    npc_merchant:'npc_merchant_hd.png',
    npc_scholar:'npc_scholar_hd.png',
    npc_elder:'npc_elder_hd.png',
    npc_guard:'npc_guard_hd.png',
    npc_child:'npc_child_hd.png',
    npc_porter:'npc_porter_hd.png',
    tile_dirt:'tile_dirt.png',
    tile_road:'tile_road.png',
    tile_grass:'tile_grass.png',
    tile_water:'tile_water.png',
    takhyeon_city_overview:'takhyeon_map_v10.jpg',
    pyeongwon_city_overview:'pyeongwon_map_v1.jpg',
    camp_overview:'camp_map_v1.jpg',
    warmap_overview:'warmap_map_v1.jpg',
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

  // 스프라이트 시트에서 한 프레임만 잘라낸 오프스크린 캔버스를 캐시해둔다.
  // drawImage에 sx/sy/sw/sh로 서브사각형을 지정한 채 스무딩을 켜면, 브라우저가
  // 확대/축소 필터링 과정에서 그 사각형 바로 바깥(옆 칸/윗줄 프레임)의 픽셀까지
  // 살짝 섞어버려 캐릭터 머리 위나 발밑에 옆 프레임 색이 깜빡이며 새어나오는
  // 현상이 생긴다. 프레임을 먼저 이웃 없는 캔버스로 분리해두면 그 문제가 없다.
  const frameCache = Object.create(null);
  function getFrame(key, img, sx, sy, sw, sh) {
    const cacheKey = key + '|' + sx + ',' + sy + ',' + sw + ',' + sh;
    let c = frameCache[cacheKey];
    if (!c) {
      c = document.createElement('canvas');
      c.width = sw; c.height = sh;
      const fctx = c.getContext('2d');
      fctx.imageSmoothingEnabled = false;
      fctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      frameCache[cacheKey] = c;
    }
    return c;
  }

  function draw(ctx, key, dx, dy, dw, dh, sx, sy, sw, sh, smoothing) {
    const img = get(key);
    if (!ready(img)) return false;
    const previousSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = !!smoothing;
    if (sx == null) {
      ctx.drawImage(img, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
    } else if (smoothing) {
      const frameImg = getFrame(key, img, sx, sy, sw, sh);
      ctx.drawImage(frameImg, 0, 0, sw, sh, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
    }
    ctx.imageSmoothingEnabled = previousSmoothing;
    return true;
  }

  function tile(ctx, key, x, y, size) {
    return draw(ctx, key, x, y, size, size);
  }

  function sprite(ctx, key, x, footY, direction, frame, frameW, frameH, scale, columns, scaleY) {
    const img = get(key);
    if (!ready(img)) return false;
    const rows = { down:0, up:1, left:2, right:3 };
    const row = rows[direction] == null ? 0 : rows[direction];
    const col = Math.abs(frame || 0) % columns;
    const dw = Math.round(frameW * (scale || 1));
    const dh = Math.round(frameH * (scaleY == null ? (scale || 1) : scaleY));
    return draw(ctx, key, x - dw/2, footY - dh, dw, dh, col*frameW, row*frameH, frameW, frameH, frameW >= 96);
  }

  return { get, ready, draw, tile, sprite, keys: () => Object.keys(manifest) };
})();
