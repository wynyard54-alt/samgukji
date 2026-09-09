// 책략(전략) 상태이상 - 혼란/공포/도발/화염/연환계 + 버프(주는/받는피해 배율,
// 등급상승, 면역, 회피).
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
// - 면역(immune) 상태인 대상에게는 혼란/공포/도발이 걸리지 않는다.
//
// 버프(지정 턴간 지속되는 "지속효과")와 즉시효과(사기/병력/식량처럼 한 번
// 반영되면 끝나는 것)는 구분한다 - 즉시효과는 이 모듈을 거치지 않고
// GameState/rd 값을 그 자리에서 바로 바꾸면 된다(별도 시스템 불필요).
// 버프 4종은 전부 "최종 데미지 계산의 마지막 단계에서 배율/판정으로만
// 적용"하는 방식이라 별도의 전투 시스템 추가가 필요 없다:
//   dmgDealtMult : 이 군세가 주는 피해에 곱하는 배율(예: 1.2 = +20%)
//   dmgTakenMult : 이 군세가 받는 피해에 곱하는 배율(예: 0.7 = -30%)
//   gradeBoost   : 무력/지력 등급을 이 수만큼 올려서 계산(1이면 한 단계)
//   evade        : 공격을 완전히 무효화할 확률(0~1) - 데미지 배율 적용 뒤,
//                  최종적으로 병력에 반영되기 직전 마지막 관문으로 판정한다.
//                  (일기토가 아니라 군세간 [전투]에서만 쓰는 개념이다.)
//   immune       : 혼란/공포/도발이 걸리지 않는다.
//   apMult       : 이 군세의 행동력(AP)에 곱하는 배율 - 적 AI는 매달 이동에
//                  쓸 수 있는 행동력(mapview.js의 AI_MOVE_BUDGET)을, 플레이어는
//                  "다음달" 행동력 재보급량을 이 배율만큼 줄이거나 늘린다.
//   moveCostMult : 타일 1칸 이동에 드는 행동력 소모량에 곱하는 배율(예: 2 = 2배).
//   stratSuccessMult : 이 대상(책사)이 책략을 시전할 때, 이미 계산된 성공률에
//                  마지막으로 곱하는 배율(예: 60% 성공률에 0.5를 곱하면 30%).
//
// S급 책략처럼 "전투당(그 전장 씬) 1회"인 것과 A급처럼 "이 달 1회"인 것은
// canUseThisScene/canUseThisMonth로 확인하고 markUsedThis*로 기록한다 -
// Scene 쪽은 군세 편성(전투 시작) 시점에 main.js가 resetSceneUsage()를
// 불러 초기화하고, Month 쪽은 "다음달"마다 GameState.nextMonth()가 자동
// 초기화한다.
const StatusEffects = (function () {
  const ARMY_STATUS_LABELS = { confuse: '혼란', fear: '공포', taunt: '도발' };
  const BUFF_LABELS = {
    dmgDealtMult: '주는피해 배율', dmgTakenMult: '받는피해 배율', gradeBoost: '등급상승', evade: '회피', immune: '상태이상 면역',
    apMult: '행동력 배율', moveCostMult: '이동소모 배율', stratSuccessMult: '책략성공률 배율',
    moveMoraleCost: '이동시 사기감소', forceFirstStrike: '선제공격 확정', noCounter: '반격불가(1회)',
    guaranteedCapture: '포박 확정',
  };
  const ALL_LABELS = Object.assign({}, ARMY_STATUS_LABELS, BUFF_LABELS);
  const DEBUFF_TYPES = new Set(Object.keys(ARMY_STATUS_LABELS));

  function list(id) {
    return GameState.armyStatus[id] || (GameState.armyStatus[id] = []);
  }

  // opts: { turns, sourceId, magnitude } - magnitude는 dmgDealtMult/
  // dmgTakenMult(배율)·gradeBoost(등급 수)·evade(확률 0~1)에서만 쓰인다.
  function applyArmyStatus(id, type, opts) {
    if (!ALL_LABELS[type]) return;
    if (DEBUFF_TYPES.has(type) && hasStatus(id, 'immune')) return; // 면역 상태면 걸리지 않는다
    const turns = (opts && opts.turns) || 3;
    const sourceId = opts && opts.sourceId;
    const magnitude = opts && opts.magnitude;
    const arr = list(id);
    const existing = arr.find((s) => s.type === type);
    if (existing) { existing.turnsLeft = turns; existing.sourceId = sourceId; existing.magnitude = magnitude; }
    else arr.push({ type, turnsLeft: turns, sourceId, magnitude });
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

  // ---- 버프 조회 (최종 데미지 계산의 마지막 단계에서 순서대로 곱/판정한다) ----
  function dmgDealtMult(id) {
    return activeStatuses(id).filter((s) => s.type === 'dmgDealtMult').reduce((m, s) => m * (s.magnitude || 1), 1);
  }
  function dmgTakenMult(id) {
    return activeStatuses(id).filter((s) => s.type === 'dmgTakenMult').reduce((m, s) => m * (s.magnitude || 1), 1);
  }
  // 여러 등급상승이 겹치면 합산한다(2개면 두 단계 상승).
  function gradeBoostAmount(id) {
    return activeStatuses(id).filter((s) => s.type === 'gradeBoost').reduce((sum, s) => sum + (s.magnitude || 0), 0);
  }
  function hasImmunity(id) { return hasStatus(id, 'immune'); }
  // 회피가 여러 개 겹쳐도 확률을 곱하지 않고 가장 높은 값 하나만 적용한다.
  function evadeChance(id) {
    return activeStatuses(id).filter((s) => s.type === 'evade').reduce((m, s) => Math.max(m, s.magnitude || 0), 0);
  }
  function rollEvade(id) {
    const chance = evadeChance(id);
    return chance > 0 && Math.random() < chance;
  }
  // 행동력(AP) 배율 - 적 AI의 이번 달 이동 예산과 플레이어의 "다음달" 행동력
  // 재보급량에 곱한다(mapview.js runAiTurn/computeAiPath, main.js #btn-nextmonth).
  function apMult(id) {
    return activeStatuses(id).filter((s) => s.type === 'apMult').reduce((m, s) => m * (s.magnitude || 1), 1);
  }
  // 타일 1칸당 필요 행동력 배율 - mapview.js의 tryMove/computeAiPath에서 쓴다.
  function moveCostMult(id) {
    return activeStatuses(id).filter((s) => s.type === 'moveCostMult').reduce((m, s) => m * (s.magnitude || 1), 1);
  }
  // 이동 1칸당 사기 감소량 - 견벽거수(사마의)처럼 "움직이면 손해"를 주는
  // 책략용. 실제 이동이 일어난 칸 수만큼만 mapview.js runAiTurn에서 호출한다.
  function moveMoraleCost(id) {
    return activeStatuses(id).filter((s) => s.type === 'moveMoraleCost').reduce((sum, s) => sum + (s.magnitude || 0), 0);
  }
  // 책략 성공률 배율 - main.js attemptStrategy에서 이미 계산된 성공률의
  // 마지막 단계에서 곱한다.
  function stratSuccessMult(id) {
    return activeStatuses(id).filter((s) => s.type === 'stratSuccessMult').reduce((m, s) => m * (s.magnitude || 1), 1);
  }

  // ---- 책략 사용 횟수 제한 ----
  // S급: 이번 전장 씬(군세를 편성해 전투를 시작한 뒤부터)에 1회만.
  function canUseThisScene(skillId) { return !GameState.strategyUsedInScene[skillId]; }
  function markUsedThisScene(skillId) { GameState.strategyUsedInScene[skillId] = true; }
  function resetSceneUsage() { GameState.strategyUsedInScene = {}; }
  // A급: 이번 달(월력) 안에 누구를 상대로 썼든 1회만 - "다음달"이 되면 자동 초기화된다.
  function canUseThisMonth(skillId) { return !GameState.strategyUsedInMonth[skillId]; }
  function markUsedThisMonth(skillId) { GameState.strategyUsedInMonth[skillId] = true; }

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
    dmgDealtMult, dmgTakenMult, gradeBoostAmount, hasImmunity, evadeChance, rollEvade,
    apMult, moveCostMult, stratSuccessMult, moveMoraleCost, drainMorale, isPlayerCommander,
    canUseThisScene, markUsedThisScene, resetSceneUsage, canUseThisMonth, markUsedThisMonth,
    igniteTile, extinguishTile, fireTilesForMap, tickFireTiles,
    linkChain, unlinkChain, chainedWith, propagateDamage,
    LABELS: ALL_LABELS,
  };
})();
