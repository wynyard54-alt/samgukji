const GameState = {
  mainHero: null, // 'gwanwoo' | 'jangbi'
  year: 184,
  month: 3,
  ap: 6,
  apMax: 6,
  resources: { rice: 200, gold: 120, troop: 80 },
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
