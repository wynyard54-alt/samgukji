const GameState = {
  mainHero: null, // 'gwanwoo' | 'jangbi'
  year: 184,
  month: 3,
  ap: 6,
  apMax: 6,
  resources: { rice: 200, gold: 120, troop: 80 },
  fame: 0, // 명성 (표시용 스텁 — 아직 획득 로직 없음)
  heroHp: null, // 자유 등용전 사이 이월되는 현재 체력 (null = 최대치)
  army: null, // 반동탁연합 출정용 유비군 편성 {deputy, troop, rice}
  trainingEv: 0, // 훈련 노력치 (100마다 스텟 1 상승)
  combatStatUps: 0, // 공/방/속 상승 누적 횟수 (skillThreshold 도달시 필살공격 습득)
  skillThreshold: 2 + Math.floor(Math.random() * 2), // 2 또는 3
  recruited: [], // ids
  npcStatus: {}, // id -> 'met' | 'recruited' | 'fled' | 'dead' | 'resolved'
  friendship: {}, // id -> 0~100 (책사형 친밀도 게이지)
  npcVisible: {}, // id -> bool (for chance-based npcs)
  flags: { act1: false, act2: false, sasugwan: false, horogwan: false, hamgokgwan: false },
  currentMap: 'takhyeon',

  reset(hero) {
    this.mainHero = hero;
    this.year = 184; this.month = 3;
    this.ap = 6; this.apMax = 6;
    this.resources = { rice: 200, gold: 120, troop: 80 };
    this.fame = 0;
    this.heroHp = null;
    this.army = null;
    this.trainingEv = 0;
    this.combatStatUps = 0;
    this.skillThreshold = 2 + Math.floor(Math.random() * 2);
    this.recruited = [];
    this.npcStatus = {};
    this.friendship = {};
    this.npcVisible = {};
    this.flags = { act1: false, act2: false, sasugwan: false, horogwan: false, hamgokgwan: false };
    this.currentMap = 'takhyeon';
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
  },

  dateLabel() { return `${this.year}년 ${this.month}월`; },

  addResource(r) {
    for (const k in r) this.resources[k] = (this.resources[k] || 0) + r[k];
  },

  recruit(id, troopGain) {
    if (!this.recruited.includes(id)) this.recruited.push(id);
    this.npcStatus[id] = 'recruited';
    this.resources.troop += (troopGain == null ? 15 : troopGain);
  },
};
