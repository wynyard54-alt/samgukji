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
    tile_dirt_rich:'tile_dirt_rich.png',
    tile_road:'tile_road.png',
    tile_grass:'tile_grass.png',
    tile_water:'tile_water.png',
    // Tak County core kit: a deliberately small, reusable set shared across
    // roads, yards, residences and district boundaries.
    takhyeon_ground_common:'takhyeon_ground_common.png',
    takhyeon_road_common:'takhyeon_road_common.png',
    takhyeon_house_common:'takhyeon_house_common.png',
    takhyeon_fence_common:'takhyeon_fence_common.png',
    takhyeon_vegetation_edge:'takhyeon_vegetation_edge.png',
    takhyeon_city_overview:'takhyeon_map_v10.png',
    pyeongwon_city_overview:'pyeongwon_map_v1.png',
    v6_camp_yubi:'v6_camp_yubi.png',
    v6_house_front:'v6_house_front.png',
    v6_house_side:'v6_house_side.png',
    v6_wall_gate:'v6_wall_gate.png',
    v6_fence_alley:'v6_fence_alley.png',
    v6_tavern_seats:'v6_tavern_seats.png',
    v6_stall_vegetable:'v6_stall_vegetable.png',
    v6_stall_grain:'v6_stall_grain.png',
    v6_weapon_rack:'v6_weapon_rack.png',
    v6_supply_cluster:'v6_supply_cluster.png',
    v6_stable:'v6_stable.png',
    v6_awning_lantern:'v6_awning_lantern.png',
    v6_ground_dirt:'v6_ground_dirt.png',
    v6_ground_market:'v6_ground_market.png',
    v6_edge_grass:'v6_edge_grass.png',
    v6_edge_stone:'v6_edge_stone.png',
    v6_drain:'v6_drain.png',
    v6_path_curve:'v6_path_curve.png',
    v6_shadow_tree:'v6_shadow_tree.png',
    v6_shadow_roof:'v6_shadow_roof.png',
    v6_weeds:'v6_weeds.png',
    v6_foreground_roof:'v6_foreground_roof.png',
    v6_foreground_leaves:'v6_foreground_leaves.png',
    v6_foreground_awning:'v6_foreground_awning.png',
    v6_idle_tavern:'v6_idle_tavern.png',
    v6_idle_merchant:'v6_idle_merchant.png',
    v6_idle_porter:'v6_idle_porter.png',
    v6_idle_scholar:'v6_idle_scholar.png',
    v6_idle_guard:'v6_idle_guard.png',
    v6_idle_watercarrier:'v6_idle_watercarrier.png',
    v6_idle_child:'v6_idle_child.png',
    v6_idle_stablehand:'v6_idle_stablehand.png',
    v7_yellowturban_lair:'v7_yellowturban_lair.png',
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

  return { get, ready, draw, tile, sprite };
})();
