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
  document.getElementById('hud-ap').textContent = `행동력 ${gs.ap}/${gs.apMax}`;
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
        toast('평원현으로 이동할 수 있습니다.');
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
      toast(`${rd.name}이(가) 등용되었습니다!`);
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
      toast(`${rd.name}이(가) 등용되었습니다! (성공률 ${Math.round(chance)}%)`);
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
              toast(`${rd.name}이(가) 등용되었습니다! (성공률 ${Math.round(chance)}%)`);
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
    toast(`${rd.name}이(가) 등용되었습니다! (성공률 ${Math.round(chance)}%)`);
  } else {
    GameState.npcStatus[id] = 'resolved';
    MapView.removeNpc(id);
    toast(`${rd.name}이(가) 결국 뜻을 굽히지 않고 떠났다. (실패, 성공률 ${Math.round(chance)}%)`);
  }
  updateHUD();
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

function onFreeBattleEnd(id, result, afterCb, persistHp) {
  const rd = ROSTER[id];
  if (persistHp) { GameState.heroHp = result.playerHp; updateHUD(); }
  if (result.outcome === 'win') {
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
    if (afterCb) afterCb();
  }
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
  showScreen('screen-explore');
  MapView.load('warmap', { onInteract: interactNPC });
  updateHUD();
  Dialogue.show(STORY.warmap_intro);
}

function checkWarmapClear() {
  const ids = ['hojin', 'songheon', 'wisok', 'yeopo'];
  const allDone = ids.every((id) => ['resolved', 'recruited', 'fled'].includes(GameState.npcStatus[id]));
  if (allDone) Dialogue.show(STORY.warmap_clear, goHamgokgwan);
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
  let msg = `${hero.name}이(가) 훈련에 매진했다.${gainedEv >= 40 ? ' 이번 훈련은 훌륭했다!' : ''} (노력치 ${GameState.trainingEv}/100)`;

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
const ARMY_GENERAL_BONUS_PCT = 0.10; // 부장 1명당 최대 +10% (자신 무력/100 만큼 반영), 최대 3명
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
    btn.textContent = `${rd.name} (무력 ${rd.stats.atk})`;
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

function updateArmyPower() {
  const hero = GameState.heroData();
  const deputyId = document.getElementById('army-deputy').value;
  const deputy = deputyId ? ROSTER[deputyId] : null;
  const baseMuryeok = hero.stats.atk + hero.stats.def + hero.stats.spd;
  const bonus = armySelectedGenerals.reduce((sum, id) => {
    const rd = ROSTER[id];
    return sum + (rd ? (rd.stats.atk / 100) * ARMY_GENERAL_BONUS_PCT : 0);
  }, 0);
  const muryeok = Math.round(baseMuryeok * (1 + bonus));
  const jiryeok = deputy ? deputy.stats.int : 0;
  document.getElementById('army-power').textContent = `군세 능력치 — 무력 ${muryeok} · 지력 ${jiryeok}`;
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
  GameState.heroHp = null;
  const income = scholarGoldIncome();
  if (income > 0) GameState.addResource({ gold: income });
  updateHUD();
  if (checkDeadlines()) return;
  const incomeMsg = income > 0 ? ` (책사들의 수완으로 금 ${income} 획득)` : '';
  toast(`${GameState.dateLabel()}이(가) 되었다. 휴식을 취해 체력과 행동력이 모두 회복되었다.${incomeMsg}`);
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
