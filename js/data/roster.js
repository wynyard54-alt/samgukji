// 챕터1: 관우&장비 루트 — 등장인물 데이터
// stats: 공격/방어/속도/지력/매력 (100점 만점). 전투 없는 이벤트 캐릭터는 stats:null
// forced: 'kill'  = 반드시 처치(등용 불가, 스토리 고정)
//         'escape'= 반드시 도주(등용 불가, 스토리 고정)
//         null    = 일반 처리(패배시 포로화->등용 시도 가능, 혹은 우호적 인물은 바로 등용 시도)
// kind: 'ally-story' 유비군 스토리 인물 / 'recruit' 일반 등용대상 / 'resource' 비전투 이벤트 / 'enemy' 전투 상대

const ROSTER = {
  yubi: { id:'yubi', name:'유비', role:'주군', kind:'ally-story', affiliation:'유비군',
    desc:'무소속에서 의용군을 일으킨 인물. 플레이어는 조작하지 않음.' },

  gwanwoo: { id:'gwanwoo', name:'관우', role:'PC', kind:'playable', affiliation:'유비군',
    stats:{atk:92, def:71, spd:58, int:52, cha:76}, weapon:'청룡언월도',
    skills:['samdanchigi'] },

  jangbi: { id:'jangbi', name:'장비', role:'PC', kind:'playable', affiliation:'유비군',
    stats:{atk:94, def:79, spd:61, int:29, cha:41}, weapon:'장팔사모',
    skills:['pohyo'] },

  // 탁현
  chujeong: { id:'chujeong', name:'추정', kind:'recruit', forced:null, affiliation:'무소속',
    stats:{atk:58, def:52, spd:48, int:51, cha:46}, intro:'황건적 토벌에 자원했다고? 마침 손이 부족했는데 잘 왔소.' },
  noshik: { id:'noshik', name:'노식', kind:'recruit', forced:null, affiliation:'무소속',
    stats:{atk:28, def:37, spd:31, int:88, cha:79}, intro:'그대가 유비의 아우들인가. 세상이 이리 어지러우니, 붓을 놓고 검을 들어야 할 때인가 싶군.' },
  yuwongi: { id:'yuwongi', name:'유원기', kind:'resource', reward:{gold:80}, affiliation:'-',
    intro:'현덕이 어릴 때부터 큰 그릇인 줄 알았지. 이 정도 노잣돈은 내가 대야지.' },
  sossangJangsepyeong: { id:'sossangJangsepyeong', name:'소쌍·장세평', kind:'resource', reward:{gold:60, troop:30}, affiliation:'-',
    intro:'그대들 뜻이 크다는 소문을 들었소. 말과 금을 좀 보태겠소.' },
  gongyung: { id:'gongyung', name:'공융', kind:'recruit', forced:null, affiliation:'북해', chance:0.15,
    stats:{atk:18, def:22, spd:20, int:82, cha:84}, intro:'북해에서 온 공융이오. 이런 촌구석에서 그대들 같은 의기 넘치는 이들을 만날 줄이야.' },

  // 탁군 인근 소읍 (적 -> 포로 후 등용)
  gwakseung: { id:'gwakseung', name:'곽승', kind:'enemy', forced:null, affiliation:'재야',
    stats:{atk:52, def:48, spd:45, int:34, cha:31}, intro:'…졌소. 그대들 밑에서 다시 검을 잡을 기회를 주겠소?' },
  yeosang: { id:'yeosang', name:'여상', kind:'enemy', forced:null, affiliation:'재야',
    stats:{atk:49, def:51, spd:42, int:31, cha:28}, intro:'이 마을을 지키려 했을 뿐이오. 당신들이라면 믿어도 되겠소?' },
  jeongwonji: { id:'jeongwonji', name:'정원지', kind:'enemy', forced:null, affiliation:'황건적',
    stats:{atk:41, def:32, spd:38, int:22, cha:21}, intro:'크윽… 살려만 준다면 뭐든 하겠소!' },
  deungmu: { id:'deungmu', name:'등무', kind:'enemy', forced:null, affiliation:'황건적',
    stats:{atk:44, def:35, spd:41, int:24, cha:22}, intro:'형님이 항복한다면 나도 따르겠소…' },

  // 평원현
  jeonhae: { id:'jeonhae', name:'전해', kind:'recruit', forced:null, affiliation:'공손찬군',
    stats:{atk:64, def:57, spd:52, int:49, cha:53}, intro:'공손찬 어른 밑에서 청주를 맡고 있는 전해요. 소문은 익히 들었소.' },
  gwanjeong: { id:'gwanjeong', name:'관정', kind:'recruit', forced:null, affiliation:'공손찬군',
    stats:{atk:24, def:21, spd:26, int:78, cha:61}, intro:'공손찬 어른의 명을 전하러 왔소. 격문을 받으시오.' },
  eomgang: { id:'eomgang', name:'엄강', kind:'recruit', forced:null, affiliation:'공손찬군',
    stats:{atk:69, def:58, spd:55, int:38, cha:41}, intro:'나도 이번 싸움에 나선다네. 잘 부탁하네.' },
  jowoon: { id:'jowoon', name:'조운', kind:'recruit', forced:null, affiliation:'무소속', chance:0.15,
    stats:{atk:91, def:68, spd:97, int:58, cha:79}, intro:'…떠도는 무사요. 정해진 주인은 없소만, 그쪽 형제들 싸우는 모습이 마음에 드는군.' },
  mijuk: { id:'mijuk', name:'미축', kind:'recruit', forced:null, affiliation:'서주', chance:0.15,
    stats:{atk:18, def:22, spd:19, int:71, cha:78}, intro:'서주 상인 미축이오. 장사 일로 지나다, 소문을 듣고 인사나 드리려 왔소.' },
  mibang: { id:'mibang', name:'미방', kind:'recruit', forced:null, affiliation:'서주', chance:0.15,
    stats:{atk:41, def:44, spd:42, int:48, cha:44}, intro:'형님을 따라왔소. 잘 부탁드리오.' },
  songgeon: { id:'songgeon', name:'손건', kind:'recruit', forced:null, affiliation:'무소속', chance:0.2,
    stats:{atk:21, def:19, spd:24, int:68, cha:61}, intro:'글재주밖에 없는 손건이오만, 필요하다면 붓이라도 들겠소.' },
  ganong: { id:'ganong', name:'간옹', kind:'recruit', forced:null, affiliation:'무소속', chance:0.2,
    stats:{atk:24, def:21, spd:26, int:64, cha:69}, intro:'이 몸은 말주변이 좀 있소이다. 협상이 필요하면 불러주시오.' },
  jindeung: { id:'jindeung', name:'진등', kind:'recruit', forced:null, affiliation:'서주', chance:0.15,
    stats:{atk:29, def:31, spd:34, int:83, cha:66}, intro:'서주의 진등이오. 지나는 길에 재미있는 사람들 이야기를 들었지.' },
  yujapyeong: { id:'yujapyeong', name:'유자평', kind:'flavor', affiliation:'평원',
    intro:'그대가 유현덕의 아우로군. 소문은 익히 들었네.' },
  jangsun: { id:'jangsun', name:'장순', kind:'enemy', forced:null, affiliation:'반란군', troop:3000,
    stats:{atk:68, def:58, spd:55, int:40, cha:35}, intro:'…이걸로 끝인가. 어양에서 다시 보자꾸나.' },

  // 반동탁연합 진영 (등용 불가, 서사 전용 인물)
  wonso: { id:'wonso', name:'원소', kind:'flavor', affiliation:'반동탁연합',
    intro:'맹주로 추대된 원소요. 각지의 제후들이 모였으나, 아직 누가 선봉에 설지 정하지 못했소.' },
  jojo: { id:'jojo', name:'조조', kind:'flavor', affiliation:'반동탁연합',
    intro:'맹덕이라 하오. 이런 촌구석 의용군에서도 쓸만한 인재가 나올 수 있는 법이지.' },
  gongsonchan: { id:'gongsonchan', name:'공손찬', kind:'flavor', affiliation:'반동탁연합',
    intro:'백규요. 자네들이 현덕의 아우들인가. 내 현덕과는 동문수학한 사이라네, 잘 부탁하네.' },
  songyeon: { id:'songyeon', name:'손견', kind:'flavor', affiliation:'반동탁연합',
    intro:'강동의 손문대요. 선봉은 이 몸이 서겠소. 동탁 따위, 단숨에 짓밟아주지!' },

  // 사수관
  hwaung: { id:'hwaung', name:'화웅', kind:'enemy', forced:'kill', affiliation:'동탁군',
    stats:{atk:81, def:62, spd:58, int:31, cha:22}, intro:'이런 촌뜨기들까지 나선단 말이냐? 목이나 내놓아라!' },
  hojin: { id:'hojin', name:'호진', kind:'enemy', forced:null, affiliation:'동탁군', troop:1500,
    stats:{atk:72, def:61, spd:49, int:38, cha:33}, intro:'…내가 졌다. 동탁을 섬긴 것도 딱히 충심은 아니었소. 그대들이라면 나쁘지 않겠군.' },

  // 호로관
  yeopo: { id:'yeopo', name:'여포', kind:'enemy', forced:'escape', affiliation:'동탁군', troop:5000,
    stats:{atk:99, def:88, spd:91, int:26, cha:14}, intro:'제후군 따위, 내 방천화극 앞에 몇이나 버틴다더냐!' },
  songheon: { id:'songheon', name:'송헌', kind:'enemy', forced:null, affiliation:'여포군', troop:2000,
    stats:{atk:58, def:52, spd:51, int:35, cha:30}, intro:'여포 밑에 있어봐야 하루하루가 살얼음판이었소. 차라리 잘 됐군.' },
  wisok: { id:'wisok', name:'위속', kind:'enemy', forced:null, affiliation:'여포군', troop:1800,
    stats:{atk:55, def:54, spd:48, int:33, cha:29}, intro:'…나도 송헌과 같은 생각이오.' },

  // 함곡관 (챕터1 결선)
  igak: { id:'igak', name:'이각', kind:'enemy', forced:'escape', affiliation:'동탁군',
    stats:{atk:68, def:48, spd:47, int:35, cha:27}, intro:'동탁 어른은 가셨지만, 우리까지 무너질 성싶으냐!' },
  gwaksa: { id:'gwaksa', name:'곽사', kind:'enemy', forced:'escape', affiliation:'동탁군',
    stats:{atk:57, def:46, spd:48, int:34, cha:26}, intro:'훗날 반드시 돌아오리라!' },
};

// 책사형(지력형) vs 무력형 판정 — 등용 경로가 갈리는 기준
function isScholarType(rd) {
  return !!(rd && rd.stats && rd.stats.int > rd.stats.atk);
}
