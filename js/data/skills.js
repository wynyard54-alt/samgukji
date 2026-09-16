// 필살공격 스킬 풀
// cost: 이번 필살기에 필요한 기력(0~100, 공격/방어 등으로 쌓이는 게이지와 같은
// 척도)이다. 예전엔 게이지가 정확히 100 찼을 때만 하나를 골라 전부(100) 소모하는
// 방식이었는데, 이제 게이지는 그때그때 남는 자원이고 필살기마다 필요한 만큼만
// 떼어 쓴다(cost만큼 차감, 남는 기력은 다음 필살기에 이어 쓸 수 있다) - 그래서
// 저비용 견제기와 고비용 한방을 상황 봐가며 고르는 실질적인 선택이 생긴다.
// dmgMult: 일반공격(1.3배) 대비 배율 기준이 아니라 기본 공식(atk*0.6-def*0.3)에
// 곱하는 배율 / healSelfPct: 자신 최대체력 대비 회복 비율 / healFromDmgPct: 입힌
// 피해 대비 회복 비율 / selfCostPct: 자신 현재체력 대비 소모 비율 / ignoreDef:
// 상대 방어력 무시 / condType('selfHp'|'targetHp')+condPct+condMult: 자신 또는
// 상대의 체력이 condPct 이하면 dmgMult 대신 condMult 적용 / drainGaugePct: 상대
// 기력을 그만큼 깎음(0 밑으로는 안 내려감) / nextEvasionBonus: 자신의 다음
// 피격시 회피율에 이만큼(%p) 가산 / nextDmgReducePct: 자신이 다음에 받는 피해를
// 이 비율만큼 감소 / forceFirst: 이번 라운드엔 속도와 무관하게 반드시 먼저 행동
const SKILL_POOL = {
  hoesim: { name:'회심의 일격', cost:60, dmgMult:2.0,
    desc:'기력 60% 소모 · 일반 공격의 2배 피해' },
  samdanchigi: { name:'삼단치기', cost:80, dmgMult:3.0,
    desc:'기력 80% 소모 · 일반 공격의 3배 피해' },
  pilsa: { name:'필사의 일격', cost:100, dmgMult:4.0, selfCostPct:0.10,
    desc:'기력 100% 소모 · 일반 공격의 4배 피해, 사용 후 자신의 체력 10% 감소' },
  pohyo: { name:'포효', cost:70, dmgMult:2.0, healSelfPct:0.10,
    desc:'기력 70% 소모 · 2배 피해 + 자신의 체력 10% 회복' },
  heubhyeol: { name:'회생의 일격', cost:60, dmgMult:1.5, healFromDmgPct:0.30,
    desc:'기력 60% 소모 · 1.5배 피해 + 입힌 피해의 30%만큼 체력 회복' },
  maenghogyeok: { name:'맹호격', cost:70, dmgMult:2.0, condType:'selfHp', condPct:0.5, condMult:3.0,
    desc:'기력 70% 소모 · 2배 피해, 자신의 체력이 50% 이하라면 3배' },
  pagapgyeok: { name:'파갑격', cost:65, dmgMult:1.5, ignoreDef:true,
    desc:'기력 65% 소모 · 1.5배 피해 + 상대 방어 효과 무시' },
  seonpungcham: { name:'선풍참', cost:60, dmgMult:1.5, nextEvasionBonus:50,
    desc:'기력 60% 소모 · 1.5배 피해 + 다음 공격 회피율 50%p 상승' },
  giryeokpasoe: { name:'기력파쇄', cost:55, dmgMult:1.5, drainGaugePct:40,
    desc:'기력 55% 소모 · 1.5배 피해 + 상대 기력 40% 감소(40% 미만이면 0으로)' },
  galgigalgi: { name:'갈기갈기', cost:80, dmgMult:2.5, condType:'targetHp', condPct:0.3, condMult:4.0,
    desc:'기력 80% 소모 · 2.5배 피해, 상대 체력 30% 이하라면 4배 피해' },
  cheolbyeoktaese: { name:'철벽태세', cost:45, dmgMult:1.0, nextDmgReducePct:0.8,
    desc:'기력 45% 소모 · 1배 피해 + 다음 턴 받는 피해 80% 감소' },
  ilgidangcheon: { name:'일기당천', cost:100, dmgMult:3.0, healSelfPct:0.20,
    desc:'기력 100% 소모 · 3배 피해 + 자신의 체력 20% 회복' },
  jeongwangseokhwa: { name:'전광석화', cost:50, dmgMult:1.5, forceFirst:true,
    desc:'기력 50% 소모 · 1.5배 피해 + 반드시 선제공격' },
};
