let stage = 'title';
let toastTimer = null;

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
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function spend(n) {
  if (!GameState.spendAP(n)) { toast('행동력이 부족합니다. "다음 달로"를 눌러보세요.'); return false; }
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

function updateHUD() {
  const gs = GameState;
  document.getElementById('hud-date').textContent = gs.dateLabel();
  document.getElementById('hud-ap').textContent = `행동력 ${gs.ap}/${gs.apMax}`;
  document.getElementById('hud-res').textContent = `쌀 ${gs.resources.rice} · 금 ${gs.resources.gold} · 병사 ${gs.resources.troop}`;
  document.getElementById('hud-recruit').textContent = `등용 ${gs.recruited.length}명`;

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
    progressBtn.textContent = '사수관으로 출정';
    progressBtn.onclick = goSasugwan;
  } else {
    progressBtn.classList.add('hidden');
  }
}

// ---------------- NPC interaction ----------------
function interactNPC(id) {
  const rd = ROSTER[id];
  if (!rd) return;
  const st = GameState.npcStatus[id];
  if (st === 'recruited' || st === 'resolved' || st === 'dead' || st === 'fled') return;

  if (id === 'yubi') { handleYubi(); return; }

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
    Dialogue.show([{ speaker: rd.name, text: rd.intro }], () => {
      showChoice(`${rd.name}을(를) 등용하시겠습니까?`, [
        { label: '등용을 청한다 (행동력 3)', cb: () => attemptPersuade(id) },
        { label: '인사만 나눈다', cb: () => {} },
      ]);
    });
    return;
  }

  if (rd.kind === 'enemy') {
    startFreeBattle(id);
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

function attemptPersuade(id) {
  if (!spend(3)) return;
  const rd = ROSTER[id];
  const hero = GameState.heroData();
  const chance = clamp(50 + (hero.stats.cha - rd.stats.cha) * 0.6, 10, 95);
  const roll = Math.random() * 100;
  if (roll < chance) {
    GameState.recruit(id);
    MapView.removeNpc(id);
    toast(`${rd.name}이(가) 등용되었습니다! (성공률 ${Math.round(chance)}%)`);
  } else {
    toast(`${rd.name}이(가) 아직 마음을 정하지 못한 듯하다... (실패, 성공률 ${Math.round(chance)}%)`);
  }
  updateHUD();
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

function startFreeBattle(id, afterCb) {
  const rd = ROSTER[id];
  Dialogue.show([{ speaker: rd.name, text: `${rd.name}이(가) 앞을 막아섰다!` }], () => {
    Battle.start({
      player: GameState.heroData(),
      enemy: rd,
      onEnd: (result) => onFreeBattleEnd(id, result, afterCb),
    });
  });
}

function onFreeBattleEnd(id, result, afterCb) {
  const rd = ROSTER[id];
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

function goSasugwan() {
  stage = 'sasugwan';
  Dialogue.show(STORY.sasugwan_pre, () => {
    Battle.start({
      player: GameState.heroData(),
      enemy: ROSTER.hwaung,
      onEnd: (result) => {
        if (result.outcome === 'win') {
          GameState.npcStatus['hwaung'] = 'dead';
          Dialogue.show(STORY.sasugwan_post, () => {
            showChoice('전장 한쪽에서 동탁군의 또 다른 장수 호진이 병력을 수습하고 있다. 맞서시겠습니까?', [
              { label: '도전한다', cb: () => startFreeBattle('hojin', goHorogwan) },
              { label: '그냥 지나친다', cb: goHorogwan },
            ]);
          });
        } else {
          toast('화웅에게 밀렸다... 다시 도전하자!');
          goSasugwan();
        }
      },
    });
  });
}

function goHorogwan() {
  stage = 'horogwan';
  Dialogue.show(STORY.horogwan_pre, () => {
    Battle.start({
      player: GameState.heroData(),
      enemy: ROSTER.yeopo,
      maxRounds: 3,
      onEnd: () => {
        Dialogue.show(STORY.horogwan_assist1, () => {
          Dialogue.show(STORY.horogwan_assist2, () => {
            Dialogue.show(STORY.horogwan_post, () => {
              GameState.npcStatus['yeopo'] = 'fled';
              showChoice('여포의 부장 송헌과 위속이 남아 저항하고 있다. 소탕하시겠습니까?', [
                { label: '맞선다', cb: () => startFreeBattle('songheon', () => startFreeBattle('wisok', goHamgokgwan)) },
                { label: '그냥 넘어간다', cb: goHamgokgwan },
              ]);
            });
          });
        });
      },
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

document.getElementById('btn-train').onclick = () => {
  if (!spend(2)) return;
  const hero = GameState.heroData();
  hero.stats.atk = Math.min(100, hero.stats.atk + 1);
  toast(`훈련으로 ${hero.name}의 공격력이 소폭 올랐다. (공격 ${hero.stats.atk})`);
};

document.getElementById('btn-nextmonth').onclick = () => {
  GameState.nextMonth();
  toast(`${GameState.dateLabel()}이(가) 되었다. 행동력이 회복되었다.`);
  updateHUD();
};

document.getElementById('btn-restart').onclick = () => showScreen('screen-title');
