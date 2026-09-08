// 챕터1: 관우&장비 루트 — 등장인물 데이터
// stats: 공격/방어/속도/지력/매력 (100점 만점). 전투 없는 이벤트 캐릭터는 stats:null
// forced: 'kill'  = 반드시 처치(등용 불가, 스토리 고정)
//         'escape'= 반드시 도주(등용 불가, 스토리 고정)
//         null    = 일반 처리(패배시 포로화->등용 시도 가능, 혹은 우호적 인물은 바로 등용 시도)
// kind: 'ally-story' 유비군 스토리 인물 / 'recruit' 일반 등용대상 / 'resource' 비전투 이벤트 / 'enemy' 전투 상대

// 필드 위 HD 스프라이트 시트 — 세력/부류별로 공유되는 스펙이라 여기서 한 번만
// 정의하고 ROSTER 각 항목에 매달아둔다 (mapview.js는 이 값을 그대로 읽어 그린다).
const SPRITE_YELLOWTURBAN = { key:'enemy_yellowturban', fw:1024/3, fh:384, sx:.19, sy:.17 };
const SPRITE_DONGTAK = { key:'officer_dongtak', fw:1024/3, fh:384, sx:.19, sy:.17 };
const SPRITE_COALITION = { key:'officer_coalition', fw:362, fh:362, sx:.185, sy:.185 };
const SPRITE_MERCHANT = { key:'npc_merchant', fw:96, fh:96, sx:.67, sy:.70 };
const SPRITE_ELDER = { key:'npc_elder', fw:96, fh:96, sx:.67, sy:.70 };

const ROSTER = {
  yubi: { id:'yubi', name:'유비', role:'주군', kind:'ally-story', affiliation:'유비군',
    desc:'무소속에서 의용군을 일으킨 인물. 지도 위에서 WASD로 조작하는 것은 항상 관우지만, 회남 벌판처럼 유비군을 따로 편성하는 장면에서는 이 능력치로 그 군세의 무력을 계산한다.',
    stats:{atk:55, def:50, spd:45, int:55, cha:95},
    sprite:{ key:'hero_yubi', fw:362, fh:362, sx:.185, sy:.185 } },

  gwanwoo: { id:'gwanwoo', name:'관우', role:'PC', kind:'playable', affiliation:'유비군',
    stats:{atk:92, def:71, spd:58, int:52, cha:76}, weapon:'청룡언월도',
    skills:['samdanchigi'],
    battleArt:{ glyph:'關', weapon:'靑龍偃月刀', className:'hero-green', src:'assets/battle/duel_gwanwoo_v2.png' } },

  jangbi: { id:'jangbi', name:'장비', role:'PC', kind:'playable', affiliation:'유비군',
    stats:{atk:94, def:79, spd:61, int:29, cha:41}, weapon:'장팔사모',
    skills:['pohyo'] },

  // 탁현
  chujeong: { id:'chujeong', name:'추정', kind:'recruit', forced:null, affiliation:'무소속',
    stats:{atk:58, def:52, spd:48, int:51, cha:46}, intro:'황건적 토벌에 자원했다고? 마침 손이 부족했는데 잘 왔소.' },
  noshik: { id:'noshik', name:'노식', kind:'recruit', forced:null, affiliation:'무소속',
    stats:{atk:28, def:37, spd:31, int:88, cha:79}, intro:'그대가 유비의 아우들인가. 세상이 이리 어지러우니, 붓을 놓고 검을 들어야 할 때인가 싶군.',
    sprite:{ key:'hero_noshik', fw:1024/3, fh:384, sx:.19, sy:.17 } },
  yuwongi: { id:'yuwongi', name:'유원기', kind:'resource', reward:{gold:80}, affiliation:'-',
    intro:'현덕이 어릴 때부터 큰 그릇인 줄 알았지. 이 정도 노잣돈은 내가 대야지.', sprite:SPRITE_ELDER },
  sossang: { id:'sossang', name:'소쌍', kind:'resource', reward:{gold:60}, affiliation:'-',
    intro:'그대들 뜻이 크다는 소문을 들었소. 이 정도 금은 내어드리리다.', sprite:SPRITE_MERCHANT },
  jangsepyeong: { id:'jangsepyeong', name:'장세평', kind:'resource', reward:{troop:30}, affiliation:'-',
    intro:'좋은 말과 장정들을 마련해두었소. 큰일에 보태시게.', sprite:SPRITE_MERCHANT },
  gongyung: { id:'gongyung', name:'공융', kind:'recruit', forced:null, affiliation:'북해', chance:0.15,
    stats:{atk:18, def:22, spd:20, int:82, cha:84}, intro:'북해에서 온 공융이오. 이런 촌구석에서 그대들 같은 의기 넘치는 이들을 만날 줄이야.' },
  ganong: { id:'ganong', name:'간옹', kind:'recruit', forced:null, affiliation:'무소속', chance:0.2,
    stats:{atk:24, def:21, spd:26, int:64, cha:69}, intro:'이 몸은 말주변이 좀 있소이다. 협상이 필요하면 불러주시오.' },

  // 탁군 인근 소읍 (적 -> 포로 후 등용)
  gwakseung: { id:'gwakseung', name:'곽승', kind:'enemy', forced:null, affiliation:'재야',
    stats:{atk:52, def:48, spd:45, int:34, cha:31}, intro:'…졌소. 그대들 밑에서 다시 검을 잡을 기회를 주겠소?' },
  yeosang: { id:'yeosang', name:'여상', kind:'enemy', forced:null, affiliation:'재야',
    stats:{atk:49, def:51, spd:42, int:31, cha:28}, intro:'이 마을을 지키려 했을 뿐이오. 당신들이라면 믿어도 되겠소?' },
  jeongwonji: { id:'jeongwonji', name:'정원지', kind:'enemy', forced:null, affiliation:'황건적',
    stats:{atk:41, def:32, spd:38, int:22, cha:21}, intro:'크윽… 살려만 준다면 뭐든 하겠소!', sprite:SPRITE_YELLOWTURBAN },
  deungmu: { id:'deungmu', name:'등무', kind:'enemy', forced:null, affiliation:'황건적',
    stats:{atk:44, def:35, spd:41, int:24, cha:22}, intro:'형님이 항복한다면 나도 따르겠소…', sprite:SPRITE_YELLOWTURBAN },
  gwanhae: { id:'gwanhae', name:'관해', kind:'enemy', forced:null, affiliation:'황건적',
    stats:{atk:53, def:44, spd:40, int:26, cha:24}, intro:'크윽… 북해를 넘본 것이 실수였군. 그대들 밑에서 다시 시작해보겠소.', sprite:SPRITE_YELLOWTURBAN },
  goseung: { id:'goseung', name:'고승', kind:'enemy', forced:null, affiliation:'황건적',
    stats:{atk:41, def:32, spd:38, int:22, cha:21}, intro:'크윽… 살려만 준다면 뭐든 하겠소!', sprite:SPRITE_YELLOWTURBAN },
  muangug: { id:'muangug', name:'무안국', kind:'enemy', forced:null, affiliation:'재야',
    stats:{atk:60, def:50, spd:47, int:33, cha:30}, intro:'…이 몸싸움, 내가 졌소. 그대들을 따르겠소.' },

  // 평원현
  jeonhae: { id:'jeonhae', name:'전해', kind:'recruit', forced:null, affiliation:'공손찬군',
    stats:{atk:64, def:57, spd:52, int:49, cha:53}, intro:'공손찬 어른 밑에서 청주를 맡고 있는 전해요. 소문은 익히 들었소.' },
  gwanjeong: { id:'gwanjeong', name:'관정', kind:'recruit', forced:null, affiliation:'공손찬군',
    stats:{atk:24, def:21, spd:26, int:78, cha:61}, intro:'공손찬 어른의 명을 전하러 왔소. 격문을 받으시오.' },
  eomgang: { id:'eomgang', name:'엄강', kind:'recruit', forced:null, affiliation:'공손찬군',
    stats:{atk:69, def:58, spd:55, int:38, cha:41}, intro:'나도 이번 싸움에 나선다네. 잘 부탁하네.' },
  jowoon: { id:'jowoon', name:'조운', kind:'recruit', forced:null, affiliation:'무소속', chance:0.15,
    stats:{atk:91, def:68, spd:97, int:58, cha:79}, intro:'…떠도는 무사요. 정해진 주인은 없소만, 그쪽 형제들 싸우는 모습이 마음에 드는군.' },
  jeonju: { id:'jeonju', name:'전주', kind:'recruit', forced:null, affiliation:'유주',
    stats:{atk:45, def:42, spd:44, int:70, cha:58}, intro:'우북평 무종현의 전주라 하오. 검이든 붓이든, 쓰일 곳이 있다면 마다치 않겠소.' },
  // 챕터2 서주에서는 도겸의 추천으로 다시 등장(michuk 항목 옆 캐릭터 결 참고
  // 주석 참조) - 미축·미방과 마찬가지로 유비 개인에게 의리를 지켜 끝까지 함께한다.
  songgeon: { id:'songgeon', name:'손건', kind:'recruit', forced:null, affiliation:'무소속', chance:0.2,
    stats:{atk:21, def:19, spd:24, int:68, cha:61}, intro:'글재주밖에 없는 손건이오만, 필요하다면 붓이라도 들겠소.' },
  jeonye: { id:'jeonye', name:'전예', kind:'recruit', forced:null, affiliation:'유주',
    stats:{atk:54, def:50, spd:55, int:64, cha:60}, intro:'우북평의 전예라 하오. 그대들의 그릇이 예사롭지 않아 보여, 염치 불고하고 스스로 찾아왔소.' },
  yeomyu: { id:'yeomyu', name:'염유', kind:'recruit', forced:null, affiliation:'유주',
    stats:{atk:48, def:45, spd:50, int:68, cha:64}, intro:'오환·선비와 함께 자라 그들의 말을 아는 염유라 하오. 이 반란, 그들의 힘을 빌리면 어렵지 않게 잠재울 수 있소.' },
  jangpae: { id:'jangpae', name:'장패', kind:'recruit', forced:null, affiliation:'무소속', chance:0.2,
    stats:{atk:83, def:66, spd:60, int:35, cha:44}, intro:'태산의 장패라 하오. 힘 쓸 곳을 찾고 있었는데, 마침 잘 만났소.' },
  taesaja: { id:'taesaja', name:'태사자', kind:'recruit', forced:null, affiliation:'무소속', chance:0.08,
    stats:{atk:90, def:70, spd:88, int:55, cha:66}, intro:'동래의 태사자요. 떠돌던 차에, 그대들의 그릇을 한번 보고 싶었소.' },
  yuyo: { id:'yuyo', name:'유요', kind:'recruit', forced:null, affiliation:'무소속', chance:0.08,
    stats:{atk:38, def:40, spd:34, int:62, cha:68}, intro:'한실의 종친, 유정례라 하오. 그대도 한실의 피를 이었다지, 반갑구려.' },
  choeyeom: { id:'choeyeom', name:'최염', kind:'recruit', forced:null, affiliation:'무소속', chance:0.08,
    stats:{atk:24, def:30, spd:26, int:84, cha:80}, intro:'청하의 최염이라 하오. 그대의 의로운 소문을 듣고 찾아왔소.' },
  yuwoo: { id:'yuwoo', name:'유우', kind:'flavor', affiliation:'유주',
    intro:'유주목 유우라 하네. 대주 태수 유회 공이 보낸 원군이라 들었네.', sprite:SPRITE_ELDER },
  jangsun: { id:'jangsun', name:'장순', kind:'enemy', forced:null, affiliation:'반란군', troop:3000,
    stats:{atk:68, def:58, spd:55, int:40, cha:35}, intro:'…이걸로 끝인가. 어양에서 다시 보자꾸나.',
    sprite:{ key:'enemy_jangsun', fw:362, fh:362, sx:.18, sy:.18 } },

  // 반동탁연합 진영 (등용 불가, 서사 전용 인물)
  wonso: { id:'wonso', name:'원소', kind:'flavor', affiliation:'반동탁연합',
    intro:'맹주로 추대된 원소요. 각지의 제후들이 모였으나, 아직 누가 선봉에 설지 정하지 못했소.', sprite:SPRITE_COALITION },
  jojo: { id:'jojo', name:'조조', kind:'flavor', affiliation:'반동탁연합',
    intro:'맹덕이라 하오. 이런 촌구석 의용군에서도 쓸만한 인재가 나올 수 있는 법이지.', sprite:SPRITE_COALITION },
  gongsonchan: { id:'gongsonchan', name:'공손찬', kind:'flavor', affiliation:'반동탁연합',
    intro:'백규요. 자네들이 현덕의 아우들인가. 내 현덕과는 동문수학한 사이라네, 잘 부탁하네.', sprite:SPRITE_COALITION },
  songyeon: { id:'songyeon', name:'손견', kind:'flavor', affiliation:'반동탁연합',
    intro:'강동의 손문대요. 선봉은 이 몸이 서겠소. 동탁 따위, 단숨에 짓밟아주지!', sprite:SPRITE_COALITION },

  // 사수관
  hwaung: { id:'hwaung', name:'화웅', kind:'enemy', forced:'kill', affiliation:'동탁군',
    stats:{atk:81, def:62, spd:58, int:31, cha:22}, intro:'이런 촌뜨기들까지 나선단 말이냐? 목이나 내놓아라!',
    sprite:SPRITE_DONGTAK,
    battleArt:{ glyph:'華', weapon:'長槍', className:'enemy-red', src:'assets/battle/duel_hwaung_v2.png' } },
  hojin: { id:'hojin', name:'호진', kind:'enemy', forced:null, affiliation:'동탁군', troop:1500,
    stats:{atk:72, def:61, spd:49, int:38, cha:33}, intro:'…내가 졌다. 동탁을 섬긴 것도 딱히 충심은 아니었소. 그대들이라면 나쁘지 않겠군.', sprite:SPRITE_DONGTAK },

  // 호로관
  yeopo: { id:'yeopo', name:'여포', kind:'enemy', forced:'escape', affiliation:'동탁군', troop:5000,
    stats:{atk:99, def:88, spd:91, int:26, cha:14}, intro:'제후군 따위, 내 방천화극 앞에 몇이나 버틴다더냐!',
    sprite:{ key:'hero_yeopo', fw:971/3, fh:1619/4, sx:.20, sy:.165 },
    battleArt:{ glyph:'呂', weapon:'方天畫戟', className:'enemy-red', src:'assets/battle/duel_yeopo_v2.png' } },
  // 장제는 훗날 조카 장수와 이어지는 서사가 있어 여기서 등용되면 안 된다.
  // 패색이 짙으면 등용 제안 없이 군세를 버리고 달아난다 (이각·곽사와 동일한 처리).
  jangje: { id:'jangje', name:'장제', kind:'enemy', forced:'escape', affiliation:'동탁군', troop:1700,
    stats:{atk:65, def:57, spd:47, int:36, cha:31}, intro:'…서량의 사내들은 이런 걸로 꺾이지 않는다. 훗날을 도모하마.', sprite:SPRITE_DONGTAK },
  beonjo: { id:'beonjo', name:'번조', kind:'enemy', forced:null, affiliation:'동탁군', troop:1600,
    stats:{atk:62, def:55, spd:53, int:34, cha:30}, intro:'…동탁 어른 없이 서량에 남을 이유도 없지. 그대라면, 한번 믿어볼 만하겠소.', sprite:SPRITE_DONGTAK },
  // 여포군 소속 부장. 호로관에서는 등장시키지 않고, 훗날 여포를 배신하는
  // 서사(챕터2)를 위해 남겨둔다.
  songheon: { id:'songheon', name:'송헌', kind:'enemy', forced:null, affiliation:'여포군', troop:2000,
    stats:{atk:58, def:52, spd:51, int:35, cha:30}, intro:'여포 밑에 있어봐야 하루하루가 살얼음판이었소. 차라리 잘 됐군.', sprite:SPRITE_DONGTAK },
  wisok: { id:'wisok', name:'위속', kind:'enemy', forced:null, affiliation:'여포군', troop:1800,
    stats:{atk:55, def:54, spd:48, int:33, cha:29}, intro:'…나도 송헌과 같은 생각이오.', sprite:SPRITE_DONGTAK },

  // 함곡관 (챕터1 결선)
  igak: { id:'igak', name:'이각', kind:'enemy', forced:'escape', affiliation:'동탁군',
    stats:{atk:68, def:48, spd:47, int:35, cha:27}, intro:'동탁 어른은 가셨지만, 우리까지 무너질 성싶으냐!', sprite:SPRITE_DONGTAK },
  gwaksa: { id:'gwaksa', name:'곽사', kind:'enemy', forced:'escape', affiliation:'동탁군',
    stats:{atk:57, def:46, spd:48, int:34, cha:26}, intro:'훗날 반드시 돌아오리라!', sprite:SPRITE_DONGTAK },

  // ---- 챕터2 (관우) : 서주 - 삼양서주 ----
  dogyeom: { id:'dogyeom', name:'도겸', kind:'flavor', affiliation:'서주',
    intro:'서주자사 도겸이오. 노쇠한 이 몸으로는 더 이상 이 땅을 지키기 어려울 듯하오.', sprite:SPRITE_ELDER },
  // 성벽 밖에 진을 친 조조군 8개 부대 - 실제 전투 없이 등장했다 복양 급보를
  // 듣고 물러나면 지도에서 모두 제거되지만, kind:'enemy'와 실제 스탯을 갖춘
  // 진짜 군세로 만들어 두어야 훗날(하비성전투 등)에도 그대로 재사용할 수 있다.
  // 순욱/정욱 등 조조의 핵심 책사들은 이 시점 연주(뒷마당)를 지키고 있었고,
  // 그 사이 진궁이 여포를 끌어들여 복양을 빼앗는 것이 바로 이 장면 다음에
  // 벌어지는 사건이므로(챕터2 핵심 반전), 이들을 서주 진중에 등장시키지
  // 않는다 - 대신 조조 본인의 지력을 높게 잡아 지휘부의 지력을 담당하게 했다.
  jojo_jungong: { id:'jojo_jungong', name:'조조(중군)', kind:'enemy', forced:null, affiliation:'조조군', troop:5000,
    stats:{atk:74, def:68, spd:62, int:88, cha:85},
    intro:'…아버지의 원한, 이 서주 땅에서 반드시 갚고야 말겠다.', sprite:SPRITE_COALITION },
  habudon_seoju: { id:'habudon_seoju', name:'하후돈군', kind:'enemy', forced:null, affiliation:'조조군', troop:5000,
    stats:{atk:82, def:68, spd:56, int:42, cha:62},
    intro:'주공의 명이다. 성문이 열릴 때까지 한 발짝도 물러서지 마라!', sprite:SPRITE_COALITION },
  habuyeon_seoju: { id:'habuyeon_seoju', name:'하후연군', kind:'enemy', forced:null, affiliation:'조조군', troop:5000,
    stats:{atk:79, def:60, spd:78, int:44, cha:53},
    intro:'…버텨봐야 며칠이나 가겠느냐.', sprite:SPRITE_COALITION },
  join_seoju: { id:'join_seoju', name:'조인군', kind:'enemy', forced:null, affiliation:'조조군', troop:5000,
    stats:{atk:73, def:84, spd:52, int:52, cha:58},
    intro:'성벽이 제법 단단하군. 허나 오래는 못 갈 것이다.', sprite:SPRITE_COALITION },
  johong_seoju: { id:'johong_seoju', name:'조홍군', kind:'enemy', forced:null, affiliation:'조조군', troop:3000,
    stats:{atk:68, def:64, spd:54, int:38, cha:50},
    intro:'…형님의 원수, 내가 반드시 갚아드리겠소.', sprite:SPRITE_COALITION },
  akjin_seoju: { id:'akjin_seoju', name:'악진군', kind:'enemy', forced:null, affiliation:'조조군', troop:3000,
    stats:{atk:77, def:59, spd:64, int:40, cha:42},
    intro:'명만 내리시면 언제든 성벽을 넘겠습니다.', sprite:SPRITE_COALITION },
  ugeum_seoju: { id:'ugeum_seoju', name:'우금군', kind:'enemy', forced:null, affiliation:'조조군', troop:3000,
    stats:{atk:67, def:72, spd:49, int:58, cha:47},
    intro:'군기가 흐트러지지 않도록 단속하고 있습니다.', sprite:SPRITE_COALITION },
  ijeon_seoju: { id:'ijeon_seoju', name:'이전군', kind:'enemy', forced:null, affiliation:'조조군', troop:3000,
    stats:{atk:61, def:59, spd:51, int:62, cha:63},
    intro:'…이 많은 백성까지 해할 필요가 있을지 모르겠군.', sprite:SPRITE_COALITION },
  // 조조군이 물러난 뒤 서주 자유탐방 중 만나는 서주 사람들. 도겸의 옛 신하이므로
  // 도겸이 죽고 유비가 서주목이 되는 순간 자연스럽게 유비를 섬기게 된다(main.js
  // checkDeadlines의 dogyeom_death 처리에서 자동으로 등용 처리) - 다른 장수들처럼
  // 친밀도를 쌓아 별도로 등용을 제안하는 대상이 아니라서 kind는 flavor로 둔다.
  //
  // [캐릭터 결 참고 - 연의 기준 최종 거취] 이 챕터가 끝나갈 무렵(하비 함락 이후
  // 여포가 조조에게 처형되는 시점)에 갈라지는 두 부류를 대사에 반영할 것:
  //   - 진규·진등: 애당초 여포가 서주를 다스릴 때도 유비를 따라 서주를 떠나지
  //     않았다 - 서주(고향/지역)에 대한 충성이 우선이라, 여포 사후에도 그냥
  //     서주에 남아 조조를 돕는다. 인물 자체에 대한 충성이 아니라 서주 땅과
  //     행정을 지키는 실무자적 가치관.
  //   - 미축·미방·손건: 도겸이 죽은 뒤로는 유비 개인에게 충성하며, 이후로도
  //     끝까지 유비를 따라간다. 사람(유비)에 대한 의리가 우선인 가치관.
  // 향후 하비 함락/여포 처형 관련 장면을 쓸 때 이 구분을 대사 톤에 녹일 것.
  michuk: { id:'michuk', name:'미축', kind:'flavor', affiliation:'서주',
    stats:{atk:20, def:24, spd:22, int:76, cha:82},
    intro:'서주의 미축이라 하오. 도겸 어른을 오래 모셔왔소만, 이제 유 사군께 힘을 보태고 싶소.' },
  mibang: { id:'mibang', name:'미방', kind:'flavor', affiliation:'서주',
    stats:{atk:34, def:36, spd:32, int:48, cha:40},
    intro:'형님을 따라왔소이다. 큰 도움은 못 되겠지만, 힘껏 돕겠소.' },
  // 진규·진등 부자는 도겸의 신하라, 도겸이 살아있는 동안 곧바로 등용하면
  // 모양새가 좋지 않다 - 서주 자유탐방 중에는 조표처럼 대화만 나누고,
  // 실제 등용은 도겸의 죽음과 함께(main.js의 dogyeom_death 처리) 이뤄진다.
  jingyu: { id:'jingyu', name:'진규', kind:'flavor', affiliation:'서주',
    stats:{atk:22, def:26, spd:20, int:80, cha:78},
    intro:'하비상 진규요. 그대의 그릇이 어떤지, 이렇게 직접 보러 왔소.', sprite:SPRITE_ELDER },
  // 진규의 아들. 챕터2 장면2(하비성 관청)에서 원술 정벌에 필요한 병력을
  // 모아주는 실제 상호작용(행동력 소모 + 병력 획득)을 담당한다.
  jindeung: { id:'jindeung', name:'진등', kind:'flavor', affiliation:'서주',
    stats:{atk:38, def:40, spd:36, int:74, cha:66},
    intro:'광릉태수 진등이라 하오. 병력을 모으는 일이라면 제게 맡겨주십시오.', sprite:SPRITE_ELDER },

  // 서주 자유탐방 중 새로 만나는 인물들. 진군·서성은 희귀 출현(도겸의 소개 없이
  // 우연히 마주치는 발견형), 손관은 일반 출현(장패와 동향인 낭야 사람으로,
  // 자유탐방이 시작되면 곧바로 등장), 조표는 도겸 밑의 관원으로 훗날 하비성을
  // 여포에게 열어주는 배신을 암시하는 서사 전용 인물이다(연의 14회).
  jingun: { id:'jingun', name:'진군', kind:'recruit', forced:null, affiliation:'서주', chance:0.2,
    stats:{atk:22, def:26, spd:24, int:81, cha:77}, intro:'예주 출신 진군이라 하오. 어지러운 세상, 그대라면 믿고 몸을 맡길 만하다 여겨 찾아왔소.' },
  seoseong: { id:'seoseong', name:'서성', kind:'recruit', forced:null, affiliation:'서주', chance:0.2,
    stats:{atk:82, def:66, spd:58, int:56, cha:48}, intro:'서성이라 하오. 힘 쓰는 일이라면 자신 있으니, 부디 써주시오.' },
  songgwan: { id:'songgwan', name:'손관', kind:'recruit', forced:null, affiliation:'서주',
    stats:{atk:78, def:63, spd:57, int:33, cha:41}, intro:'낭야의 손관이라 하오. 같은 고향의 장패가 그대들 밑에 있다기에 찾아왔소.' },
  jopyo: { id:'jopyo', name:'조표', kind:'flavor', affiliation:'서주',
    intro:'서주의 관원 조표요. …흥, 굴러온 돌이 사는 게 참 편해 보이는구려.', sprite:SPRITE_ELDER },
  // 장패 무리의 일원 - 지도에 고정 배치하지 않고, 챕터1의 여상과 같은 방식으로
  // 서주 자유탐방 중 휴식(다음달)할 때 확률적으로 마주치는 돌발 전투로 등장한다
  // (main.js의 triggerOdonEvent/maybeSeojuRandomEvent 참고).
  odon: { id:'odon', name:'오돈', kind:'enemy', forced:null, affiliation:'무소속',
    stats:{atk:56, def:50, spd:46, int:28, cha:30}, intro:'…소문으로만 듣던 그대들이군. 이 몸이 상대해주겠소.' },

  // ---- 챕터2 (관우) : 회남 - 원술 정벌 [장면3] ----
  // 기령·교유·뇌박·진란은 실제 전투 대상(kind:'enemy')이고, 원술만 서사
  // 전용이다. 기령은 관우군이, 교유는 유비군이 맡는다(warArmy:'ally'가
  // 있으면 main.js의 openWarCommandMenu가 GameState.allyArmy를 써서
  // 판정한다). 뇌박·진란은 성문 앞을 지키는 선봉이라 관우군이 상대하고,
  // 둘 다 쓰러지면(main.js checkWonsulRetreat) 원술은 남은 병력을 이끌고
  // 성 안으로 물러난다 - 이번 장면에서는 원술 본인과는 싸우지 않는다.
  giryeong: { id:'giryeong', name:'기령', kind:'enemy', forced:null, affiliation:'원술군', troop:5000,
    stats:{atk:80, def:65, spd:60, int:45, cha:50},
    intro:'…네놈이 관우로구나! 이 기령의 삼첨도를 받아보아라!', sprite:SPRITE_COALITION },
  gyoyu: { id:'gyoyu', name:'교유', kind:'enemy', forced:null, affiliation:'원술군', troop:4000, warArmy:'ally',
    stats:{atk:60, def:55, spd:50, int:30, cha:35},
    intro:'유비 그자가 감히 우리 주공을 노린단 말이냐!', sprite:SPRITE_COALITION },
  wonsul: { id:'wonsul', name:'원술', kind:'flavor', affiliation:'원술군', troop:8000,
    intro:'…흥, 유비 따위가 감히 이 원술의 땅을 넘본단 말이냐. 성문을 굳게 걸어라!', sprite:SPRITE_COALITION },
  noebak: { id:'noebak', name:'뇌박', kind:'enemy', forced:null, affiliation:'원술군', troop:3000,
    stats:{atk:55, def:50, spd:45, int:20, cha:25},
    intro:'주공의 명이다, 성벽만 지키면 된다. 함부로 들어올 생각 마라!', sprite:SPRITE_COALITION },
  jinran: { id:'jinran', name:'진란', kind:'enemy', forced:null, affiliation:'원술군', troop:3000,
    stats:{atk:58, def:52, spd:48, int:22, cha:24},
    intro:'섣불리 나가 싸울 필요 없다. 버티기만 하면 이긴다더니… 어쩔 수 없군!', sprite:SPRITE_COALITION },

  // ---- 데이터베이스 등록용 (아직 특정 장면/지도에 배치되지 않음) ----
  // 챕터2 후반(하비 함락, 여포 처형 / 회남 원술 정벌 확장)에 어떻게든 등장할
  // 예정인 인물들을 미리 등록해둔다. troop·배치 좌표는 실제 장면을 만들 때
  // 정한다. 위속·송헌은 이미 위(호로관 섹션)에 등록되어 있어 여기서는 제외.
  jingung: { id:'jingung', name:'진궁', kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:30, def:34, spd:32, int:92, cha:68}, sprite:SPRITE_DONGTAK,
    intro:'…내 계책을 따랐더라면, 이 지경까지 오지는 않았을 것을.' },
  gosun: { id:'gosun', name:'고순', kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:88, def:82, spd:60, int:58, cha:35}, sprite:SPRITE_DONGTAK,
    intro:'…함진영은 항복을 모른다. 덤벼라.' },
  jangryo: { id:'jangryo', name:'장료', kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:90, def:75, spd:80, int:70, cha:72}, sprite:SPRITE_DONGTAK,
    intro:'…주공이 어리석었을 뿐, 나는 아직 죽을 자리를 찾지 못했다.' },
  hakmaeng: { id:'hakmaeng', name:'학맹', kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:70, def:60, spd:58, int:40, cha:38}, sprite:SPRITE_DONGTAK,
    intro:'여포군의 학맹이다. 이대로 물러설 성싶으냐!' },
  joseong: { id:'joseong', name:'조성', kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:66, def:58, spd:52, int:38, cha:36}, sprite:SPRITE_DONGTAK,
    intro:'여포군의 조성이다.' },
  seongryeom: { id:'seongryeom', name:'성렴', kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:64, def:56, spd:50, int:36, cha:34}, sprite:SPRITE_DONGTAK,
    intro:'여포군의 성렴이다.' },
  huseong: { id:'huseong', name:'후성', kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:60, def:54, spd:52, int:42, cha:38}, sprite:SPRITE_DONGTAK,
    intro:'…술 때문에 매질까지 당했는데, 계속 이 밑에 있어야 할지 모르겠군.' },
  janghun: { id:'janghun', name:'장훈', kind:'enemy', forced:null, affiliation:'원술군',
    stats:{atk:70, def:60, spd:55, int:44, cha:46}, sprite:SPRITE_COALITION,
    intro:'원술군의 장훈이다.' },
  jingi: { id:'jingi', name:'진기', kind:'enemy', forced:null, affiliation:'원술군',
    stats:{atk:50, def:48, spd:44, int:60, cha:54}, sprite:SPRITE_COALITION,
    intro:'원술군의 진기라 하오.' },
  // 조조군의 이전(李典, id:ijeon_seoju)과는 한글 표기만 같은 별개 인물(원술군
  // 이전/李豊)이라 id를 구분한다.
  ipung: { id:'ipung', name:'이전', kind:'enemy', forced:null, affiliation:'원술군',
    stats:{atk:56, def:52, spd:48, int:42, cha:40}, sprite:SPRITE_COALITION,
    intro:'원술군의 이전이다.' },
  yanggang: { id:'yanggang', name:'양강', kind:'enemy', forced:null, affiliation:'원술군',
    stats:{atk:60, def:54, spd:50, int:40, cha:38}, sprite:SPRITE_COALITION,
    intro:'원술군의 양강이다.' },
  akchwi: { id:'akchwi', name:'악취', kind:'enemy', forced:null, affiliation:'원술군',
    stats:{atk:54, def:50, spd:46, int:36, cha:34}, sprite:SPRITE_COALITION,
    intro:'원술군의 악취다.' },
};

// 책사형(지력형) vs 무력형 판정 — 등용 경로가 갈리는 기준
function isScholarType(rd) {
  return !!(rd && rd.stats && rd.stats.int > rd.stats.atk);
}
