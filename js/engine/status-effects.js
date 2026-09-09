// 책략(전략) 상태이상 밑작업.
// 지금은 어떤 책략도 이 효과들을 실제로 걸지 않는다 - attemptStrategy 등에서
// 나중에 이름 붙은 책략을 배정할 때 아래 함수(applyArmyStatus/igniteTile/
// linkChain)를 호출하기만 하면, 이미 [전투] 교전 산식(main.js의
// resolveArmyBattle)에 연결돼 있어 자동으로 반영된다.
//
// - 혼란/공포/도발: 군세 단위 디버프. GameState.armyStatus[id]에 쌓인다.
// - 화염: 타일 단위 상태. GameState.tileEffects["mapId#x#y"]에 쌓이고,
//   그 타일에 서 있는 군세가 교전마다 고정 피해를 입는다. 지도에는 불꽃
//   이미지(있으면)나 절차적 불꽃(없으면)이 깔린다.
// - 연환계: 여러 군세를 사슬로 묶어, 그중 하나가 입는 피해의 일부를
//   나머지도 함께 입게 한다.
const StatusEffects = (function () {
  const ARMY_STATUS_DEFS = {
    confuse: { label: '혼란', outMult: 0.7 },  // 공격이 흐트러져 위력 -30%
    fear:    { label: '공포', forcedSecond: true }, // 겁을 먹어 이번 교전 선타를 놓친다
    taunt:   { label: '도발', inMult: 1.2 },   // 도발에 넘어가 받는 피해 +20%
  };

  function list(id) {
    return GameState.armyStatus[id] || (GameState.armyStatus[id] = []);
  }

  function applyArmyStatus(id, type, opts) {
    if (!ARMY_STATUS_DEFS[type]) return;
    const turns = (opts && opts.turns) || 3;
    const sourceId = opts && opts.sourceId;
    const arr = list(id);
    const existing = arr.find((s) => s.type === type);
    if (existing) { existing.turnsLeft = turns; existing.sourceId = sourceId; }
    else arr.push({ type, turnsLeft: turns, sourceId });
  }

  function clearArmyStatus(id, type) {
    const arr = GameState.armyStatus[id];
    if (!arr) return;
    GameState.armyStatus[id] = type ? arr.filter((s) => s.type !== type) : [];
  }

  function activeStatuses(id) { return GameState.armyStatus[id] || []; }
  function hasStatus(id, type) { return activeStatuses(id).some((s) => s.type === type); }

  // [전투] 교전 1회가 끝날 때마다 호출한다 - 지속시간을 깎고 만료된 효과를
  // 정리하며, 이번 교전에 걸려 있던 효과 라벨 목록을 돌려준다(연출용).
  function tickArmyStatus(id) {
    const arr = GameState.armyStatus[id];
    if (!arr || !arr.length) return [];
    const activeLabels = arr.map((s) => ARMY_STATUS_DEFS[s.type].label);
    for (const s of arr) s.turnsLeft--;
    GameState.armyStatus[id] = arr.filter((s) => s.turnsLeft > 0);
    return activeLabels;
  }

  function outgoingMult(id) {
    return activeStatuses(id).reduce((m, s) => m * (ARMY_STATUS_DEFS[s.type].outMult || 1), 1);
  }
  function incomingMult(id) {
    return activeStatuses(id).reduce((m, s) => m * (ARMY_STATUS_DEFS[s.type].inMult || 1), 1);
  }
  function forcedSecond(id) {
    return activeStatuses(id).some((s) => ARMY_STATUS_DEFS[s.type].forcedSecond);
  }

  // ---- 화염 타일 ----
  function tileKey(mapId, x, y) { return `${mapId}#${x}#${y}`; }

  function igniteTile(mapId, x, y, opts) {
    const dps = (opts && opts.dps) || 300;
    const ticks = (opts && opts.ticks) || 3;
    GameState.tileEffects[tileKey(mapId, x, y)] = { type: 'fire', x, y, ticksLeft: ticks, dps };
  }
  function extinguishTile(mapId, x, y) { delete GameState.tileEffects[tileKey(mapId, x, y)]; }
  function fireTilesForMap(mapId) {
    const prefix = `${mapId}#`;
    const out = [];
    for (const k in GameState.tileEffects) {
      if (k.startsWith(prefix) && GameState.tileEffects[k].type === 'fire') out.push(GameState.tileEffects[k]);
    }
    return out;
  }

  // 이 모듈은 ROSTER/MapView를 모르므로, "이 좌표에 누가 있는지"는
  // occupantsAt(x,y)로, "그 대상에게 dps만큼 피해를 입혀라"는 onDamage(id,dps)로
  // 호출부(main.js)가 넘겨준다 - 화염이 몇 턴 남았는지만 여기서 관리한다.
  function tickFireTiles(mapId, occupantsAt, onDamage) {
    const prefix = `${mapId}#`;
    for (const k in GameState.tileEffects) {
      if (!k.startsWith(prefix)) continue;
      const eff = GameState.tileEffects[k];
      if (eff.type !== 'fire') continue;
      for (const occId of occupantsAt(eff.x, eff.y)) onDamage(occId, eff.dps);
      eff.ticksLeft--;
      if (eff.ticksLeft <= 0) delete GameState.tileEffects[k];
    }
  }

  // ---- 연환계 (피해 전이 사슬) ----
  // 사슬로 묶인 군세끼리는 한쪽이 입는 피해의 일부를 나머지도 함께 입는다.
  function linkChain(ids, shareRatio) {
    const ratio = shareRatio == null ? 0.5 : shareRatio;
    for (const id of ids) GameState.warChains[id] = { members: ids.filter((x) => x !== id), ratio };
  }
  function unlinkChain(id) {
    const chain = GameState.warChains[id];
    if (!chain) return;
    for (const other of chain.members) delete GameState.warChains[other];
    delete GameState.warChains[id];
  }
  function chainedWith(id) {
    const chain = GameState.warChains[id];
    return chain ? chain.members : [];
  }
  // id가 amount만큼 피해를 입은 직후 호출한다 - 사슬로 묶인 나머지에게도
  // ratio만큼의 피해를 dealDamage(otherId, amount)로 전이시킨다.
  function propagateDamage(id, amount, dealDamage) {
    const chain = GameState.warChains[id];
    if (!chain) return;
    for (const other of chain.members) dealDamage(other, Math.max(1, Math.round(amount * chain.ratio)));
  }

  return {
    applyArmyStatus, clearArmyStatus, activeStatuses, hasStatus, tickArmyStatus,
    outgoingMult, incomingMult, forcedSecond,
    igniteTile, extinguishTile, fireTilesForMap, tickFireTiles,
    linkChain, unlinkChain, chainedWith, propagateDamage,
    LABELS: Object.keys(ARMY_STATUS_DEFS).reduce((o, k) => { o[k] = ARMY_STATUS_DEFS[k].label; return o; }, {}),
  };
})();
