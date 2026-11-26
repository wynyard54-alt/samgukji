const BOGYANG_GOAL = 8000;
const BOGYANG_ILLUST = 'assets/illust/bogyang_fire.jpg';
const BOGYANG_GARRISON = {
  habudon_seoju: { troop:2000, deputy:'sunwook', x:5, y:7 },
  hanho: { troop:500, deputy:'jeongwook', x:6, y:9 },
};
const BOGYANG_COUNTERATTACK = {
  habudon_seoju: { troop:1500, x:24, y:11, marchX:21 },
  join_seoju: { troop:1500, x:20, y:11, marchX:20 },
  habuyeon_seoju: { troop:1200, x:23, y:13, marchX:23 },
  johong_seoju: { troop:1000, x:22, y:10, marchX:24 },
  jeonwi: { troop:3000, x:22, y:14, marchX:22 },
};
const BOGYANG_RECRUITS = ['songheon', 'huseong'];
const bogyangId = (id) => 'bogyang_' + id;
const bogyangLines = (...lines) => lines.map(([speaker, text, scene]) => ({speaker, text, scene}));

// Army instances are scene-local so troop losses and advisers do not modify their roster entries.
for (const baseId of new Set([...Object.keys(BOGYANG_GARRISON), ...Object.keys(BOGYANG_COUNTERATTACK), 'jangmak', 'jangpae'])) {
  const id = bogyangId(baseId);
  const base = ROSTER[baseId];
  const friendly = ['jangmak', 'jangpae'].includes(baseId);
  ROSTER[id] = { ...base, id, kind:friendly ? 'flavor' : 'enemy', chance:undefined,
    forced:baseId === 'habudon_seoju' ? 'story' : base.forced,
    unitType:baseId === 'jangmak' ? 'cavalry' : 'infantry', rosterId:baseId };
}

{
  const {width:w, height:h} = MAPS.seoju;
  const tiles = Array.from({length:h}, (_, y) => Array.from({length:w}, (_, x) => {
    const west = y < 13 ? 7 : Math.min(13, 7 + (y - 13) * 2);
    const east = y < 14 ? 35 : 35 - (y - 14);
    const city = y >= 1 && y <= 16 && x >= west && x <= east;
    const wooded = (x < 3 && (y < 5 || y > 20)) || (x > 32 && y > 21);
    return city || wooded ? 2 : 0;
  }));
  for (const [x1,y1,x2,y2] of [
    [0,7,33,8], [21,5,23,24], [13,11,23,12], [16,8,17,12],
    [15,11,16,14], [15,14,22,15], [13,6,14,8],
    [23,6,31,7], [31,5,32,8], [23,10,31,11], [21,15,23,17],
  ]) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) tiles[y][x] = 1;
  }
  MAPS.bogyang = {
    name:'복양성', width:w, height:h, tiles, backgroundKey:'bogyang_overview',
    onConfusedMove:id => centerAlert(bogyangConfusionNotice(id)),
    playerStart:{x:3,y:16}, camera:{viewportW:800,viewportH:480}, aiPathfinding:'shortest',
    foregroundCrops:[{x:.186,y:.225,w:.045,h:.119},{x:.584,y:.566,w:.094,h:.066}],
    npcs:[
      {id:'jingung',x:22,y:5,label:'진궁',fixed:true,storyGate:'bogyangTown'},
      {id:'yeopo',x:21,y:5,label:'여포',fixed:true,storyGate:'bogyangTown', personOnly:true },
      {id:'sangin',x:29,y:11,label:'상인',fixed:true,storyGate:'bogyangTown'},
      {id:'songheon',x:13,y:6,label:'',fixed:true,discoverable:true,storyGate:'bogyangTown',
        discoveryText:'병영 아래 돌길에서 한 장수가 군사들의 움직임을 살피고 있다.'},
      {id:'huseong',x:32,y:6,label:'',fixed:true,discoverable:true,storyGate:'bogyangTown',
        discoveryText:'마구간 옆에서 한 장수가 말고삐를 손보고 있다.'},
    ],
    ambient:[
      ['guard',15,8], ['merchant',28,11], ['porter',19,12], ['woman',24,8],
    ].map(([archetype,x,y])=>({archetype,x,y,wander:1,roadOnly:true})),
    decor:[
      {type:'mapLabel',x:7,y:7,label:'서문'}, {type:'mapLabel',x:22,y:16,label:'남문'},
      {type:'mapLabel',x:22,y:5,label:'관청'}, {type:'mapLabel',x:27,y:11,label:'장터'},
    ],
  };
}

function bogyangAddUnit(id,x,y) {
  const showTroops = id === 'yeopo' || [bogyangId('jangmak'),bogyangId('jangpae')].includes(id);
  MapView.addNpc(id,{x,y,fixed:true,label:ROSTER[id].name,
    labelFromArmy:showTroops ? () => `${ROSTER[id].name}군 · 병${armyFor(id)?.troop ?? 0}` : undefined});
}

function bogyangUnits() { return GameState.flags.bogyangUnits ??= {}; }

function bogyangSetUnit(baseId, spec) {
  const id = bogyangId(baseId);
  bogyangUnits()[id] = { x:spec.x, y:spec.y, troop:spec.troop, deputy:spec.deputy ?? null,
    rice:monthlyRiceUpkeep(spec.troop) * 10, morale:100, commanderCaptured:false };
  delete GameState.npcStatus[id];
  delete GameState.warLocks[id];
  StatusEffects.clearArmyStatus(id);
  return id;
}

function bogyangSync() {
  for (const [id, unit] of Object.entries(bogyangUnits())) {
    const pos = MapView.npcPos(id);
    if (!pos) { unit.gone = true; continue; }
    const {troop,rice,morale,commanderCaptured} = ROSTER[id];
    Object.assign(unit,pos,{troop,rice,morale,commanderCaptured:!!commanderCaptured});
  }
  const pos = MapView.npcPos('yeopo');
  if (pos) GameState.flags.bogyangYeopo = pos;
}

function loadBogyang() {
  const flags = GameState.flags;
  MAPS.bogyang.battleShade = ['approach','defense'].includes(flags.bogyangPhase);
  MAPS.bogyang.apMovement = !!GameState.army && !flags.bogyangTown;
  MapView.load('bogyang',{onInteract:interactBogyang,onAmbientInteract:runAmbientEvent,
    onApSpent:updateHUD,onApBlocked:() => {
      if (warRoundActive) centerAlert('행동력이 부족합니다. 군세 행동종료를 눌러 다음 차례를 진행하세요.');
      else onApBlocked();
    },onStep:renderMinimap,
    onAllyEngage:(ally,id,budget) => handleAllyEngage(ally,id,budget)});
  for (const [id, unit] of Object.entries(bogyangUnits())) {
    if (unit.gone) continue;
    const {troop,rice,morale,deputy,commanderCaptured} = unit;
    Object.assign(ROSTER[id],{troop,rice,morale,deputy,commanderCaptured});
    bogyangAddUnit(id,unit.x,unit.y);
  }
  if (GameState.allyArmy && flags.bogyangYeopo) {
    const {x,y} = flags.bogyangYeopo;
    bogyangAddUnit('yeopo',x,y);
  }
  MapView.setSceneEffect(flags.bogyangPhase === 'defense' ? {
    key:'bogyang_fire', points:[[18,9],[20,10],[24,9],[26,10],[19,13],[20,14],[24,13],[25,14],[17,14],[19,15],[26,15]],
  } : null);
  MapView.setControlledUnit(flags.bogyangControlled === 'yeopo' && GameState.allyArmy?.troop > 0 ? 'yeopo' : null);
  activeCommanderId = MapView.controlledUnitId || null;
  MapView.lockMovement(false);
}

function startBogyang() {
  stage = 'bogyang';
  const flags = GameState.flags;
  flags.bogyangPhase = 'join';
  flags.bogyangOccupied = false;
  flags.bogyangGridV2 = true;
  flags.bogyangYeopo = {x:4,y:16};
  bogyangSetUnit('jangmak',{troop:3000,x:3,y:13});
  for (const [id,spec] of Object.entries(BOGYANG_GARRISON)) bogyangSetUnit(id,spec);
  GameState.ap = effectiveApMax();
  GameState.allyAp = GameState.allyApMax = effectiveApMax();
  loadBogyang();
  updateHUD();
}

function bogyangObjective() {
  return ({
    join:'복양 · 장막 군세와 합류하자',
    assault:'복양 · 서문의 수비군을 격파하자',
    recruit:`복양 · 수비 병력 ${GameState.resources.troop.toLocaleString()} / ${BOGYANG_GOAL.toLocaleString()}명`,
    prepare:'복양 · 장료군과 여포군을 편성하자',
    ready:'복양 · 휴식하면 조조군이 도착한다',
    approach:'복양 · 남문으로 조조군이 접근한다',
    defense:'복양 · 전위군을 격파하고 성 안의 적을 몰아내자',
    won:'복양 수비 성공',
  })[GameState.flags.bogyangPhase];
}

function interactBogyang(id,context) {
  if (isScriptedScenePlaying() || Dialogue.isActive() || !document.getElementById('choice-box').classList.contains('hidden')) return;
  const flags = GameState.flags;
  if (id === bogyangId('jangmak') && flags.bogyangPhase === 'join') {
    Dialogue.show(bogyangLines(
      ['장막','잘 오셨소. 조조는 서주로 떠났고, 복양엔 하후돈이 남아 있소. 내 기병 삼천도 함께 가겠소.'],
      ['장초','복양을 칠 때를 알려 주신 분입니다. 진궁 선생을 만나 보시지요.'],
      ['진궁','조조가 돌아오기 전에 복양을 잡아야 합니다. 저도 함께 가겠습니다.'],
      ['여포','좋소. 장료, 그럼 우리가 먼저 움직이자.'],
    ), async () => {
      if (!GameState.recruited.includes('jingung')) GameState.recruit('jingung',0);
      flags.bogyangPhase = 'assault';
      bogyangBusy = true;
      MapView.lockMovement(true);
      bogyangAddUnit('join_seoju',4,7);
      await showBogyangArmy(bogyangId('habudon_seoju'),850);
      Dialogue.show(bogyangLines(['하후돈','조인! 서주로 가서 주공께 알리시오. 성은 내가 지키겠소!'],
        ['조인','알겠소. 주공께 반드시 전하리다!']), () => {
        MapView.walkNpcPath('join_seoju', Array.from({length:4},(_,i)=>({x:3-i,y:7})),100,() => {
          MapView.removeNpc('join_seoju');
          bogyangBusy = false;
          MapView.lockMovement(false);
          MapView.clearCameraFocus();
          updateHUD();
          startWarRound();
        });
      });
    });
    return;
  }
  if (flags.bogyangTown && id === 'yeopo') { offerYeopoTraining(); return; }
  if (flags.bogyangTown && ROSTER[id]?.kind === 'merchant') { openMerchantShop(id); return; }
  if (flags.bogyangTown && (id === 'jingung' || GameState.npcStatus[id] === 'recruited')) { interactRecruitedGeneral(id); return; }
  if (flags.bogyangTown && BOGYANG_RECRUITS.includes(id)) {
    if (heroCurrentHp() <= 0) toast('휴식으로 체력을 회복한 뒤 다시 도전하자.');
    else challengeWarrior(id,context);
    return;
  }
  if (!['assault','defense'].includes(flags.bogyangPhase)) return;
  if ([GameState.mainHero,'yeopo'].includes(id) && id === (activeCommanderId || GameState.mainHero)) {
    attemptStrategySelf(id);
  } else if (bogyangUnits()[id] && ROSTER[id].kind === 'enemy') {
    if (context?.engagedCommanderId) handleAllyEngage(context.engagedCommanderId,id,context.remainingBudget);
    else openWarCommandMenu(id);
  }
}

function checkBogyangMuster() {
  const flags = GameState.flags;
  if (stage !== 'bogyang' || flags.bogyangPhase !== 'recruit' || GameState.resources.troop < BOGYANG_GOAL) return;
  flags.bogyangPhase = 'prepare';
  Dialogue.show(bogyangLines(['전령','장군! 조조군이 복양으로 오고 있습니다. 지금 군세를 편성하셔야 합니다!']),
    () => { updateHUD(); prepareBogyangArmies(); });
}

function prepareBogyangArmies() {
  prepareHanaeArmies('bogyang');
}

function finishBogyangBattle() {
  if (stage !== 'bogyang') return;
  const flags = GameState.flags;
  const phase = flags.bogyangPhase;
  if (!['assault','defense'].includes(phase)) return;
  for (const id of [...enemiesInScene(), ...bogyangIndependentArmies()]) {
    if (armyFor(id).troop <= 0) MapView.removeNpc(id);
  }
  if (GameState.allyArmy?.troop <= 0) MapView.removeNpc('yeopo');
  bogyangSync();
  if (!playerArmies().some((army) => army.troop > 0)) {
    endWarInitiative();
    flags.bogyangPhase = 'failed';
    MapView.lockMovement(true);
    showChoice('군세가 무너져 복양 전투에 실패했습니다.',[
      {label:'하내에서 다시 시작',cb:restartFromBogyang},
      {label:'메인 화면으로',cb:()=>showScreen('screen-title')},
    ]);
    return;
  }
  if (enemiesInScene().length) {
    updateHUD();
    if (warRoundActive && playerArmies().some(army => army.commanderId === warOrder[warIndex] && army.troop <= 0)) endWarUnitTurn();
    return;
  }
  endWarInitiative();

  const capturedCity = phase === 'assault';
  flags.bogyangPhase = capturedCity ? 'recruit' : 'won';
  flags.bogyangTown = true;
  flags.bogyangOccupied = true;
  flags.bogyangControlled = null;
  flags.bogyangYeopo = null;
  flags.bogyangUnits = {};
  dissolveArmy('army');
  dissolveArmy('allyArmy');
  if (capturedCity) GameState.addResource({troop:3000,horse:3000});
  loadBogyang();
  MapView.setPlayerPos(20,8,'right');
  GameState.ap = effectiveApMax();
  const lines = capturedCity
    ? bogyangLines(['장막','복양은 이제 우리 손에 있소. 내 기병 삼천을 맡기겠소.'],
      ['전령','장군! 조인의 보고를 받은 조조가 서주에서 군을 돌렸습니다!'],
      ['장료','서주는 한숨 돌렸겠군. 이제 그 군대가 우리한테 온다.'],
      ['진궁','조조가 돌아오기 전에 흩어진 군사를 모아야 합니다. 관청 앞에서 모병을 돕겠습니다.'])
    : bogyangLines(['전령','장군, 성 안에 남은 조조군이 물러났습니다!'],
      ['장료','성문을 닫아라. 다친 군사부터 돌봐라.'],['진궁','복양을 지켰습니다. 오늘은 우리가 이겼습니다.']);
  Dialogue.show(lines, () => offerCapturedRecruits(updateHUD));
}

function restartFromBogyang() {
  applySaveSnapshot(structuredClone(GameState.flags.bogyangRetry));
}

let bogyangBusy = false;

async function bogyangApproach() {
  const flags = GameState.flags;
  flags.bogyangPhase = 'approach';
  flags.bogyangTown = false;
  flags.bogyangYeopo = {x:21,y:15};
  flags.bogyangControlled = null;
  for (const [id,spec] of Object.entries(BOGYANG_COUNTERATTACK)) {
    bogyangSetUnit(id,{x:spec.marchX,y:25,troop:5000});
  }
  loadBogyang();
  MapView.setPlayerPos(23,15);
  MapView.lockMovement(true);
  bogyangBusy = true;
  updateHUD();
  MapView.panCameraTo(22,16);
  await new Promise((resolve) => setTimeout(resolve,700));
  await new Promise(resolve => MapView.panCameraTo(22,23,500,resolve));
  await Promise.all(Object.entries(BOGYANG_COUNTERATTACK).map(([id,{marchX}], index) =>
    new Promise((resolve) => MapView.walkNpcPath(bogyangId(id),
      Array.from({length:7+(index%2)},(_,step)=>({x:marchX,y:24-step})),260,resolve))));
  MapView.panCameraTo(22,17);
  await new Promise((resolve) => setTimeout(resolve,500));
  Dialogue.show(bogyangLines(
    ['하후돈','장료! 지난번엔 성을 내주었지만, 오늘은 기습할 틈이 없을 게다!'],
    ['장료','그럼 오늘은 내 앞에서 직접 길을 열어 보시오.'],
  ), () => Battle.start({
    player:GameState.heroData(), enemy:ROSTER.habudon_seoju, safeRetreatAt:.1,
    onEnd:({outcome,playerHp}) => {
      GameState.heroHp = playerHp;
      showBogyangFirePlan(outcome);
    },
  }));
}

function showBogyangFirePlan(outcome) {
  const retreat = outcome === 'win' ? '하후돈' : '장료';
  const winner = outcome === 'win' ? '장료' : '하후돈';
  Dialogue.show(bogyangLines(
    ['내레이션',`${winner} 승리. ${retreat}는 마지막 일격을 피하고 자기 진영으로 물러났다.`],
    ['여포','저 많은 군사를 성 밖에서 맞아 싸우기는 어렵겠소. 공대, 어찌하면 좋겠소?'],
    ['진궁','복양의 전씨에게 조조를 속일 편지를 보내게 하십시오. 성문을 열어 주겠다고 하면 조조가 들어올 겁니다.'],
    ['진궁','조조군 선두가 대로에 들어서면 불을 놓읍시다. 뒤따라오던 군사도 흩어질 겁니다.'],
    ['장료','나는 대로를 타고 남문까지 내려가겠소.'],
    ['장패','남문 밖은 내게 맡기시오. 빠져나오는 적의 옆을 치겠소!'],
    ['전위','주공, 이쪽입니다! 제가 길을 열겠습니다!',BOGYANG_ILLUST],
    ['여포','거기 너! 조조가 어디로 갔느냐?',BOGYANG_ILLUST],
    ['조조','앞서 가는 누런 말을 탄 자가 조조요!',BOGYANG_ILLUST],
    ['내레이션','여포가 그 말을 쫓는 사이, 조조는 불길을 빠져나갔다.',BOGYANG_ILLUST],
  ), beginBogyangDefense);
}

async function beginBogyangDefense() {
  bogyangBusy = true;
  const flags = GameState.flags;
  flags.bogyangPhase = 'defense';
  flags.bogyangYeopo = {x:14,y:12};
  for (const [id,spec] of Object.entries(BOGYANG_COUNTERATTACK)) bogyangSetUnit(id,spec);
  bogyangSetUnit('jangpae',{troop:1800,x:26,y:19});
  loadBogyang();
  MapView.setPlayerPos(22,8,'down');
  MapView.lockMovement(true);
  updateHUD();
  await showBogyangArmy(bogyangId('jangpae'));
  await showBogyangArmy(bogyangId('habudon_seoju'));
  MapView.clearCameraFocus();
  bogyangBusy = false;
  updateHUD();
  startWarRound();
}

function bogyangConfusionNotice(id) {
  const next = warRoundActive ? '군세 행동종료로 다음 차례를 진행하세요.' : '휴식으로 다음 달을 진행하세요.';
  return `${ROSTER[id].name}군은 혼란 상태라 이동할 수 없습니다. ${next}`;
}

function isBogyangBattle() {
  return ['assault','defense'].includes(GameState.flags.bogyangPhase);
}

function bogyangIndependentArmies() {
  return ['jangmak','jangpae'].map(bogyangId).filter(id => MapView.npcPos(id));
}

function upkeepBogyangAllies() {
  for (const id of bogyangIndependentArmies()) {
    const army = armyFor(id);
    army.rice = Math.max(0, army.rice - monthlyRiceUpkeep(army.troop));
    if (!army.rice) StatusEffects.drainMorale(id,1);
  }
}

async function showBogyangArmy(id, hold = 1050) {
  const pos = MapView.npcPos(id);
  if (!pos) return;
  await new Promise(resolve => MapView.panCameraTo(pos.x,pos.y,420,resolve));
  toast(`${ROSTER[id].name}군 · 병력 ${ROSTER[id].troop.toLocaleString()}명`);
  await new Promise(resolve => setTimeout(resolve,hold));
}

async function runBogyangUnitTurn(id, done) {
  const assault = GameState.flags.bogyangPhase === 'assault';
  const budget = WAR_AI_MOVE_BUDGET;
  if (bogyangIndependentArmies().includes(id)) {
    const target = enemiesInScene().find(enemy => assault || enemy !== bogyangId('jeonwi'));
    if (target && await MapView.marchToward(id, MapView.npcPos(target), budget - ARMY_BATTLE_AP_COST)) {
      resolveArmyBattle(target,{commanderId:id,freeAction:true,silent:true});
    }
  } else if (!assault && id !== bogyangId('jeonwi')) {
    const pos = MapView.npcPos(id);
    if (pos && !StatusEffects.isConfused(id)) {
      await new Promise(resolve => MapView.panCameraTo(pos.x,pos.y,350,resolve));
      const reached = await MapView.marchToward(id,{x:22,y:24},budget,265,true);
      if (reached) {
        await new Promise(resolve => setTimeout(resolve,350));
        MapView.removeNpc(id);
      }
      MapView.clearCameraFocus();
    }
  } else if (assault) {
    MapView.runAiTurn(done,[id],budget);
    return;
  } else if (!StatusEffects.isConfused(id)) {
    const target = playerArmies().find(army => army.troop > 0 &&
      inAttackRange(mapPosOf(army.commanderId),MapView.npcPos(id),1));
    if (target) handleAllyEngage(target.commanderId,id,budget);
  }
  if (!warUiBusy()) finishBogyangBattle();
  done(warUiBusy());
}

function migrateBogyangSave(playerPos) {
  const flags = GameState.flags;
  if (flags.bogyangGridV2) return playerPos;
  flags.bogyangGridV2 = true;
  const convert = pos => ({ x:Math.floor(pos.x * 36 / 64), y:Math.floor(pos.y * 25 / 42) });
  const walkable = pos => [0,1].includes(MAPS.bogyang.tiles[pos.y]?.[pos.x]);
  const nearest = (pos, occupied) => {
    const origin = convert(pos);
    const valid = point => walkable(point) && !occupied.has(`${point.x},${point.y}`);
    const points = MAPS.bogyang.tiles.flatMap((row,y) => row.map((_,x) => ({x,y})));
    const best = points.filter(valid).sort((a,b) => tileDist(a,origin)-tileDist(b,origin))[0];
    occupied.add(`${best.x},${best.y}`);
    return best;
  };
  const occupied = new Set();
  if (flags.bogyangYeopo) flags.bogyangYeopo = nearest(flags.bogyangYeopo,occupied);
  for (const unit of Object.values(bogyangUnits())) if (!unit.gone) Object.assign(unit,nearest(unit,occupied));
  return playerPos && nearest(playerPos,occupied);
}
