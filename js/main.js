// ---------------- 시작 전 그림 미리 불러오기 ----------------
// 지도 배경·삽화·인물 그림을 타이틀 화면이 보이기 전에 미리 받아둬서,
// 플레이 중간중간 그림이 하나씩 늦게 뜨는 것을 막는다.
(function preloadAssets() {
  const extraUrls = [
    'assets/illust/dowon_market.jpg', 'assets/illust/dowon_oath.jpg', 'assets/illust/pyeongwon_urgent.jpg',
    'assets/illust/anhee_dokwoo.jpg',
    'assets/illust/sasugwan_pledge.jpg', 'assets/illust/sasugwan_victory.jpg',
    'assets/illust/hogwan_yeopo_retreat.jpg',
    'assets/illust/worldmap.jpg',
    'assets/ui/portrait_gwanwoo.png',
    'assets/battle/duel_gwanwoo.png', 'assets/battle/duel_hwaung.png', 'assets/battle/duel_yeopo.png',
  ];
  // 평원/막사/호로관 배경은 각각 3MB대라, 타이틀 화면 뜨기 전에 다 같이 받으면
  // (특히 오늘 막사·호로관 배경이 추가된 뒤로) 시작이 눈에 띄게 느려진다.
  // 게임 초반에 바로 보이는 탁현만 미리 받고, 나머지는 실제로 그 지도에
  // 들어갈 때 FieldAssets가 알아서 그때 받아오게 둔다.
  const deferredFieldKeys = ['pyeongwon_city_overview', 'camp_overview', 'warmap_overview'];
  const fieldKeys = FieldAssets.keys().filter((k) => !deferredFieldKeys.includes(k));
  const total = fieldKeys.length + extraUrls.length;
  let done = 0;
  const screenEl = document.getElementById('preload-screen');
  const fillEl = document.getElementById('preload-bar-fill');
  const pctEl = document.getElementById('preload-percent');
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    screenEl.classList.add('hidden');
  }

  function tick() {
    done++;
    const pct = Math.min(100, Math.round((done / total) * 100));
    fillEl.style.width = pct + '%';
    pctEl.textContent = `불러오는 중… ${pct}%`;
    if (done >= total) finish();
  }

  if (!total) { finish(); return; }
  fieldKeys.forEach((key) => {
    const img = FieldAssets.get(key);
    if (!img || (img.complete && img.naturalWidth)) { tick(); return; }
    img.addEventListener('load', tick, { once: true });
    img.addEventListener('error', tick, { once: true });
  });
  extraUrls.forEach((src) => {
    const img = new Image();
    img.addEventListener('load', tick, { once: true });
    img.addEventListener('error', tick, { once: true });
    img.src = src;
  });
  // 느린 네트워크에서 일부 그림이 끝내 안 불러와져도 화면이 멈춰있지 않도록 안전장치를 둔다.
  setTimeout(finish, 15000);
})();

let stage = 'title';
let centerAlertTimer = null;
let pyeongwonCheckpoint = null; // 어양(구 평원현 지도) 도착 시점 GameState 스냅샷 (장순전 패배시 이 시점으로 복귀)
let coalitionDepartCheckpoint = null; // 반동탁연합 출정(군세 편성) 직전 GameState 스냅샷 (여포전 등 호로관 이후 패배시 이 시점으로 복귀)

const DEADLINES = { takhyeon: 186, pyeongwon: 188 };
const JANGSUN_TROOP_GOAL = 2000; // 유우가 요구하는 최소 모병 규모 (장순 3000명에 맞선 승산 확보용)
const MIN_PYEONGWON_STAY_MONTHS = 12; // 탁현 체류가 길어져 늦게 도착해도 평원현에서 최소 이만큼은 머물게 보장
function absMonth(year, month) { return year * 12 + month; } // 연/월을 단조증가하는 절대 개월수로 환산
// 평원현 마감 절대 개월수: 원래 기한(188년말)과, 실제 도착일+최소 체류기간 중 더 늦은 쪽을 사용한다.
function pyeongwonDeadlineAbsMonth() {
  const base = absMonth(DEADLINES.pyeongwon, 12) + 1;
  if (GameState.pyeongwonEnterAbsMonth == null) return base;
  return Math.max(base, GameState.pyeongwonEnterAbsMonth + MIN_PYEONGWON_STAY_MONTHS);
}
const STAT_LABELS = { atk: '공격', def: '방어', spd: '속도', int: '지력', cha: '매력' };
const COMBAT_STATS = ['atk', 'def', 'spd'];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// 구석의 작은 토스트는 모바일 화면에서 특히 잘 안 보인다는 피드백이 있어,
// 모든 안내 메시지를 화면 정중앙에 큼직하게 띄운다. toast()는 하위 호환을
// 위해 이름만 남겨두고 centerAlert()로 위임한다.
function centerAlert(msg) {
  const el = document.getElementById('center-alert');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(centerAlertTimer);
  centerAlertTimer = setTimeout(() => el.classList.add('hidden'), 2200);
}

// 메시지가 다 사라질 때까지 기다리지 않고, 클릭/터치하면 바로 닫을 수 있게 한다.
document.getElementById('center-alert').addEventListener('click', () => {
  clearTimeout(centerAlertTimer);
  document.getElementById('center-alert').classList.add('hidden');
});

function toast(msg) {
  centerAlert(msg);
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
  if (!GameState.spendAP(n)) { centerAlert('행동력이 부족합니다. "휴식"을 눌러보세요.'); return false; }
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
  pyeongwon: '유주 · 어양',
  camp: '반동탁연합 진영',
  warmap: '호로관 전선',
};

function getObjectives() {
  const gs = GameState;
  const list = [];
  if (stage === 'takhyeon_free') {
    const jeongwonjiDone = ['recruited', 'resolved'].includes(gs.npcStatus['jeongwonji']);
    const goseungDone = ['recruited', 'resolved'].includes(gs.npcStatus['goseung']);
    if (!jeongwonjiDone && !gs.flags.act1Briefed) list.push('유비를 찾아가자');
    else if (!jeongwonjiDone) list.push(`황건적 두목 정원지 처치하기 (${DEADLINES.takhyeon}년까지)`);
    else if (!gs.flags.goseungEvent) list.push('유비에게 보고하기');
    else if (!goseungDone) list.push('황건적 잔당 고승 처치하기');
    else if (!gs.flags.act1) list.push('유비에게 보고하기');

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

    if (gs.flags.act1) list.push('안희현으로 이동하기');
  } else if (stage === 'pyeongwon_free') {
    if (gs.flags.jangsunStarted && !gs.army && gs.npcStatus['jangsun'] !== 'resolved') {
      if (gs.resources.troop < JANGSUN_TROOP_GOAL) {
        list.push(`병사 ${JANGSUN_TROOP_GOAL}명 이상 모으기 (현재 ${gs.resources.troop}명)`);
      } else {
        list.push('막사에 가서 유비와 이야기하기');
      }
    } else if (gs.army && gs.npcStatus['jangsun'] === 'resolved') {
      list.push('막사로 돌아가 군세 해산하기');
    } else if (gs.army) {
      list.push('장순의 반란군 토벌하기');
    }
    if (gs.flags.act2) list.push(`반동탁연합 참전 준비하기 (${DEADLINES.pyeongwon}년까지)`);
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
  // 미니맵과 겹쳐 있던 별도 임무 트래커 패널을 없애고, 그 목록 전체를
  // 여기(좌상단 위치 배너) 한 곳에 모아서 보여준다.
  const objectives = getObjectives();
  document.getElementById('location-task').innerHTML = objectives.map((t) => `◆ ${t}`).join('<br>');
}

// 미니맵에 초록 점으로 짚어줄, 찾아가야 할 핵심 인물들. 각 지도의 npcs 목록에
// 실제로 등장해 있는(스토리 게이트를 통과한) 경우에만 표시된다.
const MINIMAP_QUEST_NPC_IDS = ['yubi', 'yuwoo', 'jeongwonji', 'jangsun'];

function renderMinimap() {
  const canvas = document.getElementById('minimap-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const mapId = MapView.currentMapId;
  document.getElementById('minimap-title').textContent = LOCATION_NAMES[mapId] ? LOCATION_NAMES[mapId].split(' ')[0] : (mapId || '');
  if (!mapId) return;
  const map = MAPS[mapId];
  const size = MapView.mapSize;
  const pos = MapView.playerPos;
  ctx.fillStyle = '#3a4a2f';
  ctx.fillRect(0, 0, w, h);

  if (map && map.tiles) {
    const tileW = w / Math.max(1, size.w);
    const tileH = h / Math.max(1, size.h);
    ctx.fillStyle = '#c0392b';
    for (let ty = 0; ty < map.tiles.length; ty++) {
      const row = map.tiles[ty];
      for (let tx = 0; tx < row.length; tx++) {
        if (row[tx] === 2 || row[tx] === 3 || row[tx] === 4) {
          ctx.fillRect(tx * tileW, ty * tileH, Math.ceil(tileW), Math.ceil(tileH));
        }
      }
    }
  }

  if (map && map.npcs) {
    const liveIds = new Set(MapView.liveNpcIds);
    ctx.fillStyle = '#3fcf5a';
    for (const id of MINIMAP_QUEST_NPC_IDS) {
      if (!liveIds.has(id)) continue;
      const npc = map.npcs.find((n) => n.id === id);
      if (!npc) continue;
      const nx = (npc.x / Math.max(1, size.w)) * w;
      const ny = (npc.y / Math.max(1, size.h)) * h;
      ctx.beginPath();
      ctx.arc(nx, ny, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

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

  // 유우가 요구한 최소 병력을 채우면, 딱 한 번 유비와 상의하라고 알려준다.
  if (stage === 'pyeongwon_free' && gs.flags.jangsunStarted && !gs.army &&
      gs.npcStatus['jangsun'] !== 'resolved' && !gs.flags.jangsunTroopHinted &&
      gs.resources.troop >= JANGSUN_TROOP_GOAL) {
    gs.flags.jangsunTroopHinted = true;
    centerAlert('반군의 기세가 날로 높아지고 있소. 하루빨리 유비 장군과 상의하여 토벌토록 하시오!');
  }

  const armyEl = document.getElementById('hud-army');
  if (gs.army) {
    const deputy = gs.army.deputy ? ROSTER[gs.army.deputy] : null;
    const jiryeokGrade = gradeFor(deputy ? deputy.stats.int : 0, JIRYEOK_GRADES);
    armyEl.textContent = `아군 군세 — 병력 ${gs.army.troop} · 무력 ${playerArmyGrade()} · 지력 ${jiryeokGrade}`;
    armyEl.classList.remove('hidden');
  } else {
    armyEl.classList.add('hidden');
  }

  renderLocationBanner();
  renderMinimap();
  renderPlayerPanel();

  const progressBtn = document.getElementById('btn-progress');
  if (stage === 'takhyeon_free') {
    if (gs.flags.act1) {
      progressBtn.classList.remove('hidden');
      progressBtn.textContent = '안희현으로 이동';
      progressBtn.onclick = goPyeongwonFree;
    } else {
      progressBtn.classList.add('hidden');
    }
  } else if (stage === 'pyeongwon_free') {
    if (gs.flags.act2) {
      progressBtn.classList.remove('hidden');
      progressBtn.textContent = '반동탁연합 참전 준비';
      progressBtn.onclick = () => { captureCoalitionDepartCheckpoint(); openArmyBox(goCoalitionCamp); };
    } else {
      progressBtn.classList.add('hidden');
    }
  } else {
    progressBtn.classList.add('hidden');
  }
}

// ---------------- NPC interaction ----------------
function interactNPC(id, context) {
  const rd = ROSTER[id];
  if (!rd) return;
  const st = GameState.npcStatus[id];
  if (st === 'recruited' && (stage === 'takhyeon_free' || stage === 'pyeongwon_free')) { interactRecruitedGeneral(id); return; }
  if (st === 'recruited' || st === 'resolved' || st === 'dead' || st === 'fled') return;

  if (id === 'yubi' && stage === 'camp') {
    Dialogue.show([{ speaker: '유비', text: '아우들, 반동탁연합에 합류했으니 이제부터가 진짜 시작일세. 마음 단단히 먹게.' }]);
    return;
  }
  if (id === 'yubi') { handleYubi(); return; }

  if (id === 'songyeon' && stage === 'camp') {
    GameState.npcStatus['songyeon'] = 'resolved';
    startSongyeonBattleScene();
    return;
  }

  if (id === 'yuwoo') { handleYuwoo(); return; }

  if (id === 'jangsun') { openWarCommandMenu('jangsun'); return; }

  if (rd.kind === 'flavor') {
    // 조조·원소는 진영(사수관 전투 전)과 호로관 전선(화웅을 이미 처치한 뒤) 두 맵에
    // 걸쳐 등장하는데, intro 한 줄만으로는 호로관 시점에도 사수관 이전 상황을
    // 말하는 것처럼 어색하게 읽힌다. 호로관에서는 그 이후를 반영한 대사로 바꾼다.
    const warmapIntro = {
      jojo: '관우, 그날 화웅을 상대하던 그대의 모습이 아직도 눈에 선하오. 과연 내 사람 보는 눈이 틀리지 않았소.',
      wonso: '한뜻으로 모인 제후들이라 했건만, 이제 보니 저마다 딴생각을 품은 듯하오. 동상이몽이라더니, 딱 그 짝이군.',
    };
    // 공손찬은 어양(장순의 난)에서는 아직 반동탁연합 결성 전이라, 그 시점 대사를 따로 둔다.
    const pyeongwonIntro = {
      gongsonchan: '백규요. 장순 그 역적이 이 근방에서 날뛴다기에, 옛 동문 유현덕을 도우러 병력을 좀 보탰소.',
    };
    const text = (stage === 'warmap' && warmapIntro[id]) || (stage === 'pyeongwon_free' && pyeongwonIntro[id]) || rd.intro;
    Dialogue.show([{ speaker: rd.name, text }]);
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

// 유비는 세력 막사에 고정 배치되어 개인훈련(막사)의 창구 역할도 겸한다 - 필살공격은 이 경로로만 습득 가능.
function offerBarracksTraining(greetingText) {
  showChoice(`유비: "${greetingText}"`, [
    { label: '훈련하기 (AP2)', cb: () => trainWithHero() },
    { label: '그냥 안부만 묻는다', cb: () => {} },
  ]);
}

function handleYubi() {
  if (stage === 'takhyeon_free') {
    const jeongwonjiDone = ['recruited', 'resolved'].includes(GameState.npcStatus['jeongwonji']);
    const goseungDone = ['recruited', 'resolved'].includes(GameState.npcStatus['goseung']);
    if (!jeongwonjiDone) {
      if (!GameState.flags.act1Briefed) {
        GameState.flags.act1Briefed = true;
        Dialogue.show(STORY.act1_briefing, () => updateHUD());
      } else {
        offerBarracksTraining('황건적 두목 정원지가 아직 마을 근처를 떠돌고 있다 하오. 먼저 처리하고 오시겠소?');
      }
    } else if (!GameState.flags.goseungEvent) {
      Dialogue.show(STORY.act1_report, () => {
        GameState.addFame(30); // 메인퀘스트 완료
        GameState.addFame(50); // 탁현 내 명성 확산
        GameState.addResource({ troop: 500 }); // 명성을 듣고 몰려온 장정들의 귀순
        toast('명성 +80, 병사 +500');
        updateHUD();
        Dialogue.show(STORY.goseung_incident, () => {
          GameState.flags.goseungEvent = true;
          MapView.addNpc('goseung');
        });
      });
    } else if (!goseungDone) {
      offerBarracksTraining('황건적 잔당 고승이 아직 시장 근처를 떠돌고 있다 하오. 먼저 처리하고 오시겠소?');
    } else if (!GameState.flags.act1) {
      Dialogue.show(STORY.act1_appointment, () => {
        GameState.flags.act1 = true;
        GameState.addFame(60); // 안희현위 제수 공적
        toast('안희현위에 제수되었다. 안희현으로 이동할 수 있습니다. (명성 +60)');
        updateHUD();
      });
    } else {
      offerBarracksTraining('아우들, 안희로 떠날 준비가 되었소.');
    }
  } else if (stage === 'pyeongwon_free') {
    if (GameState.flags.jangsunStarted && !GameState.army && GameState.npcStatus['jangsun'] !== 'resolved') {
      Dialogue.show(STORY.jangsun_yubi_join, () => { openArmyBox(startJangsunCampaign); });
    } else if (GameState.army && GameState.npcStatus['jangsun'] === 'resolved') {
      showChoice('유비: "수고했네, 아우! 이제 군세를 물리세."', [
        { label: '군세 해산', cb: () => disbandJangsunArmy() },
      ]);
    } else if (GameState.army) {
      Dialogue.show([{ speaker: '유비', text: '아직 장순의 반란군이 남아있네. 부디 몸조심하게.' }]);
    } else {
      offerBarracksTraining('아우, 무슨 일인가?');
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
      stationRecruitOrRemove(id);
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
      stationRecruitOrRemove(id);
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
              stationRecruitOrRemove(id);
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
    stationRecruitOrRemove(id);
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
// 병사가 남아있는 한 최소 1명의 피해는 발생한다 - 그렇지 않으면 병력이 적을 때 매턴 반올림으로
// 피해가 0이 되어 전투가 영원히 끝나지 않는 경우가 생긴다.
function armyAttackDamage(attackerTroops, attackerGrade, attackerMorale, defenderOnGate) {
  if (attackerTroops <= 0) return 0;
  const mult = 1 + GRADE_ATTACK_MOD[attackerGrade] + (attackerMorale - 100) / 100 - (defenderOnGate ? 0.05 : 0);
  return Math.max(1, Math.round(attackerTroops * 0.10 * mult));
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
  // 라운드 상한에 도달했는데도 양쪽 다 병력이 남아있다면(이론상 거의 없지만) 남은 병력 비율로 판정한다 -
  // 무조건 적이 이기는 것으로 처리하면 대등하거나 우세한 전투도 항상 패배로 나오는 버그가 된다.
  const winner = pT <= 0 && eT <= 0 ? (player.troops >= enemy.troops ? 'player' : 'enemy')
    : pT <= 0 ? 'enemy' : eT <= 0 ? 'player' : (pT >= eT ? 'player' : 'enemy');
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
  if (id === 'jangsun') { // 장순은 절대 일기토에 응하지 않는다 - 반드시 군세전투로 넘어간다
    Dialogue.show([{ speaker: rd.name, text: '흥, 필부의 결투 따위로 대세를 바꿀 성싶으냐! 전군으로 붙어보자!' }], () => {
      toast('장순이 일기토를 거절했다.');
      openWarCommandMenu(id);
    });
    return;
  }
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
  rd.troop = result.enemyTroopsLeft; // 적 군세 표기가 실시간으로 갱신되도록 손실을 그대로 반영
  updateHUD();
  MapView.render();
  if (id === 'jangsun') { resolveJangsunBattle(result); return; }
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
    if (rd.forced === 'escape') {
      GameState.npcStatus[id] = 'fled';
      MapView.removeNpc(id);
      Dialogue.show([{ speaker: '내레이션', text: `${rd.name}이(가) 승산이 없다고 보았는지 군세를 버리고 달아났다.` }], () => {
        toast(`${rd.name}이(가) 달아났다.`);
        if (afterCb) afterCb();
      });
      return;
    }
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
    const jeongwonjiDone = ['recruited', 'resolved'].includes(gs.npcStatus['jeongwonji']);
    if (!jeongwonjiDone) {
      gs.npcStatus['jeongwonji'] = 'resolved';
      MapView.removeNpc('jeongwonji');
    }
    if (gs.flags.goseungEvent) {
      const goseungDone = ['recruited', 'resolved'].includes(gs.npcStatus['goseung']);
      if (!goseungDone) {
        gs.npcStatus['goseung'] = 'resolved';
        MapView.removeNpc('goseung');
      }
    }
    gs.flags.act1 = true;
    gs.addFame(30); // 메인퀘스트 완료 (관직 제수 서사는 생략되었으므로 그 명성은 제외)
    Dialogue.show(STORY.act1_forced, () => { goPyeongwonFree(); });
    return true;
  }
  if (stage === 'pyeongwon_free' && absMonth(gs.year, gs.month) > pyeongwonDeadlineAbsMonth()) {
    gs.flags.act2 = true;
    Dialogue.show(STORY.act2_forced, () => { captureCoalitionDepartCheckpoint(); openArmyBox(goCoalitionCamp); });
    return true;
  }
  return false;
}

function onApBlocked() {
  centerAlert('행동력이 부족하다. 휴식하고 다음달에 다시 하자.');
}

function goTakhyeonFree() {
  stage = 'takhyeon_free';
  showScreen('screen-explore');
  MapView.load('takhyeon', {
    onInteract: interactNPC,
    spawnDeadlineAbsMonth: absMonth(DEADLINES.takhyeon, 12) + 1,
    onAmbientInteract: runAmbientEvent,
    onApSpent: updateHUD,
    onApBlocked,
    onStep: renderMinimap,
  });
  updateHUD();
}

function goPyeongwonFree() {
  stage = 'pyeongwon_free';
  showScreen('screen-explore');
  if (GameState.pyeongwonEnterAbsMonth == null) GameState.pyeongwonEnterAbsMonth = absMonth(GameState.year, GameState.month);
  if (!pyeongwonCheckpoint) pyeongwonCheckpoint = JSON.parse(JSON.stringify(GameState));
  MapView.load('pyeongwon', {
    onInteract: interactNPC,
    spawnDeadlineAbsMonth: pyeongwonDeadlineAbsMonth(),
    onApSpent: updateHUD,
    onApBlocked,
    onAmbientInteract: runAmbientEvent,
    onStep: renderMinimap,
  });
  updateHUD();
  if (!GameState.flags.dokwooEvent) {
    GameState.flags.dokwooEvent = true;
    Dialogue.show(STORY.act1_dokwoo, () => centerAlert('관청 근처 유우를 찾아가자.'));
  }
}

// 반동탁연합 출정(군세 편성) 직전 시점의 GameState를 남겨둔다 - 진행 버튼과
// 마감일 강제 이벤트, 두 출정 경로 모두에서 army-box를 열기 직전에 호출한다.
function captureCoalitionDepartCheckpoint() {
  coalitionDepartCheckpoint = JSON.parse(JSON.stringify(GameState));
}

// 장순전 패배(아직 반동탁연합 합류 전)와 여포전 등 호로관 이후 패배(합류해 출정한
// 이후) 양쪽에서 호출된다. 합류 이후 패배라면 너무 가혹하다는 피드백을 반영해
// "어양 도착 시점"이 아니라 "출정 직전" 스냅샷으로 되돌린다 - 장순의 난 진압과
// 반동탁연합 합류 준비(등용/자원/친밀도 등)는 그대로 유지된다.
function restoreToPyeongwonCheckpoint() {
  const hadAct2 = GameState.flags.act2;
  if (hadAct2 && coalitionDepartCheckpoint) {
    const snap = JSON.parse(JSON.stringify(coalitionDepartCheckpoint));
    Object.keys(snap).forEach((k) => { GameState[k] = snap[k]; });
    MAPS.pyeongwon.apMovement = false;
    goPyeongwonFree();
    return;
  }
  if (!pyeongwonCheckpoint) { location.reload(); return; }
  // 스냅샷 자체는 항상 반동탁연합 합류 이전 시점이라 act2 플래그가 꺼진 상태인데,
  // 패배 시점에 이미 켜져 있었다면(=coalitionDepartCheckpoint가 없는 예외적인 경우)
  // 복원 후에도 유지해 연출을 다시 보여주지 않는다. 장순전 패배는 그대로 둔다.
  const hadDokwoo = GameState.flags.dokwooEvent;
  const snap = JSON.parse(JSON.stringify(pyeongwonCheckpoint));
  Object.keys(snap).forEach((k) => { GameState[k] = snap[k]; });
  if (hadDokwoo) GameState.flags.dokwooEvent = true;
  if (hadAct2) GameState.flags.act2 = true;
  MAPS.pyeongwon.apMovement = false; // 장순의 난 출정 중 패배했다면 군세 이동모드도 함께 초기화
  goPyeongwonFree();
}

function goCoalitionCamp() {
  stage = 'camp';
  showScreen('screen-explore');
  MapView.load('camp', {
    onInteract: interactNPC,
    onApSpent: updateHUD,
    onApBlocked,
    onStep: renderMinimap,
  });
  updateHUD();
  Dialogue.show(STORY.camp_arrive);
}

function startSongyeonBattleScene() {
  Dialogue.show(STORY.camp_songgyeon_battle, () => {
    Dialogue.show(STORY.camp_gwanwoo_volunteer, goSasugwan);
  });
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
    onApBlocked,
    onStep: renderMinimap,
  });
  updateHUD();
  Dialogue.show(STORY.warmap_intro);
}

function checkWarmapClear() {
  const ids = ['hojin', 'jangje', 'beonjo', 'yeopo'];
  const allDone = ids.every((id) => ['resolved', 'recruited', 'fled', 'captured'].includes(GameState.npcStatus[id]));
  if (allDone) {
    GameState.addFame(30); // 메인퀘스트: 호로관 평정
    updateHUD();
    offerCapturedRecruits(() => Dialogue.show(STORY.warmap_clear, goHamgokgwan));
  }
}

// ---------------- 유주 어양 : 장순의 난 (군세전투 튜토리얼) ----------------
// 유우의 천거 -> 유비 막사에서 군세 편성(관우군) -> 유비군이 먼저 출발해 패퇴 ->
// 관우군이 행동력을 소모해 뒤따라가 [일기토(무조건 거절)]/[전투]로 격파 ->
// 막사로 복귀해 군세 해산 -> 공손찬이 죄를 사면하고 평원현령으로 천거(메시지) ->
// 곧바로 반동탁연합 소집 소식. 군세로 전환된 동안에는 (장수 혼자 돌아다닐 때와
// 달리) 한 칸 이동할 때마다 행동력을 소모한다.
function handleYuwoo() {
  if (!GameState.flags.jangsunStarted) {
    Dialogue.show(STORY.jangsun_call, () => {
      GameState.flags.jangsunStarted = true;
      updateHUD();
    });
  } else if (GameState.npcStatus['jangsun'] === 'resolved') {
    Dialogue.show([{ speaker: '유우', text: '그대 덕분에 이 땅에 다시 평화가 찾아왔네. 참으로 고맙네.' }]);
  } else if (!GameState.army) {
    Dialogue.show([{ speaker: '유우', text: '어서 막사로 가서 유비 공과 상의하시게.' }]);
  } else {
    Dialogue.show([{ speaker: '유우', text: '장순의 반란군이 아직 근방에 있다 하네. 부디 조심하시게.' }]);
  }
}

function startJangsunCampaign() {
  Dialogue.show(STORY.jangsun_yubi_depart, () => {
    MAPS.pyeongwon.apMovement = true; // 군세로 전환되면 이동에 행동력을 소모한다
    GameState.ap = effectiveApMax();
    GameState.flags.jangsunAppeared = true;
    MapView.addNpc('jangsun');
    updateHUD();
    toast('유비군이 먼저 앞서나갔다. 서둘러 뒤따르자.');
    // 안내 메시지가 화면에 떠 있는 동안(약 2.2초)에는 플레이어가 먼저 움직여버릴 수
    // 있어, 메시지가 꺼지기 직전에 유비가 남쪽으로 떠나는 모습을 보여준다. 그동안
    // 플레이어 이동은 잠가, 유비가 앞서 나가는 장면에 자연히 시선이 가게 한다.
    MapView.lockMovement(true);
    setTimeout(() => {
      animateYubiDeparture(() => MapView.lockMovement(false));
    }, 1500);
  });
}

// 유비가 선봉대를 이끌고 먼저 출발하는 모습을 보여준 뒤(남쪽 출정로 방향으로
// 최대 8칸, 지도 끝을 넘지 않는 선에서 이동) 막사에서 사라진다 - 다음 턴에
// 유비군 패퇴 소식이 오는 것과 맞물려, "유비가 먼저 갔다"는 대사만 있고 정작
// 화면에는 그대로 서 있는 어색함을 없앤다. 관우가 장순을 처치하면 다시
// 이 자리(원래 좌표)로 불러온다.
function animateYubiDeparture(onDone) {
  const n = MAPS.pyeongwon.npcs.find((npc) => npc.id === 'yubi');
  if (!n) { if (onDone) onDone(); return; }
  const homeX = n.x, homeY = n.y;
  const steps = Math.max(1, Math.min(8, MAPS.pyeongwon.height - 1 - homeY));
  let step = 0;
  const tick = () => {
    step++;
    n.y = homeY + step; // 남쪽(출정로) 방향으로 이동
    MapView.render();
    if (step < steps) {
      setTimeout(tick, 150);
    } else {
      MapView.removeNpc('yubi');
      n.x = homeX; n.y = homeY; // 나중에 재등장할 때는 원래 막사 자리로
      if (onDone) onDone();
    }
  };
  setTimeout(tick, 150);
}

function disbandJangsunArmy() {
  GameState.addResource({ troop: GameState.army.troop, rice: GameState.army.rice });
  GameState.army = null;
  MAPS.pyeongwon.apMovement = false;
  updateHUD();
  Dialogue.show(STORY.jangsun_victory, () => {
    GameState.addFame(60); // 메인퀘스트: 장순의 난 평정
    toast('명성 +60');
    updateHUD();
    Dialogue.show(STORY.jangsun_aftermath, () => {
      Dialogue.show(STORY.act2_call, () => {
        GameState.flags.act2 = true;
        updateHUD();
      });
    });
  });
}

function resolveJangsunBattle(result) {
  if (result.winner === 'player') {
    Dialogue.show([{ speaker: '내레이션', text: `치열한 접전 끝에 장순의 반란군을 격파했다! (아군 병력 ${result.playerTroopsLeft}명)` }], () => {
      GameState.npcStatus['jangsun'] = 'resolved';
      MapView.removeNpc('jangsun');
      MapView.addNpc('yubi'); // 반란이 진압되었으니 막사로 돌아온 유비를 다시 보여준다
      toast('막사로 돌아가 유비에게 보고하고 군세를 해산하자.');
    });
  } else {
    Dialogue.show([{ speaker: '내레이션', text: `아군이 장순의 반란군에 크게 밀려 무너졌다. (아군 병력 ${result.playerTroopsLeft}명 남음)` }], () => {
      showChoice('아직 힘이 부족한 것 같다. 어떻게 할까?', [
        { label: '처음부터 다시 시작', cb: () => showScreen('screen-title') },
        { label: '어양에서 다시 시작', cb: () => restoreToPyeongwonCheckpoint() },
      ]);
    });
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
                  Dialogue.show(STORY.warmap_yeopo_defeat, () => {
                    showChoice(`${GameState.heroData().name}이(가) 여포 저지에 실패했다. 어떻게 할까?`, [
                      { label: '처음부터 다시 시작', cb: () => showScreen('screen-title') },
                      { label: '어양에서 다시 시작', cb: () => restoreToPyeongwonCheckpoint() },
                    ]);
                  });
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
    // 여포전과는 시간 간격이 있는 별개의 전투이므로 체력을 완전히 회복한 채 시작한다.
    // 이각→곽사는 곧바로 이어지는 전투라 기존처럼 체력을 그대로 넘긴다.
    GameState.heroHp = null;
    updateHUD();
    Battle.start({
      player: GameState.heroData(), enemy: ROSTER.igak, maxRounds: 3,
      startHp: heroCurrentHp(),
      onEnd: (result) => {
        GameState.heroHp = result.playerHp; // 이각전에서 닳은 체력을 곽사전까지 그대로 이어간다
        updateHUD();
        GameState.npcStatus['igak'] = 'fled';
        Dialogue.show(STORY.hamgokgwan_igak_result, () => {
          Battle.start({
            player: GameState.heroData(), enemy: ROSTER.gwaksa, maxRounds: 3,
            startHp: heroCurrentHp(),
            onEnd: (result2) => {
              GameState.heroHp = result2.playerHp;
              GameState.npcStatus['gwaksa'] = 'fled';
              GameState.addFame(30); // 메인퀘스트: 함곡관 평정
              updateHUD();
              Dialogue.show(STORY.hamgokgwan_post, goEnding);
            },
          });
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
// 인트로(타이틀) -> 챕터 고르기 -> 당시 세력 설명 -> 장수 고르기 순서로 진행한다.
document.getElementById('btn-start').onclick = () => showScreen('screen-chapter');

document.getElementById('chapter-card-1').onclick = () => showScreen('screen-factions');
document.querySelectorAll('#screen-chapter .pick-card[data-ready="false"]').forEach((btn) => {
  btn.onclick = () => toast('준비 중인 챕터입니다.');
});

document.getElementById('btn-faction-back').onclick = () => showScreen('screen-chapter');
document.getElementById('btn-faction-next').onclick = () => showScreen('screen-select');

document.querySelectorAll('.hero-card').forEach((card) => {
  if (card.dataset.ready === 'false') {
    card.onclick = () => toast('준비 중인 장수입니다.');
    return;
  }
  card.onclick = () => {
    GameState.reset(card.dataset.hero);
    MAPS.pyeongwon.apMovement = false; // 이전 회차의 장순의 난 군세 이동모드가 남아있지 않도록 초기화
    goTakhyeonFree();
    Dialogue.show(STORY.intro, () => centerAlert('유비를 찾아가자.'));
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

// ---- 개인훈련 (세력 막사, 유비) - 필살공격은 오직 이 경로로만 습득할 수 있다 ----
function trainWithHero() {
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
}

// ---- 등용된 무력형 장수와 함께하는 훈련 - 노력치/스탯은 오르지만 필살공격 습득에는 관여하지 않는다 ----
function trainWithGeneral(id) {
  const rd = ROSTER[id];
  if (!spend(2)) return;
  const hero = GameState.heroData();
  const gainedEv = 25 + Math.floor(Math.random() * 26);
  GameState.trainingEv += gainedEv;
  let msg = `${rd.name}과(와) 함께 훈련했다. (노력치 ${GameState.trainingEv}/100)`;

  while (GameState.trainingEv >= 100) {
    GameState.trainingEv -= 100;
    const keys = Object.keys(STAT_LABELS);
    const key = keys[Math.floor(Math.random() * keys.length)];
    hero.stats[key] = Math.min(100, hero.stats[key] + 1);
    msg = `${rd.name}과(와)의 훈련 끝에 ${hero.name}의 ${STAT_LABELS[key]}이(가) 1 올랐다! (${STAT_LABELS[key]} ${hero.stats[key]})`;
  }

  Dialogue.show([{ speaker: rd.name, text: '자, 한 수 배워봅시다!' }], () => {
    toast(msg);
    updateHUD();
  });
}

// ---- 등용된 지력형 장수를 통한 모병 - 장수 본인의 매력에 따라 모병량이 달라진다 ----
function conscriptViaGeneral(id) {
  const rd = ROSTER[id];
  if (GameState.resources.gold < 30) { toast('금이 부족합니다. (금 30 필요)'); return; }
  if (!spend(2)) return;
  const gained = 300 + rd.stats.cha * 2;
  GameState.resources.gold -= 30;
  GameState.resources.troop += gained;
  Dialogue.show([{ speaker: rd.name, text: '우리 세력의 금으로 병사를 모아보겠습니다.' }], () => {
    toast(`${rd.name}이(가) 병사 ${gained}명을 모병했다. (금 30 소모, 병사 ${GameState.resources.troop})`);
    updateHUD();
  });
}

// ---- 등용된 장수와의 상시 상호작용 (등용 지역에 남아 훈련/모병을 돕는다) ----
function interactRecruitedGeneral(id) {
  const rd = ROSTER[id];
  if (isScholarType(rd)) {
    showChoice(`${rd.name}: "무슨 일로 오셨습니까?" (${rd.name} 매력 ${rd.stats.cha})`, [
      { label: '모병을 부탁한다 (AP2, 금30)', cb: () => conscriptViaGeneral(id) },
      { label: '그냥 안부만 묻는다', cb: () => Dialogue.show([{ speaker: rd.name, text: '언제든 불러주십시오.' }]) },
    ]);
  } else {
    showChoice(`${rd.name}: "무슨 일로 오셨습니까?"`, [
      { label: '함께 훈련한다 (AP2)', cb: () => trainWithGeneral(id) },
      { label: '그냥 안부만 묻는다', cb: () => Dialogue.show([{ speaker: rd.name, text: '언제든 불러주십시오.' }]) },
    ]);
  }
}

// 등용 완료 시 호출 - 마을(탁현/평원)에서는 그 자리에 남아 훈련/모병역을 맡고, 그 외(전장 등)에서는 기존처럼 퇴장한다.
function stationRecruitOrRemove(id) {
  if (stage === 'takhyeon_free' || stage === 'pyeongwon_free') { MapView.render(); return; }
  MapView.removeNpc(id);
}

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
    ...GameState.recruited.map((id) => ({ id, role: null })),
  ];
  entries.forEach(({ id, role, lord }) => {
    const rd = ROSTER[id];
    if (!rd) return;
    const scholar = !lord && (role === '책사' || (role == null && isScholarType(rd)));
    const label = role || (scholar ? '책사' : '장수');
    const div = document.createElement('div');
    div.className = 'roster-row' + (lord ? ' lord' : '');
    const statsLine = rd.stats
      ? `<div class="roster-stats">${formatStatLine(rd.stats)}</div>`
      : '';
    div.innerHTML = `<div class="roster-row-main"><span class="roster-role${scholar ? ' scholar' : ''}">${label}</span><span class="roster-name">${rd.name}</span></div>${statsLine}`;
    wrap.appendChild(div);
  });
}

// ---- 가방(인벤토리) ----
const BAG_SLOTS = 10;
// TODO: 실제 청룡언월도 아이콘 이미지를 받으면 icon을 이모지 대신 <img> 경로로 교체한다.
const BAG_ITEMS = [
  { name: '청룡언월도', icon: '🗡️', desc: '관우의 애병(愛兵).' },
];

function renderBagPanel() {
  const grid = document.getElementById('bag-grid');
  grid.innerHTML = '';
  for (let i = 0; i < BAG_SLOTS; i++) {
    const item = BAG_ITEMS[i];
    const slot = document.createElement('div');
    slot.className = 'bag-slot' + (item ? ' filled' : '');
    if (item) {
      slot.innerHTML = `<span>${item.icon}</span><span class="bag-slot-name">${item.name}</span>`;
      slot.onclick = () => toast(`${item.name} — ${item.desc}`);
    }
    grid.appendChild(slot);
  }
}

function openBagBox() {
  renderBagPanel();
  document.getElementById('bag-box').classList.remove('hidden');
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
    opt.textContent = `${rd.name} (지력 ${rd.stats.int})`;
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
      document.getElementById('army-hint').textContent = `병사가 부족합니다. 최소 ${ARMY_MIN_TROOP}명이 필요합니다. (탁현/어양에서 징병하기를 이용하세요)`;
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

// ---------------- 저장/불러오기 ----------------
// 마을/진영을 자유롭게 돌아다니는 지도 화면에서만 저장할 수 있다 - 전투나
// 대사, 장순의 난 행군(군세 이동모드) 중에는 되돌릴 상태가 애매해 제외한다.
const SAVE_KEY = 'samgukji_saves_v1';
const SAVE_SLOT_COUNT = 10;
const SAVE_RESUMABLE_STAGES = ['takhyeon_free', 'pyeongwon_free', 'camp', 'warmap'];
const STAGE_MAP_ID = { takhyeon_free: 'takhyeon', pyeongwon_free: 'pyeongwon', camp: 'camp', warmap: 'warmap' };

function loadSaveSlots() {
  try {
    const arr = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]');
    const slots = new Array(SAVE_SLOT_COUNT).fill(null);
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) if (arr[i]) slots[i] = arr[i];
    return slots;
  } catch (e) {
    return new Array(SAVE_SLOT_COUNT).fill(null);
  }
}

function writeSaveSlots(slots) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(slots));
    return true;
  } catch (e) {
    toast('저장에 실패했습니다 (브라우저 저장공간 문제일 수 있어요).');
    return false;
  }
}

function canSaveNow() {
  if (!SAVE_RESUMABLE_STAGES.includes(stage)) return false;
  if (!document.getElementById('screen-explore').classList.contains('active')) return false;
  if (Dialogue.isActive()) return false;
  // 일기토 화면은 #screen-explore 위에 별도로 떠 있는 오버레이라 화면 전환
  // 시스템(showScreen)을 거치지 않는다 - 전투 중인지는 직접 확인해야 한다.
  if (!document.getElementById('battle-screen').classList.contains('hidden')) return false;
  // 장순의 난 행군 중(군세 이동모드)에는 지도 자체의 특수 상태(apMovement)가
  // 저장 데이터에 담기지 않으므로 제외한다.
  if (stage === 'pyeongwon_free' && MAPS.pyeongwon.apMovement && !!GameState.army) return false;
  return true;
}

function buildSaveSnapshot() {
  const mapId = STAGE_MAP_ID[stage];
  const pos = MapView.playerPos;
  return {
    savedAt: Date.now(),
    label: `${GameState.dateLabel()} · ${GameState.heroData().name}`,
    location: LOCATION_NAMES[mapId] || mapId,
    stage,
    playerPos: { x: pos.x, y: pos.y },
    gameState: JSON.parse(JSON.stringify(GameState)),
  };
}

// go_____Free류 진입 함수를 그대로 쓰면 첫 도착 안내 대사나 행동력 재보급 같은
// 1회성 연출/부수효과가 다시 발동해버려서, 저장 불러오기 전용으로 지도만 조용히
// 다시 그려주는 경로를 따로 둔다.
function resumeExploreStage(targetStage, playerPos) {
  stage = targetStage;
  showScreen('screen-explore');
  const opts = { onInteract: interactNPC, onApSpent: updateHUD, onApBlocked, onStep: renderMinimap };
  if (targetStage === 'takhyeon_free') {
    MapView.load('takhyeon', { ...opts, spawnDeadlineAbsMonth: absMonth(DEADLINES.takhyeon, 12) + 1, onAmbientInteract: runAmbientEvent });
  } else if (targetStage === 'pyeongwon_free') {
    MapView.load('pyeongwon', { ...opts, spawnDeadlineAbsMonth: pyeongwonDeadlineAbsMonth(), onAmbientInteract: runAmbientEvent });
  } else if (targetStage === 'camp') {
    MapView.load('camp', opts);
  } else if (targetStage === 'warmap') {
    MapView.load('warmap', opts);
  }
  if (playerPos) MapView.setPlayerPos(playerPos.x, playerPos.y);
  updateHUD();
}

function applySaveSnapshot(snap) {
  Object.keys(snap.gameState).forEach((k) => { GameState[k] = snap.gameState[k]; });
  resumeExploreStage(snap.stage, snap.playerPos);
  closeSaveBox();
  toast('불러오기 완료.');
}

function saveToSlot(index) {
  if (!canSaveNow()) {
    toast('마을이나 진영을 자유롭게 돌아다닐 때만 저장할 수 있습니다.');
    return;
  }
  const slots = loadSaveSlots();
  const doSave = () => {
    slots[index] = buildSaveSnapshot();
    if (writeSaveSlots(slots)) { toast(`${index + 1}번 칸에 저장했습니다.`); renderSaveBox(); }
  };
  if (slots[index]) {
    showChoice(`${index + 1}번 칸에 이미 저장된 기록이 있습니다. 덮어쓸까요?`, [
      { label: '덮어쓰기', cb: doSave },
      { label: '취소', cb: () => {} },
    ]);
  } else {
    doSave();
  }
}

function loadFromSlot(index) {
  const slots = loadSaveSlots();
  const snap = slots[index];
  if (!snap) return;
  showChoice(`${index + 1}번 칸의 기록을 불러올까요? 지금 진행 상황은 저장해두지 않으면 사라집니다.`, [
    { label: '불러오기', cb: () => applySaveSnapshot(snap) },
    { label: '취소', cb: () => {} },
  ]);
}

function deleteSlot(index) {
  const slots = loadSaveSlots();
  if (!slots[index]) return;
  showChoice(`${index + 1}번 칸의 저장 기록을 삭제할까요?`, [
    { label: '삭제', cb: () => { slots[index] = null; writeSaveSlots(slots); renderSaveBox(); toast('삭제했습니다.'); } },
    { label: '취소', cb: () => {} },
  ]);
}

function renderSaveBox() {
  const slots = loadSaveSlots();
  const wrap = document.getElementById('save-slots');
  wrap.innerHTML = '';
  slots.forEach((snap, i) => {
    const row = document.createElement('div');
    row.className = 'save-slot';
    const info = document.createElement('div');
    info.className = 'save-slot-info';
    if (snap) {
      const d = new Date(snap.savedAt);
      const timeLabel = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      info.innerHTML = `<div class="save-slot-label">${i + 1}. ${snap.label}</div><div class="save-slot-sub">${snap.location} · ${timeLabel} 저장</div>`;
    } else {
      info.innerHTML = `<div class="save-slot-empty">${i + 1}. 비어있음</div>`;
    }
    row.appendChild(info);
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '저장';
    saveBtn.onclick = () => saveToSlot(i);
    row.appendChild(saveBtn);
    if (snap) {
      const loadBtn = document.createElement('button');
      loadBtn.textContent = '불러오기';
      loadBtn.className = 'secondary';
      loadBtn.onclick = () => loadFromSlot(i);
      row.appendChild(loadBtn);
      const delBtn = document.createElement('button');
      delBtn.textContent = '삭제';
      delBtn.className = 'danger';
      delBtn.onclick = () => deleteSlot(i);
      row.appendChild(delBtn);
    }
    wrap.appendChild(row);
  });
}

// ---------------- 대지도 ----------------
function renderWorldMap() {
  const wrap = document.getElementById('worldmap-markers');
  wrap.innerHTML = '';
  WORLDMAP_LOCATIONS.forEach((loc) => {
    const el = document.createElement('div');
    el.className = `wm-marker ${loc.type}`;
    el.style.left = `${loc.x}%`;
    el.style.top = `${loc.y}%`;
    el.style.setProperty('--wm-color', WORLDMAP_FACTION_COLORS[loc.faction] || WORLDMAP_FACTION_COLORS.neutral);
    const label = document.createElement('div');
    label.className = 'wm-label';
    label.textContent = loc.name;
    el.appendChild(label);
    wrap.appendChild(el);
  });
}

function openWorldMapBox() {
  renderWorldMap();
  document.getElementById('worldmap-box').classList.remove('hidden');
}

function closeWorldMapBox() {
  document.getElementById('worldmap-box').classList.add('hidden');
}

document.getElementById('worldmap-close').onclick = closeWorldMapBox;

function openSaveBox() {
  renderSaveBox();
  document.getElementById('save-box').classList.remove('hidden');
}

function closeSaveBox() {
  document.getElementById('save-box').classList.add('hidden');
}

document.getElementById('save-close').onclick = closeSaveBox;

function confirmGoTitle() {
  showChoice('처음 화면으로 돌아갈까요? 저장하지 않은 진행 상황은 사라집니다.', [
    { label: '처음으로', cb: () => showScreen('screen-title') },
    { label: '취소', cb: () => {} },
  ]);
}

function confirmQuit() {
  showChoice('게임을 종료할까요?', [
    { label: '종료', cb: () => {
      toast('창을 닫아도 좋습니다. 다음에 또 만나요!');
      window.close();
    } },
    { label: '취소', cb: () => {} },
  ]);
}

function openSettingsMenu() {
  document.getElementById('settings-box').classList.remove('hidden');
}

function closeSettingsMenu() {
  document.getElementById('settings-box').classList.add('hidden');
}

document.getElementById('settings-close').onclick = closeSettingsMenu;
document.getElementById('settings-save').onclick = () => { closeSettingsMenu(); openSaveBox(); };
document.getElementById('settings-gotitle').onclick = () => { closeSettingsMenu(); confirmGoTitle(); };
document.getElementById('settings-quit').onclick = () => { closeSettingsMenu(); confirmQuit(); };

document.getElementById('btn-continue').onclick = () => openSaveBox();

// ---------------- 대화 기록 ----------------
// 휙 지나가버린 NPC 대사나 어르신의 이야기 등을 다시 볼 수 있게, 실제로 화면에
// 표시된 대사를 Dialogue 모듈이 순서대로 쌓아두고(js/engine/dialogue.js) 여기서
// 그대로 보여준다.
function renderLogBox() {
  const wrap = document.getElementById('log-list');
  wrap.innerHTML = '';
  const history = Dialogue.getHistory();
  if (!history.length) {
    wrap.innerHTML = '<div class="log-empty">아직 나눈 대화가 없습니다.</div>';
    return;
  }
  history.forEach((line) => {
    const row = document.createElement('div');
    row.className = 'log-entry';
    const narration = line.speaker === '내레이션';
    row.innerHTML = `<div class="log-speaker${narration ? ' narration' : ''}">${line.speaker}</div><div class="log-text">${line.text}</div>`;
    wrap.appendChild(row);
  });
}

function openLogBox() {
  renderLogBox();
  document.getElementById('log-box').classList.remove('hidden');
  const wrap = document.getElementById('log-list');
  wrap.scrollTop = wrap.scrollHeight; // 가장 최근 대사가 바로 보이게 아래로 스크롤
}

function closeLogBox() {
  document.getElementById('log-box').classList.add('hidden');
}

document.getElementById('log-close').onclick = closeLogBox;

document.querySelectorAll('#bottom-menu button').forEach((btn) => {
  btn.onclick = () => {
    if (btn.dataset.menu === 'generals') { openRosterPanel(); return; }
    if (btn.dataset.menu === 'bag') { openBagBox(); return; }
    if (btn.dataset.menu === 'settings') { openSettingsMenu(); return; }
    if (btn.dataset.menu === 'log') { openLogBox(); return; }
    if (btn.dataset.menu === 'map') { openWorldMapBox(); return; }
    toast('준비 중인 기능입니다.');
  };
});
document.getElementById('bag-close').onclick = () => {
  document.getElementById('bag-box').classList.add('hidden');
};

// ---- 마을 체류 중 다음달로 넘길 때 가끔 발생하는 돌발 이벤트 ----
const RANDOM_EVENT_CHANCE = 0.3;
const RANDOM_EVENT_BANDITS = ['gwakseung', 'yeosang']; // 정원지는 탁현 2번째 두목 퀘스트로 승격되어 여기서 제외
const FLAVOR_EVENT_LINES = [
  '거리에서 아이들이 무예 놀이를 하며 뛰노는 모습이 보인다.',
  '저잣거리에 이상한 소문이 돌고 있다 - 낙양에서 큰 난리가 났다는데...',
  '오늘따라 하늘이 유난히 붉게 물들었다.',
  '지나가던 노인이 그대들을 보고 흐뭇하게 웃는다.',
];

function triggerBanditEvent() {
  const available = RANDOM_EVENT_BANDITS.filter((id) => !GameState.npcStatus[id]);
  if (!available.length) { triggerFlavorEvent(); return; }
  const id = available[Math.floor(Math.random() * available.length)];
  startFreeBattle(id, undefined, true);
}

function triggerMerchantEvent() {
  const rice = Math.random() < 0.5;
  const amount = 20 + Math.floor(Math.random() * 41); // 20~60
  Dialogue.show([{ speaker: '떠돌이 상인', text: '마침 지나던 길이오. 필요한 물자가 있으면 나눠드리리다.' }], () => {
    GameState.addResource(rice ? { rice: amount } : { gold: amount });
    toast(`떠돌이 상인에게서 ${rice ? `쌀 ${amount}` : `금 ${amount}`}을(를) 얻었다.`);
    updateHUD();
  });
}

function triggerHarvestEvent() {
  const good = Math.random() < 0.5;
  const amount = 15 + Math.floor(Math.random() * 26); // 15~40
  if (good) {
    GameState.addResource({ rice: amount });
    Dialogue.show([{ speaker: '내레이션', text: `이번 달은 날씨가 좋아 인근 농가에서 곡식을 나눠주었다. (쌀 +${amount})` }], () => updateHUD());
  } else {
    GameState.resources.rice = Math.max(0, GameState.resources.rice - amount);
    Dialogue.show([{ speaker: '내레이션', text: `가뭄으로 곡식 사정이 어려워졌다. (쌀 -${amount})` }], () => updateHUD());
  }
}

function triggerFlavorEvent() {
  const line = FLAVOR_EVENT_LINES[Math.floor(Math.random() * FLAVOR_EVENT_LINES.length)];
  Dialogue.show([{ speaker: '내레이션', text: line }]);
}

// 마을 체류 중 휴식(다음달)마다 일정 확률로 발생 - 이벤트가 발생하면 true를 반환한다.
function maybeRandomEvent() {
  if (Math.random() >= RANDOM_EVENT_CHANCE) return false;
  const kind = ['bandit', 'merchant', 'harvest', 'flavor'][Math.floor(Math.random() * 4)];
  if (kind === 'bandit') triggerBanditEvent();
  else if (kind === 'merchant') triggerMerchantEvent();
  else if (kind === 'harvest') triggerHarvestEvent();
  else triggerFlavorEvent();
  return true;
}

// ---- 지나가는 백성 - 가끔 "…" 말풍선을 달고 나타나 말을 걸면 짧은 대화를 나눈다 ----
// 매달 자동으로 뜨는 안내문구 대신, 돌아다니다 우연히 마주치는 이런 짧은 상호작용이
// 마을에 더 살아있는 느낌을 준다.

// 어르신에게 들을 수 있는 세상 돌아가는 이야기 - 지금 시점까지 실제로 벌어진 일만
// 들려준다 (아직 일어나지 않은 이후 전개는 언급하지 않는다). act1/act2 진행에 따라
// 들을 수 있는 이야기 풀이 점점 넓어진다.
const LORE_EVENT_LINES = {
  base: [
    '원소와 원술은 사촌 형제간인데, 두 집안 모두 대대로 삼공을 배출한 명문가라고 하오.',
    '손견이라는 장수가 여러 전장에서 크게 이름을 떨치고 있다고 하오.',
    '낙양 조정에서는 십상시라는 환관 무리가 국정을 어지럽히고 있다는 소문이 파다하오.',
    '황건적의 우두머리 장각 삼형제는 이미 토벌되었지만, 잔당이 아직 곳곳에 남아있다는군.',
  ],
  act1: [
    '한당이라는 장수가 손견을 주군으로 모시고 있다고 하오.',
    '동탁이라는 자가 낙양으로 들어와 어린 황제를 폐하고 진류왕을 새 황제로 세웠다는 소식이오.',
    '동탁의 횡포에 낙양 백성들의 원성이 자자하다는군.',
    '상산 땅에 조자룡이라는 젊은 장수가 무예가 뛰어나다고 소문이 자자하오.',
  ],
  act2: [
    '조조가 진류에서 사재를 털어 의병을 모았다고 하오.',
    '동탁의 폭정을 더는 두고 볼 수 없다며 각지 제후들이 힘을 합치려 한다는군.',
    '서량 쪽에서 마등과 한수가 병사를 일으켰다는 소문이 있소.',
    '원소가 맹주로 추대되어 제후 연합을 이끌게 되었다고 하오.',
  ],
};

// 연도가 붙은 어르신 이야기 - 현재 GameState.year(게임 속 실제 연도)가 그 해에
// 이르러야만 들을 수 있다. 아직 벌어지지 않은 미래의 일을 미리 듣는 일이 없도록,
// 반드시 해당 연도 이후에만 후보 풀에 들어간다.
const LORE_YEAR_LINES = [
  { year: 185, text: '강동의 손견이라는 장수 곁에는 정보, 황개, 한당, 조무라는 네 장수가 따른답니다. 모두 오래전부터 그를 모신 용장들이지요.' },
  { year: 186, text: '조조라는 젊은 장수도 황보숭을 따라 곡양에서 장량의 황건군을 토벌했다더군요. 그때부터 범상치 않았답니다.' },
  { year: 187, text: '어양에서 장거와 장순이 큰 반란을 일으켰답니다. 장거는 스스로 천자라 칭하고 장순은 대장군이라 했다지요.' },
  { year: 188, text: '유우라는 분이 유주목이 되어 장순을 토벌했답니다. 평원현령 유비도 그 싸움에서 큰 공을 세웠다고 하지요.' },
  { year: 189, text: '영제께서 돌아가신 뒤 궁궐이 피바다가 되었다더군요. 대장군 하진도 죽고, 그 악명 높던 십상시도 그때 몰락했답니다.' },
  { year: 189, text: '여포라는 장수가 적토마 한 필을 받고 제 주군 정원을 죽였다지 뭡니까. 무예는 천하에 드물다지만 참 무서운 사내입니다.' },
  { year: 190, text: '사수관에서 화웅이 연합군 장수들을 연달아 베어 쓰러뜨렸는데, 관우가 나서더니 술이 식기도 전에 그 목을 가져왔다더군요.' },
  { year: 190, text: '호로관에서는 유비의 세 형제가 한꺼번에 여포에게 달려들었다지요. 그래도 여포가 쉽게 쓰러지지 않았다니 그 무예가 얼마나 대단했겠습니까.' },
  { year: 190, text: '동탁이 낙양을 버리면서 궁궐과 민가에 불을 질렀답니다. 그 뒤 손견이 궁궐 우물에서 전국옥새를 찾아냈다더군요.' },
  { year: 192, text: '왕윤이 초선이라는 여인을 이용해 동탁과 여포 사이를 갈라놓았답니다. 결국 여포가 제 손으로 동탁을 찔러 죽였다지요.' },
  { year: 195, text: '이각과 곽사가 장안에서 서로 싸우는 바람에 황제께서 직접 난리를 피해 달아나셨답니다. 천자가 길 위를 떠도는 세상이 되었지요.' },
  { year: 196, text: '조조가 황제를 모셔 허도로 옮겼답니다. 이제 천하의 명령이 모두 그곳에서 나온다는군요.' },
  { year: 196, text: '유비가 원술을 막으러 나간 틈에 장비가 서주를 지키고 있었는데, 여포에게 그만 성을 빼앗겼답니다.' },
  { year: 196, text: '강동의 손책과 태사자가 신정에서 단둘이 맞붙었다더군요. 싸우다 서로의 무기와 투구까지 빼앗았을 정도였답니다.' },
  { year: 197, text: '여포가 군영 문밖의 화극 가지를 화살 한 발로 맞혔다더군요. 그 한 발 때문에 원술군과 유비군의 싸움이 멈췄답니다.' },
  { year: 197, text: '완성에서 조조가 큰 화를 당했답니다. 전위라는 장수가 홀로 문을 막아 싸우다가 주군을 살리고 죽었다지요.' },
  { year: 198, text: '하후돈은 싸우다 눈에 화살을 맞았는데, 화살촉에 딸려 나온 제 눈을 그대로 삼켜버렸답니다. 듣기만 해도 섬뜩한 사내지요.' },
  { year: 198, text: '천하를 떨게 하던 여포도 결국 하비에서 붙잡혔답니다. 백문루에서 조조에게 목숨을 구걸했지만 살아나지는 못했다지요.' },
  { year: 200, text: '원소군의 안량이 그렇게 용맹하다더니 관우가 말을 달려 단숨에 목을 베었다더군요. 문추 또한 오래 버티지 못했다지요.' },
  { year: 200, text: '관도에서 병력이 훨씬 적던 조조가 원소를 크게 이겼답니다. 허유가 원소를 떠나 조조에게 오소의 군량창고를 알려준 것이 결정적이었다더군요.' },
  { year: 207, text: '유비가 제갈량이라는 젊은 선비를 만나려고 초가집을 세 번이나 찾아갔다더군요. 장비는 그게 영 못마땅했다지요.' },
  { year: 208, text: '제갈량이 유비의 군사를 맡고 처음 싸운 박망파에서 하후돈의 대군을 불로 크게 깨뜨렸답니다. 그래서 관우와 장비도 그제야 군사의 재주를 인정했다지요.' },
  { year: 208, text: '장판에서 조운이 혼자 조조군 속으로 뛰어들어 어린 아두를 품에 안고 돌아왔다더군요. 조조조차 그 장수를 탐냈답니다.' },
  { year: 208, text: '장비가 장판교 위에서 혼자 창을 들고 조조의 대군을 막았답니다. 고함을 몇 번 질렀을 뿐인데 적장 하나가 놀라 죽었다는 이야기도 있지요.' },
  { year: 208, text: '제갈량이 사흘 안에 화살 십만 개를 마련하겠다더니, 안개 낀 강 위에서 조조군에게 화살을 얻어왔다지 뭡니까. 참 기막힌 꾀지요.' },
  { year: 208, text: '주유가 적벽에서 조조의 대함대를 불태웠답니다. 황개의 거짓 항복과 동남풍이 맞아떨어져 강물이 온통 불바다가 되었다더군요.' },
  { year: 209, text: '관우가 장사에서 노장 황충과 싸웠답니다. 황충의 말이 넘어졌는데도 관우가 베지 않고 보내주었다니, 두 사람 모두 대단한 장수였지요.' },
  { year: 210, text: '유비가 강동으로 장가를 갔다더군요. 손권은 계책으로 그를 붙잡으려 했다는데, 도리어 손부인을 데리고 무사히 돌아왔다지요.' },
  { year: 211, text: '서량의 마초가 조조를 몰아붙여 조조가 수염을 자르고 옷까지 바꿔 입으며 도망쳤답니다. 사람들이 "금마초"라 부를 만하지요.' },
  { year: 214, text: '낙봉파에서 봉추 방통이 주군의 말인 적로를 타고 화살을 맞아 죽었다더군요. 제갈량과 나란히 이름 높던 인재였는데, 참 아까운 일입니다.' },
  { year: 215, text: '관우가 노숙의 초청을 받고 칼 한 자루만 든 채 강동 진영에 들어갔다더군요. 수많은 군사가 둘러싸고 있었는데도 전혀 두려워하지 않았다지요.' },
  { year: 215, text: '합비에서 장료가 겨우 팔백 기병을 이끌고 손권의 대군 속으로 뛰어들었다더군요. 강동 아이들도 장료 이름만 들으면 울음을 그쳤다는 이야기가 있답니다.' },
  { year: 219, text: '정군산에서 노장 황충이 높은 곳에서 단숨에 내리쳐 하후연을 베었다더군요. 늙었다고 얕볼 장수가 아니지요.' },
  { year: 219, text: '유비가 한중을 얻고 한중왕의 자리에 올랐답니다. 관우, 장비, 조운, 마초, 황충 같은 장수들이 모두 그의 휘하에 있지요.' },
  { year: 219, text: '관우가 번성을 치다가 큰비를 이용해 우금의 일곱 군을 물에 잠기게 했다더군요. 우금은 항복하고 방덕은 끝까지 굴복하지 않았다지요.' },
  { year: 219, text: '여몽이 병사들을 상인처럼 꾸며 흰옷을 입히고 강을 건넜답니다. 관우가 북쪽 전쟁에 정신이 팔린 틈에 형주가 순식간에 넘어갔다더군요.' },
  { year: 220, text: '조조가 세상을 떠난 뒤 아들 조비가 그 자리를 이었답니다. 얼마 지나지 않아 한나라 황제에게서 제위를 넘겨받아 위나라 황제가 되었다는군요.' },
  { year: 221, text: '유비가 촉에서 황제의 자리에 올랐답니다. 그런데 오나라를 치러 가려던 장비가 출정도 하기 전에 부하 장달과 범강에게 죽임을 당했다지요.' },
  { year: 223, text: '이릉에서 크게 패한 유비가 백제성에서 병이 깊어졌답니다. 마지막에 제갈량에게 어린 황제와 나라를 부탁하고 눈을 감았다더군요.' },
  { year: 225, text: '남쪽에서 맹획이라는 자가 여러 부족을 모아 난을 일으켰답니다. 제갈량이 직접 남쪽으로 내려가 그를 여러 번 잡았다 놓아주며 마음까지 굴복시키려 한다는군요.' },
];

function availableLoreLines() {
  let pool = LORE_EVENT_LINES.base.slice();
  if (GameState.flags.act1) pool = pool.concat(LORE_EVENT_LINES.act1);
  if (GameState.flags.act2) pool = pool.concat(LORE_EVENT_LINES.act2);
  pool = pool.concat(LORE_YEAR_LINES.filter((l) => l.year <= GameState.year).map((l) => l.text));
  return pool;
}

// 아직 만나지 않은 발견형 NPC에 대한 귀띔 - discoveryText(가까이 가면 보이는 묘사)와는
// 달리, 다른 사람에게서 전해 들은 소문 형태라 근처에 가지 않아도 들을 수 있다.
const RUMOR_HINTS = {
  noshik: '장터 근처에 학식이 깊어 보이는 노학자가 나타났다는 소문이오.',
  gongyung: '비단전 쪽에서 언쟁을 딱 부러지게 정리해주는 선비를 봤다는 사람이 있소.',
  gwanjeong: '주막 근처에서 눈빛이 예사롭지 않은 나그네를 봤다는군.',
  jeonju: '마을 사람들이 어느 은둔 선비에게 자꾸 세상에 나오라 권하고 있다던데.',
  songgeon: '주막 앞에서 떠도는 소문을 죽간에 옮겨 적는 사람이 있다고 하오.',
  jeonye: '유비 장군 진영 근처를 서성이는 낯선 학자를 봤다는 소문이오.',
  yeomyu: '성벽 밖에서 오환족 얘기를 하는 병사들 무리를 봤다고 하오.',
  yuyo: '한실 소식을 궁금해하는 기품 있는 선비가 돌아다닌다는군.',
  choeyeom: '거리의 풍속을 유심히 살피는 수염 기른 선비를 봤다고 하오.',
};

function rumorCandidates() {
  const map = MAPS[MapView.currentMapId];
  if (!map) return [];
  return map.npcs.filter((n) => n.discoverable && RUMOR_HINTS[n.id] && !GameState.npcStatus[n.id]);
}

// 마을 체류 중(취락지) 상황에 따라 지금 뽑을 수 있는 말풍선 종류 목록.
// 마을 지도 진입시/이동 중/다음달 넘길 때 모두 이 함수로 매번 새로 계산한다.
function availableAmbientKinds() {
  // 장순의 난 진압을 위해 군세로 전환되어 행군 중일 때는(관우군이 유비를 뒤따라
  // 이동력을 소모해가며 급히 쫓아가는 상황) 한가한 백성과의 잡담은 어울리지 않는다.
  const inJangsunMarch = stage === 'pyeongwon_free' && MAPS.pyeongwon.apMovement && !!GameState.army;
  if (inJangsunMarch) return [];
  const kinds = ['beggar', 'thanks', 'festival', 'lore', 'recruit', 'lostitem'];
  if (rumorCandidates().length) kinds.push('rumor');
  if (GameState.flags.helpedVillagerOnce) kinds.push('gratitude');
  return kinds;
}

const AMBIENT_EVENTS = {
  beggar: {
    run: () => {
      Dialogue.show([{ speaker: '가난한 백성', text: '나리, 부디 금 5냥만 도와주십시오...' }], () => {
        const amount = Math.min(5, GameState.resources.gold);
        GameState.resources.gold -= amount;
        if (amount > 0) GameState.flags.helpedVillagerOnce = true;
        toast(amount > 0 ? `가엾은 백성에게 금 ${amount}을(를) 나누어 주었다.` : '가진 금이 없어 도와주지 못했다.');
        updateHUD();
      });
    },
  },
  thanks: {
    run: () => {
      Dialogue.show([{ speaker: '낯익은 백성', text: '나리, 항상 감사합니다. 이것 좀 받으십시오.' }], () => {
        GameState.addResource({ rice: 20 });
        toast('백성에게서 쌀 20을 받았다.');
        updateHUD();
      });
    },
  },
  festival: {
    run: () => {
      Dialogue.show([{ speaker: '마을 사람들', text: '나리! 마침 잘 오셨소, 우리와 함께 축제를 즐겨주시오!' }], () => {
        GameState.addFame(5);
        toast('마을 사람들과 즐거운 시간을 보냈다. (명성 +5)');
        updateHUD();
      });
    },
  },
  lore: {
    run: () => {
      const pool = availableLoreLines();
      const line = pool[Math.floor(Math.random() * pool.length)];
      Dialogue.show([{ speaker: '나이 지긋한 어르신', text: line }]);
    },
  },
  rumor: {
    run: () => {
      const candidates = rumorCandidates();
      if (!candidates.length) { triggerFlavorEvent(); return; } // 안전망 - 통상 availableAmbientKinds에서 이미 걸러짐
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      Dialogue.show([{ speaker: '지나가던 백성', text: RUMOR_HINTS[target.id] }]);
    },
  },
  recruit: {
    run: () => {
      const amount = 10 + Math.floor(Math.random() * 21); // 10~30
      Dialogue.show([{ speaker: '마을 청년', text: '나리, 저도 나리 밑에서 한번 싸워보고 싶습니다!' }], () => {
        GameState.resources.troop += amount;
        toast(`마을 청년들이 병사 ${amount}명을 자청해 보탰다.`);
        updateHUD();
      });
    },
  },
  lostitem: {
    run: () => {
      const rice = 10 + Math.floor(Math.random() * 16); // 10~25
      Dialogue.show([{ speaker: '허둥대는 짐꾼', text: '아이고, 제가 방금 봇짐을 흘렸었나 봅니다... 아, 여기 있었군요! 감사합니다, 나리 덕에 찾았습니다.' }], () => {
        GameState.flags.helpedVillagerOnce = true;
        GameState.addResource({ rice });
        toast(`짐꾼에게서 사례로 쌀 ${rice}을(를) 받았다.`);
        updateHUD();
      });
    },
  },
  gratitude: {
    run: () => {
      Dialogue.show([{ speaker: '낯선 백성', text: '나리가 예전에 도와주셨던 그분이, 늘 고마워하며 안부를 전해달라 하셨습니다.' }], () => {
        GameState.addFame(3);
        toast('훈훈한 소문이 퍼지고 있다. (명성 +3)');
        updateHUD();
      });
    },
  },
};

function runAmbientEvent(kind) {
  const ev = AMBIENT_EVENTS[kind];
  if (ev) ev.run();
}

document.getElementById('btn-nextmonth').onclick = () => {
  GameState.nextMonth();
  // 체력은 병사와 달리 매달 휴식하면서 회복된다 (병사수/군량처럼 전쟁 중 손실이 누적되지는 않음).
  // 같은 달 안에서 연달아 전투를 치를 때만 체력이 그대로 이어진다 - 휴식(다음달)을 거치면 항상 완전 회복.
  const inCampaign = stage === 'warmap';
  // 장순의 난: 군세로 전환된 뒤에는 어양이라도 warmap처럼 매달 행동력을 재보급받는다.
  const inJangsunMarch = stage === 'pyeongwon_free' && MAPS.pyeongwon.apMovement && !!GameState.army;
  GameState.heroHp = null;
  if (inCampaign || inJangsunMarch) GameState.ap = effectiveApMax();
  if (inCampaign && GameState.army) {
    GameState.army.rice = Math.max(0, GameState.army.rice - Math.ceil(GameState.army.troop / 100));
    if (GameState.army.rice <= 0) GameState.changeMorale(-1); // 군량 고갈시 매턴 사기 하락
  }
  const income = scholarGoldIncome();
  if (income > 0) GameState.addResource({ gold: income });
  updateHUD();
  if (checkDeadlines()) return;

  // 관우군이 첫 휴식을 취하는 순간, 먼저 앞서갔던 유비군이 장순과 격돌해 패퇴한다 (1회성 서사).
  if (inJangsunMarch && !GameState.flags.yubiArmyDefeated) {
    GameState.flags.yubiArmyDefeated = true;
    Dialogue.show(STORY.jangsun_yubi_defeat, () => {
      toast(`${GameState.dateLabel()}이(가) 되었다. 행동력이 재보급되었다.`);
    });
    return;
  }

  const incomeMsg = income > 0 ? ` (책사들의 수완으로 금 ${income} 획득)` : '';
  const hpMsg = inCampaign || inJangsunMarch ? '체력과 행동력이 재보급되었다.' : '휴식을 취해 체력과 행동력이 모두 회복되었다.';
  const inTown = (stage === 'takhyeon_free' || stage === 'pyeongwon_free') && !inJangsunMarch;
  const spawned = inTown ? MapView.checkScheduledSpawns() : [];
  const spawnMsg = spawned.length ? ' 마을에 낯선 인물이 나타났다는 소문이 돈다. 돌아다니다 보면 마주칠지도 모른다.' : '';
  // 마을 체류 중에는 매달 뜨는 정형화된 안내문구를 없애고, 대신 지나가던 백성에게
  // 가끔 말풍선이 걸려 돌아다니다 우연히 마주치는 편이 더 재미있다.
  const finishTurn = () => {
    if (inTown) {
      const extra = `${incomeMsg}${spawnMsg}`.trim();
      if (extra) toast(`${GameState.dateLabel()}이(가) 되었다. ${extra}`);
      return;
    }
    toast(`${GameState.dateLabel()}이(가) 되었다. ${hpMsg}${incomeMsg}${spawnMsg}`);
  };
  if (inCampaign) {
    // 적 군세의 턴: 한 칸씩 걸어서 접근하는 모습을 보여준 뒤, 사거리 안이면 공격한다.
    MapView.runAiTurn((aiBattle) => { if (!aiBattle) finishTurn(); }); // 전투가 발동했으면 턴종료 토스트는 생략
  } else if (inTown) {
    MapView.rollAmbientEvent(availableAmbientKinds());
    if (!maybeRandomEvent()) finishTurn();
    // maybeRandomEvent가 발생했다면 그 자체의 대사/토스트가 턴 진행 피드백을 대신한다.
  } else {
    finishTurn();
  }
};

document.getElementById('btn-restart').onclick = () => showScreen('screen-title');

// 모바일 터치 이동패드 (클릭=탭으로 동일하게 동작)
function touchpadBlocked() {
  return Dialogue.isActive() || !document.getElementById('bag-box').classList.contains('hidden')
    || !document.getElementById('roster-box').classList.contains('hidden')
    || !document.getElementById('army-box').classList.contains('hidden')
    || !document.getElementById('choice-box').classList.contains('hidden');
}
function guardedMove(dx, dy) {
  if (touchpadBlocked()) return;
  MapView.tryMove(dx, dy);
}
document.getElementById('tp-up').onclick = () => guardedMove(0, -1);
document.getElementById('tp-down').onclick = () => guardedMove(0, 1);
document.getElementById('tp-left').onclick = () => guardedMove(-1, 0);
document.getElementById('tp-right').onclick = () => guardedMove(1, 0);
document.getElementById('tp-action').onclick = () => { if (!touchpadBlocked()) MapView.interactFacing(); };
