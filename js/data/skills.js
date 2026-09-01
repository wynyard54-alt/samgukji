// 필살공격 스킬 풀 — 데미지/체력 효과만 사용 (상태이상 없음)
// dmgMult: 일반공격(1.3배) 대비 배율 기준이 아니라 기본 공식(atk*0.6-def*0.3)에 곱하는 배율
// healSelfPct: 자신 최대체력 대비 회복 비율 / healFromDmgPct: 입힌 피해 대비 회복 비율 / selfCostPct: 자신 현재체력 대비 소모 비율
const SKILL_POOL = {
  samdanchigi: { name:'삼단치기', dmgMult:3.0, desc:'일반 공격의 3배 피해' },
  pohyo: { name:'포효', dmgMult:2.0, healSelfPct:0.10, desc:'일반 공격의 2배 피해 + 체력 10% 회복' },
  hoesim: { name:'회심의 일격', dmgMult:2.6, desc:'일반 공격의 2.6배 피해' },
  pilsa: { name:'필사의 일격', dmgMult:3.3, selfCostPct:0.08, desc:'일반 공격의 3.3배 피해 (반동으로 체력 8% 소모)' },
  heubhyeol: { name:'흡혈의 일격', dmgMult:1.8, healFromDmgPct:0.30, desc:'일반 공격의 1.8배 피해 + 입힌 피해의 30% 회복' },
};
