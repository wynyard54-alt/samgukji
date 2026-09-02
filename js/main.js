let stage = 'title';
let toastTimer = null;

const DEADLINES = { takhyeon: 186, pyeongwon: 188 };
const STAT_LABELS = { atk: '공격', def: '방어', spd: '속도', int: '지력', cha: '매력' };
const COMBAT_STATS = ['atk', 'def', 'spd'];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
}

function showChoice(text, options) {
  const box = document.getElementById('choice-box');
  document.getElementById('choice-text').textContent = text;
  const wrap = document.getElementById('choice-buttons');
  wrap.innerHTML = '';
  options.forEach((opt) => {
    const b = document.createElement('button');
    b.textContent = opt.label;
    b.onclick = () => { box.classList.add('hidden'); if (opt.cb) opt.cb(); };
    wrap.appendChild(b);
  });
  box.classList.remove('hidden');
  const first = wrap.querySelector('button');
  if (first) first.focus();
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

const WARMAP_AP_CAP = 8; // 기병 이동 등이 한 턴에 지나치게 멀리 가지 않도록 전쟁맵에서만 행동력 상한을 건다

function effectiveApMax() {
  return stage === 'warmap' ? Math.min(GameState.apMax, WARMAP_AP_CAP) : GameState.apMax;
}

function heroMaxHp() { return Battle.maxHP(GameState.heroData().stats); }
function heroCurrentHp() { return GameState.heroHp != null ? GameState.heroHp : heroMaxHp(); }

// 책사 1명당 매달 금 5 + 지력/5 수입 (성읍이 없는 챕터1이라 쌀 수입은 없음)
function scholarGoldIncome() {
  return GameState.recruited.reduce((sum, id) => {
    const rd = ROSTER[id];
    if (!rd || !isScholarType(rd)) return sum;
    return sum + 5 + Math.round(rd.stats.int / 5);
  }, 0);
}

function spend(n) {
  if (!GameState.spendAP(n)) { toast('행동력이 부족합니다. "휴식"을 눌러보세요.'); return false; }
  updateHUD();
  return true;
}

function describeReward(r) {
  const parts = [];
  if (r.gold) parts.push(`금 ${r.gold}`);
  if (r.rice) parts.push(`쌀 ${r.rice}`);
  if (r.troop) parts.push(`병사 ${r.troop}`);
  return parts.join(', ');
}

const LOCATION_NAMES = {
  takhyeon: '탁현 · 장터',
  pyeongwon: '평원현',
  camp: '반동탁연합 진영',
  warmap: '호로관 전선',
};

function getObjectives() {
  const gs = GameState;
  const list = [];
  if (stage === 'takhyeon_free') {
    const deungmuDone = ['recruited', 'resolved'].includes(gs.npcStatus['deungmu']);
    if (!deungmuDone) list.push(`황건적 두목 등무 처치하기 (${DEADLINES.takhyeon}년까지)`);

    ['noshik', 'gongyung'].forEach((id) => {
      const rd = ROSTER[id];
      if (!rd) return;
      if (gs.npcVisible[id] === false) return;
      const st = gs.npcStatus[id];
      if (st === 'recruited' || st === 'resolved') return;
      if (!st) { list.push(`${rd.name}과(와) 첫 만남 (미발견)`); return; }
      const fs = gs.friendship[id] || 0;
      if (fs <= 0) list.push(`${rd.name}의 집 방문 (미방문)`);
      else list.push(`${rd.name}의 집 방문 중 (친밀도 ${fs}/100)`);
    });

    if (deungmuDone && !gs.flags.act1) list.push('유비에게 보고하기');
    if (gs.flags.act1) list.push('평원현으로 이동하기');
  } else if (stage === 'pyeongwon_free') {
    list.push(`반동탁연합 참전 준비하기 (${DEADLINES.pyeongwon}년까지)`);
  } else if (stage === 'camp') {
    list.push('제후들과 인사하고 손견을 도와 화웅과 맞서기');
  } else if (stage === 'warmap') {
    list.push('호로관의 적 군세를 모두 격파하기');
  } else {
    list.push('전투에 집중하자!');
  }
  return list.slice(0, 4);
}

function renderLocationBanner() {
  const name = LOCATION_NAMES[MapView.currentMapId] || '';
  document.getElementById('location-name').textContent = name;
  const objectives = getObjectives();
  document.getElementById('location-task').textContent = objectives[0] ? `◆ ${objectives[0]}` : '';
}

function renderQuestPanel() {
  const wrap = document.getElementById('quest-list');
  wrap.innerHTML = '';
  getObjectives().forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    wrap.appendChild(li);
  });
}

function renderMinimap() {
  const canvas = document.getElementById('minimap-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const mapId = MapView.currentMapId;
  document.getElementById('minimap-title').textContent = LOCATION_NAMES[mapId] ? LOCATION_NAMES[mapId].split(' ')[0] : (mapId || '');
  if (!mapId) return;
  const size = MapView.mapSize;
  const pos = MapView.playerPos;
  ctx.fillStyle = '#3a4a2f';
  ctx.fillRect(0, 0, w, h);
  const px = (pos.x / Math.max(1, size.w)) * w;
  const py = (pos.y / Math.max(1, size.h)) * h;
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.arc(px, py, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}

function renderPlayerPanel() {
  const hero = GameState.heroData();
  if (!hero) return;
  document.getElementById('player-name').textContent = hero.name;

  const img = document.getElementById('player-portrait-img');
  const fallback = document.getElementById('player-portrait-fallback');
  if (GameState.mainHero === 'gwanwoo') {
    img.src = 'assets/ui/portrait_gwanwoo.png';
    img.classList.remove('hidden');
    fallback.classList.add('hidden');
  } else {
    img.classList.add('hidden');
    fallback.classList.remove('hidden');
    fallback.textContent = hero.name ? hero.name[0] : '';
    fallback.style.background = GameState.mainHero === 'jangbi' ? '#8a3b2a' : '#555';
  }

  const maxHp = heroMaxHp();
  const curHp = clamp(heroCurrentHp(), 0, maxHp);
  document.getElementById('stat-fill-hp').style.width = `${(curHp / maxHp) * 100}%`;
  document.getElementById('stat-val-hp').textContent = `${curHp}/${maxHp}`;

  Object.keys(STAT_LABELS).forEach((key) => {
    const val = hero.stats[key] || 0;
    document.getElementById(`stat-fill-${key}`).style.width = `${clamp(val, 0, 100)}%`;
    document.getElementById(`stat-val-${key}`).textContent = val;
  });
}

function updateHUD() {
  const gs = GameState;
  document.getElementById('hud-date').textContent = gs.dateLabel();
  document.getElementById('hud-ap').textContent = `행동력 ${Math.min(gs.ap, effectiveApMax())}/${effectiveApMax()}`;
  document.getElementById('hud-gold').textContent = `금 ${gs.resources.gold}(+${scholarGoldIncome()})`;
  document.getElementById('hud-rice').textContent = `쌀 ${gs.resources.rice}(+0)`;
  document.getElementById('hud-troop').textContent = `병사 ${gs.resources.troop}`;
  document.getElementById('hud-fame').textContent = `명성 ${gs.fame}`;

  renderLocationBanner();
  renderQuestPanel();
  renderMinimap();
  renderPlayerPanel();

  const progressBtn = document.getElementById('btn-progress');
  if (stage === 'takhyeon_free') {
    const deungmuDone = ['recruited', 'resolved'].includes(gs.npcStatus['deungmu']);
    if (deungmuDone && gs.flags.act1) {
      progressBtn.classList.remove('hidden');
      progressBtn.textContent = '평원현으로 이동';
      progressBtn.onclick = goPyeongwonFree;
    } else {
      progressBtn.classList.add('hidden');
    }
  } else if (stage === 'pyeongwon_free') {
    progressBtn.classList.remove('hidden');
    progressBtn.textContent = '반동탁연합 참전 준비';
    progressBtn.onclick = () => openArmyBox(goCoalitionCamp);
  } else {
    progressBtn.classList.add('hidden');
  }
}

// ---------------- NPC interaction ----------------
function interactNPC(id, context) {
  const rd = ROSTER[id];
  if (!rd) return;
  const st = GameState.npcStatus[id];
  if (st === 'recruited' || st === 'resolved' || st === 'dead' || st === 'fled') return;

  if (id === 'yubi') { handleYubi(); return; }

  if (id === 'songyeon' && stage === 'camp') {
    GameState.npcStatus['songyeon'] = 'resolved';
    startSongyeonBattleScene();
    return;
  }

  if (rd.kind === 'flavor') {
    Dialogue.show([{ speaker: rd.name, text: rd.intro }]);
    return;
  }

  if (rd.kind === 'resource') {
    Dialogue.show([{ speaker: rd.name, text: rd.intro }], () => {
      GameState.addResource(rd.reward || {});
      GameState.npcStatus[id] = 'resolved';
      MapView.removeNpc(id);
      toast(`${rd.name}에게서 ${describeReward(rd.reward || {})}을(를) 얻었다.`);
      updateHUD();
    });
    return;
  }

  if (rd.kind === 'recruit') {
    if (isScholarType(rd)) visitScholar(id, context); else challengeWarrior(id);
    return;
  }

  if (id === 'yeopo' && stage === 'warmap') {
    startYeopoAssistScene();
    return;
  }

  if (rd.kind === 'enemy') {
    if (stage === 'warmap' && !rd.forced) { openWarCommandMenu(id); return; }
    const afterCb = stage === 'warmap' ? checkWarmapClear : undefined;
    startFreeBattle(id, afterCb, true);
    return;
  }
}

function handleYubi() {
  if (stage === 'takhyeon_free') {
    const deungmuDone = ['recruited', 'resolved'].includes(GameState.npcStatus['deungmu']);
    if (!deungmuDone) {
      Dialogue.show([{ speaker: '유비', text: '황건적 잔당이 아직 마을 근처를 떠돌고 있다 하오. 먼저 처리하고 오시겠소?' }]);
    } else if (!GameState.flags.act1) {
      Dialogue.show(STORY.act1_report, () => {
        GameState.flags.act1 = true;
        GameState.addFame(30); // 메인퀘스트 완료
        GameState.addFame(50); // 관직 제수
        toast('평원현으로 이동할 수 있습니다. (명성 +80)');
        updateHUD();
      });
    } else {
      Dialogue.show([{ speaker: '유비', text: '아우들, 평원으로 떠날 준비가 되었소.' }]);
    }
  }
}

// ---- 책사형: 저택 방문 + 친밀도 게이지 ----
const VISIT_LINES = [
  '어서 오시오. 같이 차나 한 잔 하며 이야기 좀 나누시겠소?',
  '또 와주셨구려. 요즘 돌아가는 세상 이야기나 나눕시다.',
  '그대가 또 찾아올 줄 알았소. 앉으시오.',
];

function visitScholar(id, context) {
  const rd = ROSTER[id];
  const firstTime = !GameState.npcStatus[id];
  if (firstTime) {
    GameState.npcStatus[id] = 'met';
    GameState.friendship[id] = 0;
    MapView.render();
    const firstLines = [];
    if (context && context.discoveryText) {
      firstLines.push({ speaker: '내레이션', text: context.discoveryText });
      firstLines.push({ speaker: '내레이션', text: '범상치 않은 인물을 발견했다!' });
    }
    firstLines.push({ speaker: rd.name, text: rd.intro });
    Dialogue.show(firstLines, () => {
      toast(`${rd.name}의 거처를 알게 되었다. 이제 지도에서 방문(행동력3)할 수 있다.`);
      MapView.render();
    });
    return;
  }
  if (!spend(3)) return;
  const hero = GameState.heroData();
  const gain = Math.round(clamp(8 + hero.stats.cha * 0.12 + hero.stats.int * 0.08, 4, 30));
  GameState.friendship[id] = Math.min(100, (GameState.friendship[id] || 0) + gain);
  const fs = GameState.friendship[id];
  const line = VISIT_LINES[Math.floor(Math.random() * VISIT_LINES.length)];
  if (fs >= 100) {
    Dialogue.show([
      { speaker: rd.name, text: line },
      { speaker: '내레이션', text: `[${rd.name}과(와) 친밀도 상승 (+${gain}) → 100/100]` },
      { speaker: rd.name, text: '그대의 진심을 이제야 알겠소. 나 역시 함께하겠소!' },
    ], () => {
      GameState.recruit(id, 0);
      MapView.removeNpc(id);
      toast(`${rd.name}이(가) 등용되었습니다! (명성 +10)`);
      updateHUD();
    });
  } else {
    Dialogue.show([
      { speaker: rd.name, text: line },
      { speaker: '내레이션', text: `[${rd.name}과(와) 친밀도 상승 (+${gain}) → ${fs}/100]` },
    ], () => {
      showChoice(`지금 ${rd.name}에게 등용을 제안해보시겠습니까? (현재 친밀도 ${fs}/100)`, [
        { label: '등용을 제안한다', cb: () => proposeScholar(id) },
        { label: '다음에 다시 오겠다', cb: () => {} },
      ]);
    });
  }
}

function proposeScholar(id) {
  const rd = ROSTER[id];
  const fs = GameState.friendship[id] || 0;
  const chance = clamp(fs, 5, 97);
  const roll = Math.random() * 100;
  if (roll < chance) {
    Dialogue.show([{ speaker: rd.name, text: '그대의 진심을 이제야 알겠소. 나 역시 함께하겠소!' }], () => {
      GameState.recruit(id, 0);
      MapView.removeNpc(id);
      toast(`${rd.name}이(가) 등용되었습니다! (성공률 ${Math.round(chance)}%, 명성 +10)`);
      updateHUD();
    });
  } else {
    Dialogue.show([{ speaker: rd.name, text: '아직은 때가 아닌 듯하오. 조금 더 지켜봅시다.' }], () => {
      toast(`아쉽지만 아직 거절당했다. (실패, 성공률 ${Math.round(chance)}%) 친밀도를 더 쌓아보자.`);
    });
  }
}

// ---- 무력형: 등용 제안 → 거절 + 일기토 → 승리 시 등용확률 상승 ----
function challengeWarrior(id) {
  const rd = ROSTER[id];
  const firstTime = !GameState.npcStatus[id];
  if (!firstTime && !spend(3)) return;
  GameState.npcStatus[id] = 'met';
  Dialogue.show([{ speaker: rd.name, text: '나는 실력없는 장수 밑으로 들어가고 싶지 않소. 그대의 실력, 이 자리에서 보여주시오!' }], () => {
    Battle.start({
      player: GameState.heroData(),
      enemy: rd,
      startHp: heroCurrentHp(),
      onEnd: (result) => {
        GameState.heroHp = result.playerHp;
        updateHUD();
        if (result.outcome === 'win') {
          const hero = GameState.heroData();
          const chance = clamp(60 + (hero.stats.cha - rd.stats.cha) * 0.5, 20, 95);
          const roll = Math.random() * 100;
          if (roll < chance) {
            Dialogue.show([{ speaker: rd.name, text: '…드디어 눈을 떴습니다. 함께하죠.' }], () => {
              GameState.recruit(id);
              MapView.removeNpc(id);
              toast(`${rd.name}이(가) 등용되었습니다! (성공률 ${Math.round(chance)}%, 명성 +10)`);
              updateHUD();
            });
          } else {
            Dialogue.show([{ speaker: rd.name, text: '…다음에 다시 붙어 봅시다.' }]);
          }
        } else if (result.outcome === 'lose') {
          toast(`${rd.name}에게 밀렸다... 실력을 더 키워야겠다.`);
        }
      },
    });
  });
}

function attemptPersuadeCaptured(id) {
  const rd = ROSTER[id];
  const hero = GameState.heroData();
  const chance = clamp(55 + (hero.stats.cha - rd.stats.cha) * 0.6, 15, 95);
  const roll = Math.random() * 100;
  if (roll < chance) {
    GameState.recruit(id);
    MapView.removeNpc(id);
    toast(`${rd.name}이(가) 등용되었습니다! (성공률 ${Math.round(chance)}%, 명성 +10)`);
  } else {
    GameState.npcStatus[id] = 'resolved';
    MapView.removeNpc(id);
    toast(`${rd.name}이(가) 결국 뜻을 굽히지 않고 떠났다. (실패, 성공률 ${Math.round(chance)}%)`);
  }
  updateHUD();
}

// ---- 군세간 전투 (전쟁맵 [일기토]/[전투] 커맨드) ----
const GRADE_RANK = { S:1, A:2, B:3, C:4, D:5 };
const GRADE_ATTACK_MOD = { S:0.10, A:0.05, B:0, C:-0.05, D:-0.10 };
const GATE_TILES = { 2:true }; // 관문/요새 타일 - 방어측이 있으면 피해 -5%

// 방어측 군세 등급이 도전측보다 낮을수록 일기토 수락 확률이 낮아진다 (등급차 1당 -20%)
function duelAcceptChance(challengerGrade, defenderGrade) {
  const diff = Math.max(0, GRADE_RANK[defenderGrade] - GRADE_RANK[challengerGrade]);
  return Math.max(0, 100 - 20 * diff);
}

function enemyArmyGrade(rd) { return gradeFor(armyMuryeokValue(rd, []), MURYEOK_GRADES); }

function npcOnGateTile(id) {
  // 현재 챕터1 지도에는 관문/요새 타일에 서있는 적 군세가 없다 - 향후 지도 확장을 위한 훅
  return false;
}

// 병사수 10% 기준 공격에 군세등급/사기/지형 보정을 더해 additive로 합산한다 (병종은 챕터2에서 반영)
function armyAttackDamage(attackerTroops, attackerGrade, attackerMorale, defenderOnGate) {
  const mult = 1 + GRADE_ATTACK_MOD[attackerGrade] + (attackerMorale - 100) / 100 - (defenderOnGate ? 0.05 : 0);
  return Math.max(0, Math.round(attackerTroops * 0.10 * mult));
}

function simulateArmyBattle(player, enemy) {
  // player/enemy: { troops, grade, morale, onGate }
  if (player.morale <= 0) return { winner:'enemy', rounds:0, playerTroopsLeft:player.troops, enemyTroopsLeft:enemy.troops, surrender:'player' };
  if (enemy.morale <= 0) return { winner:'player', rounds:0, playerTroopsLeft:player.troops, enemyTroopsLeft:enemy.troops, surrender:'enemy' };
  let pT = player.troops, eT = enemy.troops, rounds = 0;
  while (pT > 0 && eT > 0 && rounds < 50) {
    const dmgToEnemy = armyAttackDamage(pT, player.grade, player.morale, enemy.onGate);
    const dmgToPlayer = armyAttackDamage(eT, enemy.grade, enemy.morale, player.onGate);
    eT = Math.max(0, eT - dmgToEnemy);
    pT = Math.max(0, pT - dmgToPlayer);
    rounds++;
  }
  const winner = eT <= 0 && pT <= 0 ? (player.troops >= enemy.troops ? 'player' : 'enemy') : eT <= 0 ? 'player' : 'enemy';
  return { winner, rounds, playerTroopsLeft:pT, enemyTroopsLeft:eT };
}

function openWarCommandMenu(id) {
  const rd = ROSTER[id];
  showChoice(`${rd.name} 군세와 마주쳤다. 어떻게 하시겠습니까?`, [
    { label: '일기토', cb: () => attemptDuelChallenge(id) },
    { label: '전투', cb: () => resolveArmyBattle(id) },
  ]);
}

function attemptDuelChallenge(id) {
  const rd = ROSTER[id];
  const challengerGrade = playerArmyGrade();
  const defenderGrade = enemyArmyGrade(rd);
  const chance = duelAcceptChance(challengerGrade, defenderGrade);
  const roll = Math.random() * 100;
  if (roll < chance) {
    startFreeBattle(id, () => { if (stage === 'warmap') checkWarmapClear(); }, true);
  } else {
    Dialogue.show([{ speaker: rd.name, text: '흥, 그런 도발에 넘어갈 성싶으냐! 정정당당히 전군으로 붙어보자!' }], () => {
      toast(`${rd.name}이(가) 일기토를 거절했다. (수락 확률 ${Math.round(chance)}%)`);
      openWarCommandMenu(id);
    });
  }
}

function resolveArmyBattle(id) {
  const rd = ROSTER[id];
  const army = GameState.army;
  const result = simulateArmyBattle(
    { troops: army ? army.troop : 0, grade: playerArmyGrade(), morale: GameState.morale, onGate: false },
    { troops: rd.troop || 1000, grade: enemyArmyGrade(rd), morale: 100, onGate: npcOnGateTile(id) },
  );
  if (army) army.troop = result.playerTroopsLeft;
  updateHUD();
  if (result.winner === 'player') {
    Dialogue.show([{ speaker: '내레이션', text: `치열한 교전 끝에 ${rd.name}의 군세를 격파했다! (아군 병력 ${result.playerTroopsLeft}명, 적 병력 궤멸)` }], () => {
      GameState.npcStatus[id] = 'resolved';
      MapView.removeNpc(id);
      toast(`${rd.name}이(가) 패주했다.`);
      if (stage === 'warmap') checkWarmapClear();
    });
  } else {
    Dialogue.show([{ speaker: '내레이션', text: `아군이 ${rd.name}의 군세에 밀려 물러났다. (아군 병력 ${result.playerTroopsLeft}명 남음)` }], () => {
      releaseCapturedOnDefeat();
      toast('전열을 정비해 다시 도전하자.');
    });
  }
}

function startFreeBattle(id, afterCb, persistHp) {
  const rd = ROSTER[id];
  Dialogue.show([{ speaker: rd.name, text: `${rd.name}이(가) 앞을 막아섰다!` }], () => {
    Battle.start({
      player: GameState.heroData(),
      enemy: rd,
      startHp: persistHp ? heroCurrentHp() : undefined,
      onEnd: (result) => onFreeBattleEnd(id, result, afterCb, persistHp),
    });
  });
}

// 일기토는 항상 한쪽 체력이 0이 되어야 끝난다 - 승자(플레이어)가 자기 최대체력의 70%
// 이상을 남긴 압도적 승리라면, 적 사령관을 포획해 전쟁이 끝난 뒤 등용을 제안할 수 있다.
// 서사 강제(forced) 전투(화웅/여포/이각/곽사 등)는 이 메카닉에서 제외된다.
const CAPTURE_HP_RATIO = 0.7;

function isOverwhelmingWin(rd, result) {
  return stage === 'warmap' && !rd.forced && result.playerMaxHp > 0 &&
    (result.playerHp / result.playerMaxHp) >= CAPTURE_HP_RATIO;
}

function captureCommander(id, afterCb) {
  const rd = ROSTER[id];
  GameState.npcStatus[id] = 'captured';
  GameState.capturedCommanders.push(id);
  MapView.removeNpc(id);
  Dialogue.show([{ speaker: '내레이션', text: `압도적인 실력차로 ${rd.name}을(를) 사로잡았다! 이번 전쟁이 끝나면 등용을 제안할 수 있을 것이다.` }], () => {
    toast(`${rd.name}을(를) 포획했다!`);
    if (afterCb) afterCb();
  });
}

// 포획한 적장을 데리고 있는 동안 아군이 다른 전투에서 패배하면, 혼란을 틈타 모두 풀려난다.
function releaseCapturedOnDefeat() {
  if (!GameState.capturedCommanders.length) return;
  const names = GameState.capturedCommanders.map((id) => ROSTER[id].name).join(', ');
  for (const id of GameState.capturedCommanders) GameState.npcStatus[id] = 'resolved';
  GameState.capturedCommanders = [];
  toast(`포획해두었던 ${names}이(가) 혼란을 틈타 달아났다.`);
}

function onFreeBattleEnd(id, result, afterCb, persistHp) {
  const rd = ROSTER[id];
  if (persistHp) { GameState.heroHp = result.playerHp; updateHUD(); }
  if (result.outcome === 'win') {
    if (isOverwhelmingWin(rd, result)) { captureCommander(id, afterCb); return; }
    showChoice(rd.intro, [
      { label: '등용을 제안한다', cb: () => { attemptPersuadeCaptured(id); if (afterCb) afterCb(); } },
      { label: '그냥 보내준다', cb: () => {
          GameState.npcStatus[id] = 'resolved'; MapView.removeNpc(id);
          toast(`${rd.name}을(를) 놓아주었다.`);
          if (afterCb) afterCb();
        } },
    ]);
  } else if (result.outcome === 'lose') {
    toast(`${rd.name}에게 밀렸다... 다시 도전할 수 있다.`);
    if (stage === 'warmap') releaseCapturedOnDefeat();
    if (afterCb) afterCb();
  }
}

// 전쟁이 끝나면 포획해두었던 적장들에게 순서대로 등용을 제안한다.
function offerCapturedRecruits(done) {
  const captured = GameState.capturedCommanders.slice();
  GameState.capturedCommanders = [];
  function next(i) {
    if (i >= captured.length) { done(); return; }
    const id = captured[i];
    const rd = ROSTER[id];
    Dialogue.show([{ speaker: '내레이션', text: `포로로 잡아두었던 ${rd.name}을(를) 마주했다.` }], () => {
      showChoice(rd.intro, [
        { label: '등용을 제안한다', cb: () => { attemptPersuadeCaptured(id); next(i + 1); } },
        { label: '그냥 풀어준다', cb: () => {
            GameState.npcStatus[id] = 'resolved'; MapView.removeNpc(id);
            toast(`${rd.name}을(를) 풀어주었다.`);
            next(i + 1);
          } },
      ]);
    });
  }
  next(0);
}

// ---------------- 스테이지 진행 ----------------
// ---- 체류 시한: 정해진 기간을 넘기면 서사적으로 다음 단계로 강제 진행 ----
function checkDeadlines() {
  const gs = GameState;
  if (stage === 'takhyeon_free' && gs.year > DEADLINES.takhyeon && !gs.flags.act1) {
    const deungmuDone = ['recruited', 'resolved'].includes(gs.npcStatus['deungmu']);
    if (!deungmuDone) {
      gs.npcStatus['deungmu'] = 'resolved';
      MapView.removeNpc('deungmu');
    }
    gs.flags.act1 = true;
    gs.addFame(30); // 메인퀘스트 완료 (관직 제수 서사는 생략되었으므로 그 명성은 제외)
    Dialogue.show(STORY.act1_forced, () => { goPyeongwonFree(); });
    return true;
  }
  if (stage === 'pyeongwon_free' && gs.year > DEADLINES.pyeongwon) {
    Dialogue.show(STORY.act2_forced, () => { openArmyBox(goCoalitionCamp); });
    return true;
  }
  return false;
}

function goTakhyeonFree() {
  stage = 'takhyeon_free';
  showScreen('screen-explore');
  MapView.load('takhyeon', { onInteract: interactNPC });
  updateHUD();
}

function goPyeongwonFree() {
  stage = 'pyeongwon_free';
  showScreen('screen-explore');
  MapView.load('pyeongwon', { onInteract: interactNPC });
  updateHUD();
  if (!GameState.flags.act2) {
    Dialogue.show(STORY.act2_call, () => { GameState.flags.act2 = true; });
  }
}

function goCoalitionCamp() {
  stage = 'camp';
  showScreen('screen-explore');
  MapView.load('camp', { onInteract: interactNPC });
  updateHUD();
  Dialogue.show(STORY.camp_arrive);
}

function startSongyeonBattleScene() {
  Dialogue.show(STORY.camp_songgyeon_battle, goSasugwan);
}

function goSasugwan() {
  stage = 'sasugwan';
  Dialogue.show(STORY.sasugwan_pre, () => {
    Battle.start({
      player: GameState.heroData(),
      enemy: ROSTER.hwaung,
      onEnd: (result) => {
        if (result.outcome === 'win') {
          GameState.npcStatus['hwaung'] = 'dead';
          GameState.addFame(30); // 메인퀘스트: 온주참화웅
          updateHUD();
          Dialogue.show(STORY.sasugwan_post, goWarmap);
        } else {
          toast('화웅에게 밀렸다... 다시 도전하자!');
          goSasugwan();
        }
      },
    });
  });
}

function goWarmap() {
  stage = 'warmap';
  GameState.ap = effectiveApMax(); // 전쟁맵 진입시 행동력 상한(8)에 맞춰 재보급
  showScreen('screen-explore');
  MapView.load('warmap', {
    onInteract: interactNPC,
    onApSpent: updateHUD,
    onApBlocked: () => toast('행동력이 부족하다. 다음달로 넘어가 행동력을 재보급받자.'),
  });
  updateHUD();
  Dialogue.show(STORY.warmap_intro);
}

function checkWarmapClear() {
  const ids = ['hojin', 'songheon', 'wisok', 'yeopo'];
  const allDone = ids.every((id) => ['resolved', 'recruited', 'fled', 'captured'].includes(GameState.npcStatus[id]));
  if (allDone) {
    GameState.addFame(30); // 메인퀘스트: 호로관 평정
    updateHUD();
    offerCapturedRecruits(() => Dialogue.show(STORY.warmap_clear, goHamgokgwan));
  }
}

function startYeopoAssistScene() {
  Dialogue.show(STORY.warmap_yeopo_taunt, () => {
    Dialogue.show(STORY.warmap_jangbi_out, () => {
      Dialogue.show(STORY.warmap_jangbi_push, () => {
        showChoice('장비를 도와야 한다!', [
          { label: '도와준다', cb: () => {
            Battle.start({
              player: GameState.heroData(),
              enemy: ROSTER.yeopo,
              startHp: heroCurrentHp(),
              retreatAt: 0.3,
              onEnd: (result) => {
                GameState.heroHp = result.playerHp;
                updateHUD();
                if (result.outcome === 'lose') {
                  releaseCapturedOnDefeat();
                  toast('여포에게 밀렸다... 다시 도전하자!');
                  return;
                }
                GameState.npcStatus['yeopo'] = 'fled';
                MapView.removeNpc('yeopo');
                Dialogue.show(STORY.warmap_yubi_assist, () => {
                  Dialogue.show(STORY.warmap_yeopo_flee, checkWarmapClear);
                });
              },
            });
          } },
        ]);
      });
    });
  });
}

function goHamgokgwan() {
  stage = 'hamgokgwan';
  Dialogue.show(STORY.hamgokgwan_pre, () => {
    Battle.start({
      player: GameState.heroData(), enemy: ROSTER.igak, maxRounds: 3,
      onEnd: () => {
        GameState.npcStatus['igak'] = 'fled';
        Battle.start({
          player: GameState.heroData(), enemy: ROSTER.gwaksa, maxRounds: 3,
          onEnd: () => {
            GameState.npcStatus['gwaksa'] = 'fled';
            GameState.addFame(30); // 메인퀘스트: 함곡관 평정
            updateHUD();
            Dialogue.show(STORY.hamgokgwan_post, goEnding);
          },
        });
      },
    });
  });
}

function goEnding() {
  showScreen('screen-ending');
  const list = GameState.recruited.map((id) => ROSTER[id].name).join(', ') || '없음';
  document.getElementById('ending-summary').innerHTML =
    `플레이 장수: ${ROSTER[GameState.mainHero].name}<br>` +
    `최종 날짜: ${GameState.dateLabel()}<br>` +
    `등용한 장수 (${GameState.recruited.length}명): ${list}<br>` +
    `자원 — 쌀 ${GameState.resources.rice} · 금 ${GameState.resources.gold} · 병사 ${GameState.resources.troop}`;
}

// 일기토 승리(패배가 아닌 모든 종료)시 명성 +10 — 등용/메인퀘스트 명성과 별개로 항상 적용
BattleEvents.on('battleEnd', (payload) => {
  if (payload.outcome !== 'lose') {
    GameState.addFame(10);
    updateHUD();
  }
});

// 전쟁맵에서의 일기토 승패는 군세 사기에 반영된다 (승 +10, 패 -10)
BattleEvents.on('battleEnd', (payload) => {
  if (stage !== 'warmap') return;
  if (payload.outcome === 'win') GameState.changeMorale(10);
  else if (payload.outcome === 'lose') GameState.changeMorale(-10);
});

// ---------------- 부팅 ----------------
document.getElementById('btn-start').onclick = () => showScreen('screen-select');

document.querySelectorAll('.hero-card').forEach((card) => {
  card.onclick = () => {
    GameState.reset(card.dataset.hero);
    goTakhyeonFree();
    Dialogue.show(STORY.intro);
  };
});

function learnRandomSkill(hero) {
  if (!hero.skills) hero.skills = [];
  if (hero.skills.length >= 4) return null;
  const available = Object.keys(SKILL_POOL).filter((id) => !hero.skills.includes(id));
  if (!available.length) return null;
  const pick = available[Math.floor(Math.random() * available.length)];
  hero.skills.push(pick);
  return SKILL_POOL[pick].name;
}

document.getElementById('btn-train').onclick = () => {
  if (!spend(2)) return;
  const hero = GameState.heroData();
  const gainedEv = 25 + Math.floor(Math.random() * 26); // 25~50
  GameState.trainingEv += gainedEv;
  const greatSession = gainedEv >= 40;
  if (greatSession) GameState.addFame(5);
  let msg = `${hero.name}이(가) 훈련에 매진했다.${greatSession ? ' 이번 훈련은 훌륭했다! (명성 +5)' : ''} (노력치 ${GameState.trainingEv}/100)`;

  while (GameState.trainingEv >= 100) {
    GameState.trainingEv -= 100;
    const keys = Object.keys(STAT_LABELS);
    const key = keys[Math.floor(Math.random() * keys.length)];
    hero.stats[key] = Math.min(100, hero.stats[key] + 1);
    msg = `훈련 끝에 ${hero.name}의 ${STAT_LABELS[key]}이(가) 1 올랐다! (${STAT_LABELS[key]} ${hero.stats[key]})`;

    if (COMBAT_STATS.includes(key)) {
      GameState.combatStatUps++;
      if (GameState.combatStatUps >= GameState.skillThreshold) {
        GameState.combatStatUps = 0;
        GameState.skillThreshold = 2 + Math.floor(Math.random() * 2);
        const learned = learnRandomSkill(hero);
        if (learned) msg += ` 그리고 새로운 필살공격 【${learned}】을(를) 익혔다!`;
      }
    }
  }

  toast(msg);
  updateHUD();
};

document.getElementById('btn-conscript').onclick = () => {
  if (GameState.resources.gold < 30) { toast('금이 부족합니다. (금 30 필요)'); return; }
  if (!spend(2)) return;
  const hero = GameState.heroData();
  const gained = 300 + hero.stats.cha * 2;
  GameState.resources.gold -= 30;
  GameState.resources.troop += gained;
  toast(`병사 ${gained}명을 징병했다. (금 30 소모, 병사 ${GameState.resources.troop})`);
  updateHUD();
};

function formatStatLine(stats) {
  return `공${stats.atk} 방${stats.def} 속${stats.spd} 지${stats.int} 매${stats.cha}`;
}

function renderRosterPanel() {
  const wrap = document.getElementById('roster-list');
  wrap.innerHTML = '';
  const entries = [
    { id: 'yubi', role: '군주', lord: true },
    { id: 'gwanwoo', role: '장수' },
    { id: 'jangbi', role: '장수' },
    ...GameState.recruited.map((id) => ({ id, role: '장수' })),
  ];
  entries.forEach(({ id, role, lord }) => {
    const rd = ROSTER[id];
    if (!rd) return;
    const div = document.createElement('div');
    div.className = 'roster-row' + (lord ? ' lord' : '');
    const statsLine = rd.stats
      ? `<div class="roster-stats">${formatStatLine(rd.stats)}</div>`
      : '';
    div.innerHTML = `<div class="roster-row-main"><span class="roster-role">${role}</span><span class="roster-name">${rd.name}</span></div>${statsLine}`;
    wrap.appendChild(div);
  });
}

function openRosterPanel() {
  renderRosterPanel();
  document.getElementById('roster-box').classList.remove('hidden');
  document.getElementById('roster-close').focus();
}

const ARMY_MIN_TROOP = 500;
const ARMY_MAX_TROOP = 10000;
const ARMY_GENERAL_BONUS_PCT = 0.10; // 부장 1명당 자신의 무력3스텟합 × 10%를 가산, 최대 3명
const ARMY_MAX_GENERALS = 3;

let armySelectedGenerals = [];
let armySteppers = {};

function makeArmyStepper(valueElId, min, maxGetter, step) {
  const el = document.getElementById(valueElId);
  return {
    step,
    get() { return Number(el.dataset.val || 0); },
    set(v) {
      v = clamp(Math.round(v / step) * step, min, maxGetter());
      el.dataset.val = v;
      el.textContent = v;
      updateArmyPower();
    },
  };
}

function renderArmyGenerals() {
  const wrap = document.getElementById('army-generals-list');
  wrap.innerHTML = '';
  const candidates = GameState.recruited.filter((id) => ROSTER[id] && !isScholarType(ROSTER[id]));
  if (!candidates.length) {
    wrap.innerHTML = '<div class="army-empty-hint">등용한 무력형 장수가 없습니다.</div>';
    return;
  }
  candidates.forEach((id) => {
    const rd = ROSTER[id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'army-general-chip' + (armySelectedGenerals.includes(id) ? ' selected' : '');
    btn.textContent = `${rd.name} (무력 ${muryeok3(rd)})`;
    btn.onclick = () => {
      const idx = armySelectedGenerals.indexOf(id);
      if (idx >= 0) {
        armySelectedGenerals.splice(idx, 1);
      } else {
        if (armySelectedGenerals.length >= ARMY_MAX_GENERALS) {
          toast(`부장은 최대 ${ARMY_MAX_GENERALS}명까지 선택할 수 있습니다.`);
          return;
        }
        armySelectedGenerals.push(id);
      }
      renderArmyGenerals();
      updateArmyPower();
    };
    wrap.appendChild(btn);
  });
}

function muryeok3(rd) { return rd.stats.atk + rd.stats.def + rd.stats.spd; }

const MURYEOK_GRADES = [[300, 'S'], [250, 'A'], [200, 'B'], [150, 'C']];
const JIRYEOK_GRADES = [[90, 'S'], [80, 'A'], [70, 'B'], [60, 'C']];

function gradeFor(value, thresholds) {
  for (const [min, grade] of thresholds) {
    if (value >= min) return grade;
  }
  return 'D';
}

// 사령관(또는 포획시 책사) 무력3스텟 + 부장(최대 3명) 무력3스텟×10%의 합 - 군세 전투 계산에도 재사용된다
function armyMuryeokValue(commanderRd, generalIds) {
  const base = muryeok3(commanderRd);
  const bonus = (generalIds || []).reduce((sum, id) => {
    const rd = ROSTER[id];
    return sum + (rd ? muryeok3(rd) * ARMY_GENERAL_BONUS_PCT : 0);
  }, 0);
  return Math.round(base + bonus);
}

function playerArmyMuryeok() {
  const hero = GameState.heroData();
  return armyMuryeokValue(hero, GameState.army ? GameState.army.generals : []);
}

function playerArmyGrade() { return gradeFor(playerArmyMuryeok(), MURYEOK_GRADES); }

function updateArmyPower() {
  const deputyId = document.getElementById('army-deputy').value;
  const deputy = deputyId ? ROSTER[deputyId] : null;
  const muryeok = armyMuryeokValue(GameState.heroData(), armySelectedGenerals);
  const jiryeok = deputy ? deputy.stats.int : 0;
  const el = document.getElementById('army-power');
  el.textContent = `군세 능력치 — 무력 ${gradeFor(muryeok, MURYEOK_GRADES)} · 지력 ${gradeFor(jiryeok, JIRYEOK_GRADES)}`;
  el.title = `무력 ${muryeok} · 지력 ${jiryeok}`;
}

function wireArmyStepperButtons() {
  document.querySelectorAll('#army-box .stepper-btn').forEach((btn) => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = '1';
    let holdTimeout = null;
    let interval = null;
    const fire = () => {
      const stepper = armySteppers[btn.dataset.target];
      if (!stepper) return;
      stepper.set(stepper.get() + Number(btn.dataset.dir) * stepper.step);
    };
    const start = (ev) => {
      ev.preventDefault();
      fire();
      holdTimeout = setTimeout(() => { interval = setInterval(fire, 100); }, 400);
    };
    const stop = () => { clearTimeout(holdTimeout); clearInterval(interval); };
    btn.addEventListener('mousedown', start);
    btn.addEventListener('touchstart', start, { passive: false });
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((ev) => btn.addEventListener(ev, stop));
  });
}

function openArmyBox(onConfirm) {
  const select = document.getElementById('army-deputy');
  select.innerHTML = '<option value="">없음</option>';
  GameState.recruited.forEach((id) => {
    const rd = ROSTER[id];
    if (!rd || !isScholarType(rd)) return;
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = rd.name;
    select.appendChild(opt);
  });
  select.onchange = updateArmyPower;

  armySelectedGenerals = [];
  renderArmyGenerals();

  const troopMax = Math.min(ARMY_MAX_TROOP, GameState.resources.troop);
  document.getElementById('army-troop-max').textContent = GameState.resources.troop;
  document.getElementById('army-rice-max').textContent = GameState.resources.rice;
  armySteppers = {
    'army-troop': makeArmyStepper('army-troop-value', 0, () => Math.min(ARMY_MAX_TROOP, GameState.resources.troop), 100),
    'army-rice': makeArmyStepper('army-rice-value', 0, () => GameState.resources.rice, 50),
  };
  armySteppers['army-troop'].set(troopMax);
  armySteppers['army-rice'].set(Math.min(200, GameState.resources.rice));
  wireArmyStepperButtons();
  document.getElementById('army-hint').textContent = '';
  updateArmyPower();

  document.getElementById('army-box').classList.remove('hidden');

  document.getElementById('army-close').onclick = () => {
    document.getElementById('army-box').classList.add('hidden');
  };

  document.getElementById('army-confirm').onclick = () => {
    const troop = armySteppers['army-troop'].get();
    const rice = armySteppers['army-rice'].get();
    if (troop < ARMY_MIN_TROOP) {
      document.getElementById('army-hint').textContent = `병사가 부족합니다. 최소 ${ARMY_MIN_TROOP}명이 필요합니다. (탁현/평원현에서 징병하기를 이용하세요)`;
      return;
    }
    const deputy = select.value || null;
    GameState.resources.troop -= troop;
    GameState.resources.rice -= rice;
    GameState.army = { deputy, generals: armySelectedGenerals.slice(), troop, rice };
    GameState.morale = 100; // 출정시 사기 초기화
    GameState.capturedCommanders = [];
    document.getElementById('army-box').classList.add('hidden');
    updateHUD();
    onConfirm();
  };
}

function closeRosterPanel() {
  document.getElementById('roster-box').classList.add('hidden');
}

document.getElementById('roster-close').onclick = closeRosterPanel;
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && !document.getElementById('roster-box').classList.contains('hidden')) {
    closeRosterPanel();
  }
});

document.querySelectorAll('#bottom-menu button').forEach((btn) => {
  btn.onclick = () => {
    if (btn.dataset.menu === 'generals') { openRosterPanel(); return; }
    toast('준비 중인 기능입니다.');
  };
});

document.getElementById('btn-nextmonth').onclick = () => {
  GameState.nextMonth();
  // 체력은 병사와 달리 매달 휴식하면서 회복된다 (병사수/군량처럼 전쟁 중 손실이 누적되지는 않음).
  // 같은 달 안에서 연달아 전투를 치를 때만 체력이 그대로 이어진다 - 휴식(다음달)을 거치면 항상 완전 회복.
  const inCampaign = stage === 'warmap';
  GameState.heroHp = null;
  if (inCampaign) GameState.ap = effectiveApMax();
  if (inCampaign && GameState.army) {
    GameState.army.rice = Math.max(0, GameState.army.rice - Math.ceil(GameState.army.troop / 100));
    if (GameState.army.rice <= 0) GameState.changeMorale(-1); // 군량 고갈시 매턴 사기 하락
  }
  const income = scholarGoldIncome();
  if (income > 0) GameState.addResource({ gold: income });
  updateHUD();
  if (checkDeadlines()) return;
  const aiBattle = inCampaign && MapView.runAiTurn(); // 적 군세의 턴: 사거리 안이면 공격, 아니면 접근
  if (aiBattle) return; // 전투 다이얼로그가 우선이므로 턴종료 토스트는 생략
  const incomeMsg = income > 0 ? ` (책사들의 수완으로 금 ${income} 획득)` : '';
  const hpMsg = inCampaign ? '체력과 행동력이 재보급되었다.' : '휴식을 취해 체력과 행동력이 모두 회복되었다.';
  toast(`${GameState.dateLabel()}이(가) 되었다. ${hpMsg}${incomeMsg}`);
};

document.getElementById('btn-restart').onclick = () => showScreen('screen-title');

// 모바일 터치 이동패드 (클릭=탭으로 동일하게 동작)
function guardedMove(dx, dy) {
  if (Dialogue.isActive()) return;
  MapView.tryMove(dx, dy);
}
document.getElementById('tp-up').onclick = () => guardedMove(0, -1);
document.getElementById('tp-down').onclick = () => guardedMove(0, 1);
document.getElementById('tp-left').onclick = () => guardedMove(-1, 0);
document.getElementById('tp-right').onclick = () => guardedMove(1, 0);
document.getElementById('tp-action').onclick = () => { if (!Dialogue.isActive()) MapView.interactFacing(); };
