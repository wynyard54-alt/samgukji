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
  const deferredFieldKeys = ['pyeongwon_city_overview', 'camp_overview', 'warmap_overview', 'seoju_siege_overview', 'seoju_overview', 'habi_gwannae_overview', 'suchun_overview'];
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
const HABI_RECRUIT_GOAL = 5000; // 하비성 관청(챕터2 장면2)에서 원술 정벌 전 모아야 하는 병력
const MIN_PYEONGWON_STAY_MONTHS = 12; // 탁현 체류가 길어져 늦게 도착해도 평원현에서 최소 이만큼은 머물게 보장
function absMonth(year, month) { return year * 12 + month; } // 연/월을 단조증가하는 절대 개월수로 환산
// 평원현 마감 절대 개월수: 원래 기한(188년말)과, 실제 도착일+최소 체류기간 중 더 늦은 쪽을 사용한다.
function pyeongwonDeadlineAbsMonth() {
  const base = absMonth(DEADLINES.pyeongwon, 12) + 1;
  if (GameState.pyeongwonEnterAbsMonth == null) return base;
  return Math.max(base, GameState.pyeongwonEnterAbsMonth + MIN_PYEONGWON_STAY_MONTHS);
}
const STAT_LABELS = { atk: '공격', def: '방어', spd: '속도', int: '지력', cha: '매력', lead: '통솔' };
const COMBAT_STATS = ['atk', 'def', 'spd']; // 통솔(lead)은 필살공격 습득 진행에는 관여하지 않는다

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

// 이름 마지막 글자의 받침 유무에 따라 "이"/"가" 중 맞는 주격 조사를 고른다
// (예: 관우 -> 가, 손권 -> 이) - 군세 편성창처럼 인물 이름을 문장에 끼워 넣는
// 곳에서 쓴다.
function subjectParticle(name) {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return '가';
  return code % 28 === 0 ? '가' : '이';
}

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
  pyeongwon: '계 · 어양',
  camp: '반동탁연합 진영',
  warmap: '호로관 전선',
  seoju_siege: '서주성 (대치)',
  seoju: '서주성',
  habi: '하비성 관청',
  hoenam: '회남 벌판',
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

    ['noshik'].forEach((id) => {
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
  } else if (stage === 'seoju_free') {
    const metCount = SEOJU_GREET_IDS.filter((id) => !!gs.npcStatus[id]).length;
    if (metCount < 3) list.push(`서주의 유력 인사들과 인사 나누기 (${metCount}/3)`);
  } else if (stage === 'habi_camp') {
    const step = gs.flags.habiStep || 0;
    if (step === 0) list.push('유비를 찾아가자');
    else if (step === 1) list.push(`진등을 찾아가 병사를 모집하며 세력을 키워라 (${gs.resources.troop}/${HABI_RECRUIT_GOAL})`);
    else if (step === 2) list.push('유비를 찾아가 회의에 참석하자');
    else if (step >= 3) list.push('준비되면 [원술 토벌 출전] 버튼으로 출정하기');
  } else if (stage === 'camp') {
    list.push('제후들과 인사하고 손견을 도와 화웅과 맞서기');
  } else if (stage === 'warmap') {
    if (MapView.currentMapId === 'hoenam') list.push('기령의 군세를 격파하라');
    else list.push('호로관의 적 군세를 모두 격파하기');
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
  document.getElementById('hud-rice').textContent = `쌀 ${gs.resources.rice.toLocaleString()}(+0)`;
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
  } else if (stage === 'seoju_free') {
    if (gs.flags.dogyeomDied) {
      progressBtn.classList.remove('hidden');
      progressBtn.textContent = '하비성으로 이동';
      progressBtn.onclick = goHabiCamp;
    } else {
      progressBtn.classList.add('hidden');
    }
  } else if (stage === 'habi_camp') {
    if ((gs.flags.habiStep || 0) >= 3) {
      progressBtn.classList.remove('hidden');
      progressBtn.textContent = '원술 토벌 출전';
      progressBtn.onclick = startWonsulExpedition;
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
  // 미방은 이미 마음을 정한 상태라, 손건과 달리 친밀도를 쌓을 필요 없이
  // 서주에서 찾아가 인사만 나누면 곧바로 등용된다("찾아서 등용"). 미축·진규·
  // 진등은 도겸의 옛 신하라 도겸 생전에 곧바로 등용하면 모양새가 좋지 않으니
  // (아래 rd.kind==='flavor' 분기에서) 대화만 나누고, 실제 등용은 도겸의
  // 죽음과 함께(checkDeadlines의 dogyeom_death 처리) 한꺼번에 이뤄진다.
  if (SEOJU_INSTANT_JOIN_IDS.includes(id) && stage === 'seoju_free') {
    if (GameState.recruited.includes(id)) {
      interactRecruitedGeneral(id);
      return;
    }
    const completesGreetQuest = SEOJU_GREET_IDS.includes(id) &&
      SEOJU_GREET_IDS.filter((x) => x !== id && !!GameState.npcStatus[x]).length === SEOJU_GREET_IDS.length - 1;
    Dialogue.show([{ speaker: rd.name, text: rd.intro }], () => {
      GameState.recruit(id, 0);
      stationRecruitOrRemove(id);
      toast(`${rd.name}이(가) 합류했다.`);
      updateHUD();
      if (completesGreetQuest) checkDeadlines();
    });
    return;
  }
  // 진등은 씬1(서주 자유탐방)에서 이미 등용된 상태로 하비 관청에 들어올 수
  // 있으므로, 아래의 "이미 등용됨" 일괄 차단보다 먼저 확인해야 한다.
  if (id === 'jindeung' && stage === 'habi_camp') { handleJindeungRecruit(); return; }
  // 등용된 지력형 장수의 모병 상호작용(interactRecruitedGeneral)은 챕터1
  // 마을(탁현/평원)뿐 아니라 챕터2의 서주·하비 관청에서도 그대로 열려 있어야
  // 한다 - 안 그러면 미축·미방·진규 같은 책사형 인물들이 등용된 뒤 그냥
  // 인사만 나누는 장식으로만 남아버린다.
  if (st === 'recruited' && (stage === 'takhyeon_free' || stage === 'pyeongwon_free' || stage === 'seoju_free' || stage === 'habi_camp')) { interactRecruitedGeneral(id); return; }
  if (st === 'recruited' || st === 'resolved' || st === 'dead' || st === 'fled') return;

  if (id === 'yubi' && stage === 'camp') {
    Dialogue.show([{ speaker: '유비', text: '아우들, 반동탁연합에 합류했으니 이제부터가 진짜 시작일세. 마음 단단히 먹게.' }]);
    return;
  }
  if (id === 'yubi' && stage === 'habi_camp') { handleHabiYubi(); return; }
  if (id === 'yubi') { handleYubi(); return; }

  if (id === 'songyeon' && stage === 'camp') {
    GameState.npcStatus['songyeon'] = 'resolved';
    startSongyeonBattleScene();
    return;
  }

  if (id === 'yuwoo') { handleYuwoo(); return; }

  if (id === 'jangsun') { openWarCommandMenu('jangsun'); return; }

  // 도겸이 손건을 추천하는 서브퀘스트(연의 12회) - 인재 등록 기간 중 첫 대화에서만
  // 한 번 나온다. 이후에는 일반 flavor 대사로 자연스럽게 넘어간다.
  if (id === 'dogyeom' && stage === 'seoju_free' && !GameState.flags.dogyeomDied && !GameState.flags.songgeonRecommended) {
    GameState.flags.songgeonRecommended = true;
    Dialogue.show([
      { speaker: '도겸', text: '북해 사람 손건, 자는 공우인데, 이 사람을 종사로 삼을 만하오.' },
      { speaker: '도겸', text: '시장 근처에서 죽간에 소문을 옮겨 적고 있다 하니, 한번 찾아가 보시게.' },
    ], () => {
      MapView.addNpc('songgeon');
      toast('도겸이 손건을 추천했다. 시장 근처를 둘러보자.');
    });
    return;
  }

  if (rd.kind === 'flavor') {
    // 미축·진규·조표는 이 시점엔 등용되지 않고 대화만 나누므로 별도 상태
    // 추적이 없지만, 서주 인사 (0/3) 임무에는 포함되므로 첫 만남을 기록해둔다 -
    // 미축·진규의 실제 등용은 도겸 사망 시 자동으로 처리된다.
    const isFirstMeet = (id === 'michuk' || id === 'jopyo' || id === 'jingyu') && !GameState.npcStatus[id];
    const completesGreetQuest = isFirstMeet &&
      SEOJU_GREET_IDS.filter((x) => x !== id && !!GameState.npcStatus[x]).length === SEOJU_GREET_IDS.length - 1;
    if (isFirstMeet) {
      GameState.npcStatus[id] = 'met';
      updateHUD();
    }
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
    Dialogue.show([{ speaker: rd.name, text }], () => {
      if (completesGreetQuest) checkDeadlines();
    });
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

  if (rd.kind === 'merchant') { openMerchantShop(id); return; }

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
      updateHUD();
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

// ---- 군세간 전투 (전쟁맵 [일기토]/[전투]/[책략] 커맨드) ----
// 데미지는 "현재 병력"이 아니라 "이번 교전이 시작된 시점의 병력" 기준으로
// 고정한다 - 그래야 대등한 두 군세끼리도 몇 번 안에 승부가 난다(20% 기준
// 시뮬레이션상 3~7교전). [전투]를 누르면 속도가 빠른 쪽이 먼저 한 대
// 치고, 그 한 방으로 상대가 쓰러지면 반격 없이 끝난다 - 이게 선타의 실질적
// 의미다. 공격이 이번 행동력 소모의 마지막 액션이라(포켓몬 카드게임에서
// 서포터·아이템을 쓰고 마지막에 공격해 턴을 마치는 것과 같은 감각) 행동력을
// 1 소모하고, 다음 [전투]를 누르기 전까지는 그대로 멈춰 있다.
const GRADE_RANK = { S:1, A:2, B:3, C:4, D:5 };
const GRADE_ATTACK_MOD = { S:0.10, A:0.05, B:0, C:-0.05, D:-0.10 };
const ARMY_HIT_RATE = 0.20; // 교전 시작 시점 병력의 20%가 교전 1회당 고정 피해량이 된다

// 방어측 군세 등급이 도전측보다 낮을수록 일기토 수락 확률이 낮아진다 (등급차 1당 -20%)
function duelAcceptChance(challengerGrade, defenderGrade) {
  const diff = Math.max(0, GRADE_RANK[defenderGrade] - GRADE_RANK[challengerGrade]);
  return Math.max(0, 100 - 20 * diff);
}

// 등급상승(gradeBoost) 책략을 반영해 등급을 boost단계만큼 끌어올린다(S가
// 상한). boost가 0/없으면 원래 등급 그대로다.
function shiftGrade(grade, boost) {
  if (!boost) return grade;
  const ranks = ['S', 'A', 'B', 'C', 'D'];
  const idx = ranks.indexOf(grade);
  if (idx < 0) return grade;
  return ranks[Math.max(0, Math.min(ranks.length - 1, idx - boost))];
}

// 일기토에서 군세장이 포로로 잡혔는데 그 군세에 책사(deputy)가 있었다면,
// 지휘를 이어받은 책사의 무력으로 등급을 다시 매긴다(대개 훨씬 낮아 사실상
// 와해 수준으로 약해진다) - captureCommander 참고.
function enemyArmyGrade(rd) {
  const base = (rd.commanderCaptured && rd.deputy && ROSTER[rd.deputy])
    ? gradeFor(armyMuryeokValue(ROSTER[rd.deputy], []), MURYEOK_GRADES)
    : gradeFor(armyMuryeokValue(rd, []), MURYEOK_GRADES);
  return shiftGrade(base, StatusEffects.gradeBoostAmount(rd.id));
}
function enemyJiryeokGrade(rd) {
  return shiftGrade(gradeFor(rd.stats.int, JIRYEOK_GRADES), StatusEffects.gradeBoostAmount(rd.id));
}

function npcOnGateTile(id) {
  // 현재 챕터1 지도에는 관문/요새 타일에 서있는 적 군세가 없다 - 향후 지도 확장을 위한 훅
  return false;
}

// 부장 무력 가산과 같은 방식(3인 합×10%)으로 속도만 따로 합산한다 - 무력등급과
// 달리 교전 선타 순서를 정하는 데만 쓰인다.
function armySpeedValue(commanderRd, generalIds) {
  const base = commanderRd.stats.spd;
  const bonus = (generalIds || []).reduce((sum, id) => {
    const rd = ROSTER[id];
    return sum + (rd ? rd.stats.spd * ARMY_GENERAL_BONUS_PCT : 0);
  }, 0);
  return base + bonus;
}

// 병사가 남아있는 한 최소 1명의 피해는 발생한다.
function fixedHitDamage(troops, grade, morale, defenderOnGate) {
  const mult = 1 + GRADE_ATTACK_MOD[grade] + (morale - 100) / 100 - (defenderOnGate ? 0.05 : 0);
  return Math.max(1, Math.round(troops * ARMY_HIT_RATE * mult));
}

// 교전이 시작되면(첫 [전투] 또는 [책략]) 그 시점 병력·등급·사기로 이번
// 교전 내내 쓸 고정 피해량을 잠가둔다(GameState.warLocks[id]) - 이후 몇
// 번을 더 때리든 이 값을 그대로 쓴다. 병력이 줄어들 때마다 다시 계산하면
// 대등한 싸움이 영영 안 끝나는 예전 산식의 문제가 그대로 재현되기 때문이다.
function getWarLock(id, ctx, enemyMoraleOverride) {
  let lock = GameState.warLocks[id];
  if (lock) return lock;
  const rd = ROSTER[id];
  lock = {
    playerHit: fixedHitDamage(ctx.army.troop, warArmyGrade(ctx), GameState.morale, npcOnGateTile(id)),
    enemyHit: fixedHitDamage(rd.troop || 1000, enemyArmyGrade(rd), enemyMoraleOverride != null ? enemyMoraleOverride : (rd.morale != null ? rd.morale : 100), false),
  };
  GameState.warLocks[id] = lock;
  maybeEnemyCastsStrategy(rd, ctx); // 이 적과 처음 맞닥뜨리는 순간(교전 개시)에 한 번 확인한다
  return lock;
}

// 적 책사(deputy)가 있고, 아직 못 쓴 책략을 갖고 있으면 자동으로 한 번
// 걸어준다 - 어차피 책사 1명당 책략이 보통 1개뿐이라 복잡한 선택 판단이
// 필요 없다("있으면 쓴다"). STRATEGY_EFFECTS의 모든 효과는 alliesOf/
// enemiesOf/armyFor/moraleOf로 "캐스터가 어느 쪽인지"를 실제로 구분해서
// 동작하므로(main.js 상단 "군세 통합" 섹션 참고), 구현된 책략이면 전부
// 적도 그대로 쓸 수 있다 - STRATEGY_EFFECTS에 없는 것(병종/사거리/성벽,
// 적 책략시전이 필요한 반계·책략봉쇄·간파)만 자동으로 제외된다.
function maybeEnemyCastsStrategy(rd, ctx) {
  if (!rd.deputy) return;
  const advisor = ROSTER[rd.deputy];
  if (!advisor) return;
  const sid = strategiesFor(rd.deputy).find((s) => STRATEGY_EFFECTS[s] && strategyIsUsable(s));
  if (!sid) return;
  const desc = STRATEGY_EFFECTS[sid](ctx.commanderId, rd.deputy, rd.id);
  markStrategyUsed(sid);
  toast(`${rd.name} 진영의 ${advisor.name}이(가) ${STRATEGIES[sid].name}을(를) 시전했다! ${desc}`);
}

// 이 적을 어느 편의 군세가 상대하는지 정한다 - 기본은 플레이어가 직접
// 편성한 군세(GameState.army, 지금까지는 늘 관우군)이고, ROSTER 항목에
// warArmy:'ally'가 있으면 플레이어가 따로 편성한 동맹군(GameState.allyArmy,
// 회남 벌판의 유비군)을 대신 쓴다 - 같은 세력(관우/유비)끼리는 플레이어가
// 직접 지휘하되, 나중에 반동탁연합의 조조·원소나 하비전의 조조군처럼 진짜
// 별개 세력이 돕는 경우가 생기면 여기에 warArmy:'ai:조조' 같은 새 갈래를
// 추가해 AI가 알아서 판정하게 하면 된다.
function resolveWarArmy(rd) {
  if (rd.warArmy === 'ally') {
    const army = GameState.allyArmy;
    return army ? { army, commanderId: army.commanderId } : null;
  }
  return { army: GameState.army, commanderId: GameState.mainHero };
}

function warArmyGrade(ctx) {
  const base = gradeFor(armyMuryeokValue(ROSTER[ctx.commanderId], ctx.army.generals), MURYEOK_GRADES);
  return shiftGrade(base, StatusEffects.gradeBoostAmount(ctx.commanderId));
}
function warArmySpeed(ctx) {
  return armySpeedValue(ROSTER[ctx.commanderId], ctx.army.generals);
}

function openWarCommandMenu(id) {
  const rd = ROSTER[id];
  const ctx = resolveWarArmy(rd);
  if (!ctx) {
    toast(`${rd.name}과(와) 싸우려면 먼저 유비군을 편성해야 합니다.`);
    return;
  }
  showChoice(`${rd.name} 군세와 마주쳤다. 어떻게 하시겠습니까?`, [
    { label: '일기토', cb: () => attemptDuelChallenge(id) },
    { label: '전투', cb: () => resolveArmyBattle(id) },
    { label: '책략', cb: () => attemptStrategy(id) },
  ]);
}

// ---- 책략 커맨드 ----
// 책사별 고유 책략은 아직 정하지 않아, 우선 군세 편성에서 지정한 책사(부장)의
// 지력 등급에 따른 성공률로 적의 이번 교전 고정 피해량을 30% 깎는 범용
// 효과만 넣어둔다 - 나중에 책사마다 고유 책략을 배정하면 이 함수가 그
// 분기로 바뀐다. 교전이 아직 시작 전이면 처음부터 약해진 채로 잠기고, 이미
// 시작된 교전이면 남은 교전 동안 추가로 30% 더 약해진다.
// 책략 성공률은 내 책사의 지력 등급 하나만 보지 않고, 적 총사령관의 지력
// 등급과 비교한 "등급차"로 정한다 - 동률 50%를 기준으로 등급차 1당 10%p씩
// 오르내린다(1등급 앞서면 60%, 4등급 앞서면 90% / 반대로 뒤처지면 40%,
// 10%까지 내려간다). 무력 등급차 1당 -20%인 일기토 수락률(duelAcceptChance)과
// 같은 효과의 산식이다.
// 화염/혼란/공포/도발/연환계 같은 이름 붙은 책략을 나중에 추가할 때는 여기서
// StatusEffects.applyArmyStatus(id,'confuse'|'fear'|'taunt',{turns})나
// StatusEffects.igniteTile(mapId,x,y,{dps,ticks}), StatusEffects.linkChain([ids])를
// 호출하기만 하면 된다 - 이미 다음 효과들이 전투 산식에 연결돼 있다
// (js/engine/status-effects.js):
//  - 혼란: 이동 불가(mapview.js tryMove/runAiTurn) / 이 군세를 노리는 책략은
//    100% 성공(attemptStrategy) / [전투]에서 반격 불가(resolveArmyBattle)
//  - 공포: 걸려 있는 동안 매 턴(1달 휴식 = "다음달" 버튼 한 번)마다 사기 -10
//  - 도발: 도발을 건 군세를 쫓아옴(원래 AI가 항상 플레이어를 쫓으므로 지금은
//    자동으로 충족됨) / 도발당한 상대에게 거는 일기토는 100% 발동(attemptDuelChallenge)
// 지속시간(turns)과 공포의 사기 드레인은 "다음달" 버튼 핸들러에서
// StatusEffects.tickAllArmyStatus()로 매 턴 한 번씩만 처리된다([전투]를 몇 번
// 누르든 턴 안에서는 소모되지 않는다).
function strategySuccessChance(deputyGrade, enemyGrade) {
  const diff = GRADE_RANK[enemyGrade] - GRADE_RANK[deputyGrade]; // 양수면 내 책사가 우위
  return Math.max(10, Math.min(90, 50 + 10 * diff));
}
// 이름 붙은 책략이 아직 없는(또는 아직 효과가 구현되지 않은) 책사가 쓰는
// 범용 책략 - 지력 등급차 기반 성공률로 적의 이번 교전 고정 피해량을 30% 깎는다.
function castGenericStrategy(id, ctx, deputy) {
  const rd = ROSTER[id];
  const grade = shiftGrade(gradeFor(deputy.stats.int, JIRYEOK_GRADES), StatusEffects.gradeBoostAmount(deputy.id));
  // 혼란에 빠진 적에게는 어떤 책략을 걸든 반드시 통한다. 견벽거수/팔문금쇄진
  // 같은 "적 책사 성공률 감소" 효과는 이미 계산된 성공률의 마지막 단계에서
  // stratSuccessMult로 한 번 더 곱한다(받는피해 배율과 같은 방식).
  const baseChance = strategySuccessChance(grade, enemyJiryeokGrade(rd));
  const chance = StatusEffects.isConfused(id) ? 100 : Math.max(0, Math.min(100, baseChance * StatusEffects.stratSuccessMult(deputy.id)));
  const roll = Math.random() * 100;
  if (roll < chance) {
    Dialogue.show([{ speaker: deputy.name, text: '계책이 통했습니다! 적진이 크게 흔들리고 있습니다.' }], () => {
      const hadLock = !!GameState.warLocks[id];
      const lock = getWarLock(id, ctx, hadLock ? undefined : 70);
      if (hadLock) lock.enemyHit = Math.max(1, Math.round(lock.enemyHit * 0.7));
      toast(`${rd.name}의 다음 공격력이 크게 약해졌다.`);
      openWarCommandMenu(id);
    });
  } else {
    Dialogue.show([{ speaker: deputy.name, text: '송구합니다, 적이 계책을 미리 간파한 듯합니다...' }], () => {
      toast(`책략이 실패했다. (성공 확률 ${Math.round(chance)}%)`);
      openWarCommandMenu(id);
    });
  }
}

// ---- 군세(army) 통합 ----
// "군세"는 { commanderId, deputy, generals, troop, rice } 하나의 모양으로
// 통일한다. 플레이어 군세는 원래대로 GameState.army/allyArmy 객체를 그대로
// 쓰고(기존 코드가 다 이 객체를 직접 참조하므로 손대지 않는다), 적은 처음
// 필요해지는 순간(전투 개시) rd.army에 "편성"해서 붙여준다 - troop/rice/
// deputy/generals는 getter/setter로 rd.troop/rd.rice/rd.deputy/rd.generals를
// 그대로 가리키는 프록시라, 지도 표시·데미지 계산 등 rd.troop을 직접 읽는
// 기존 코드는 전혀 손대지 않아도 항상 같은 값을 본다. 이 덕분에 책략
// 효과들이 "상대가 플레이어냐 적이냐"를 가리지 않고 armyFor(id) 하나로
// 병력/군량/부장을 다룰 수 있다.
function playerArmies() { return [GameState.army, GameState.allyArmy].filter(Boolean); }
function composeEnemyArmy(rd) {
  ensureEnemyRice(rd);
  return {
    commanderId: rd.id,
    get deputy() { return rd.deputy || null; },
    set deputy(v) { rd.deputy = v; },
    get generals() { return rd.generals || []; },
    set generals(v) { rd.generals = v; },
    get troop() { return rd.troop; },
    set troop(v) { rd.troop = v; },
    get rice() { return rd.rice; },
    set rice(v) { rd.rice = v; },
  };
}
function armyFor(commanderId) {
  const found = playerArmies().find((a) => a.commanderId === commanderId);
  if (found) return found;
  const rd = ROSTER[commanderId];
  if (!rd) return null;
  if (!rd.army) rd.army = composeEnemyArmy(rd);
  return rd.army;
}
function isPlayerSide(commanderId) { return StatusEffects.isPlayerCommander(commanderId); }
// 사기(morale) 조회 - 플레이어 쪽은 GameState.morale 하나를 관우군/유비군이
// 같이 쓰고, 적은 각자 rd.morale을 따로 갖는다.
function moraleOf(id) {
  return isPlayerSide(id) ? (GameState.morale != null ? GameState.morale : 100) : (ROSTER[id].morale != null ? ROSTER[id].morale : 100);
}
// 사기는 "군세 하나하나"가 아니라 "진영 하나"가 공유하는 값이다(플레이어
// 쪽 여러 군세는 GameState.morale 하나를 같이 쓴다) - 그래서 여러 id에
// 그대로 반복 적용하면 플레이어 쪽에서 중복 적용되는 버그가 생긴다.
// amount는 changeMorale과 같은 부호(양수=상승)로 받는다.
function boostSideMorale(ids, amount) {
  if (ids.some(isPlayerSide)) GameState.changeMorale(amount);
  ids.filter((id) => !isPlayerSide(id)).forEach((id) => StatusEffects.drainMorale(id, -amount));
}
// 사기 "조회/조건 판정"이 필요한 반복(적 전체 중 사기 50 이하만 혼란 등)에서도
// 같은 진영을 여러 번 세지 않도록, 플레이어 쪽이 섞여 있으면 대표 1개만 남긴다.
function dedupeByMoralePool(ids) {
  let sawPlayerSide = false;
  const out = [];
  for (const id of ids) {
    if (isPlayerSide(id)) { if (sawPlayerSide) continue; sawPlayerSide = true; }
    out.push(id);
  }
  return out;
}

// ---- 이름 붙은 책략(S~D급) ----
// "적 전체/아군 전체"는 지금 전장(현재 지도) 안에 있는 군세 전체를 뜻한다 -
// 회남 벌판처럼 아군이 관우군+유비군 둘 다 있으면 둘 다, 적이 원술 진영
// 전부면 그 전부가 대상이다. 여러 군세를 동시에 편성/조작하는 구조를 그대로
// 반영한다(main.js가 "플레이어 군세는 1개"라고 가정하지 않도록 - playerArmies()
// 하나만 고치면 나중에 세 번째 군세 슬롯이 생겨도 전부 따라간다).
// 아래 두 함수는 "플레이어 시점" 원시 함수이고, 실제 책략 효과들은 대부분
// 그 아래의 caster 상대적인 alliesOf/enemiesOf/alliedCastersOf를 쓴다 -
// 적이 캐스터일 때는 "아군"과 "적"이 서로 뒤집혀야 하기 때문이다.
function alliesInScene() { return playerArmies().map((a) => a.commanderId); }
// 사령관뿐 아니라 부장(책사)까지 포함 - 신풍처럼 "아군 전체 지력 상승" 같은
// 효과가 그 책사 본인의 책략 성공률에도 실제로 반영되게 하기 위함.
function alliedCasterIds() {
  const ids = [];
  playerArmies().forEach((a) => { ids.push(a.commanderId); if (a.deputy) ids.push(a.deputy); });
  return [...new Set(ids)];
}
function enemiesInScene() {
  return MapView.liveNpcIds.filter((nid) => { const r = ROSTER[nid]; return r && r.kind === 'enemy'; });
}
function enemyCasterIds() {
  const ids = [];
  enemiesInScene().forEach((eid) => { ids.push(eid); const rd = ROSTER[eid]; if (rd.deputy) ids.push(rd.deputy); });
  return [...new Set(ids)];
}
// caster가 플레이어 쪽이면 원래 뜻 그대로, 적 쪽이면 뒤집는다 - 이제 모든
// 책략 효과가 "내 편/상대 편"을 이 두 함수로만 물어보면 캐스터가 어느
// 쪽이든 똑같이 동작한다.
function alliesOf(casterId) { return isPlayerSide(casterId) ? alliesInScene() : enemiesInScene(); }
function enemiesOf(casterId) { return isPlayerSide(casterId) ? enemiesInScene() : alliesInScene(); }
function alliedCastersOf(casterId) { return isPlayerSide(casterId) ? alliedCasterIds() : enemyCasterIds(); }
function npcMapPos(id) {
  const mapSpec = MAPS[MapView.currentMapId];
  const n = mapSpec && mapSpec.npcs.find((x) => x.id === id);
  return n ? { x: n.x, y: n.y } : null;
}
function tileDist(a, b) {
  return (a && b) ? Math.abs(a.x - b.x) + Math.abs(a.y - b.y) : Infinity;
}
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// "아군 1명"을 타겟으로 하는 책략(격려/견수 등)은 시전자 쪽 사령관에게
// 적용한다 - 아직 "여러 아군 중 하나를 직접 고르는" UI가 없어서, 그 전투를
// 치르고 있는 사령관으로 정한다. 예전에는 이걸 targetId(상대편)에서
// resolveWarArmy로 거꾸로 추측했는데, 그러면 "캐스터가 항상 플레이어"라고
// 가정하게 되어 적이 같은 책략을 쓰면 값이 꼬였다 - 이제는 호출부
// (castNamedStrategy/maybeEnemyCastsStrategy)가 caster의 사령관 id를 직접
// 알고 있으니 그걸 그대로 세 번째 인자(casterCommanderId)로 넘겨받는다.
// 이간계/반목처럼 "타겟 적이 인접한 다른 적을 공격하게" 만드는 책략의 공통
// 로직 - maxAttackers가 없으면(이간계) 인접한 적 전부, 있으면(반목) 그
// 수만큼만 무작위로 고른다. 서로 주고받는 피해는 기존 고정 데미지 산식
// (fixedHitDamage)을 그대로 재사용한다(일기토가 아닌 군세간 교전이므로).
// targetId와 "같은 편"(캐스터의 반대 편)인 다른 군세가 targetId를 공격하게
// 만든다 - pool은 enemiesOf(casterId)에서 구한다(캐스터가 적이면 이 pool은
// 플레이어 쪽이 된다). 플레이어 군세는 지도 위에 개별 좌표가 없어서(유비군은
// 별도 스프라이트가 없음) 인접 판정상 자연히 대상이 안 잡힐 수 있는데, 이는
// 실제 버그가 아니라 "플레이어 쪽엔 아직 걸 일이 없다"는 뜻이다.
function triggerEnemyInfighting(targetId, maxAttackers, casterId) {
  const pos = npcMapPos(targetId);
  const pool = shuffled(enemiesOf(casterId).filter((eid) => eid !== targetId && tileDist(npcMapPos(eid), pos) <= 1));
  const attackers = maxAttackers ? pool.slice(0, maxAttackers) : pool;
  const target = armyFor(targetId);
  const targetName = ROSTER[targetId].name;
  if (!attackers.length) return `${targetName} 주변에 이간질할 다른 적이 없었다.`;
  const lines = attackers.map((eid) => {
    const other = armyFor(eid);
    const otherName = ROSTER[eid].name;
    const dmgToTarget = fixedHitDamage(other.troop, enemyArmyGrade(ROSTER[eid]), moraleOf(eid), false);
    const dmgToOther = fixedHitDamage(target.troop, enemyArmyGrade(ROSTER[targetId]), moraleOf(targetId), false);
    target.troop = Math.max(0, target.troop - dmgToTarget);
    other.troop = Math.max(0, other.troop - dmgToOther);
    return `${otherName}이(가) ${targetName}을(를) 공격해 서로 ${dmgToTarget}/${dmgToOther}명의 피해를 주고받았다`;
  });
  return lines.join('. ') + '.';
}

// S급은 "전투당(그 전장 씬) 1회", A급은 "이번 달 1회" - B~D급은 별도 제한이
// 명시되지 않아 자유롭게 쓸 수 있다(행동력 소모로만 자연히 제한됨). 허보만
// 예외로 "전투중 1회"라 S급과 같은 씬 단위 제한을 쓴다.
const SCENE_LIMITED_OVERRIDE = new Set(['heobo']);
function strategyIsUsable(sid) {
  const grade = STRATEGIES[sid].grade;
  if (grade === 'S' || SCENE_LIMITED_OVERRIDE.has(sid)) return StatusEffects.canUseThisScene(sid);
  if (grade === 'A') return StatusEffects.canUseThisMonth(sid);
  return true;
}
function markStrategyUsed(sid) {
  const grade = STRATEGIES[sid].grade;
  if (grade === 'S' || SCENE_LIMITED_OVERRIDE.has(sid)) StatusEffects.markUsedThisScene(sid);
  else if (grade === 'A') StatusEffects.markUsedThisMonth(sid);
}

// 각 책략의 실제 효과 구현. (targetId, deputyId) -> 결과 서술 문자열(내레이션에 씀).
// 아래 시스템이 아직 없어서 그에 의존하는 8개만 STRATEGY_EFFECTS에서
// 빠져 있다 - 그 시스템들이 생기면 이어서 채운다. 나머지는 여기 없으면
// castGenericStrategy(범용 약화 책략)로 대신 나간다.
//  - 병종/사거리/성벽 내구도: 응변진, 철벽수성, 벽력거, 연노지휘, 야습
//  - "적이 책략을 시전한다"는 시스템: 반계, 책략봉쇄, 간파
// 아래 모든 효과는 caster가 플레이어든 적이든 동일하게 동작한다 - "아군/적"은
// alliesOf(casterId)/enemiesOf(casterId)로, 병력·군량은 armyFor(id)로,
// 사기는 moraleOf/boostSideMorale로 조회·적용해서 어느 쪽이 캐스터인지
// 하드코딩하지 않는다.
const STRATEGY_EFFECTS = {
  // ---- S급 ----
  sinpung(targetId, deputyId, casterId) {
    alliedCastersOf(casterId).forEach((aid) => StatusEffects.applyArmyStatus(aid, 'gradeBoost', { turns: 5, magnitude: 1 }));
    boostSideMorale(enemiesOf(casterId), -20);
    return '아군 전체의 무력과 지력이 크게 오르고, 적 전체가 크게 동요했다.';
  },
  sinhwagye(targetId) {
    const target = ROSTER[targetId];
    const pos = npcMapPos(targetId);
    const boosted = StatusEffects.isConfused(targetId) ||
      StatusEffects.fireTilesForMap(MapView.currentMapId).some((t) => pos && t.x === pos.x && t.y === pos.y);
    if (pos) StatusEffects.igniteTile(MapView.currentMapId, pos.x, pos.y, { dps: boosted ? 300 : 200, ticks: 3 });
    return `${target.name}의 진영에 불길이 치솟았다${boosted ? ' (이미 혼란/화염 상태라 피해가 50% 더 커졌다)' : ''}.`;
  },
  sipmyeonmaebok(targetId, deputyId, casterId) {
    const enemies = enemiesOf(casterId);
    enemies.forEach((eid) => {
      const a = armyFor(eid);
      a.troop = Math.max(0, Math.round(a.troop * 0.8));
      StatusEffects.applyArmyStatus(eid, 'apMult', { turns: 2, magnitude: 0.5 });
    });
    const confused = shuffled(enemies).slice(0, 2);
    confused.forEach((eid) => StatusEffects.applyArmyStatus(eid, 'confuse', { turns: 3 }));
    return `적 전체가 큰 피해를 입고 행동이 크게 굼떠졌으며, ${confused.map((eid) => ROSTER[eid].name).join(', ') || '일부'}의 군세가 혼란에 빠졌다.`;
  },
  isagyeollyu(targetId, deputyId, casterId) {
    enemiesOf(casterId).forEach((eid) => {
      const a = armyFor(eid);
      a.troop = Math.max(0, Math.round(a.troop * 0.8));
      StatusEffects.applyArmyStatus(eid, 'apMult', { turns: 5, magnitude: 0.5 });
      StatusEffects.applyArmyStatus(eid, 'moveCostMult', { turns: 5, magnitude: 2 });
    });
    return '적 전체가 큰 피해를 입고, 앞으로 한동안 움직임이 크게 둔해졌다.';
  },
  gyeonbyeokgeosu(targetId, deputyId, casterId) {
    alliedCastersOf(casterId).forEach((aid) => StatusEffects.applyArmyStatus(aid, 'dmgTakenMult', { turns: 3, magnitude: 0.7 }));
    enemiesOf(casterId).forEach((eid) => {
      StatusEffects.applyArmyStatus(eid, 'stratSuccessMult', { turns: 3, magnitude: 0.5 });
      StatusEffects.applyArmyStatus(eid, 'moveMoraleCost', { turns: 3, magnitude: 1 });
    });
    return '아군 전체가 굳게 방비를 갖췄다. 적이 섣불리 움직이면 사기가 떨어질 것이다.';
  },
  jeonggunsuseup(targetId, deputyId, casterId) {
    alliesOf(casterId).forEach((aid) => {
      const a = armyFor(aid);
      const maxTroop = armyMaxTroop(ROSTER[aid]);
      a.troop = Math.min(maxTroop, Math.round(a.troop * 1.4));
      StatusEffects.clearArmyStatus(aid);
    });
    return '아군 군세 전원이 병력을 크게 수습하고, 온갖 이상 상태에서 벗어났다.';
  },

  // ---- A급 ----
  palmungeumswaejin(targetId, deputyId, casterId) {
    const pos = npcMapPos(targetId);
    const affected = enemiesOf(casterId).filter((eid) => tileDist(npcMapPos(eid), pos) <= 3);
    affected.forEach((eid) => {
      StatusEffects.applyArmyStatus(eid, 'gradeBoost', { turns: 3, magnitude: -1 });
      StatusEffects.applyArmyStatus(eid, 'stratSuccessMult', { turns: 3, magnitude: 0.5 });
    });
    return `${ROSTER[targetId].name} 주변 적 군세 ${affected.length}개의 기세와 계책이 크게 꺾였다.`;
  },
  yeonhwangye(targetId, deputyId, casterId) {
    const chained = enemiesOf(casterId).slice(0, 5);
    if (chained.length >= 2) StatusEffects.linkChain(chained, 0.3);
    return `적 군세 ${chained.length}개가 쇠사슬로 묶여 서로의 피해를 나눠 받게 되었다.`;
  },
  // 인접한 적 "전부"가 대상 - 반목(B급)은 같은 로직에서 1명만 고른다.
  igangye(targetId, deputyId, casterId) { return triggerEnemyInfighting(targetId, null, casterId); },
  ildaeilro(targetId, deputyId, casterId) {
    alliesOf(casterId).forEach((aid) => {
      StatusEffects.applyArmyStatus(aid, 'evade', { turns: 1, magnitude: 0.5 });
      StatusEffects.applyArmyStatus(aid, 'dmgDealtMult', { turns: 1, magnitude: 1.5 });
    });
    return '아군 전체가 회피 태세에 들어갔다. 회피에 성공하면 다음 공격이 더욱 매서워질 것이다.';
  },
  baesujin(targetId, deputyId, casterId) {
    alliesOf(casterId).forEach((aid) => {
      const morale = moraleOf(aid);
      const lowMoraleBoost = Math.max(1, 100 / Math.max(1, morale));
      StatusEffects.applyArmyStatus(aid, 'dmgDealtMult', { turns: 3, magnitude: 1.2 * lowMoraleBoost });
      StatusEffects.applyArmyStatus(aid, 'dmgTakenMult', { turns: 3, magnitude: 1.1 });
    });
    return '아군이 물러설 곳 없는 배수진을 쳤다. 사기가 낮을수록 오히려 더 거세게 맞받아칠 것이다.';
  },
  gunsimjangak(targetId, deputyId, casterId) {
    const allies = alliesOf(casterId);
    allies.forEach((aid) => {
      StatusEffects.clearArmyStatus(aid, 'confuse');
      StatusEffects.clearArmyStatus(aid, 'fear');
      StatusEffects.clearArmyStatus(aid, 'taunt');
      StatusEffects.applyArmyStatus(aid, 'immune', { turns: 3 });
    });
    boostSideMorale(allies, 40);
    return '아군 전체의 사기가 크게 오르고, 혼란·공포·도발에서 벗어나 당분간 그 어떤 것도 통하지 않게 되었다.';
  },

  // ---- B급 ----
  // (응변진/철벽수성/벽력거는 병종·사거리·성벽 내구도 시스템이 아직 없어
  // 제외했고, 반계/책략봉쇄/간파는 "적이 책략을 시전한다"는 시스템 자체가
  // 없어서 아직 보류한다 - 이 셋은 STRATEGY_EFFECTS에 없어 castable
  // 목록에서 자동으로 빠진다.)
  // 퇴로봉쇄: [전투]의 "적 격파" 분기에는 guaranteedCapture를 확인해 포획을
  // 강제하도록 연결해뒀지만, "플레이어가 격파당하는" 분기에는 대응하는
  // 포획 판정 자체가 없다(그런 개념 자체가 아직 없음) - 그래서 적이 이걸
  // 플레이어에게 걸어도 위험하지 않고, 그냥 아직은 효과가 없을 뿐이다.
  toerobongswae(targetId) {
    StatusEffects.applyArmyStatus(targetId, 'guaranteedCapture', { turns: 2 });
    return `${ROSTER[targetId].name}의 퇴로를 끊었다. 2턴 안에 무너뜨리면 반드시 포박할 수 있을 것이다.`;
  },
  heosiljeonhwan(targetId, deputyId, casterId) {
    const BUFF_TYPES = ['dmgDealtMult', 'dmgTakenMult', 'gradeBoost', 'evade', 'immune', 'apMult', 'moveCostMult', 'stratSuccessMult', 'moveMoraleCost'];
    const stolen = StatusEffects.activeStatuses(targetId).filter((s) => BUFF_TYPES.includes(s.type));
    stolen.forEach((s) => {
      StatusEffects.applyArmyStatus(casterId, s.type, { turns: s.turnsLeft, magnitude: s.magnitude });
      StatusEffects.clearArmyStatus(targetId, s.type);
    });
    return stolen.length
      ? `${ROSTER[targetId].name}의 버프를 모두 빼앗아 아군에게 옮겨왔다.`
      : `${ROSTER[targetId].name}에게는 빼앗을 버프가 없었다.`;
  },
  yueonbieo(targetId, deputyId, casterId) {
    const enemies = enemiesOf(casterId);
    boostSideMorale(enemies, -10);
    const confused = [];
    dedupeByMoralePool(enemies).forEach((eid) => {
      if (moraleOf(eid) <= 50) {
        // 사기 풀을 공유하는 쪽(플레이어 쪽)이면 그 풀의 모든 군세에 함께 건다.
        (isPlayerSide(eid) ? enemies.filter(isPlayerSide) : [eid]).forEach((id) => StatusEffects.applyArmyStatus(id, 'confuse', { turns: 2 }));
        confused.push(ROSTER[eid].name);
      }
    });
    return `적 전체의 사기가 크게 흔들렸다${confused.length ? `. ${confused.join(', ')}의 군세가 혼란에 빠졌다` : ''}.`;
  },
  gongsimgye(targetId, deputyId, casterId) {
    const enemies = enemiesOf(casterId);
    boostSideMorale(enemies, -10);
    const fled = [];
    dedupeByMoralePool(enemies).forEach((eid) => {
      if (moraleOf(eid) <= 20 && !isPlayerSide(eid)) { // 플레이어 쪽 퇴각(패주) 개념은 아직 없다
        GameState.npcStatus[eid] = 'fled';
        MapView.removeNpc(eid);
        fled.push(ROSTER[eid].name);
      }
    });
    return `적 전체의 사기가 크게 흔들렸다${fled.length ? `. ${fled.join(', ')}의 군세는 그대로 퇴각했다` : ''}.`;
  },
  gomu(targetId, deputyId, casterId) {
    boostSideMorale(alliesOf(casterId), 20);
    return '아군 전체의 사기가 크게 올랐다.';
  },
  // 반목: 이간계와 같은 로직이지만 인접한 적 1명만 무작위로 고른다.
  banmok(targetId, deputyId, casterId) { return triggerEnemyInfighting(targetId, 1, casterId); },
  heobo(targetId) {
    const target = ROSTER[targetId];
    // 플레이어 쪽엔 "지도에서 퇴각시킨다"는 개념 자체가 없다(포획과 마찬가지로
    // 아직 플레이어가 패배하는 경로가 안 만들어져 있음) - 적이 이걸 걸어도
    // 안전하게 아무 일도 없을 뿐, 위험하지 않다.
    if (isPlayerSide(targetId)) return `${target.name}이(가) 겁을 먹었지만, 물러날 곳이 없어 그 자리를 지켰다.`;
    GameState.npcStatus[targetId] = 'fled';
    MapView.removeNpc(targetId);
    return `${target.name}의 군세가 겁을 먹고 그대로 퇴각했다.`;
  },
  gullyangbogeup(targetId, deputyId, casterId) {
    alliesOf(casterId).forEach((aid) => { const a = armyFor(aid); a.rice = Math.round(a.rice * 1.5); });
    return '아군 군세의 군량이 크게 늘었다.';
  },
  gullyangchadan(targetId) {
    const a = armyFor(targetId);
    a.rice = Math.max(0, Math.round(a.rice * 0.7));
    return `${ROSTER[targetId].name}의 군량 보급로를 끊어 군량이 크게 줄었다.`;
  },
  uibyeongmojip(targetId, deputyId, casterId) {
    const allies = alliesOf(casterId);
    allies.forEach((aid) => {
      const a = armyFor(aid);
      const maxTroop = armyMaxTroop(ROSTER[aid]);
      a.troop = Math.min(maxTroop, Math.round(a.troop * 1.2));
    });
    boostSideMorale(allies, 10);
    return '의병이 모여들어 아군 병력이 늘고 사기도 올랐다.';
  },

  // ---- C급 ----
  // (연노지휘는 병종 궁병 시스템이 아직 없어 제외, 책략봉쇄도 반계/간파와
  // 같은 이유로 보류한다.)
  giseup(targetId, deputyId, casterId) {
    StatusEffects.applyArmyStatus(casterId, 'forceFirstStrike', { turns: 1 });
    StatusEffects.applyArmyStatus(targetId, 'apMult', { turns: 2, magnitude: 0.5 });
    return `다음 교전에서 아군이 반드시 선제공격하며, ${ROSTER[targetId].name}의 행동력이 크게 줄었다.`;
  },
  sugong(targetId) {
    StatusEffects.applyArmyStatus(targetId, 'apMult', { turns: 3, magnitude: 0.7 });
    StatusEffects.applyArmyStatus(targetId, 'moveCostMult', { turns: 3, magnitude: 1.5 });
    return `${ROSTER[targetId].name}의 진영에 물난리가 나 움직임이 크게 둔해졌다.`;
  },
  hwagong(targetId) {
    const pos = npcMapPos(targetId);
    if (pos) StatusEffects.igniteTile(MapView.currentMapId, pos.x, pos.y, {});
    return `${ROSTER[targetId].name}의 진영에 불을 놓았다.`;
  },
  hollan(targetId, deputyId) {
    StatusEffects.applyArmyStatus(targetId, 'confuse', { turns: 2, sourceId: deputyId });
    return `${ROSTER[targetId].name}의 군세가 혼란에 빠졌다.`;
  },
  dobal(targetId, deputyId) {
    StatusEffects.applyArmyStatus(targetId, 'taunt', { turns: 2, sourceId: deputyId });
    return `${ROSTER[targetId].name}의 군세가 도발에 넘어갔다.`;
  },
  heojangseongse(targetId, deputyId) {
    StatusEffects.applyArmyStatus(targetId, 'fear', { turns: 2, sourceId: deputyId });
    return `${ROSTER[targetId].name}의 군세가 공포에 질렸다.`;
  },
  // 매복: "다음 턴 공격"은 다음달이 아니라 다음 [전투] 교전 1회를 뜻해서,
  // resolveArmyBattle에서 실제로 반격을 막은 순간 즉시 소모(clear)된다.
  maebok(targetId) {
    StatusEffects.applyArmyStatus(targetId, 'noCounter', { turns: 1 });
    return `${ROSTER[targetId].name}의 군세 배후에 매복했다. 다음 공격에는 반격당하지 않을 것이다.`;
  },
  gyeongryeo(targetId, deputyId, casterId) {
    StatusEffects.applyArmyStatus(casterId, 'dmgDealtMult', { turns: 2, magnitude: 1.1 });
    boostSideMorale([casterId], 15);
    return '아군의 사기가 오르고 다음 공격이 더 매서워질 것이다.';
  },
  gyeonsu(targetId, deputyId, casterId) {
    StatusEffects.applyArmyStatus(casterId, 'dmgTakenMult', { turns: 2, magnitude: 0.65 });
    return '아군의 방어 태세가 크게 강화되었다.';
  },
  wibo(targetId) {
    StatusEffects.applyArmyStatus(targetId, 'dmgDealtMult', { turns: 3, magnitude: 0.85 });
    StatusEffects.applyArmyStatus(targetId, 'stratSuccessMult', { turns: 3, magnitude: 0.85 });
    return `${ROSTER[targetId].name}의 공격력과 지략이 둔해졌다.`;
  },
  chiryo(targetId, deputyId, casterId) {
    alliesOf(casterId).forEach((aid) => {
      const a = armyFor(aid);
      const maxTroop = armyMaxTroop(ROSTER[aid]);
      a.troop = Math.min(maxTroop, Math.round(a.troop * 1.1));
    });
    return '아군이 병력을 수습했다.';
  },
  seondong(targetId) {
    const a = armyFor(targetId);
    a.troop = Math.max(0, Math.round(a.troop * 0.9));
    boostSideMorale([targetId], -10);
    return `${ROSTER[targetId].name}의 군세에서 동요가 일어나 병력이 줄고 사기가 떨어졌다.`;
  },
  // 질주: 플레이어는 행동력(GameState.ap)을 그 자리에서 즉시 늘려준다 - 적은
  // 이런 "당장 쓸 수 있는 포인트 자원" 개념이 없고 매달 계산되는 이동 예산
  // (apMult)만 있어서, 대신 그 예산에 1턴짜리 배율 버프를 걸어준다(다음
  // AI 이동에 바로 반영됨). 두 자원 모델 자체가 달라 완전히 같은 방식으로
  // 만들 수는 없지만, "이번 기회에 더 많이 움직인다"는 효과는 동일하다.
  jilju(targetId, deputyId, casterId) {
    if (isPlayerSide(casterId)) {
      const bonus = Math.round(effectiveApMax() * 0.5);
      GameState.ap += bonus;
      return `아군의 행동력이 즉시 ${bonus} 늘었다.`;
    }
    StatusEffects.applyArmyStatus(casterId, 'apMult', { turns: 1, magnitude: 1.5 });
    return `${ROSTER[casterId].name}의 군세가 크게 빨라졌다.`;
  },

  // ---- D급 ----
  gyeongmun(targetId, deputyId, casterId) {
    boostSideMorale(enemiesOf(casterId), -5);
    return '적 전체의 사기가 소폭 떨어졌다.';
  },
  eungwon(targetId, deputyId, casterId) {
    boostSideMorale([casterId], 10);
    return '아군의 사기가 소폭 올랐다.';
  },
  eunggeupcheochi(targetId, deputyId, casterId) {
    alliesOf(casterId).forEach((aid) => {
      const a = armyFor(aid);
      const maxTroop = armyMaxTroop(ROSTER[aid]);
      a.troop = Math.min(maxTroop, Math.round(a.troop * 1.05));
    });
    return '아군이 병력을 소폭 회복했다.';
  },
};

function castNamedStrategy(sid, targetId, deputyId, casterCommanderId) {
  const desc = STRATEGY_EFFECTS[sid](targetId, deputyId, casterCommanderId);
  markStrategyUsed(sid);
  Dialogue.show([{ speaker: ROSTER[deputyId].name, text: `${STRATEGIES[sid].name}!` }, { speaker: '내레이션', text: desc }], () => {
    updateHUD();
    // 허보/공심계처럼 대상이 그 자리에서 퇴각해버릴 수 있다 - 이미 지도에서
    // 사라진 상대에게는 다시 커맨드 메뉴를 띄우지 않는다(전투 종료/맵 클리어
    // 체크는 기존 퇴각 처리와 동일하게 넘긴다).
    if (stage === 'warmap') checkWarmapClear();
    if (MapView.liveNpcIds.includes(targetId)) openWarCommandMenu(targetId);
  });
}

function attemptStrategy(id) {
  const rd = ROSTER[id];
  const ctx = resolveWarArmy(rd);
  if (!ctx) { toast(`${rd.name}과(와) 싸우려면 먼저 유비군을 편성해야 합니다.`); return; }
  const deputyId = ctx.army.deputy;
  const deputy = deputyId ? ROSTER[deputyId] : null;
  if (!deputy) {
    toast('책략을 쓰려면 군세 편성에서 책사를 부장으로 등용해야 합니다.');
    openWarCommandMenu(id);
    return;
  }
  if (!spend(STRATEGY_AP_COST)) return;
  // 실제 효과가 구현된 책략 중, 지금 쓸 수 있는(전투당/월 1회 제한에 걸리지
  // 않은) 것만 골라 선택지로 보여준다 - 없으면 기존 범용 책략으로 바로 나간다.
  const castable = strategiesFor(deputyId).filter((sid) => STRATEGY_EFFECTS[sid] && strategyIsUsable(sid));
  if (!castable.length) { castGenericStrategy(id, ctx, deputy); return; }
  const options = castable.map((sid) => ({
    label: `${STRATEGIES[sid].name}(${STRATEGIES[sid].grade}급)`,
    cb: () => castNamedStrategy(sid, id, deputyId, ctx.commanderId),
  }));
  options.push({ label: '기본 계책 (적 공격력 약화)', cb: () => castGenericStrategy(id, ctx, deputy) });
  showChoice(`${deputy.name}의 책략 - 무엇을 쓰시겠습니까?`, options);
}

function attemptDuelChallenge(id) {
  const rd = ROSTER[id];
  if (!spend(DUEL_AP_COST)) return;
  if (id === 'jangsun') { // 장순은 절대 일기토에 응하지 않는다 - 반드시 군세전투로 넘어간다
    Dialogue.show([{ speaker: rd.name, text: '흥, 필부의 결투 따위로 대세를 바꿀 성싶으냐! 전군으로 붙어보자!' }], () => {
      toast('장순이 일기토를 거절했다.');
      openWarCommandMenu(id);
    });
    return;
  }
  const ctx = resolveWarArmy(rd);
  const challengerGrade = ctx ? warArmyGrade(ctx) : 'D';
  const defenderGrade = enemyArmyGrade(rd);
  // 도발에 걸린 상대에게 거는 일기토는 반드시 성사된다.
  const chance = StatusEffects.isTaunted(id) ? 100 : duelAcceptChance(challengerGrade, defenderGrade);
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

// StatusEffects(js/engine/status-effects.js)는 ROSTER/MapView를 모르는 순수
// 모듈이라, "화염 타일에 누가 서있는지"/"그 대상에게 피해를 입혀라"는 여기서
// 어댑터로 연결해준다. 아직 어떤 책략도 igniteTile을 호출하지 않으므로
// 실제 게임에서는 항상 빈 목록이 돌아와 아무 일도 일어나지 않는다.
function fireTileOccupantsAt(x, y) {
  const occ = [];
  const pos = MapView.playerPos;
  if (GameState.army && pos.x === x && pos.y === y) occ.push(GameState.army.commanderId);
  const mapSpec = MAPS[MapView.currentMapId];
  for (const n of (mapSpec ? mapSpec.npcs : [])) {
    if (n.x === x && n.y === y && MapView.liveNpcIds.includes(n.id)) occ.push(n.id);
  }
  return occ;
}
function applyFireTileDamage(occId, dps) {
  if (GameState.army && occId === GameState.army.commanderId) {
    GameState.army.troop = Math.max(0, GameState.army.troop - dps);
    MapView.showDamageFloat(occId, dps);
  } else if (ROSTER[occId]) {
    ROSTER[occId].troop = Math.max(0, ROSTER[occId].troop - dps);
    MapView.showDamageFloat(occId, dps);
  }
}

// [전투] 한 번 = 딱 한 교전. 속도가 빠른 쪽이 먼저 때리고, 그 한 방으로
// 상대가 쓰러지면 반격 없이 그대로 끝난다. 공격이 이번 행동의 마지막
// 액션이라 행동력을 2 소모하고, 양쪽 다 살아남으면 결과만 보여준 뒤
// 멈춘다 - 계속하려면 다시 [전투]를 눌러야 한다.
const ARMY_BATTLE_AP_COST = 2;
const DUEL_AP_COST = 1;
const STRATEGY_AP_COST = 1;
function resolveArmyBattle(id) {
  const rd = ROSTER[id];
  const ctx = resolveWarArmy(rd);
  if (!ctx) { toast(`${rd.name}과(와) 싸우려면 먼저 유비군을 편성해야 합니다.`); return; }
  if (!spend(ARMY_BATTLE_AP_COST)) return;
  const army = ctx.army;
  const commanderName = ROSTER[ctx.commanderId].name;
  const showOnMap = rd.warArmy !== 'ally'; // 유비군은 지도에 별도 스프라이트가 없다
  const playerKey = ctx.commanderId;

  const lock = getWarLock(id, ctx);
  // 기습(forceFirstStrike)이 걸려 있으면 속도와 무관하게 반드시 선타를 친다.
  const playerFirst = StatusEffects.hasStatus(playerKey, 'forceFirstStrike') || warArmySpeed(ctx) >= rd.stats.spd;
  const lines = [{
    speaker: '내레이션',
    text: playerFirst ? `${commanderName}군이 더 빨라 선제공격!` : `${rd.name}의 군세가 더 빨라 선제공격!`,
  }];
  let enemyDown = false, playerDown = false;

  // 연환계로 묶인 군세끼리는 한쪽이 입는 피해의 일부를 나머지도 함께 입는다.
  function chainDamage(otherId, amount) {
    const other = ROSTER[otherId];
    if (!other) return;
    other.troop = Math.max(0, other.troop - amount);
    MapView.showDamageFloat(otherId, amount);
    lines.push({ speaker: '내레이션', text: `연환계로 묶인 ${other.name}의 군세에도 ${amount}명 피해가 전이되었다.` });
  }

  // 책략 버프(주는/받는피해 배율)는 새 시스템을 안 만들고 이 마지막 계산
  // 단계에서 고정 피해량에 배율만 곱해서 반영한다. 회피는 그 배율까지 다
  // 적용한 다음, 병력에 실제로 반영되기 직전 마지막 관문으로 판정한다
  // (일기토가 아니라 군세간 [전투]이므로 이 순서가 맞다).
  function finalDamage(baseDmg, attackerId, defenderId) {
    const withMult = Math.max(1, Math.round(baseDmg * StatusEffects.dmgDealtMult(attackerId) * StatusEffects.dmgTakenMult(defenderId)));
    return StatusEffects.rollEvade(defenderId) ? 0 : withMult;
  }

  function playerStrikes() {
    const dmg = finalDamage(lock.playerHit, playerKey, id);
    rd.troop = Math.max(0, rd.troop - dmg);
    MapView.showDamageFloat(id, dmg);
    if (showOnMap) MapView.showAttackBump(GameState.mainHero);
    lines.push({ speaker: '내레이션', text: dmg > 0 ? `${commanderName}군의 공격! ${rd.name}의 군세에 ${dmg}명 피해.` : `${commanderName}군의 공격! ${rd.name}의 군세가 완전히 회피했다.` });
    if (dmg > 0) StatusEffects.propagateDamage(id, dmg, chainDamage);
    if (rd.troop <= 0) enemyDown = true;
  }
  function enemyStrikes() {
    const dmg = finalDamage(lock.enemyHit, id, playerKey);
    army.troop = Math.max(0, army.troop - dmg);
    if (showOnMap) MapView.showDamageFloat(GameState.mainHero, dmg);
    MapView.showAttackBump(id);
    lines.push({ speaker: '내레이션', text: dmg > 0 ? `${rd.name}의 군세가 공격! ${commanderName}군이 ${dmg}명 피해를 입었다.` : `${rd.name}의 군세가 공격! ${commanderName}군이 완전히 회피했다.` });
    if (army.troop <= 0) playerDown = true;
  }

  // 혼란에 걸린 쪽은 선타를 맞고도 반격하지 못한다. 매복(noCounter)은 그와
  // 별개로 "다음 교전 1회"만 막는 것이라, 한 번 쓰이면 즉시 소모된다.
  if (playerFirst) {
    playerStrikes();
    if (!enemyDown) {
      if (StatusEffects.isConfused(id)) lines.push({ speaker: '내레이션', text: `${rd.name}의 군세는 혼란에 빠져 반격하지 못했다!` });
      else if (StatusEffects.hasStatus(id, 'noCounter')) {
        lines.push({ speaker: '내레이션', text: `매복에 당한 ${rd.name}의 군세가 반격하지 못했다!` });
        StatusEffects.clearArmyStatus(id, 'noCounter');
      } else enemyStrikes();
    }
  } else {
    enemyStrikes();
    if (!playerDown) {
      if (StatusEffects.isConfused(playerKey)) lines.push({ speaker: '내레이션', text: `${commanderName}군은 혼란에 빠져 반격하지 못했다!` });
      else if (StatusEffects.hasStatus(playerKey, 'noCounter')) {
        lines.push({ speaker: '내레이션', text: `매복에 당한 ${commanderName}군이 반격하지 못했다!` });
        StatusEffects.clearArmyStatus(playerKey, 'noCounter');
      } else playerStrikes();
    }
  }

  updateHUD();
  MapView.render();

  // 퇴로봉쇄로 "2턴 내 격파시 반드시 포박"이 걸려 있었는지는 아래
  // clearArmyStatus가 지우기 전에 미리 기억해둔다.
  const wasGuaranteedCapture = enemyDown && StatusEffects.hasStatus(id, 'guaranteedCapture');
  Dialogue.show(lines, () => {
    if (!enemyDown && !playerDown) {
      toast('한 차례 접전이 끝났다. 계속하려면 다시 [전투]를 사용하자.');
      return;
    }
    delete GameState.warLocks[id];
    StatusEffects.clearArmyStatus(id);
    StatusEffects.unlinkChain(id);
    if (id === 'jangsun') {
      resolveJangsunBattle({ winner: enemyDown ? 'player' : 'enemy', playerTroopsLeft: army.troop });
      return;
    }
    if (enemyDown && wasGuaranteedCapture) {
      captureCommander(id, () => { if (stage === 'warmap') checkWarmapClear(); });
    } else if (enemyDown) {
      Dialogue.show([{ speaker: '내레이션', text: `${rd.name}의 군세가 완전히 무너졌다! (아군 병력 ${army.troop}명 남음)` }], () => {
        GameState.npcStatus[id] = 'resolved';
        MapView.removeNpc(id);
        toast(`${rd.name}이(가) 패주했다.`);
        if (stage === 'warmap') checkWarmapClear();
      });
    } else {
      Dialogue.show([{ speaker: '내레이션', text: `아군이 ${rd.name}의 군세에 완전히 밀려 무너졌다.` }], () => {
        releaseCapturedOnDefeat();
        toast('전열을 정비해 다시 도전하자.');
      });
    }
  });
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

// 부장 1명당 20%p, 최대 60%(3명 이상) - 지휘관을 잃고 와해된 군세의 병력 중
// 이 비율만큼을 아군 세력 병력(예비 병력)으로 흡수한다.
function armyGeneralSalvagePct(count) {
  return Math.min(count, 3) * 20;
}

function captureCommander(id, afterCb) {
  const rd = ROSTER[id];
  GameState.npcStatus[id] = 'captured';
  GameState.capturedCommanders.push(id);

  const advisor = rd.deputy && ROSTER[rd.deputy];
  if (advisor) {
    // 군세장은 포로로 잡혔지만 책사가 지휘를 이어받는다 - 군세는 지도에 그대로
    // 남고 병력도 그대로지만, 이후 [전투]/일기토 계산에는 책사의 무력이
    // 대신 쓰여(대개 훨씬 낮다) 사실상 와해 수준으로 약해진다.
    rd.commanderCaptured = true;
    delete GameState.warLocks[id]; // 지휘관 교체로 다음 교전 피해량을 새로 계산해야 한다
    Dialogue.show([
      { speaker: '내레이션', text: `압도적인 실력차로 ${rd.name}을(를) 사로잡았다! 이번 전쟁이 끝나면 등용을 제안할 수 있을 것이다.` },
      { speaker: '내레이션', text: `지휘관을 잃은 ${rd.name}의 군세는 책사 ${advisor.name}이(가) 겨우 수습했지만, 사기가 크게 꺾여 오래 버티지 못할 것이다.` },
    ], () => {
      toast(`${rd.name}을(를) 포획! (군세는 ${advisor.name}이(가) 지휘)`);
      if (afterCb) afterCb();
    });
    return;
  }

  // 책사가 없으면 지휘 계통이 완전히 무너져 군세 자체가 와해된다 - 부장이
  // 있었다면 패잔병 일부를 그 자리에서 수습해 아군 세력 병력에 합류시킨다.
  const salvagePct = armyGeneralSalvagePct((rd.generals || []).length);
  const salvaged = salvagePct > 0 ? Math.round((rd.troop || 0) * salvagePct / 100) : 0;
  if (salvaged > 0) { GameState.addResource({ troop: salvaged }); updateHUD(); }
  StatusEffects.clearArmyStatus(id);
  StatusEffects.unlinkChain(id);
  MapView.removeNpc(id);

  const lines = [{ speaker: '내레이션', text: `압도적인 실력차로 ${rd.name}을(를) 사로잡았다! 이번 전쟁이 끝나면 등용을 제안할 수 있을 것이다.` }];
  lines.push(salvaged > 0
    ? { speaker: '내레이션', text: `지휘관을 잃은 ${rd.name}의 군세는 그 자리에서 무너졌지만, 부장들이 패잔병 ${salvaged}명을 수습해 아군에 합류시켰다.` }
    : { speaker: '내레이션', text: `지휘관을 잃은 ${rd.name}의 군세는 그 자리에서 완전히 무너졌다.` });
  Dialogue.show(lines, () => {
    toast(salvaged > 0 ? `${rd.name}을(를) 포획! 패잔병 ${salvaged}명 흡수. (병사 ${GameState.resources.troop})` : `${rd.name}을(를) 포획했다!`);
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
    if (stage === 'warmap' && rd.kind === 'enemy') {
      // 일반 승리(포획엔 못 미침) - 적장은 개인전에서 밀려 진영으로 돌아갈
      // 뿐, 병력 손실 없이 군세는 그대로 남는다. 대신 사기가 크게 꺾여
      // 이후 [전투] 피해 계산에 그대로 반영된다(fixedHitDamage의 사기 보정).
      rd.morale = Math.max(0, (rd.morale != null ? rd.morale : 100) - 10);
      delete GameState.warLocks[id]; // 사기가 바뀌었으니 다음 교전 피해량을 새로 계산해야 한다
      Dialogue.show([{ speaker: '내레이션', text: `${rd.name}이(가) 밀려 진영으로 물러났다! 군세의 사기가 크게 떨어졌다.` }], () => {
        toast(`${rd.name}의 군세 사기가 떨어졌다(${rd.morale}). [전투]로 몰아붙이자.`);
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
  if (stage === 'seoju_free' && !gs.flags.dogyeomDied
      && SEOJU_GREET_IDS.every((id) => !!gs.npcStatus[id])) {
    gs.flags.dogyeomDied = true;
    MapView.lockMovement(true);
    Dialogue.show(STORY.dogyeom_death, () => {
      MapView.removeNpc('dogyeom');
      MapView.lockMovement(false);
      gs.addFame(40);
      // 도겸의 옛 신하였던 미축·미방·진규·진등은 유언에 따라 별도의 등용
      // 절차 없이 그대로 유비를 섬기게 된다 (진규·진등은 도겸 생전에는
      // 대화만 나누고, 이 시점에야 비로소 실제로 합류한다).
      ['michuk', 'mibang', 'jingyu', 'jindeung'].forEach((id) => { if (!gs.recruited.includes(id)) gs.recruit(id, 0); });
      updateHUD();
      toast('유비가 서주목의 자리를 이어받았다. 미축·미방·진규·진등도 유비를 섬기게 되었다.');
    });
    return true;
  }
  if (stage === 'habi_camp' && gs.flags.habiStep === 1 && gs.resources.troop >= HABI_RECRUIT_GOAL) {
    triggerHabiRecruitComplete();
    return true;
  }
  return false;
}

// 하비성 모병 목표(HABI_RECRUIT_GOAL) 달성 시의 컷신 - "다음달" 버튼을 눌렀을
// 때(checkDeadlines)뿐 아니라, 목표를 채운 채로 곧장 유비에게 말을 걸었을
// 때(handleHabiYubi)도 같은 흐름을 타야 "병사가 부족하다"는 낡은 대사가
// 나오지 않는다.
function triggerHabiRecruitComplete() {
  GameState.flags.habiStep = 1.5; // 컷신 진행 중 - 완료 후 2로 넘어간다 (중복 발동 방지)
  MapView.lockMovement(true);
  Dialogue.show(STORY.habi_xuchang_intercept, () => {
    Dialogue.show(STORY.habi_messenger_call, () => {
      MapView.lockMovement(false);
      GameState.flags.habiStep = 2;
      updateHUD();
      centerAlert('유비를 찾아가 회의에 참석하자.');
    });
  });
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

// ---------------- 챕터2 (관우) : 서주 - 삼양서주 [장면1] ----------------
// 서주성 전용 지도 2장(seoju_siege=성문을 닫아건 대치 상태, seoju=조조군이
// 물러간 뒤 성문을 연 상태)을 쓴다 - 건물 배치는 완전히 동일하고 성문
// 통행 여부와 성벽 밖 진영 유무만 다르므로, js/data/maps.js에서 같은
// buildSeojuGrid() 함수로 함께 만든다.
const SEOJU_JOJO_ARMY_IDS = [
  'jojo_jungong', 'habudon_seoju', 'habuyeon_seoju', 'join_seoju',
  'johong_seoju', 'akjin_seoju', 'ugeum_seoju', 'ijeon_seoju',
];
// 자유탐방이 시작되면 곧바로(확률 없이) 등장하는 서주 사람들.
const SEOJU_FREEROAM_NPC_IDS = ['michuk', 'mibang', 'jingyu', 'jindeung', 'songgwan', 'jopyo'];
// 진군·서성은 도겸의 소개 없이 우연히 마주치는 희귀 출현 인재라, 자유탐방
// 시작 시점에 각자의 확률(ROSTER[id].chance)로 한 번만 등장 여부를 굴린다.
const SEOJU_RARE_RECRUIT_IDS = ['jingun', 'seoseong'];
// 손건과 달리 친밀도 없이 만나기만 하면 곧바로 등용되는 인물(가족·측근).
// 진규·진등은 도겸의 신하라, 도겸이 아직 살아있는 동안 유비 쪽으로
// 넘어오면 모양새가 좋지 않다 - 조표처럼 대화만 나누고, 실제 등용은
// 도겸의 죽음과 함께(다른 옛 신하들과 같은 시점에) 이뤄진다.
const SEOJU_INSTANT_JOIN_IDS = ['mibang'];
// "서주 인사 (0/3)" 임무 - 이 셋을 모두 만나면(등용 포함) 도겸이 서주를
// 넘기는 장면으로 이어진다. 미방은 유력 인사로 보기엔 무게감이 떨어져
// 조표로 바꿨다(미방은 여전히 SEOJU_INSTANT_JOIN_IDS로 찾아서 등용된다).
const SEOJU_GREET_IDS = ['jingyu', 'michuk', 'jopyo'];
// 다른 챕터 시작 컷신(예: STORY.intro)은 모두 MapView.load()로 지도를
// 먼저 깔아 explore-viewport 크기(모바일 회전 프리젠테이션의 실제 픽셀
// 크기)를 잡아둔 다음에 삽화 대사를 보여준다. 여기서 지도 로드를 대사
// 콜백 안(삽화가 다 끝난 뒤)으로 미뤘더니, 지도를 한 번도 로드한 적
// 없는 상태(예: 챕터2 미리보기로 곧장 진입한 경우)에서는 explore-viewport가
// 아직 크기를 잡지 못해 삽화가 작게 나오는 문제가 있었다. 삽화가 지도를
// 완전히 덮어버리므로(scene-illustration, z-index:2) 지도를 먼저 로드해도
// 화면상 보이는 건 똑같이 삽화뿐이라 순서를 바꿔도 안전하다.
function goSeojuFree() {
  stage = 'seoju_free';
  showScreen('screen-explore');
  GameState.flags.seojuArrived = true;
  MapView.load('seoju_siege', {
    onInteract: interactNPC,
    onApSpent: updateHUD,
    onApBlocked,
    onAmbientInteract: runAmbientEvent,
    onStep: renderMinimap,
  });
  MapView.lockMovement(true);
  updateHUD();
  Dialogue.show(STORY.seoju_urgent_call, () => {
    // 카메라가 조조 진영(반달 대형) 쪽을 비춰주며 첫 대사와 자연스럽게
    // 이어지도록 한다 - 초승달 대형은 위쪽(우금 15)보다 아래쪽(조조/조인/조홍
    // 20~22)에 병력이 더 몰려 있어, 중앙(19)보다 살짝 아래(20)를 비추면
    // 좁은 모바일 화면에서도 병력이 더 많이 보인다.
    MapView.panCameraTo(15, 20, 700);
    // 대치 중인 군세는 자유롭게 돌아다니기보다 대열을 유지한 채 한두 칸
    // 정도만 자세를 바꾸는 편이 실제 진영다워 보인다 (radius:1).
    MapView.startNpcStir(SEOJU_JOJO_ARMY_IDS, { radius: 1, intervalMs: 900 });
    // seoju_wall_standoff_intro는 holdMs로 3초 뒤 자동 진행되고, 이어지는
    // seoju_wall_standoff(장비-우금 접전)까지는 계속 조조 진영을 비춰준다 -
    // "저것이 조조의 군세다" 같은 대사가 나오는 동안은 그걸 보고 있어야
    // 자연스럽다. 우금이 패퇴한 다음에야 성 안으로 들어가는 것이므로,
    // 그 시점에 플레이어를 성문 앞으로 옮기고 카메라도 되돌린다.
    Dialogue.show(STORY.seoju_wall_standoff_intro, () => {
      Dialogue.show(STORY.seoju_wall_standoff, () => {
        MapView.stopNpcStir();
        // 성문 앞이 아니라 성벽 위(문루 오른쪽, 일부러 두껍게 만든 성벽 구간)에서
        // 도겸을 만난다 - 유비/도겸도 함께 등장시켜 세 사람이 모여 있는 것처럼 보인다.
        MapView.setPlayerPos(23, 12);
        MapView.addNpc('yubi');
        MapView.addNpc('dogyeom');
        MapView.clearCameraFocus();
        Dialogue.show(STORY.seoju_wall_standoff_city, () => {
          // 편지를 받은 조조가 곽가와 상의하는 장면이므로, 다시 조조 진영을 비춰준다.
          MapView.panCameraTo(15, 20, 700);
          Dialogue.show(STORY.puyang_report_retreat, () => {
            // 조조군이 물러가며 그림 자체가 바뀐다(성문 닫힘 -> 열림, 진영
            // 철거) - 같은 지도에서 NPC만 지우는 대신 지도를 통째로 갈아
            // 끼운다. movementLocked 상태는 load()가 건드리지 않으므로
            // dogyeom_disband가 끝날 때까지 계속 잠겨 있다.
            MapView.load('seoju', {
              onInteract: interactNPC,
              onApSpent: updateHUD,
              onApBlocked,
              onAmbientInteract: runAmbientEvent,
              onStep: renderMinimap,
            });
            updateHUD();
            Dialogue.show(STORY.dogyeom_disband, () => {
              MapView.lockMovement(false);
              GameState.flags.seojuFreeRoam = true;
              SEOJU_FREEROAM_NPC_IDS.forEach((id) => MapView.addNpc(id));
              SEOJU_RARE_RECRUIT_IDS.forEach((id) => {
                if (Math.random() < (ROSTER[id].chance || 0.2)) MapView.addNpc(id);
              });
              toast('서주 성내를 둘러보자.');
            });
          });
        });
      });
    });
  });
}

// ---------------- 챕터2 (관우) : 하비성 관청 [장면2] ----------------
// 실제 하비 관청 배경/지도가 만들어지기 전까지는 반동탁연합 진영 지도를
// 임시로 재사용한다. habiStep으로 진행 단계를 추적한다:
// 0=유비를 아직 못 만남, 1=여포 정착 후 병사 모집 중, 1.5=밀서 컷신 진행 중
// (중복 발동 방지), 2=회의 대기, 3=원술 정벌 출정 완료.
function goHabiCamp() {
  stage = 'habi_camp';
  showScreen('screen-explore');
  MapView.load('habi', {
    onInteract: interactNPC,
    onApSpent: updateHUD,
    onApBlocked,
    onAmbientInteract: runAmbientEvent,
    onStep: renderMinimap,
  });
  updateHUD();
  Dialogue.show(STORY.habi_intro, () => {
    centerAlert('유비를 찾아가자.');
  });
}

function handleHabiYubi() {
  const step = GameState.flags.habiStep || 0;
  if (step === 0) {
    Dialogue.show(STORY.habi_yeopo_debate, () => {
      showChoice('여포를 서주에 받아들이는 것을 어떻게 생각하는가?', [
        { label: '반대한다', cb: () => {
          Dialogue.show([{ speaker: '관우', text: '여포는 자기 군주도 해하고 배신하는 믿을 수 없는 자입니다.' }], () => {
            Dialogue.show(STORY.habi_yeopo_result, () => {
              GameState.flags.habiStep = 1;
              updateHUD();
              toast('진등을 찾아가 병사를 모집하며 세력을 키우자.');
            });
          });
        } },
        { label: '찬성한다', cb: () => {
          Dialogue.show([{ speaker: '관우', text: '여포가 머문다면 조조도 쉽게 서주를 공격하진 못할 겁니다.' }], () => {
            Dialogue.show(STORY.habi_yeopo_result, () => {
              GameState.flags.habiStep = 1;
              updateHUD();
              toast('진등을 찾아가 병사를 모집하며 세력을 키우자.');
            });
          });
        } },
      ]);
    });
    return;
  }
  if (step === 1) {
    if (GameState.resources.troop >= HABI_RECRUIT_GOAL) {
      triggerHabiRecruitComplete();
      return;
    }
    Dialogue.show([{ speaker: '유비', text: `아직 병사가 부족하네 (${GameState.resources.troop}/${HABI_RECRUIT_GOAL}). 진등을 찾아가 병사를 모아주게.` }]);
    return;
  }
  if (step === 2) {
    Dialogue.show(STORY.habi_council, () => {
      GameState.flags.habiStep = 3; // 회의 완료 - 이제 우측 상단 [원술 토벌 출전] 버튼으로 원할 때 출정한다
      updateHUD();
      centerAlert('준비되면 우측 상단 [원술 토벌 출전] 버튼으로 출정하자.');
    });
    return;
  }
  Dialogue.show([{ speaker: '유비', text: '채비는 끝났네. 준비되면 [원술 토벌 출전]으로 출정하세.' }]);
}

// 회남 벌판은 관우군(기령 담당)과 유비군(교유 담당)을 각각 편성해 따로
// 지휘한다 - 두 군세 모두 플레이어가 직접 짜므로, 같은 인물을 두 군세에
// 겹쳐 넣을 수 없도록 관우군에서 고른 부장/책사는 유비군 후보에서 뺀다.
// 회의(habiStep 3) 완료 후 우측 상단 [원술 토벌 출전] 버튼에서 호출된다.
function startWonsulExpedition() {
  openArmyBox(() => {
    Dialogue.show([{ speaker: '유비', text: '나도 따로 한 부대를 이끌고 교유를 치겠네. 내 군세도 좀 꾸려주게.' }], () => {
      openArmyBox(goHoenamBattle, {
        commanderId: 'yubi',
        field: 'allyArmy',
        excludeIds: [GameState.army.deputy, ...GameState.army.generals].filter(Boolean),
        desc: '교유를 상대할 유비군을 꾸리세요.',
      });
    });
  });
}

// 진등에게 직접 찾아가 병사를 모집한다 - 행동력을 써서 병력을 조금씩
// 늘리는, 자동 증가가 아닌 실제 플레이어 행동으로 채우는 미션이다. 목표
// (HABI_RECRUIT_GOAL)를 채운 뒤에도 모집 자체는 막지 않는다 - 이후 원술
// 정벌에 데려갈 병력을 더 불려두고 싶을 수 있으므로, 그 뒤로는 그냥 평범한
// 상시 모집 NPC로 남는다.
function handleJindeungRecruit() {
  const step = GameState.flags.habiStep || 0;
  if (step === 0) {
    Dialogue.show([{ speaker: '진등', text: '이 진등, 힘닿는 데까지 병력을 모아보겠습니다.' }]);
    return;
  }
  if (!spend(2)) return;
  const gained = 300 + Math.floor(Math.random() * 300);
  GameState.addResource({ troop: gained });
  updateHUD();
  const progressNote = step === 1 ? `(${GameState.resources.troop}/${HABI_RECRUIT_GOAL})` : `(총 ${GameState.resources.troop}명)`;
  Dialogue.show([{ speaker: '진등', text: `근방 장정들을 더 모아왔습니다. 병사 ${gained}명을 더 모았습니다. ${progressNote}` }]);
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
    return;
  }
  checkHoenamClear();
}

// ---------------- 챕터2 (관우) : 회남 벌판 [장면3, 원술 정벌] ----------------
function goHoenamBattle() {
  stage = 'warmap';
  GameState.ap = effectiveApMax();
  showScreen('screen-explore');
  MapView.load('hoenam', {
    onInteract: interactNPC,
    onApSpent: updateHUD,
    onApBlocked,
    onStep: renderMinimap,
  });
  updateHUD();
  Dialogue.show(STORY.hoenam_intro);
}

// 기령(관우군)과 교유(유비군)를 각각 실제로 격파해야 원술이 잔여 세력과
// 성에 틀어박힌다. 곧이어 장비가 하비 함락 소식을 갖고 도착하며 원술 정벌이
// 중단된다 - 챕터2의 결말이다.
// 성문 앞을 지키던 선봉 뇌박·진란을 둘 다 관우군이 무너뜨리면, 뒤에 있던
// 원술은 더 버티지 못하고 남은 병력을 이끌고 성 안으로 물러난다 - 원술
// 본인과는 이번 장면에서 싸우지 않는다(성벽에 남은 이는 장식용 서사뿐).
// afterCb는 항상(대사가 뜨든 안 뜨든) 정확히 한 번 호출된다 - checkHoenamClear가
// 이어서 기령/교유 완료 여부를 확인할 때 두 대사가 동시에 겹쳐 뜨지 않도록
// 순서를 맞추기 위함이다.
function checkWonsulRetreat(afterCb) {
  const done = (id) => ['resolved', 'recruited', 'fled', 'captured'].includes(GameState.npcStatus[id]);
  if (GameState.flags.wonsulRetreated || !done('noebak') || !done('jinran')) {
    if (afterCb) afterCb();
    return;
  }
  GameState.flags.wonsulRetreated = true;
  MapView.removeNpc('wonsul');
  Dialogue.show([{ speaker: '내레이션', text: '앞서 나와 있던 뇌박과 진란이 무너지자, 원술은 남은 병력을 이끌고 성 안으로 황급히 물러났다.' }], afterCb);
}

function checkHoenamClear() {
  if (MapView.currentMapId !== 'hoenam' || GameState.flags.hoenamCleared) return;
  checkWonsulRetreat(() => {
    const done = (id) => ['resolved', 'recruited', 'fled', 'captured'].includes(GameState.npcStatus[id]);
    if (!done('giryeong') || !done('gyoyu')) return;
    GameState.flags.hoenamCleared = true;
    MapView.lockMovement(true);
    Dialogue.show(STORY.hoenam_giryeong_win, () => {
      Dialogue.show(STORY.hoenam_jangbi_arrives, () => {
        MapView.lockMovement(false);
        toast('원술 정벌이 중단되었다. (다음 장면에서 계속)');
      });
    });
  });
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
    `자원 — 쌀 ${GameState.resources.rice.toLocaleString()} · 금 ${GameState.resources.gold} · 병사 ${GameState.resources.troop}`;
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

// 챕터2 정식 진입(세력 소개/장수 선택 등)은 아직 미완성이라, 관우 스토리 장면1만
// 바로 확인해볼 수 있는 임시 미리보기 버튼이다. 정식 챕터2가 만들어지면 제거한다.
document.getElementById('chapter-card-2-preview').onclick = () => {
  GameState.reset('gwanwoo');
  GameState.npcStatus['deungmu'] = 'resolved';
  GameState.flags.act1 = true;
  MAPS.pyeongwon.apMovement = false;
  showScreen('screen-explore');
  goSeojuFree();
};

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

// 등용 완료 시 호출 - 마을(탁현/평원/서주)에서는 그 자리에 남아 훈련/모병역을 맡고, 그 외(전장 등)에서는 기존처럼 퇴장한다.
function stationRecruitOrRemove(id) {
  if (stage === 'takhyeon_free' || stage === 'pyeongwon_free' || stage === 'seoju_free') { MapView.render(); return; }
  MapView.removeNpc(id);
}

function formatStatLine(stats) {
  return `공${stats.atk} 방${stats.def} 속${stats.spd} 지${stats.int} 매${stats.cha} 통${stats.lead || 0}`;
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
    const sids = strategiesFor(id);
    const strategyLine = sids.length
      ? `<div class="roster-strategy">책략: ${sids.map((sid) => `${STRATEGIES[sid].name}(${STRATEGIES[sid].grade})`).join(', ')}</div>`
      : '';
    div.innerHTML = `<div class="roster-row-main"><span class="roster-role${scholar ? ' scholar' : ''}">${label}</span><span class="roster-name">${rd.name}</span></div>${statsLine}${strategyLine}`;
    div.onclick = () => openHeroDetail(id, label);
    wrap.appendChild(div);
  });
}

// 장수 상세보기 - [장수] 목록에서 인물 하나를 탭하면 뜨는 간략 정보 카드.
// "이 사람이 누구야?"에 바로 답할 수 있는 정도로만(소속/한 줄 업적/결말),
// 장황한 설명은 넣지 않는다.
function openHeroDetail(id, label) {
  const rd = ROSTER[id];
  if (!rd) return;
  document.getElementById('hero-detail-name').textContent = rd.name;
  document.getElementById('hero-detail-role').textContent = label;
  document.getElementById('hero-detail-bio').textContent = rd.bio || '아직 소개 문구가 준비되지 않았습니다.';
  const skillLines = [];
  if (rd.skills && rd.skills.length) {
    skillLines.push(...rd.skills.map((sid) => SKILL_POOL[sid]).filter(Boolean).map((s) => `필살기: ${s.name} - ${s.desc}`));
  }
  const sids = strategiesFor(id);
  skillLines.push(...sids.map((sid) => `책략: ${STRATEGIES[sid].name}(${STRATEGIES[sid].grade}급) - ${STRATEGIES[sid].desc}`));
  const skillsEl = document.getElementById('hero-detail-skills');
  skillsEl.innerHTML = skillLines.length ? skillLines.map((l) => `<div>${l}</div>`).join('') : '';
  document.getElementById('hero-detail-box').classList.remove('hidden');
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
const ARMY_TROOP_PER_LEAD = 200; // 군세 최대 병력 = 사령관 통솔 × 200 (통솔 100이면 최대 2만명)
const ARMY_GENERAL_BONUS_PCT = 0.10; // 부장 1명당 자신의 무력3스텟합 × 10%를 가산, 최대 3명
const ARMY_MAX_GENERALS = 3;

function armyMaxTroop(commanderRd) { return (commanderRd.stats.lead || 0) * ARMY_TROOP_PER_LEAD; }

// 병사 100명이 한 달에 쌀 200석을 먹는다(1인당 월 2석) - 15000명 군세면 한
// 달에 30000석, 10달이면 300000석을 소비한다. 아군·적 군세 모두 같은
// 기준으로 계산한다.
const RICE_PER_TROOP_PER_MONTH = 2;
function monthlyRiceUpkeep(troop) { return Math.ceil(troop * RICE_PER_TROOP_PER_MONTH); }
const ENEMY_RICE_MONTHS_BUFFER = 10; // 적 군세가 처음 등장할 때 자동으로 챙겨오는 군량(개월 수 기준)
// 적 군세는 로스터 데이터에 미리 rice 값을 넣어두지 않는다 - 이걸 처음
// 필요로 하는 순간(다음달 소모 계산이든, 군량차단 책략이든)에 자기 병력
// 기준 10달치를 스스로 챙겨온 것으로 본다.
function ensureEnemyRice(rd) {
  if (rd.rice == null) rd.rice = monthlyRiceUpkeep(rd.troop) * ENEMY_RICE_MONTHS_BUFFER;
  return rd.rice;
}

let armySelectedGenerals = [];
let armySteppers = {};
// 지금 편성 중인 군세가 누구 것인지(관우군/유비군)와, 이미 다른 군세에
// 배정되어 이 군세에는 중복으로 넣을 수 없는 인물 목록을 담아둔다.
let armyComposingCtx = { commanderId: null, excludeIds: [] };

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
  const candidates = GameState.recruited.filter((id) => ROSTER[id] && !isScholarType(ROSTER[id])
    && !armyComposingCtx.excludeIds.includes(id));
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
  const commanderRd = ROSTER[armyComposingCtx.commanderId] || GameState.heroData();
  const muryeok = armyMuryeokValue(commanderRd, armySelectedGenerals);
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

// opts: { commanderId(기본 관우), field('army' 기본 | 'allyArmy'), excludeIds(다른 군세에
// 이미 배정되어 중복 선택할 수 없는 인물), desc(안내 문구) } - 회남 벌판처럼 관우군과
// 유비군을 각각 편성해야 하는 장면에서는 이 창을 커맨더/대상 필드만 바꿔 두 번 연다.
function openArmyBox(onConfirm, opts) {
  opts = opts || {};
  const commanderId = opts.commanderId || GameState.mainHero;
  const targetField = opts.field || 'army';
  const excludeIds = opts.excludeIds || [];
  armyComposingCtx = { commanderId, excludeIds };
  const commanderRd = ROSTER[commanderId];

  document.getElementById('army-title').textContent = `${commanderRd.name}군 편성`;
  document.getElementById('army-desc').textContent = opts.desc
    || `${commanderRd.name}${subjectParticle(commanderRd.name)} 이끌 군세를 꾸리세요.`;

  const select = document.getElementById('army-deputy');
  select.innerHTML = '<option value="">없음</option>';
  GameState.recruited.forEach((id) => {
    const rd = ROSTER[id];
    if (!rd || !isScholarType(rd) || excludeIds.includes(id)) return;
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = `${rd.name} (지력 ${rd.stats.int})`;
    select.appendChild(opt);
  });
  select.onchange = updateArmyPower;

  armySelectedGenerals = [];
  renderArmyGenerals();

  const maxTroopByLead = armyMaxTroop(commanderRd);
  const troopMax = Math.min(maxTroopByLead, GameState.resources.troop);
  document.getElementById('army-troop-max').textContent = troopMax;
  document.getElementById('army-rice-max').textContent = GameState.resources.rice.toLocaleString();
  armySteppers = {
    'army-troop': makeArmyStepper('army-troop-value', 0, () => Math.min(maxTroopByLead, GameState.resources.troop), 100),
    'army-rice': makeArmyStepper('army-rice-value', 0, () => GameState.resources.rice, 1000),
  };
  armySteppers['army-troop'].set(troopMax);
  // 기본값은 지금 고른 병력 기준 5달치 군량(1인당 월 2석) - 보유량이 부족하면 그만큼만.
  armySteppers['army-rice'].set(Math.min(monthlyRiceUpkeep(troopMax) * 5, GameState.resources.rice));
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
    GameState[targetField] = { commanderId, deputy, generals: armySelectedGenerals.slice(), troop, rice };
    if (targetField === 'army') {
      GameState.morale = 100; // 출정시 사기 초기화 (유비군 등 보조 군세는 별도 사기를 추적하지 않는다)
      GameState.capturedCommanders = [];
      StatusEffects.resetSceneUsage(); // S급 책략의 "전투당 1회" 제한도 새 전장 씬 시작으로 초기화한다
    }
    document.getElementById('army-box').classList.add('hidden');
    updateHUD();
    onConfirm();
  };
}

function closeRosterPanel() {
  document.getElementById('roster-box').classList.add('hidden');
}

document.getElementById('roster-close').onclick = closeRosterPanel;
document.getElementById('hero-detail-close').onclick = () => {
  document.getElementById('hero-detail-box').classList.add('hidden');
};
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
let worldMapMode = 'faction'; // 'faction' | 'troops' | 'rice'

function worldMapMarkerColor(loc, faction) {
  if (worldMapMode === 'troops') return worldmapTierColor(loc.troops, WORLDMAP_TROOPS_THRESHOLDS, WORLDMAP_TROOPS_COLORS);
  if (worldMapMode === 'rice') return worldmapTierColor(loc.rice, WORLDMAP_RICE_THRESHOLDS, WORLDMAP_RICE_COLORS);
  return WORLDMAP_FACTION_COLORS[faction] || WORLDMAP_FACTION_COLORS.neutral;
}

function renderWorldMap() {
  const wrap = document.getElementById('worldmap-markers');
  wrap.innerHTML = '';
  const overrides = WORLDMAP_SCENE_FACTIONS[stage] || {};
  const flagLocId = WORLDMAP_SCENE_FLAG[stage];
  WORLDMAP_LOCATIONS.forEach((loc) => {
    const el = document.createElement('div');
    el.className = `wm-marker ${loc.type}`;
    el.style.left = `${loc.x}%`;
    el.style.top = `${loc.y}%`;
    const faction = overrides[loc.id] || loc.faction;
    el.style.setProperty('--wm-color', worldMapMarkerColor(loc, faction));
    const label = document.createElement('div');
    label.className = 'wm-label';
    label.textContent = loc.name;
    el.appendChild(label);
    if (loc.id === flagLocId) {
      const flag = document.createElement('div');
      flag.className = 'wm-flag';
      flag.textContent = '🚩';
      el.appendChild(flag);
    }
    el.onclick = () => openCityCard(loc, faction);
    wrap.appendChild(el);
  });
  renderWorldMapLegend();
}

function tierLegendRows(thresholds, colors, unit) {
  const rows = [];
  for (let i = 0; i < colors.length; i++) {
    let label;
    if (i === 0) label = `${thresholds[0].toLocaleString()}${unit} 이하`;
    else if (i === colors.length - 1) label = `${thresholds[i - 1].toLocaleString()}${unit} 초과`;
    else label = `${(thresholds[i - 1] + 1).toLocaleString()}~${thresholds[i].toLocaleString()}${unit}`;
    rows.push({ color: colors[i], label });
  }
  return rows;
}

function renderWorldMapLegend() {
  const wrap = document.getElementById('worldmap-legend');
  wrap.innerHTML = '';
  let title;
  let rows;
  if (worldMapMode === 'troops') {
    title = '병력';
    rows = tierLegendRows(WORLDMAP_TROOPS_THRESHOLDS, WORLDMAP_TROOPS_COLORS, '명');
  } else if (worldMapMode === 'rice') {
    title = '월간 쌀 생산량';
    rows = tierLegendRows(WORLDMAP_RICE_THRESHOLDS, WORLDMAP_RICE_COLORS, '석');
  } else {
    title = '세력';
    const overrides = WORLDMAP_SCENE_FACTIONS[stage] || {};
    const seen = [];
    WORLDMAP_LOCATIONS.forEach((loc) => {
      const f = overrides[loc.id] || loc.faction;
      if (!seen.includes(f)) seen.push(f);
    });
    rows = seen.map((f) => ({
      color: WORLDMAP_FACTION_COLORS[f] || WORLDMAP_FACTION_COLORS.neutral,
      label: WORLDMAP_FACTION_NAMES[f] || f,
    }));
  }
  const titleEl = document.createElement('div');
  titleEl.className = 'wm-legend-title';
  titleEl.textContent = title;
  wrap.appendChild(titleEl);
  rows.forEach((r) => {
    const row = document.createElement('div');
    row.className = 'wm-legend-row';
    const sw = document.createElement('div');
    sw.className = 'wm-legend-swatch';
    sw.style.background = r.color;
    const lbl = document.createElement('span');
    lbl.className = 'wm-legend-label';
    lbl.textContent = r.label;
    row.appendChild(sw);
    row.appendChild(lbl);
    wrap.appendChild(row);
  });
}

function setWorldMapMode(mode) {
  worldMapMode = mode;
  document.querySelectorAll('.wm-mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  renderWorldMap();
}

document.querySelectorAll('.wm-mode-btn').forEach((btn) => {
  btn.onclick = () => setWorldMapMode(btn.dataset.mode);
});

// 세로 모바일(웹뷰 포함)에서는 CSS의 vh/vw 값이 실기기에서 실제 화면 크기와
// 다르게 계산되는 경우가 있어(explore-viewport와 같은 문제), 여기서도
// window.innerWidth/innerHeight로 직접 계산한 픽셀 값을 강제 적용한다.
function applyWorldMapMobileSize() {
  const box = document.getElementById('worldmap-box');
  const img = document.getElementById('worldmap-img');
  const isRotated = window.innerWidth > 0 && window.innerHeight > 0 &&
    window.innerWidth < window.innerHeight && window.innerWidth <= 1024;
  if (isRotated) {
    box.style.width = Math.min(1100, Math.round(window.innerHeight * 0.86)) + 'px';
    box.style.maxHeight = Math.min(760, Math.round(window.innerWidth * 0.92)) + 'px';
    img.style.maxHeight = Math.min(600, Math.round(window.innerWidth * 0.70)) + 'px';
  } else {
    box.style.width = '';
    box.style.maxHeight = '';
    img.style.maxHeight = '';
  }
}

window.addEventListener('resize', () => {
  if (!document.getElementById('worldmap-box').classList.contains('hidden')) applyWorldMapMobileSize();
});

function openWorldMapBox() {
  setWorldMapMode('faction');
  applyWorldMapMobileSize();
  document.getElementById('worldmap-box').classList.remove('hidden');
}

function closeWorldMapBox() {
  document.getElementById('worldmap-box').classList.add('hidden');
}

document.getElementById('worldmap-close').onclick = closeWorldMapBox;

function contrastTextColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#2b2620' : '#fff8ea';
}

function openCityCard(loc, faction) {
  document.getElementById('citycard-title').textContent = loc.name;
  const factionEl = document.getElementById('citycard-faction');
  factionEl.textContent = WORLDMAP_FACTION_NAMES[faction] || faction;
  const color = WORLDMAP_FACTION_COLORS[faction] || WORLDMAP_FACTION_COLORS.neutral;
  factionEl.style.setProperty('--wm-color', color);
  factionEl.style.color = contrastTextColor(color);
  document.getElementById('citycard-troops').textContent = `${loc.troops.toLocaleString()}명`;
  document.getElementById('citycard-defense').textContent = `${loc.defCur.toLocaleString()} / ${loc.defMax.toLocaleString()}`;
  document.getElementById('citycard-rice').textContent = `${loc.rice.toLocaleString()}석`;
  document.getElementById('citycard-box').classList.remove('hidden');
}

function closeCityCard() {
  document.getElementById('citycard-box').classList.add('hidden');
}

document.getElementById('citycard-close').onclick = closeCityCard;

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
  const goldAmount = 20 + Math.floor(Math.random() * 41); // 20~60
  const riceAmount = 200 + Math.floor(Math.random() * 201); // 200~400
  Dialogue.show([{ speaker: '떠돌이 상인', text: '마침 지나던 길이오. 필요한 물자가 있으면 나눠드리리다.' }], () => {
    GameState.addResource(rice ? { rice: riceAmount } : { gold: goldAmount });
    toast(`떠돌이 상인에게서 ${rice ? `쌀 ${riceAmount}` : `금 ${goldAmount}`}을(를) 얻었다.`);
    updateHUD();
  });
}

// ---- 도시맵(탁현/평원/서주) 상주 상인 - 금으로 군량/활/군마를 구매 ----
// unit/cost = 슬라이더 한 칸(step)당 수량/금값, monthlyCap = 이번 달에 살 수 있는
// 최대 수량 - 다음달 버튼을 누르면 GameState.merchantBought가 초기화되며 다시 채워진다.
const MERCHANT_DEALS = [
  { key: 'rice', label: '군량', unit: 300, cost: 10, monthlyCap: 5100 }, // 300의 배수로 딱 떨어지게(약 5000) 맞춘 값
  { key: 'bow', label: '활', unit: 100, cost: 10, monthlyCap: 3000 },
  { key: 'horse', label: '군마', unit: 50, cost: 10, monthlyCap: 1000 },
];

let merchantSliders = {};

function merchantMaxUnits(deal) {
  const remainingMonthly = Math.max(0, deal.monthlyCap - GameState.merchantBought[deal.key]);
  const affordableUnits = Math.floor(GameState.resources.gold / deal.cost) * deal.unit;
  return Math.min(remainingMonthly, affordableUnits);
}

function merchantCostFor(deal, qty) {
  return Math.round((qty / deal.unit) * deal.cost);
}

function makeMerchantSlider(deal) {
  const input = document.getElementById(`merchant-${deal.key}-slider`);
  const valueEl = document.getElementById(`merchant-${deal.key}-value`);
  input.addEventListener('input', () => updateMerchantRow(deal));
  return {
    get() { return Number(input.value); },
    set(v) {
      input.max = merchantMaxUnits(deal);
      input.value = clamp(v, 0, Number(input.max));
      valueEl.textContent = Number(input.value).toLocaleString();
      updateMerchantRow(deal);
    },
  };
}

function updateMerchantRow(deal) {
  const row = document.querySelector(`.merchant-row[data-key="${deal.key}"]`);
  const remainingMonthly = Math.max(0, deal.monthlyCap - GameState.merchantBought[deal.key]);
  row.querySelector('.merchant-left').textContent = remainingMonthly.toLocaleString();
  row.querySelector('.merchant-cap').textContent = deal.monthlyCap.toLocaleString();
  const qty = merchantSliders[deal.key].get();
  document.getElementById(`merchant-${deal.key}-value`).textContent = qty.toLocaleString();
  row.querySelector('.merchant-cost').textContent = qty > 0 ? `금 ${merchantCostFor(deal, qty)} 소비` : '';
}

function wireMerchantBuyButtons() {
  document.querySelectorAll('.merchant-buy-btn').forEach((btn) => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', () => buyFromMerchant(MERCHANT_DEALS.find((d) => d.key === btn.dataset.key)));
  });
}

function renderMerchantBox() {
  document.getElementById('merchant-gold').textContent = GameState.resources.gold.toLocaleString();
  MERCHANT_DEALS.forEach((deal) => {
    const input = document.getElementById(`merchant-${deal.key}-slider`);
    input.min = 0;
    input.step = deal.unit;
    if (!merchantSliders[deal.key]) merchantSliders[deal.key] = makeMerchantSlider(deal);
    merchantSliders[deal.key].set(0);
  });
  document.getElementById('merchant-hint').textContent = '';
  wireMerchantBuyButtons();
}

function openMerchantShop(id) {
  const rd = ROSTER[id];
  Dialogue.show([{ speaker: rd.name, text: rd.intro }], () => {
    renderMerchantBox();
    document.getElementById('merchant-box').classList.remove('hidden');
  });
}

function buyFromMerchant(deal) {
  const qty = merchantSliders[deal.key].get();
  const hintEl = document.getElementById('merchant-hint');
  if (qty <= 0) { hintEl.textContent = '구매할 수량을 먼저 골라주세요.'; return; }
  const cost = merchantCostFor(deal, qty);
  if (GameState.resources.gold < cost) { hintEl.textContent = '금이 부족합니다.'; return; }
  GameState.resources.gold -= cost;
  GameState.addResource({ [deal.key]: qty });
  GameState.merchantBought[deal.key] += qty;
  hintEl.textContent = '';
  toast(`${deal.label} ${qty.toLocaleString()}을(를) 구매했다. (금 ${cost} 소비, 보유 ${deal.label} ${GameState.resources[deal.key].toLocaleString()})`);
  updateHUD();
  document.getElementById('merchant-gold').textContent = GameState.resources.gold.toLocaleString();
  MERCHANT_DEALS.forEach((d) => merchantSliders[d.key].set(0));
}

document.getElementById('merchant-close').onclick = () => {
  document.getElementById('merchant-box').classList.add('hidden');
};

function triggerHarvestEvent() {
  const good = Math.random() < 0.5;
  const amount = 200 + Math.floor(Math.random() * 201); // 200~400
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

// 서주 자유탐방 전용 돌발 이벤트 - 챕터1의 RANDOM_EVENT_BANDITS/checkScheduledSpawns는
// 같은 지도를 챕터1과 공유하는 탓에 그대로 재사용하면 챕터1 인물들까지 되살아날
// 위험이 있어, 오돈(장패 무리)만을 위한 경량 버전을 따로 둔다.
function triggerOdonEvent() {
  if (GameState.npcStatus['odon']) { triggerFlavorEvent(); return; }
  startFreeBattle('odon', undefined, true);
}
function maybeSeojuRandomEvent() {
  if (Math.random() >= RANDOM_EVENT_CHANCE) return false;
  const kind = ['odon', 'merchant', 'harvest', 'flavor'][Math.floor(Math.random() * 4)];
  if (kind === 'odon') triggerOdonEvent();
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
  jeonju: '마을 사람들이 어느 은둔 선비에게 자꾸 세상에 나오라 권하고 있다던데.',
  songgeon: '주막 앞에서 떠도는 소문을 죽간에 옮겨 적는 사람이 있다고 하오.',
  jeonye: '유비 장군 진영 근처를 서성이는 낯선 학자를 봤다는 소문이오.',
  yeomyu: '성벽 밖에서 오환족 얘기를 하는 병사들 무리를 봤다고 하오.',
  choeyeom: '거리의 풍속을 유심히 살피는 수염 기른 선비를 봤다고 하오.',
  jingun: '주막 근처에서 단정한 차림의 선비를 봤다는 사람이 있소.',
  seoseong: '창을 손질하는 덩치 큰 사내를 봤다는 소문이오.',
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
        GameState.addResource({ rice: 300 });
        toast('백성에게서 쌀 300을 받았다.');
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
      const rice = 200 + Math.floor(Math.random() * 201); // 200~400
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
  GameState.merchantBought = { rice: 0, bow: 0, horse: 0 }; // 상인의 월간 판매 한도 초기화
  // 체력은 병사와 달리 매달 휴식하면서 회복된다 (병사수/군량처럼 전쟁 중 손실이 누적되지는 않음).
  // 같은 달 안에서 연달아 전투를 치를 때만 체력이 그대로 이어진다 - 휴식(다음달)을 거치면 항상 완전 회복.
  const inCampaign = stage === 'warmap';
  // 장순의 난: 군세로 전환된 뒤에는 어양이라도 warmap처럼 매달 행동력을 재보급받는다.
  const inJangsunMarch = stage === 'pyeongwon_free' && MAPS.pyeongwon.apMovement && !!GameState.army;
  GameState.heroHp = null;
  if (inCampaign || inJangsunMarch) {
    // 십면매복/이사결류 같은 행동력 디버프가 걸려 있으면(apMult) 이번 달
    // 재보급량 자체가 그만큼 줄어든다 - 적 AI의 이동 예산(mapview.js
    // computeAiPath)과 완전히 동일한 배율 방식이다.
    const apScale = GameState.army ? StatusEffects.apMult(GameState.army.commanderId) : 1;
    GameState.ap = Math.max(0, Math.floor(effectiveApMax() * apScale));
  }
  if (inCampaign && GameState.army) {
    GameState.army.rice = Math.max(0, GameState.army.rice - monthlyRiceUpkeep(GameState.army.troop));
    if (GameState.army.rice <= 0) GameState.changeMorale(-1); // 군량 고갈시 매턴 사기 하락
  }
  // 적 군세도 아군과 같은 기준(1인당 월 2석)으로 군량을 소모한다 - 로스터
  // 데이터에 미리 값을 넣어두는 대신, 이 전장에서 처음 맞닥뜨리는 순간
  // 자기 병력 기준 10달치를 스스로 챙겨온 것으로 본다.
  if (inCampaign) enemiesInScene().forEach((eid) => {
    const rd = ROSTER[eid];
    ensureEnemyRice(rd);
    rd.rice = Math.max(0, rd.rice - monthlyRiceUpkeep(rd.troop));
    if (rd.rice <= 0) StatusEffects.drainMorale(eid, 1); // 아군과 동일하게 고갈시 매턴 사기 하락
  });
  // 책략 상태이상(혼란/공포/도발)의 "턴"은 이 1달 휴식 하나를 가리킨다 -
  // 공포의 사기 드레인도 여기서 함께 처리된다. 화염 타일은 지금 지도가
  // 전쟁맵일 때만(그 타일 위 군세가 실제로 존재할 때만) 의미가 있다.
  StatusEffects.tickAllArmyStatus();
  if (inCampaign) {
    StatusEffects.tickFireTiles(MapView.currentMapId, fireTileOccupantsAt, applyFireTileDamage);
    MapView.render();
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
  // 서주 자유탐방도 마을 체류와 같은 결이지만, 챕터1과 지도를 공유하는 탓에
  // checkScheduledSpawns()/RANDOM_EVENT_BANDITS를 그대로 재사용하면 챕터1
  // 인물들까지 되살아날 위험이 있어 spawned 계산에서는 제외하고, 돌발 이벤트만
  // 별도의 경량 버전(maybeSeojuRandomEvent)으로 처리한다.
  const inSeojuTown = stage === 'seoju_free';
  const spawned = inTown ? MapView.checkScheduledSpawns() : [];
  const spawnMsg = spawned.length ? ' 마을에 낯선 인물이 나타났다는 소문이 돈다. 돌아다니다 보면 마주칠지도 모른다.' : '';
  // 마을 체류 중에는 매달 뜨는 정형화된 안내문구를 없애고, 대신 지나가던 백성에게
  // 가끔 말풍선이 걸려 돌아다니다 우연히 마주치는 편이 더 재미있다.
  const finishTurn = () => {
    if (inTown || inSeojuTown) {
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
  } else if (inSeojuTown) {
    MapView.rollAmbientEvent(availableAmbientKinds());
    if (!maybeSeojuRandomEvent()) finishTurn();
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
