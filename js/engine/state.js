const GameState = {
  mainHero: null, // 'gwanwoo' | 'jangbi'
  year: 184,
  month: 3,
  ap: 6,
  apMax: 6,
  resources: { rice: 200, gold: 120, troop: 80 },
  fame: 0, // 명성 (100당 최대 행동력 +1, 최대 1000)
  morale: 100, // 군세 사기 (기본 100, 일기토 승패 ±10, 군량 고갈시 매턴 -1, 0 이하면 붕괴)
  capturedCommanders: [], // 일기토 압도적 승리로 포획한 적 사령관 id 목록 (전쟁 종료 후 등용 제안)
  npcSpawnMonth: {}, // id -> 랜덤 등장 장수가 실제로 등장하는 절대 개월수 (absMonth)
  npcSpawnPos: {}, // id -> 랜덤 등장 장수의 등장 좌표 {x,y} (한 번 정해지면 고정)
  pyeongwonEnterAbsMonth: null, // 평원현에 실제로 진입한 절대 개월수 (늦게 도착해도 최소 체류기간을 보장하기 위함)
  heroHp: null, // 자유 등용전 사이 이월되는 현재 체력 (null = 최대치)
  army: null, // 플레이어가 직접 편성한 주력 군세 {commanderId, deputy, generals, troop, rice}
  allyArmy: null, // 플레이어가 별도로 편성해 직접 지휘하는 두 번째 군세 (회남 벌판의 유비군 등) - 같은 구조
  warLocks: {}, // id -> {playerHit, enemyHit} - 그 적과의 교전이 시작된 시점 병력 기준으로 고정된 교전당 피해량
  armyStatus: {}, // id(사령관/commanderId) -> [{type, turnsLeft, sourceId}] - 혼란/공포/도발 등 책략 디버프 (js/engine/status-effects.js)
  warChains: {}, // id -> {members:[id,...], ratio} - 연환계로 묶인 군세끼리 피해를 나눠 받는 사슬
  tileEffects: {}, // "mapId#x#y" -> {type:'fire', x, y, ticksLeft, dps} - 화염 등 타일에 붙는 상태이상
  strategyUsedInScene: {}, // skillId -> true - S급 책략처럼 "전투당(그 전장 씬) 1회"인 책략을 이번 군세 편성 이후 이미 썼는지
  strategyUsedInMonth: {}, // skillId -> true - A급 책략처럼 "이번 달 1회"인 책략을 이미 썼는지 (다음달이 되면 초기화)
  trainingEv: 0, // 훈련 노력치 (100마다 스텟 1 상승)
  combatStatUps: 0, // 공/방/속 상승 누적 횟수 (skillThreshold 도달시 필살공격 습득)
  skillThreshold: 2 + Math.floor(Math.random() * 2), // 2 또는 3
  recruited: [], // ids
  npcStatus: {}, // id -> 'met' | 'recruited' | 'fled' | 'dead' | 'resolved'
  friendship: {}, // id -> 0~100 (책사형 친밀도 게이지)
  npcVisible: {}, // id -> bool (for chance-based npcs)
  flags: { act1: false, act2: false },

  reset(hero) {
    this.mainHero = hero;
    this.year = 184; this.month = 3;
    this.ap = 6; this.apMax = 6;
    this.resources = { rice: 200, gold: 120, troop: 80 };
    this.fame = 0;
    this.morale = 100;
    this.capturedCommanders = [];
    this.npcSpawnMonth = {};
    this.npcSpawnPos = {};
    this.pyeongwonEnterAbsMonth = null;
    this.heroHp = null;
    this.army = null;
    this.allyArmy = null;
    this.warLocks = {};
    this.armyStatus = {};
    this.warChains = {};
    this.tileEffects = {};
    this.strategyUsedInScene = {};
    this.strategyUsedInMonth = {};
    this.trainingEv = 0;
    this.combatStatUps = 0;
    this.skillThreshold = 2 + Math.floor(Math.random() * 2);
    this.recruited = [];
    this.npcStatus = {};
    this.friendship = {};
    this.npcVisible = {};
    this.flags = { act1: false, act2: false };
  },

  heroData() { return ROSTER[this.mainHero]; },

  spendAP(n) {
    if (this.ap < n) return false;
    this.ap -= n;
    return true;
  },

  nextMonth() {
    this.month++;
    if (this.month > 12) { this.month = 1; this.year++; }
    this.ap = this.apMax;
    this.strategyUsedInMonth = {}; // A급 책략의 "월 1회" 제한을 매달 초기화한다
  },

  dateLabel() { return `${this.year}년 ${this.month}월`; },

  addResource(r) {
    for (const k in r) this.resources[k] = (this.resources[k] || 0) + r[k];
  },

  // 명성 100당 최대 행동력 +1 (최대 명성 1000 -> 최대 행동력 6+10=16).
  // 임계값을 새로 넘기면 이번 달 남은 행동력도 즉시 함께 오른다.
  addFame(n) {
    this.fame = Math.min(1000, this.fame + n);
    const newMax = 6 + Math.floor(this.fame / 100);
    if (newMax > this.apMax) {
      this.ap += (newMax - this.apMax);
      this.apMax = newMax;
    }
  },

  changeMorale(n) {
    this.morale = Math.max(-100, Math.min(150, this.morale + n));
  },

  recruit(id, troopGain) {
    if (!this.recruited.includes(id)) this.recruited.push(id);
    this.npcStatus[id] = 'recruited';
    this.resources.troop += (troopGain == null ? 15 : troopGain);
    this.addFame(10);
  },
};
