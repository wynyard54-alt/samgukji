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
    sceneGates:{south:{tiles:[21,23,16,16],x:21.9,y:15.88,w:1.27,h:1.28,sprite:'bogyang_gate'}},
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
  const showTroops = id === GameState.allyArmy?.commanderId || [bogyangId('yeopo'),bogyangId('jangmak'),bogyangId('jangpae')].includes(id);
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
  const pos = MapView.npcPos(GameState.allyArmy?.commanderId);
  if (pos) GameState.flags.bogyangYeopo = pos;
}

function loadBogyang() {
  const flags = GameState.flags;
  MAPS.bogyang.battleShade = ['approach','defense','rescue'].includes(flags.bogyangPhase);
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
    bogyangAddUnit(GameState.allyArmy.commanderId,x,y);
  }
  if (['escape','depart'].includes(flags.bogyangPhase)) MapView.setSceneGateClosed('south',true);
  if (flags.bogyangPhase === 'supplies') showBogyangBandits();
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
    famine:'복양 · 메뚜기 떼가 연주를 덮쳤다',
    supplies:`군량 확보 · ${GameState.resources.rice.toLocaleString()} / 100,000석`,
    rescueBrief:'복양 · 여포의 출전',
    rescueMuster:'복양 · 장료군과 고순군을 급히 편성하자',
    rescue:`여포 본대를 구해라 · 여포군 ${(ROSTER[bogyangId('yeopo')]?.troop ?? 0).toLocaleString()}명`,
    escape:'복양 · 포위망을 돌파했다',
    depart:'복양 · 서주로 이동하자',
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
  if (flags.bogyangPhase === 'supplies' && Object.hasOwn(BOGYANG_BANDITS,id)) { fightBogyangBandit(id); return; }
  if (flags.bogyangTown && id === 'yeopo') { offerYeopoTraining(); return; }
  if (flags.bogyangTown && ROSTER[id]?.kind === 'merchant') { openMerchantShop(id,flags.bogyangPhase === 'supplies' ? '창고에 남은 쌀이 조금 있습니다. 얼마나 필요하십니까?' : undefined); return; }
  if (flags.bogyangTown && (id === 'jingung' || GameState.npcStatus[id] === 'recruited')) { interactRecruitedGeneral(id); return; }
  if (flags.bogyangTown && BOGYANG_RECRUITS.includes(id)) {
    if (heroCurrentHp() <= 0) toast('휴식으로 체력을 회복한 뒤 다시 도전하자.');
    else challengeWarrior(id,context);
    return;
  }
  if (!isBogyangBattle()) return;
  if (playerArmies().some(army => army.commanderId === id) && id === (activeCommanderId || GameState.mainHero)) {
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
  if (phase === 'rescue') { finishBogyangRescue(); return; }
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
  Dialogue.show(lines, () => offerCapturedRecruits(capturedCity ? updateHUD : startBogyangFamine));
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
  return ['assault','defense','rescue'].includes(GameState.flags.bogyangPhase);
}

function bogyangIndependentArmies() {
  return ['jangmak','jangpae','yeopo'].map(bogyangId).filter(id => MapView.npcPos(id));
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
  if (GameState.flags.bogyangPhase === 'rescue') { await runBogyangRescueTurn(id,done); return; }
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

const BOGYANG_FOOD_TRIGGER = 80000;
const BOGYANG_GATE_ILLUST = 'assets/illust/bogyang_closed_gate.jpg';
const BOGYANG_DEPARTURE_ILLUST = 'assets/illust/habi_yeopo_march.jpg';
const BOGYANG_BANDITS = {
  hwangeonjan1:{x:4,y:5,before:'크하하! 멍청한 관군들, 농민들을 약탈하면 쉽게 식량이 해결되는 것을!',after:'피같이 모아둔 내 식량…!'},
  hwangeonjan2:{x:5,y:20,before:'이 수레는 우리가 먼저 차지했다! 가져가고 싶으면 덤벼라!',after:'으윽… 수레는 두고 가겠다!'},
  hwangeonjan3:{x:31,y:21,before:'이 길을 지나려면 쌀 한 자루는 내놓아야지. 장군이라고 봐줄 줄 알았나?',after:'졌소! 빼앗은 쌀은 저 짐더미에 있소.'},
};
const BOGYANG_LINEUP = ['habudon_seoju','habuyeon_seoju','jeonwi','heojeo','akjin_seoju','ijeon_seoju'];
const BOGYANG_BREAKOUT = {
  jeonwi:{x:22,y:18}, habudon_seoju:{x:18,y:20}, ijeon_seoju:{x:26,y:20},
};
for (const baseId of ['jojo','yeopo',...BOGYANG_LINEUP]) {
  const id = bogyangId(baseId);
  const base = ROSTER[baseId];
  ROSTER[id] = {...base,id,kind:baseId === 'yeopo' ? 'flavor' : 'enemy',rosterId:baseId,
    chance:undefined,unitType:'infantry',deputy:null};
}
ROSTER.habudon_seoju.battleArt = ROSTER[bogyangId('habudon_seoju')].battleArt = {
  glyph:'夏', weapon:'군도', className:'enemy-blue', src:'assets/battle/duel_habudon_v1.png',
};
ROSTER.heojeo.battleArt = ROSTER[bogyangId('heojeo')].battleArt = {
  glyph:'許', weapon:'철퇴', className:'enemy-blue', src:'assets/battle/duel_heojeo_v1.png',
};

const bogyangWait = ms => new Promise(resolve => setTimeout(resolve,ms));
const bogyangTalk = lines => new Promise(resolve => Dialogue.show(lines,resolve));
const bogyangPan = (x,y) => new Promise(resolve => MapView.panCameraTo(x,y,550,resolve));
const bogyangWalk = (id,path,follow = false) => new Promise(resolve => MapView.walkNpcPath(id,path,185,resolve,follow));

function bogyangLocustOverlay() {
  const started = performance.now();
  let overview = true;
  let fading = false;
  const seeds = Array.from({length:370}, () => [Math.random(),Math.random(),Math.random()]);
  MapView.setSceneOverlay((ctx,{w,h}) => {
    const t = (performance.now()-started)/1000;
    if (overview) {
      FieldAssets.draw(ctx,'bogyang_overview',0,0,w,h);
      ctx.fillStyle = '#412c23';
      for (const unit of Object.values(bogyangUnits())) {
        if (!unit.gone) ctx.fillRect(unit.x/36*w,unit.y/25*h,6,5);
      }
      ctx.fillStyle = '#c1a266';
      ctx.fillRect(21/36*w,5/25*h,6,5);
    }
    const count = overview ? seeds.length : fading ? 16 : 58;
    ctx.save();
    ctx.globalAlpha = overview ? .8 : .45;
    for (let i=0; i<count; i++) {
      const [a,b,c] = seeds[i];
      const progress = t * (.28+c*.2) - a*.94;
      const travel = overview ? progress : ((progress%1.9)+1.9)%1.9-.31;
      const x = w*(travel + b*.7 - .35);
      const y = h*(1.46 - travel + b*.62 - .44);
      const size = 6 + c*6;
      const frame = (Math.floor(t*15+i)%3)*128;
      FieldAssets.draw(ctx,'bogyang_locust',x,y,size*2.4,size*2.4,frame,0,128,128);
    }
    ctx.restore();
  });
  return {
    focusField:() => { overview = false; },
    finish:async () => { fading = true; await bogyangWait(850); MapView.setSceneOverlay(null); },
  };
}

async function startBogyangFamine() {
  const flags = GameState.flags;
  if (flags.bogyangPhase !== 'won' || bogyangBusy) return;
  bogyangBusy = true;
  flags.bogyangPhase = 'famine';
  clearBogyangBattlefieldFire();
  bogyangSetUnit('jojo',{troop:5000,x:22,y:19,deputy:'sunwook'});
  bogyangSetUnit('habudon_seoju',{troop:1500,x:19,y:20});
  bogyangSetUnit('jeonwi',{troop:2000,x:25,y:20});
  const playerPos = MapView.playerPos;
  loadBogyang();
  MapView.setPlayerPos(playerPos.x,playerPos.y);
  MapView.lockMovement(true);
  await bogyangTalk(bogyangLines(
    ['내레이션','복양에서 크게 패한 조조는 자신이 죽었다는 거짓 소문을 퍼뜨려 여포군에 큰 피해를 입혔다.'],
    ['내레이션','이후 여포군은 성문을 굳게 닫고 응전하지 않았으니, 양군의 대치는 계속되었다.'],
  ));
  MapView.setSceneGateClosed('south',true);
  const locusts = bogyangLocustOverlay();
  await bogyangWait(2100);
  GameState.resources.rice = 20000;
  if (GameState.month < 9) GameState.month = 9;
  updateHUD();
  centerAlert('[군량의 대부분이 사라졌다.]');
  await bogyangWait(1450);
  locusts.focusField();
  await bogyangTalk(bogyangLines(['내레이션','그해 가을, 메뚜기 떼가 연주를 뒤덮었다. 농작물이 모두 사라지고 백성과 군사들은 굶주리기 시작했다.']));
  await bogyangPan(22,20);
  await bogyangTalk(bogyangLines(
    ['조조','황충으로 군량이 바닥났으니 일단 견성으로 물러나야겠다.'],
    ['순욱','주공, 여남과 영천 일대에 아직 황건적 잔당들이 남아 있다고 합니다.'],
    ['순욱','그들을 토벌한다면 백성들의 근심을 덜고 군량도 확보할 수 있을 것입니다.'],
    ['조조','문약의 말이 옳다. 전군 회군하라!'],
  ));
  await Promise.all(Object.keys(bogyangUnits()).map(id => {
    const {x,y} = MapView.npcPos(id);
    return bogyangWalk(id,Array.from({length:25-y},(_,i)=>({x,y:y+i+1})),id===bogyangId('jojo'));
  }));
  for (const id of Object.keys(bogyangUnits())) MapView.removeNpc(id);
  flags.bogyangUnits = {};
  MapView.setSceneGateClosed('south',false);
  MapView.setPlayerPos(23,5,'left');
  await bogyangPan(22,5);
  await bogyangTalk(bogyangLines(
    ['여포','조조가 드디어 물러났구나! 허나 우리 역시 군량이 바닥났으니…'],
    ['여포','에잇! 천하의 여봉선이 고작 메뚜기 따위에 발목을 잡히다니!'],
    ['진궁','온후, 조조가 물러났다고 안심할 때가 아닙니다. 군량을 확보하고 병력을 정비해야 합니다.'],
    ['여포','문원, 그대에게 맡기겠소. 군사들이 굶주리지 않도록 하시오.'],
    ['설란','문원 장군, 우리도 군사를 내보내 인근에서 군량을 징발하고 있소.'],
    ['이봉','며칠만 기다리면 상당한 군량을 확보할 수 있을 것이오.'],
    ['장료','군량도 중요하지만 성의 수비에도 소홀함이 없어야 하오.'],
  ));
  await locusts.finish();
  flags.bogyangPhase = 'supplies';
  showBogyangBandits();
  MapView.clearCameraFocus();
  MapView.lockMovement(false);
  bogyangBusy = false;
  updateHUD();
}

function showBogyangBandits() {
  for (const [id,{x,y}] of Object.entries(BOGYANG_BANDITS)) {
    if (!GameState.flags.bogyangBandits?.includes(id)) {
      MapView.addNpc(id,{x,y,fixed:true,personOnly:true,label:'황건적 잔당'});
    }
  }
}

function fightBogyangBandit(id) {
  if (heroCurrentHp() <= 0) { showDuelRecoveryNotice(GameState.mainHero); return; }
  showChoice('황건적 잔당을 소탕할까요?',[
    {label:'일기토 (행동력 1)', cb:() => {
      if (!spend(DUEL_AP_COST)) return;
      const bandit = BOGYANG_BANDITS[id];
      Dialogue.show(bogyangLines(['황건적 잔당',bandit.before]),() => Battle.start({
        player:GameState.heroData(),enemy:ROSTER[id],startHp:heroCurrentHp(),
        onEnd:({outcome,playerHp}) => {
          GameState.heroHp = playerHp;
          if (outcome !== 'win') { updateHUD(); return; }
          const defeated = GameState.flags.bogyangBandits ??= [];
          if (defeated.includes(id)) return;
          defeated.push(id);
          MapView.removeNpc(id);
          GameState.addResource({rice:10000,gold:100});
          updateHUD();
          Dialogue.show(bogyangLines(
            ['황건적 잔당',bandit.after],
            ['내레이션','군량 10,000석과 금 100을 확보했다.'],
            ['내레이션',[
              '여남과 영천에서도 조조군이 황건적 잔당을 토벌하고 있다는 소식이 들려왔다.',
              '조조군의 전위가 허저라는 장수와 맞붙었다. 한참을 겨루고도 승부를 가리지 못했다고 한다.',
              '허저가 조조에게 합류했다. 조조군은 황건적을 토벌하며 군량도 확보했다.',
            ][defeated.length-1]],
          ));
        },
      }));
    }},
    {label:'물러서기'},
  ]);
}

async function announceBogyangRescue() {
  const flags = GameState.flags;
  if (flags.bogyangPhase !== 'supplies') return;
  bogyangBusy = true;
  flags.bogyangPhase = 'rescueBrief';
  for (const id of Object.keys(BOGYANG_BANDITS)) MapView.removeNpc(id);
  MapView.lockMovement(true);
  await bogyangPan(22,5);
  await bogyangTalk(bogyangLines(
    ['전령','급보입니다! 조조군이 연주를 공격하여 설란과 이봉 두 장군이 전사하였습니다!'],
    ['여포','무엇이?! 조조가 벌써 군세를 회복했단 말이냐!'],
    ['전령','조조군이 연주를 되찾고 복양으로 진군하고 있습니다!'],
    ...((flags.bogyangBandits?.length ?? 0) < 3 ? [['전령','새로 합류한 허저라는 장수가 선봉에 섰다고 합니다!']] : []),
    ['진궁','온후, 아직 장수들이 모두 모이지 않았으니 출전을 서두르지 마십시오.'],
    ['여포','조조 따위가 두렵단 말이오? 내 직접 나가 상대하겠소!'],
  ));
  flags.bogyangRescueRetry = buildSaveSnapshot();
  await beginBogyangEncirclement();
}

async function beginBogyangEncirclement() {
  const flags = GameState.flags;
  bogyangBusy = true;
  flags.bogyangTown = false;
  flags.bogyangPhase = 'rescueMuster';
  flags.bogyangUnits = {};
  const needed = 3000 + 2*ARMY_MIN_TROOP;
  if (GameState.resources.troop < needed) {
    const reinforcement = needed - GameState.resources.troop;
    GameState.addResource({troop:reinforcement});
    toast(`흩어졌던 복양 수비병 ${reinforcement.toLocaleString()}명이 돌아왔다.`);
  }
  GameState.resources.troop -= 3000;
  const rice = Math.min(GameState.resources.rice,monthlyRiceUpkeep(3000)*3);
  GameState.resources.rice -= rice;
  bogyangSetUnit('yeopo',{troop:3000,x:22,y:17});
  bogyangUnits()[bogyangId('yeopo')].rice = rice;
  BOGYANG_LINEUP.forEach((id,index) => bogyangSetUnit(id,{troop:2000,x:13+index*3,y:22}));
  bogyangSetUnit('jojo',{troop:5000,x:22,y:24});
  loadBogyang();
  MapView.setPlayerPos(21,15);
  MapView.lockMovement(true);
  await bogyangPan(22,20);
  await bogyangWait(700);
  await bogyangWalk(bogyangId('yeopo'),[{x:22,y:18},{x:22,y:19},{x:22,y:20}]);
  await bogyangTalk(bogyangLines(['허저','내가 허저다! 온후의 무예를 한번 겨뤄 보겠소!']));
  await new Promise(resolve => Battle.showExhibition({
    player:ROSTER.yeopo,enemy:ROSTER.heojeo,dodgeRounds:[true,false,false,false,false,false,false,false],
    stopAtHpRatio:.5,resultLabel:'조조군이 여포를 에워싼다',onEnd:resolve,
  }));
  MapView.removeNpc(bogyangId('jeonwi'));
  bogyangAddUnit(bogyangId('jeonwi'),22,18);
  await Promise.all([
    bogyangWalk(bogyangId('habudon_seoju'),[{x:14,y:22},{x:15,y:22},{x:16,y:22},{x:17,y:22},{x:18,y:22},{x:18,y:21},{x:18,y:20}]),
    bogyangWalk(bogyangId('ijeon_seoju'),[{x:27,y:22},{x:26,y:22},{x:26,y:21},{x:26,y:20}]),
  ]);
  bogyangSync();
  await bogyangTalk(bogyangLines(['전령','여포 장군이 포위됐습니다! 장료 장군, 고순 장군과 함께 구해 주십시오!']));
  bogyangBusy = false;
  updateHUD();
  prepareBogyangRescue();
}

function prepareBogyangRescue() {
  prepareHanaeArmies('bogyangRescue');
}

async function startBogyangRescueBattle() {
  const flags = GameState.flags;
  flags.bogyangPhase = 'rescue';
  bogyangBusy = true;
  bogyangSync();
  // 아직 지도에 배치하지 않은 고순군의 출발 좌표를 설정한다.
  flags.bogyangYeopo = {x:23,y:15};
  loadBogyang();
  MapView.setPlayerPos(21,15,'down');
  MapView.lockMovement(true);
  await bogyangPan(22,18);
  await Promise.all([
    bogyangWalk('gosun',[{x:23,y:16},{x:23,y:17},{x:24,y:17},{x:25,y:17}]),
    (async () => {
      for (const [x,y] of [[21,16],[21,17],[20,17],[19,17]]) {
        MapView.setPlayerPos(x,y,'down');
        await bogyangWait(185);
      }
    })(),
  ]);
  bogyangBusy = false;
  MapView.clearCameraFocus();
  updateHUD();
  startWarRound();
}

async function runBogyangRescueTurn(id, done) {
  if (id === bogyangId('yeopo')) { done(false); return; }
  const target = MapView.npcPos(bogyangId('yeopo'));
  const pos = MapView.npcPos(id);
  const guard = Object.keys(BOGYANG_BREAKOUT).some(key => bogyangId(key) === id);
  const army = armyFor(id);
  if (target && pos && !StatusEffects.isConfused(id)) {
    // The blockade holds its positions. Surrounding units close ranks over several turns.
    const adjacent = inAttackRange(pos,target,1);
    const reaches = adjacent || (!guard && id !== bogyangId('jojo') &&
      await MapView.marchToward(id,target,2,175));
    if (reaches && army?.troop > 0) {
      resolveArmyBattle(id,{commanderId:bogyangId('yeopo'),initiator:'enemy',freeAction:true,silent:true});
    }
  }
  finishBogyangRescue();
  done(false);
}

function finishBogyangRescue() {
  const flags = GameState.flags;
  if (flags.bogyangPhase !== 'rescue') return;
  const yeopo = bogyangId('yeopo');
  for (const id of enemiesInScene()) if (ROSTER[id].troop <= 0) MapView.removeNpc(id);
  if (!MapView.npcPos(yeopo) || ROSTER[yeopo].troop <= 0 || !playerArmies().some(army=>army.troop>0)) {
    endWarInitiative();
    flags.bogyangPhase = 'failed';
    MapView.lockMovement(true);
    showChoice('여포 본대 구출에 실패했습니다.',[
      {label:'복양 구출전 다시 시작',cb:() => {
        applySaveSnapshot(structuredClone(flags.bogyangRescueRetry));
        beginBogyangEncirclement();
      }},
      {label:'메인 화면으로',cb:()=>showScreen('screen-title')},
    ]);
    return;
  }
  const gap = Object.keys(BOGYANG_BREAKOUT).find(id => !MapView.npcPos(bogyangId(id)));
  if (gap) { endBogyangRescue(gap); return; }
  if (GameState.allyArmy?.troop <= 0) MapView.removeNpc('gosun');
  updateHUD();
  if (warRoundActive && playerArmies().some(army=>army.commanderId===warOrder[warIndex] && army.troop<=0)) endWarUnitTurn();
}

async function endBogyangRescue(gap) {
  const flags = GameState.flags;
  flags.bogyangPhase = 'escape';
  bogyangBusy = true;
  endWarInitiative();
  MapView.lockMovement(true);
  const id = bogyangId('yeopo'), pos = MapView.npcPos(id), exit = BOGYANG_BREAKOUT[gap];
  await bogyangPan(pos.x,pos.y);
  const path = [];
  let {x,y} = pos;
  while (x !== exit.x) { x += Math.sign(exit.x-x); path.push({x,y}); }
  while (y !== exit.y) { y += Math.sign(exit.y-y); path.push({x,y}); }
  await bogyangWalk(id,path,true);
  GameState.addResource({troop:ROSTER[id].troop,rice:ROSTER[id].rice});
  dissolveArmy('army');
  dissolveArmy('allyArmy');
  flags.bogyangOccupied = false;
  clearBogyangBattlefieldFire();
  flags.bogyangUnits = {};
  flags.bogyangYeopo = null;
  loadBogyang();
  MapView.setPlayerPos(21,18);
  MapView.lockMovement(true);
  await bogyangTalk(bogyangLines(
    ['여포','일단 복양으로 돌아가 군사를 정비하겠다!',BOGYANG_GATE_ILLUST],
    ['내레이션','하지만 복양성의 성문은 굳게 닫혀 열리지 않는다. 성벽 위에 전씨가 서 있다.',BOGYANG_GATE_ILLUST],
    ['여포','무엇 하느냐! 어서 성문을 열어라!',BOGYANG_GATE_ILLUST],
    ['전씨','나는 이미 조 장군에게 귀순하였소!',BOGYANG_GATE_ILLUST],
    ['여포','이 배은망덕한 놈!',BOGYANG_GATE_ILLUST],
    ['내레이션','복양을 잃은 여포는 정도로 물러났으나 조조의 계략에 다시 패하여 연주를 모두 잃었다.',BOGYANG_DEPARTURE_ILLUST],
    ['여포','이제 천하 어디로 가야 한단 말인가.',BOGYANG_DEPARTURE_ILLUST],
    ['진궁','서주의 유비는 인덕이 높다 하니, 그에게 의탁하는 것이 좋겠습니다.',BOGYANG_DEPARTURE_ILLUST],
  ));
  offerCapturedRecruits(() => {
    flags.bogyangPhase = 'depart';
    bogyangBusy = false;
    updateHUD();
  });
}

function clearBogyangBattlefieldFire() {
  for (const {x,y} of StatusEffects.fireTilesForMap('bogyang')) StatusEffects.extinguishTile('bogyang',x,y);
}

function departBogyang() {
  if (bogyangBusy || warUiBusy() || GameState.flags.bogyangPhase !== 'depart') return;
  stage = 'jangryo_seoju';
  loadJangryoSeoju();
  updateHUD();
}

function loadJangryoSeoju() {
  MapView.load('seoju',{onInteract:(id) => { if (id === 'yubi') Dialogue.show(bogyangLines(['유비','먼 길을 오셨소. 우선 이곳에서 쉬어 가시오.'])); },
    onApSpent:updateHUD,onApBlocked,onStep:renderMinimap,onAmbientInteract:runAmbientEvent,
    npcFilter:()=>false});
  MapView.addNpc('yubi',{x:18,y:9,personOnly:true,fixed:true,label:'유비'});
  MapView.lockMovement(false);
}
