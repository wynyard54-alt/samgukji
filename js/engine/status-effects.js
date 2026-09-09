// 책략(전략) 상태이상 - 혼란/공포/도발/화염/연환계.
// 지금은 어떤 책략도 이 효과들을 실제로 걸지 않는다 - attemptStrategy 등에서
// 나중에 이름 붙은 책략을 배정할 때 아래 함수(applyArmyStatus/igniteTile/
// linkChain)를 호출하기만 하면, 이미 전투 산식(main.js의 resolveArmyBattle/
// attemptStrategy/attemptDuelChallenge, mapview.js의 runAiTurn/tryMove)에
// 연결돼 있어 자동으로 반영된다.
//
// 세 군세 디버프의 실제 효과("턴"은 [전투] 교전이 아니라 1달 휴식 = 1턴이다):
// - 혼란: 이동 불가 / 이 군세를 노리는 책략은 100% 성공 / [전투]에서 반격 불가
// - 공포: 걸려 있는 동안 매 턴(다음달)마다 사기 -10
// - 도발: 도발을 건 군세를 쫓아오게 됨 / 도발 상태인 상대에게 거는 일기토는 100% 발동
const StatusEffects = (function () {
  const ARMY_STATUS_LABELS = { confuse: '혼란', fear: '공포', taunt: '도발' };

  function list(id) {
    return GameState.armyStatus[id] || (GameState.armyStatus[id] = []);
  }

  function applyArmyStatus(id, type, opts) {
    if (!ARMY_STATUS_LABELS[type]) return;
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
  function statusEntry(id, type) { return activeStatuses(id).find((s) => s.type === type); }

  function isConfused(id) { return hasStatus(id, 'confuse'); }
  function isTaunted(id) { return hasStatus(id, 'taunt'); }
  // 도발을 건 쪽의 id - 도발당한 군세가 지도에서 누구를 쫓아야 하는지에 쓰인다.
  function tauntSourceId(id) {
    const s = statusEntry(id, 'taunt');
    return s ? s.sourceId : null;
  }

  // id가 플레이어가 직접 지휘하는 군세(본대 관우군이든, 따로 편성한 유비군이든)인지 -
  // 두 경우 모두 같은 GameState.morale 하나를 공유해서 쓴다(getWarLock 참고).
  function isPlayerCommander(id) {
    return !!((GameState.army && GameState.army.commanderId === id) ||
      (GameState.allyArmy && GameState.allyArmy.commanderId === id));
  }
  function drainMorale(id, amount) {
    if (isPlayerCommander(id)) GameState.changeMorale(-amount);
    else if (ROSTER[id]) ROSTER[id].morale = Math.max(0, (ROSTER[id].morale != null ? ROSTER[id].morale : 100) - amount);
  }

  // "턴"은 [전투] 교전 단위가 아니라 1달 휴식(다음달로 넘어가는 것) 하나를
  // 뜻한다 - main.js의 "다음달" 버튼 핸들러가 매달 한 번 tickAllArmyStatus를
  // 불러준다. 공포는 틱마다 사기를 10 깎고, 모든 효과는 지속시간을 1씩 줄여
  // 만료되면 제거한다. 이번 틱에 걸려 있던 효과 라벨 목록을 돌려준다(연출용).
  function tickArmyStatus(id) {
    const arr = GameState.armyStatus[id];
    if (!arr || !arr.length) return [];
    const activeLabels = arr.map((s) => ARMY_STATUS_LABELS[s.type]);
    for (const s of arr) {
      if (s.type === 'fear') drainMorale(id, 10);
      s.turnsLeft--;
    }
    GameState.armyStatus[id] = arr.filter((s) => s.turnsLeft > 0);
    return activeLabels;
  }
  // 상태이상이 걸려 있는 모든 대상을 한 번에 틱한다 - 매달 휴식마다 한 번씩만 부르면 된다.
  function tickAllArmyStatus() {
    for (const id in GameState.armyStatus) tickArmyStatus(id);
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
    applyArmyStatus, clearArmyStatus, activeStatuses, hasStatus, tickArmyStatus, tickAllArmyStatus,
    isConfused, isTaunted, tauntSourceId,
    igniteTile, extinguishTile, fireTilesForMap, tickFireTiles,
    linkChain, unlinkChain, chainedWith, propagateDamage,
    LABELS: ARMY_STATUS_LABELS,
  };
})();
