// 챕터1: 관우&장비 루트 — 등장인물 데이터
// stats: 공격/방어/속도/지력/매력/통솔 (100점 만점). 전투 없는 이벤트 캐릭터는 stats:null
//   - lead(통솔): 군사를 얼마나 잘 다루는가 - 앞으로 군세 편성시 최대 병력을
//     이 값으로 제한할 예정이다. 책사는 어차피 군세를 단독으로 편성하지
//     못해 게임상 실질적 효과가 없으므로 대체로 낮게 잡되, 제갈각·조비처럼
//     실제 군 지휘 경력이 있는 인물은 예외적으로 높였다. 반대로 여포처럼
//     개인 무력(atk)은 최강이라도 통솔은 그저 그런 인물도 있다.
// forced: 'kill'  = 반드시 처치(등용 불가, 스토리 고정)
//         'escape'= 반드시 도주(등용 불가, 스토리 고정)
//         null    = 일반 처리(패배시 포로화->등용 시도 가능, 혹은 우호적 인물은 바로 등용 시도)
// kind: 'ally-story' 유비군 스토리 인물 / 'recruit' 일반 등용대상 / 'resource' 비전투 이벤트 / 'enemy' 전투 상대
// birth/deathReal/deathVirtual: 출생년·사망년(서기).
//   - deathReal: 정사(정식 역사서)/연의 기준 실제 사망년.
//   - deathVirtual: "가상 사망년" - 이 게임 세계관에서 다들 90세까지는 산다고
//     가정한 값(birth+90)이 기본값이다. 실제 게임 진행상 등용되거나 일찍
//     죽는 등 그 인물만의 결말이 정해지면, 그 장면을 쓸 때 이 값을 따로
//     고치면 된다.
//   - 게임 시작 시 "실제 사망년 반영/가상 사망년 반영" 중 하나를 고르게 해서
//     어느 쪽을 기준으로 등장 여부를 판정할지 정할 수 있게 두 값을 분리해뒀다.

// 필드 위 HD 스프라이트 시트 — 세력/부류별로 공유되는 스펙이라 여기서 한 번만
// 정의하고 ROSTER 각 항목에 매달아둔다 (mapview.js는 이 값을 그대로 읽어 그린다).
const SPRITE_YELLOWTURBAN = { key:'enemy_yellowturban', fw:1024/3, fh:384, sx:.19, sy:.17 };
const SPRITE_DONGTAK = { key:'officer_dongtak', fw:1024/3, fh:384, sx:.19, sy:.17 };
const SPRITE_COALITION = { key:'officer_coalition', fw:362, fh:362, sx:.185, sy:.185 };
const SPRITE_MERCHANT = { key:'npc_merchant', fw:96, fh:96, sx:.67, sy:.70 };
const SPRITE_ELDER = { key:'npc_elder', fw:96, fh:96, sx:.67, sy:.70 };

const ROSTER = {
  yubi: { id:'yubi', name:'유비', birth:161, deathReal:223, deathVirtual:251, role:'주군', kind:'ally-story', affiliation:'유비군',
    desc:'무소속에서 의용군을 일으킨 인물. 지도 위에서 WASD로 조작하는 것은 항상 관우지만, 회남 벌판처럼 유비군을 따로 편성하는 장면에서는 이 능력치로 그 군세의 무력을 계산한다.',
    stats:{atk:55, def:50, spd:45, int:55, cha:95, lead:65},
    sprite:{ key:'hero_yubi', fw:362, fh:362, sx:.185, sy:.185 } },

  gwanwoo: { id:'gwanwoo', name:'관우', birth:160, deathReal:220, deathVirtual:250, role:'PC', kind:'playable', affiliation:'유비군',
    stats:{atk:92, def:71, spd:58, int:52, cha:76, lead:88}, weapon:'청룡언월도',
    skills:['samdanchigi'],
    battleArt:{ glyph:'關', weapon:'靑龍偃月刀', className:'hero-green', src:'assets/battle/duel_gwanwoo_v2.png' } },

  jangbi: { id:'jangbi', name:'장비', birth:165, deathReal:221, deathVirtual:255, role:'PC', kind:'playable', affiliation:'유비군',
    stats:{atk:94, def:79, spd:61, int:29, cha:41, lead:78}, weapon:'장팔사모',
    skills:['pohyo'] },

  // 탁현
  chujeong: { id:'chujeong', name:'추정', birth:162, deathReal:230, deathVirtual:252, kind:'recruit', forced:null, affiliation:'무소속',
    stats:{atk:58, def:52, spd:48, int:51, cha:46, lead:42}, intro:'황건적 토벌에 자원했다고? 마침 손이 부족했는데 잘 왔소.' },
  noshik: { id:'noshik', name:'노식', birth:140, deathReal:192, deathVirtual:230, kind:'recruit', forced:null, affiliation:'무소속',
    stats:{atk:28, def:37, spd:31, int:88, cha:79, lead:68}, intro:'그대가 유비의 아우들인가. 세상이 이리 어지러우니, 붓을 놓고 검을 들어야 할 때인가 싶군.',
    sprite:{ key:'hero_noshik', fw:1024/3, fh:384, sx:.19, sy:.17 } },
  yuwongi: { id:'yuwongi', name:'유원기', birth:130, deathReal:200, deathVirtual:220, kind:'resource', reward:{gold:80}, affiliation:'-',
    intro:'현덕이 어릴 때부터 큰 그릇인 줄 알았지. 이 정도 노잣돈은 내가 대야지.', sprite:SPRITE_ELDER },
  sossang: { id:'sossang', name:'소쌍', birth:145, deathReal:210, deathVirtual:235, kind:'resource', reward:{gold:60}, affiliation:'-',
    intro:'그대들 뜻이 크다는 소문을 들었소. 이 정도 금은 내어드리리다.', sprite:SPRITE_MERCHANT },
  jangsepyeong: { id:'jangsepyeong', name:'장세평', birth:140, deathReal:205, deathVirtual:230, kind:'resource', reward:{troop:30}, affiliation:'-',
    intro:'좋은 말과 장정들을 마련해두었소. 큰일에 보태시게.', sprite:SPRITE_MERCHANT },
  gongyung: { id:'gongyung', name:'공융', birth:153, deathReal:208, deathVirtual:243, kind:'recruit', forced:null, affiliation:'북해', chance:0.15,
    stats:{atk:18, def:22, spd:20, int:82, cha:84, lead:25}, intro:'북해에서 온 공융이오. 이런 촌구석에서 그대들 같은 의기 넘치는 이들을 만날 줄이야.' },
  ganong: { id:'ganong', name:'간옹', birth:155, deathReal:225, deathVirtual:245, kind:'recruit', forced:null, affiliation:'무소속', chance:0.2,
    stats:{atk:24, def:21, spd:26, int:64, cha:69, lead:20}, intro:'이 몸은 말주변이 좀 있소이다. 협상이 필요하면 불러주시오.' },

  // 탁군 인근 소읍 (적 -> 포로 후 등용)
  gwakseung: { id:'gwakseung', name:'곽승', birth:153, deathReal:215, deathVirtual:243, kind:'enemy', forced:null, affiliation:'재야',
    stats:{atk:52, def:48, spd:45, int:34, cha:31, lead:40}, intro:'…졌소. 그대들 밑에서 다시 검을 잡을 기회를 주겠소?' },
  yeosang: { id:'yeosang', name:'여상', birth:150, deathReal:210, deathVirtual:240, kind:'enemy', forced:null, affiliation:'재야',
    stats:{atk:49, def:51, spd:42, int:31, cha:28, lead:38}, intro:'이 마을을 지키려 했을 뿐이오. 당신들이라면 믿어도 되겠소?' },
  jeongwonji: { id:'jeongwonji', name:'정원지', birth:163, deathReal:205, deathVirtual:253, kind:'enemy', forced:null, affiliation:'황건적',
    stats:{atk:41, def:32, spd:38, int:22, cha:21, lead:32}, intro:'크윽… 살려만 준다면 뭐든 하겠소!', sprite:SPRITE_YELLOWTURBAN },
  deungmu: { id:'deungmu', name:'등무', birth:160, deathReal:205, deathVirtual:250, kind:'enemy', forced:null, affiliation:'황건적',
    stats:{atk:44, def:35, spd:41, int:24, cha:22, lead:34}, intro:'형님이 항복한다면 나도 따르겠소…', sprite:SPRITE_YELLOWTURBAN },
  gwanhae: { id:'gwanhae', name:'관해', birth:150, deathReal:208, deathVirtual:240, kind:'enemy', forced:null, affiliation:'황건적',
    stats:{atk:53, def:44, spd:40, int:26, cha:24, lead:42}, intro:'크윽… 북해를 넘본 것이 실수였군. 그대들 밑에서 다시 시작해보겠소.', sprite:SPRITE_YELLOWTURBAN },
  goseung: { id:'goseung', name:'고승', birth:162, deathReal:205, deathVirtual:252, kind:'enemy', forced:null, affiliation:'황건적',
    stats:{atk:41, def:32, spd:38, int:22, cha:21, lead:32}, intro:'크윽… 살려만 준다면 뭐든 하겠소!', sprite:SPRITE_YELLOWTURBAN },
  muangug: { id:'muangug', name:'무안국', birth:155, deathReal:192, deathVirtual:245, kind:'enemy', forced:null, affiliation:'재야',
    stats:{atk:60, def:50, spd:47, int:33, cha:30, lead:48}, intro:'…이 몸싸움, 내가 졌소. 그대들을 따르겠소.' },

  // 평원현
  jeonhae: { id:'jeonhae', name:'전해', birth:145, deathReal:210, deathVirtual:235, kind:'recruit', forced:null, affiliation:'공손찬군',
    stats:{atk:64, def:57, spd:52, int:49, cha:53, lead:45}, intro:'공손찬 어른 밑에서 청주를 맡고 있는 전해요. 소문은 익히 들었소.' },
  gwanjeong: { id:'gwanjeong', name:'관정', birth:165, deathReal:215, deathVirtual:255, kind:'recruit', forced:null, affiliation:'공손찬군',
    stats:{atk:24, def:21, spd:26, int:78, cha:61, lead:22}, intro:'공손찬 어른의 명을 전하러 왔소. 격문을 받으시오.' },
  eomgang: { id:'eomgang', name:'엄강', birth:162, deathReal:205, deathVirtual:252, kind:'recruit', forced:null, affiliation:'공손찬군',
    stats:{atk:69, def:58, spd:55, int:38, cha:41, lead:50}, intro:'나도 이번 싸움에 나선다네. 잘 부탁하네.' },
  jowoon: { id:'jowoon', name:'조운', birth:168, deathReal:229, deathVirtual:258, kind:'recruit', forced:null, affiliation:'무소속', chance:0.15,
    stats:{atk:91, def:68, spd:97, int:58, cha:79, lead:82}, intro:'…떠도는 무사요. 정해진 주인은 없소만, 그쪽 형제들 싸우는 모습이 마음에 드는군.' },
  jeonju: { id:'jeonju', name:'전주', birth:155, deathReal:232, deathVirtual:245, kind:'recruit', forced:null, affiliation:'유주',
    stats:{atk:45, def:42, spd:44, int:70, cha:58, lead:35}, intro:'우북평 무종현의 전주라 하오. 검이든 붓이든, 쓰일 곳이 있다면 마다치 않겠소.' },
  // 챕터2 서주에서는 도겸의 추천으로 다시 등장(michuk 항목 옆 캐릭터 결 참고
  // 주석 참조) - 미축·미방과 마찬가지로 유비 개인에게 의리를 지켜 끝까지 함께한다.
  songgeon: { id:'songgeon', name:'손건', birth:158, deathReal:215, deathVirtual:248, kind:'recruit', forced:null, affiliation:'무소속', chance:0.2,
    stats:{atk:21, def:19, spd:24, int:68, cha:61, lead:20}, intro:'글재주밖에 없는 손건이오만, 필요하다면 붓이라도 들겠소.' },
  jeonye: { id:'jeonye', name:'전예', birth:189, deathReal:256, deathVirtual:279, kind:'recruit', forced:null, affiliation:'유주',
    stats:{atk:54, def:50, spd:55, int:64, cha:60, lead:38}, intro:'우북평의 전예라 하오. 그대들의 그릇이 예사롭지 않아 보여, 염치 불고하고 스스로 찾아왔소.' },
  yeomyu: { id:'yeomyu', name:'염유', birth:160, deathReal:230, deathVirtual:250, kind:'recruit', forced:null, affiliation:'유주',
    stats:{atk:48, def:45, spd:50, int:68, cha:64, lead:35}, intro:'오환·선비와 함께 자라 그들의 말을 아는 염유라 하오. 이 반란, 그들의 힘을 빌리면 어렵지 않게 잠재울 수 있소.' },
  jangpae: { id:'jangpae', name:'장패', birth:155, deathReal:239, deathVirtual:245, kind:'recruit', forced:null, affiliation:'무소속', chance:0.2,
    stats:{atk:83, def:66, spd:60, int:35, cha:44, lead:60}, intro:'태산의 장패라 하오. 힘 쓸 곳을 찾고 있었는데, 마침 잘 만났소.' },
  taesaja: { id:'taesaja', name:'태사자', birth:166, deathReal:206, deathVirtual:256, kind:'recruit', forced:null, affiliation:'무소속', chance:0.08,
    stats:{atk:90, def:70, spd:88, int:55, cha:66, lead:68}, intro:'동래의 태사자요. 떠돌던 차에, 그대들의 그릇을 한번 보고 싶었소.' },
  yuyo: { id:'yuyo', name:'유요', birth:156, deathReal:198, deathVirtual:246, kind:'recruit', forced:null, affiliation:'무소속', chance:0.08,
    stats:{atk:38, def:40, spd:34, int:62, cha:68, lead:55}, intro:'한실의 종친, 유정례라 하오. 그대도 한실의 피를 이었다지, 반갑구려.' },
  choeyeom: { id:'choeyeom', name:'최염', birth:155, deathReal:216, deathVirtual:245, kind:'recruit', forced:null, affiliation:'무소속', chance:0.08,
    stats:{atk:24, def:30, spd:26, int:84, cha:80, lead:28}, intro:'청하의 최염이라 하오. 그대의 의로운 소문을 듣고 찾아왔소.' },
  yuwoo: { id:'yuwoo', name:'유우', birth:130, deathReal:193, deathVirtual:220, kind:'flavor', affiliation:'유주',
    intro:'유주목 유우라 하네. 대주 태수 유회 공이 보낸 원군이라 들었네.', sprite:SPRITE_ELDER },
  jangsun: { id:'jangsun', name:'장순', birth:145, deathReal:189, deathVirtual:235, kind:'enemy', forced:null, affiliation:'반란군', troop:3000,
    stats:{atk:68, def:58, spd:55, int:40, cha:35, lead:50}, intro:'…이걸로 끝인가. 어양에서 다시 보자꾸나.',
    sprite:{ key:'enemy_jangsun', fw:362, fh:362, sx:.18, sy:.18 } },

  // 반동탁연합 진영 (등용 불가, 서사 전용 인물)
  wonso: { id:'wonso', name:'원소', birth:154, deathReal:202, deathVirtual:244, kind:'flavor', affiliation:'반동탁연합',
    intro:'맹주로 추대된 원소요. 각지의 제후들이 모였으나, 아직 누가 선봉에 설지 정하지 못했소.', sprite:SPRITE_COALITION },
  jojo: { id:'jojo', name:'조조', birth:155, deathReal:220, deathVirtual:245, kind:'flavor', affiliation:'반동탁연합',
    intro:'맹덕이라 하오. 이런 촌구석 의용군에서도 쓸만한 인재가 나올 수 있는 법이지.', sprite:SPRITE_COALITION },
  gongsonchan: { id:'gongsonchan', name:'공손찬', birth:150, deathReal:199, deathVirtual:240, kind:'flavor', affiliation:'반동탁연합',
    intro:'백규요. 자네들이 현덕의 아우들인가. 내 현덕과는 동문수학한 사이라네, 잘 부탁하네.', sprite:SPRITE_COALITION },
  songyeon: { id:'songyeon', name:'손견', birth:155, deathReal:191, deathVirtual:245, kind:'flavor', affiliation:'반동탁연합',
    intro:'강동의 손문대요. 선봉은 이 몸이 서겠소. 동탁 따위, 단숨에 짓밟아주지!', sprite:SPRITE_COALITION },

  // 사수관
  hwaung: { id:'hwaung', name:'화웅', birth:155, deathReal:191, deathVirtual:245, kind:'enemy', forced:'kill', affiliation:'동탁군',
    stats:{atk:81, def:62, spd:58, int:31, cha:22, lead:55}, intro:'이런 촌뜨기들까지 나선단 말이냐? 목이나 내놓아라!',
    sprite:SPRITE_DONGTAK,
    battleArt:{ glyph:'華', weapon:'長槍', className:'enemy-red', src:'assets/battle/duel_hwaung_v2.png' } },
  hojin: { id:'hojin', name:'호진', birth:150, deathReal:215, deathVirtual:240, kind:'enemy', forced:null, affiliation:'동탁군', troop:1500,
    stats:{atk:72, def:61, spd:49, int:38, cha:33, lead:48}, intro:'…내가 졌다. 동탁을 섬긴 것도 딱히 충심은 아니었소. 그대들이라면 나쁘지 않겠군.', sprite:SPRITE_DONGTAK },

  // 호로관
  yeopo: { id:'yeopo', name:'여포', birth:160, deathReal:199, deathVirtual:250, kind:'enemy', forced:'escape', affiliation:'동탁군', troop:5000,
    stats:{atk:99, def:88, spd:91, int:26, cha:14, lead:62}, intro:'제후군 따위, 내 방천화극 앞에 몇이나 버틴다더냐!',
    sprite:{ key:'hero_yeopo', fw:971/3, fh:1619/4, sx:.20, sy:.165 },
    battleArt:{ glyph:'呂', weapon:'方天畫戟', className:'enemy-red', src:'assets/battle/duel_yeopo_v2.png' } },
  // 장제는 훗날 조카 장수와 이어지는 서사가 있어 여기서 등용되면 안 된다.
  // 패색이 짙으면 등용 제안 없이 군세를 버리고 달아난다 (이각·곽사와 동일한 처리).
  jangje: { id:'jangje', name:'장제', birth:150, deathReal:196, deathVirtual:240, kind:'enemy', forced:'escape', affiliation:'동탁군', troop:1700,
    stats:{atk:65, def:57, spd:47, int:36, cha:31, lead:58}, intro:'…서량의 사내들은 이런 걸로 꺾이지 않는다. 훗날을 도모하마.', sprite:SPRITE_DONGTAK },
  beonjo: { id:'beonjo', name:'번조', birth:155, deathReal:210, deathVirtual:245, kind:'enemy', forced:null, affiliation:'동탁군', troop:1600,
    stats:{atk:62, def:55, spd:53, int:34, cha:30, lead:45}, intro:'…동탁 어른 없이 서량에 남을 이유도 없지. 그대라면, 한번 믿어볼 만하겠소.', sprite:SPRITE_DONGTAK },
  // 여포군 소속 부장. 호로관에서는 등장시키지 않고, 훗날 여포를 배신하는
  // 서사(챕터2)를 위해 남겨둔다.
  songheon: { id:'songheon', name:'송헌', birth:160, deathReal:215, deathVirtual:250, kind:'enemy', forced:null, affiliation:'여포군', troop:2000,
    stats:{atk:58, def:52, spd:51, int:35, cha:30, lead:40}, intro:'여포 밑에 있어봐야 하루하루가 살얼음판이었소. 차라리 잘 됐군.', sprite:SPRITE_DONGTAK },
  wisok: { id:'wisok', name:'위속', birth:162, deathReal:215, deathVirtual:252, kind:'enemy', forced:null, affiliation:'여포군', troop:1800,
    stats:{atk:55, def:54, spd:48, int:33, cha:29, lead:38}, intro:'…나도 송헌과 같은 생각이오.', sprite:SPRITE_DONGTAK },

  // 함곡관 (챕터1 결선)
  igak: { id:'igak', name:'이각', birth:150, deathReal:198, deathVirtual:240, kind:'enemy', forced:'escape', affiliation:'동탁군',
    stats:{atk:68, def:48, spd:47, int:35, cha:27, lead:55}, intro:'동탁 어른은 가셨지만, 우리까지 무너질 성싶으냐!', sprite:SPRITE_DONGTAK },
  gwaksa: { id:'gwaksa', name:'곽사', birth:152, deathReal:197, deathVirtual:242, kind:'enemy', forced:'escape', affiliation:'동탁군',
    stats:{atk:57, def:46, spd:48, int:34, cha:26, lead:45}, intro:'훗날 반드시 돌아오리라!', sprite:SPRITE_DONGTAK },

  // ---- 챕터2 (관우) : 서주 - 삼양서주 ----
  dogyeom: { id:'dogyeom', name:'도겸', birth:132, deathReal:194, deathVirtual:222, kind:'flavor', affiliation:'서주',
    intro:'서주자사 도겸이오. 노쇠한 이 몸으로는 더 이상 이 땅을 지키기 어려울 듯하오.', sprite:SPRITE_ELDER },
  // 성벽 밖에 진을 친 조조군 8개 부대 - 실제 전투 없이 등장했다 복양 급보를
  // 듣고 물러나면 지도에서 모두 제거되지만, kind:'enemy'와 실제 스탯을 갖춘
  // 진짜 군세로 만들어 두어야 훗날(하비성전투 등)에도 그대로 재사용할 수 있다.
  // 순욱/정욱 등 조조의 핵심 책사들은 이 시점 연주(뒷마당)를 지키고 있었고,
  // 그 사이 진궁이 여포를 끌어들여 복양을 빼앗는 것이 바로 이 장면 다음에
  // 벌어지는 사건이므로(챕터2 핵심 반전), 이들을 서주 진중에 등장시키지
  // 않는다 - 대신 조조 본인의 지력을 높게 잡아 지휘부의 지력을 담당하게 했다.
  jojo_jungong: { id:'jojo_jungong', name:'조조(중군)', birth:155, deathReal:220, deathVirtual:245, kind:'enemy', forced:null, affiliation:'조조군', troop:5000,
    stats:{atk:74, def:68, spd:62, int:88, cha:85, lead:95},
    intro:'…아버지의 원한, 이 서주 땅에서 반드시 갚고야 말겠다.', sprite:SPRITE_COALITION },
  habudon_seoju: { id:'habudon_seoju', name:'하후돈군', birth:156, deathReal:220, deathVirtual:246, kind:'enemy', forced:null, affiliation:'조조군', troop:5000,
    stats:{atk:82, def:68, spd:56, int:42, cha:62, lead:78},
    intro:'주공의 명이다. 성문이 열릴 때까지 한 발짝도 물러서지 마라!', sprite:SPRITE_COALITION },
  habuyeon_seoju: { id:'habuyeon_seoju', name:'하후연군', birth:156, deathReal:219, deathVirtual:246, kind:'enemy', forced:null, affiliation:'조조군', troop:5000,
    stats:{atk:79, def:60, spd:78, int:44, cha:53, lead:75},
    intro:'…버텨봐야 며칠이나 가겠느냐.', sprite:SPRITE_COALITION },
  join_seoju: { id:'join_seoju', name:'조인군', birth:168, deathReal:223, deathVirtual:258, kind:'enemy', forced:null, affiliation:'조조군', troop:5000,
    stats:{atk:73, def:84, spd:52, int:52, cha:58, lead:80},
    intro:'성벽이 제법 단단하군. 허나 오래는 못 갈 것이다.', sprite:SPRITE_COALITION },
  johong_seoju: { id:'johong_seoju', name:'조홍군', birth:160, deathReal:232, deathVirtual:250, kind:'enemy', forced:null, affiliation:'조조군', troop:3000,
    stats:{atk:68, def:64, spd:54, int:38, cha:50, lead:62},
    intro:'…형님의 원수, 내가 반드시 갚아드리겠소.', sprite:SPRITE_COALITION },
  akjin_seoju: { id:'akjin_seoju', name:'악진군', birth:168, deathReal:218, deathVirtual:258, kind:'enemy', forced:null, affiliation:'조조군', troop:3000,
    stats:{atk:77, def:59, spd:64, int:40, cha:42, lead:68},
    intro:'명만 내리시면 언제든 성벽을 넘겠습니다.', sprite:SPRITE_COALITION },
  ugeum_seoju: { id:'ugeum_seoju', name:'우금군', birth:160, deathReal:221, deathVirtual:250, kind:'enemy', forced:null, affiliation:'조조군', troop:3000,
    stats:{atk:67, def:72, spd:49, int:58, cha:47, lead:72},
    intro:'군기가 흐트러지지 않도록 단속하고 있습니다.', sprite:SPRITE_COALITION },
  ijeon_seoju: { id:'ijeon_seoju', name:'이전군', birth:174, deathReal:209, deathVirtual:264, kind:'enemy', forced:null, affiliation:'조조군', troop:3000,
    stats:{atk:61, def:59, spd:51, int:62, cha:63, lead:65},
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
  michuk: { id:'michuk', name:'미축', birth:160, deathReal:221, deathVirtual:250, kind:'flavor', affiliation:'서주',
    stats:{atk:20, def:24, spd:22, int:76, cha:82, lead:22},
    intro:'서주의 미축이라 하오. 도겸 어른을 오래 모셔왔소만, 이제 유 사군께 힘을 보태고 싶소.' },
  mibang: { id:'mibang', name:'미방', birth:165, deathReal:225, deathVirtual:255, kind:'flavor', affiliation:'서주',
    stats:{atk:34, def:36, spd:32, int:48, cha:40, lead:30},
    intro:'형님을 따라왔소이다. 큰 도움은 못 되겠지만, 힘껏 돕겠소.' },
  // 진규·진등 부자는 도겸의 신하라, 도겸이 살아있는 동안 곧바로 등용하면
  // 모양새가 좋지 않다 - 서주 자유탐방 중에는 조표처럼 대화만 나누고,
  // 실제 등용은 도겸의 죽음과 함께(main.js의 dogyeom_death 처리) 이뤄진다.
  jingyu: { id:'jingyu', name:'진규', birth:140, deathReal:210, deathVirtual:230, kind:'flavor', affiliation:'서주',
    stats:{atk:22, def:26, spd:20, int:80, cha:78, lead:25},
    intro:'하비상 진규요. 그대의 그릇이 어떤지, 이렇게 직접 보러 왔소.', sprite:SPRITE_ELDER },
  // 진규의 아들. 챕터2 장면2(하비성 관청)에서 원술 정벌에 필요한 병력을
  // 모아주는 실제 상호작용(행동력 소모 + 병력 획득)을 담당한다.
  jindeung: { id:'jindeung', name:'진등', birth:162, deathReal:201, deathVirtual:252, kind:'flavor', affiliation:'서주',
    stats:{atk:38, def:40, spd:36, int:74, cha:66, lead:62},
    intro:'광릉태수 진등이라 하오. 병력을 모으는 일이라면 제게 맡겨주십시오.', sprite:SPRITE_ELDER },

  // 서주 자유탐방 중 새로 만나는 인물들. 진군·서성은 희귀 출현(도겸의 소개 없이
  // 우연히 마주치는 발견형), 손관은 일반 출현(장패와 동향인 낭야 사람으로,
  // 자유탐방이 시작되면 곧바로 등장), 조표는 도겸 밑의 관원으로 훗날 하비성을
  // 여포에게 열어주는 배신을 암시하는 서사 전용 인물이다(연의 14회).
  jingun: { id:'jingun', name:'진군', birth:170, deathReal:237, deathVirtual:260, kind:'recruit', forced:null, affiliation:'서주', chance:0.2,
    stats:{atk:22, def:26, spd:24, int:81, cha:77, lead:22}, intro:'예주 출신 진군이라 하오. 어지러운 세상, 그대라면 믿고 몸을 맡길 만하다 여겨 찾아왔소.' },
  seoseong: { id:'seoseong', name:'서성', birth:165, deathReal:228, deathVirtual:255, kind:'recruit', forced:null, affiliation:'서주', chance:0.2,
    stats:{atk:82, def:66, spd:58, int:56, cha:48, lead:74}, intro:'서성이라 하오. 힘 쓰는 일이라면 자신 있으니, 부디 써주시오.' },
  songgwan: { id:'songgwan', name:'손관', birth:160, deathReal:215, deathVirtual:250, kind:'recruit', forced:null, affiliation:'서주',
    stats:{atk:78, def:63, spd:57, int:33, cha:41, lead:48}, intro:'낭야의 손관이라 하오. 같은 고향의 장패가 그대들 밑에 있다기에 찾아왔소.' },
  jopyo: { id:'jopyo', name:'조표', birth:150, deathReal:196, deathVirtual:240, kind:'flavor', affiliation:'서주',
    intro:'서주의 관원 조표요. …흥, 굴러온 돌이 사는 게 참 편해 보이는구려.', sprite:SPRITE_ELDER },
  // 장패 무리의 일원 - 지도에 고정 배치하지 않고, 챕터1의 여상과 같은 방식으로
  // 서주 자유탐방 중 휴식(다음달)할 때 확률적으로 마주치는 돌발 전투로 등장한다
  // (main.js의 triggerOdonEvent/maybeSeojuRandomEvent 참고).
  odon: { id:'odon', name:'오돈', birth:158, deathReal:212, deathVirtual:248, kind:'enemy', forced:null, affiliation:'무소속',
    stats:{atk:56, def:50, spd:46, int:28, cha:30, lead:44}, intro:'…소문으로만 듣던 그대들이군. 이 몸이 상대해주겠소.' },

  // ---- 챕터2 (관우) : 회남 - 원술 정벌 [장면3] ----
  // 기령·교유·뇌박·진란은 실제 전투 대상(kind:'enemy')이고, 원술만 서사
  // 전용이다. 기령은 관우군이, 교유는 유비군이 맡는다(warArmy:'ally'가
  // 있으면 main.js의 openWarCommandMenu가 GameState.allyArmy를 써서
  // 판정한다). 뇌박·진란은 성문 앞을 지키는 선봉이라 관우군이 상대하고,
  // 둘 다 쓰러지면(main.js checkWonsulRetreat) 원술은 남은 병력을 이끌고
  // 성 안으로 물러난다 - 이번 장면에서는 원술 본인과는 싸우지 않는다.
  // generalIds: 일기토로 기령이 포로로 잡혀 군세가 와해될 때, 휘하 부장인
  // 뇌박·진란이 패잔병 일부를 수습해 아군에 합류시킨다(main.js captureCommander).
  // advisorId: 다만 책사 양홍이 있으면 군세는 와해되지 않고 양홍이 지휘를
  // 이어받는다 - 그쪽이 먼저 적용되어 generalIds 쪽 병력 흡수는 발동하지
  // 않는다(captureCommander의 advisor 우선 분기 참고).
  giryeong: { id:'giryeong', name:'기령', birth:155, deathReal:210, deathVirtual:245, kind:'enemy', forced:null, affiliation:'원술군', troop:5000,
    stats:{atk:80, def:65, spd:60, int:45, cha:50, lead:50}, generalIds:['noebak','jinran'], advisorId:'yanghong',
    intro:'…네놈이 관우로구나! 이 기령의 삼첨도를 받아보아라!', sprite:SPRITE_COALITION },
  // 원술의 장사(長史) - 기령의 책사. 무력은 낮은 전형적 문관 스텟이라, 기령이
  // 일기토로 포로가 되면 지휘를 이어받아 군세를 겨우 수습하지만 크게 약해진다.
  yanghong: { id:'yanghong', name:'양홍', birth:145, deathReal:199, deathVirtual:235, kind:'flavor', affiliation:'원술군',
    stats:{atk:22, def:24, spd:22, int:72, cha:58, lead:22},
    intro:'원술 님 밑에서 장사를 맡고 있는 양홍이오. 기령 장군을 돕고 있소.', sprite:SPRITE_COALITION },
  gyoyu: { id:'gyoyu', name:'교유', birth:158, deathReal:195, deathVirtual:248, kind:'enemy', forced:null, affiliation:'원술군', troop:4000, warArmy:'ally',
    stats:{atk:60, def:55, spd:50, int:30, cha:35, lead:46},
    intro:'유비 그자가 감히 우리 주공을 노린단 말이냐!', sprite:SPRITE_COALITION },
  wonsul: { id:'wonsul', name:'원술', birth:155, deathReal:199, deathVirtual:245, kind:'flavor', affiliation:'원술군', troop:8000,
    intro:'…흥, 유비 따위가 감히 이 원술의 땅을 넘본단 말이냐. 성문을 굳게 걸어라!', sprite:SPRITE_COALITION },
  noebak: { id:'noebak', name:'뇌박', birth:158, deathReal:198, deathVirtual:248, kind:'enemy', forced:null, affiliation:'원술군', troop:3000,
    stats:{atk:55, def:50, spd:45, int:20, cha:25, lead:42},
    intro:'주공의 명이다, 성벽만 지키면 된다. 함부로 들어올 생각 마라!', sprite:SPRITE_COALITION },
  jinran: { id:'jinran', name:'진란', birth:160, deathReal:198, deathVirtual:250, kind:'enemy', forced:null, affiliation:'원술군', troop:3000,
    stats:{atk:58, def:52, spd:48, int:22, cha:24, lead:44},
    intro:'섣불리 나가 싸울 필요 없다. 버티기만 하면 이긴다더니… 어쩔 수 없군!', sprite:SPRITE_COALITION },

  // ---- 데이터베이스 등록용 (아직 특정 장면/지도에 배치되지 않음) ----
  // 챕터2 후반(하비 함락, 여포 처형 / 회남 원술 정벌 확장)에 어떻게든 등장할
  // 예정인 인물들을 미리 등록해둔다. troop·배치 좌표는 실제 장면을 만들 때
  // 정한다. 위속·송헌은 이미 위(호로관 섹션)에 등록되어 있어 여기서는 제외.
  jingung: { id:'jingung', name:'진궁', birth:141, deathReal:199, deathVirtual:231, kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:30, def:34, spd:32, int:92, cha:68, lead:52}, sprite:SPRITE_DONGTAK,
    intro:'…내 계책을 따랐더라면, 이 지경까지 오지는 않았을 것을.' },
  gosun: { id:'gosun', name:'고순', birth:165, deathReal:199, deathVirtual:255, kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:88, def:82, spd:60, int:58, cha:35, lead:76}, sprite:SPRITE_DONGTAK,
    intro:'…함진영은 항복을 모른다. 덤벼라.' },
  jangryo: { id:'jangryo', name:'장료', birth:169, deathReal:222, deathVirtual:259, kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:90, def:75, spd:80, int:70, cha:72, lead:86}, sprite:SPRITE_DONGTAK,
    intro:'…주공이 어리석었을 뿐, 나는 아직 죽을 자리를 찾지 못했다.' },
  hakmaeng: { id:'hakmaeng', name:'학맹', birth:158, deathReal:199, deathVirtual:248, kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:70, def:60, spd:58, int:40, cha:38, lead:42}, sprite:SPRITE_DONGTAK,
    intro:'여포군의 학맹이다. 이대로 물러설 성싶으냐!' },
  joseong: { id:'joseong', name:'조성', birth:160, deathReal:199, deathVirtual:250, kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:66, def:58, spd:52, int:38, cha:36, lead:40}, sprite:SPRITE_DONGTAK,
    intro:'여포군의 조성이다.' },
  seongryeom: { id:'seongryeom', name:'성렴', birth:162, deathReal:199, deathVirtual:252, kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:64, def:56, spd:50, int:36, cha:34, lead:38}, sprite:SPRITE_DONGTAK,
    intro:'여포군의 성렴이다.' },
  huseong: { id:'huseong', name:'후성', birth:165, deathReal:215, deathVirtual:255, kind:'enemy', forced:null, affiliation:'여포군',
    stats:{atk:60, def:54, spd:52, int:42, cha:38, lead:40}, sprite:SPRITE_DONGTAK,
    intro:'…술 때문에 매질까지 당했는데, 계속 이 밑에 있어야 할지 모르겠군.' },
  janghun: { id:'janghun', name:'장훈', birth:160, deathReal:199, deathVirtual:250, kind:'enemy', forced:null, affiliation:'원술군',
    stats:{atk:70, def:60, spd:55, int:44, cha:46, lead:42}, sprite:SPRITE_COALITION,
    intro:'원술군의 장훈이다.' },
  jingi: { id:'jingi', name:'진기', birth:158, deathReal:199, deathVirtual:248, kind:'enemy', forced:null, affiliation:'원술군',
    stats:{atk:50, def:48, spd:44, int:60, cha:54, lead:34}, sprite:SPRITE_COALITION,
    intro:'원술군의 진기라 하오.' },
  // 조조군의 이전(李典, id:ijeon_seoju)과는 한글 표기만 같은 별개 인물(원술군
  // 이전/李豊)이라 id를 구분한다.
  ipung: { id:'ipung', name:'이전', birth:162, deathReal:199, deathVirtual:252, kind:'enemy', forced:null, affiliation:'원술군',
    stats:{atk:56, def:52, spd:48, int:42, cha:40, lead:36}, sprite:SPRITE_COALITION,
    intro:'원술군의 이전이다.' },
  yanggang: { id:'yanggang', name:'양강', birth:165, deathReal:197, deathVirtual:255, kind:'enemy', forced:null, affiliation:'원술군',
    stats:{atk:60, def:54, spd:50, int:40, cha:38, lead:32}, sprite:SPRITE_COALITION,
    intro:'원술군의 양강이다.' },
  akchwi: { id:'akchwi', name:'악취', birth:168, deathReal:197, deathVirtual:258, kind:'enemy', forced:null, affiliation:'원술군',
    stats:{atk:54, def:50, spd:46, int:36, cha:34, lead:30}, sprite:SPRITE_COALITION,
    intro:'원술군의 악취다.' },

  // ---- 책사 로스터 (예비 등록) ----
  // 아직 어느 지도/장면에도 배치되지 않은 책사 약 130명을 지력 등급(S~D,
  // JIRYEOK_GRADES 기준) 순으로 미리 등록해둔다 - 실제로 등장할 챕터를 만들
  // 때 sprite/troop/지도 좌표 등을 채워 넣으면 된다. kind는 아직 어떤 장면
  // 로직과도 연결돼 있지 않아 전부 'flavor'로 둔다.
  //   - 지력·매력: 정사/연의상의 재능·평판을 감안해 개별적으로 매겼다. 지력이
  //     높다고 매력이 자동으로 낮은 건 아니고(반대도 마찬가지), 순욱·노숙처럼
  //     인품·신망으로 유명한 "정치가"형 인재는 매력을 지력 못지않게, 혹은 더
  //     높게 잡았다(우리 게임에 정치 스텟이 따로 없어 그 몫을 지력·매력에
  //     나눠 얹은 셈).
  //   - 무력3스텟(공/방/속): 순수 책사라도 0으로 두지 않고 최소한의 수치를
  //     넣었다. 서서·제갈각·육개·조비처럼 실제로 무예나 군 지휘 경력이 있는
  //     인물은 눈에 띄게 더 높게 잡았다.
  //   - 소속은 확실한 인물 위주로 적었고, 활동 시기가 불분명한 마이너 인물은
  //     "무소속"으로 두었다 - 실제 등장 챕터를 정할 때 다시 확인할 것.
  //   - 목록에 있었지만 이미 로스터에 있는 인물(진궁·노식·진등·진군·손건·
  //     미축·간옹·전주·최염·유요·도겸·진규·양홍)은 중복 등록하지 않았다.
  //     장제(蔣濟, 위나라 중신)는 동탁군 장수 장제(張濟, 기존 'jangje')와
  //     한글 표기만 같은 동명이인이라 id를 jangje_wi로 구분했다.

  // -- S급 (지력 90+) --
  jegallyang: { id:'jegallyang', name:'제갈량', birth:181, deathReal:234, deathVirtual:271, kind:'flavor', affiliation:'촉한',
    stats:{atk:26, def:30, spd:24, int:99, cha:95, lead:92}, intro:'와룡이라 불리는 제갈량이오. 큰 그림을 그리는 것이 내 소임이오.' },
  juyu: { id:'juyu', name:'주유', birth:175, deathReal:210, deathVirtual:265, kind:'flavor', affiliation:'손권군',
    stats:{atk:44, def:40, spd:42, int:93, cha:90, lead:90}, intro:'강동의 주유라 하오. 이 강동, 함부로 넘볼 수 없을 것이오.' },
  yukson: { id:'yukson', name:'육손', birth:183, deathReal:245, deathVirtual:273, kind:'flavor', affiliation:'손권군',
    stats:{atk:42, def:44, spd:38, int:91, cha:78, lead:87}, intro:'육손이라 하오. 병법은 요란한 것이 아니라 때를 아는 것이오.' },
  jeongwook: { id:'jeongwook', name:'정욱', birth:141, deathReal:220, deathVirtual:231, kind:'flavor', affiliation:'조조군',
    stats:{atk:30, def:28, spd:24, int:90, cha:62, lead:45}, intro:'조공을 섬기는 정욱이오. 계책이라면 매섭게 쓸 줄 아오.' },
  gwakga: { id:'gwakga', name:'곽가', birth:170, deathReal:207, deathVirtual:260, kind:'flavor', affiliation:'조조군',
    stats:{atk:18, def:20, spd:24, int:96, cha:74, lead:28}, intro:'곽가라 하오. 세상 돌아가는 이치를 읽는 게 내 재주요.' },
  samaui: { id:'samaui', name:'사마의', birth:179, deathReal:251, deathVirtual:269, kind:'flavor', affiliation:'조조군',
    stats:{atk:34, def:38, spd:30, int:97, cha:70, lead:88}, intro:'사마의라 하오. 때를 기다릴 줄 아는 것도 재주라면 재주지.' },
  sunyu: { id:'sunyu', name:'순유', birth:157, deathReal:214, deathVirtual:247, kind:'flavor', affiliation:'조조군',
    stats:{atk:18, def:18, spd:18, int:94, cha:72, lead:22}, intro:'순유라 하오. 조용히 계책을 다듬는 것을 좋아하오.' },

  // -- A급 (지력 80~89) - 진궁은 이미 로스터에 있어 제외 --
  seoseo: { id:'seoseo', name:'서서', birth:168, deathReal:234, deathVirtual:258, kind:'flavor', affiliation:'조조군',
    stats:{atk:48, def:40, spd:44, int:85, cha:80, lead:55}, intro:'서서라 하오. 한때는 검을 쓰는 협객이었소만, 이제는 계책으로 돕겠소.' },
  bangtong: { id:'bangtong', name:'방통', birth:179, deathReal:214, deathVirtual:269, kind:'flavor', affiliation:'촉한',
    stats:{atk:22, def:24, spd:20, int:88, cha:72, lead:40}, intro:'봉추라 불리는 방통이오. 생김새로 사람을 판단하지 마시오.' },
  gahu: { id:'gahu', name:'가후', birth:147, deathReal:223, deathVirtual:237, kind:'flavor', affiliation:'조조군',
    stats:{atk:24, def:26, spd:22, int:89, cha:64, lead:32}, intro:'가후라 하오. 살아남는 법을 아는 것도 지혜요.' },
  beopjeong: { id:'beopjeong', name:'법정', birth:176, deathReal:220, deathVirtual:266, kind:'flavor', affiliation:'촉한',
    stats:{atk:20, def:22, spd:20, int:86, cha:58, lead:35}, intro:'법정이라 하오. 은혜도 원한도 잊지 않는 성미요.' },
  sunwook: { id:'sunwook', name:'순욱', birth:163, deathReal:212, deathVirtual:253, kind:'flavor', affiliation:'조조군',
    stats:{atk:16, def:18, spd:16, int:87, cha:88, lead:42}, intro:'순욱이라 하오. 사람을 알아보고 쓰는 것이 으뜸가는 계책이오.' },

  // -- B급 (지력 70~79) - 진등·진군·노식은 이미 로스터에 있어 제외 --
  jeonpung: { id:'jeonpung', name:'전풍', birth:145, deathReal:200, deathVirtual:235, kind:'flavor', affiliation:'원소군',
    stats:{atk:22, def:24, spd:20, int:79, cha:55, lead:35}, intro:'원소 어른을 섬기는 전풍이오. 옳다 싶으면 직언을 삼가지 않소.' },
  nosuk: { id:'nosuk', name:'노숙', birth:172, deathReal:217, deathVirtual:262, kind:'flavor', affiliation:'손권군',
    stats:{atk:24, def:26, spd:22, int:77, cha:76, lead:60}, intro:'노숙이라 하오. 온건히 화합하는 길이 늘 옳다고 믿소.' },
  goewol: { id:'goewol', name:'괴월', birth:155, deathReal:216, deathVirtual:245, kind:'flavor', affiliation:'유표군',
    stats:{atk:20, def:22, spd:18, int:76, cha:64, lead:28}, intro:'형주의 괴월이라 하오.' },
  maseok: { id:'maseok', name:'마속', birth:190, deathReal:228, deathVirtual:280, kind:'flavor', affiliation:'촉한',
    stats:{atk:30, def:26, spd:28, int:75, cha:58, lead:42}, intro:'마속이라 하오. 병법을 논하는 것이라면 자신 있소.' },
  biwi: { id:'biwi', name:'비위', birth:213, deathReal:253, deathVirtual:303, kind:'flavor', affiliation:'촉한',
    stats:{atk:18, def:20, spd:18, int:74, cha:68, lead:20}, intro:'비위라 하오. 안살림을 다지는 것이 내 몫이오.' },
  gwakdo: { id:'gwakdo', name:'곽도', birth:150, deathReal:205, deathVirtual:240, kind:'flavor', affiliation:'원소군',
    stats:{atk:22, def:22, spd:20, int:73, cha:48, lead:26}, intro:'원소 어른의 참모, 곽도요.' },
  dongso: { id:'dongso', name:'동소', birth:156, deathReal:232, deathVirtual:246, kind:'flavor', affiliation:'조조군',
    stats:{atk:18, def:20, spd:18, int:75, cha:60, lead:22}, intro:'동소라 하오. 조공의 명을 받들고 있소.' },
  gamtaek: { id:'gamtaek', name:'감택', birth:173, deathReal:243, deathVirtual:263, kind:'flavor', affiliation:'손권군',
    stats:{atk:16, def:18, spd:16, int:74, cha:62, lead:18}, intro:'감택이라 하오. 글로 세운 공도 공이오.' },
  mancheong: { id:'mancheong', name:'만총', birth:165, deathReal:242, deathVirtual:255, kind:'flavor', affiliation:'조조군',
    stats:{atk:40, def:42, spd:34, int:72, cha:56, lead:62}, intro:'만총이라 하오. 붓과 칼, 둘 다 놓지 않소.' },
  simbae: { id:'simbae', name:'심배', birth:150, deathReal:204, deathVirtual:240, kind:'flavor', affiliation:'원소군',
    stats:{atk:26, def:28, spd:22, int:73, cha:50, lead:30}, intro:'원소 어른을 섬기는 심배요.' },
  yuyeop: { id:'yuyeop', name:'유엽', birth:179, deathReal:234, deathVirtual:269, kind:'flavor', affiliation:'조조군',
    stats:{atk:20, def:22, spd:18, int:78, cha:62, lead:25}, intro:'유엽이라 하오. 종실의 피를 이었으나, 지금은 계책으로 섬기고 있소.' },
  jeosu: { id:'jeosu', name:'저수', birth:145, deathReal:200, deathVirtual:235, kind:'flavor', affiliation:'원소군',
    stats:{atk:22, def:24, spd:20, int:77, cha:58, lead:32}, intro:'저수라 하오. 원소 어른께 여러 번 간언을 올렸소만…' },
  ubeon: { id:'ubeon', name:'우번', birth:164, deathReal:233, deathVirtual:254, kind:'flavor', affiliation:'손권군',
    stats:{atk:20, def:20, spd:18, int:73, cha:54, lead:22}, intro:'우번이라 하오. 옳은 말이라면 굽히지 않소.' },
  yangsu: { id:'yangsu', name:'양수', birth:175, deathReal:219, deathVirtual:265, kind:'flavor', affiliation:'조조군',
    stats:{atk:16, def:18, spd:16, int:76, cha:60, lead:18}, intro:'양수라 하오. 남들이 못 보는 걸 먼저 보는 게 흠이라면 흠이오.' },
  jangwan: { id:'jangwan', name:'장완', birth:175, deathReal:246, deathVirtual:265, kind:'flavor', affiliation:'촉한',
    stats:{atk:18, def:20, spd:18, int:74, cha:70, lead:42}, intro:'장완이라 하오. 승상께서 맡기신 뒷일을 그르치지 않으려 하오.' },
  janggwang: { id:'janggwang', name:'장굉', birth:168, deathReal:212, deathVirtual:258, kind:'flavor', affiliation:'손권군',
    stats:{atk:16, def:18, spd:16, int:73, cha:64, lead:20}, intro:'장굉이라 하오.' },
  maryang: { id:'maryang', name:'마량', birth:187, deathReal:222, deathVirtual:277, kind:'flavor', affiliation:'촉한',
    stats:{atk:22, def:24, spd:20, int:75, cha:72, lead:28}, intro:'백미라 불리는 마량이오.' },
  jongyo: { id:'jongyo', name:'종요', birth:151, deathReal:230, deathVirtual:241, kind:'flavor', affiliation:'조조군',
    stats:{atk:18, def:18, spd:16, int:76, cha:66, lead:22}, intro:'종요라 하오. 글씨든 정사든, 소홀히 하지 않소.' },
  heoyu: { id:'heoyu', name:'허유', birth:150, deathReal:204, deathVirtual:240, kind:'flavor', affiliation:'조조군',
    stats:{atk:20, def:20, spd:18, int:77, cha:48, lead:20}, intro:'허유라 하오. 옛 벗을 찾아 이리로 왔소.' },
  jegalgeun: { id:'jegalgeun', name:'제갈근', birth:174, deathReal:241, deathVirtual:264, kind:'flavor', affiliation:'손권군',
    stats:{atk:18, def:20, spd:18, int:74, cha:74, lead:46}, intro:'제갈근이라 하오. 아우와는 각자 섬기는 주공이 다를 뿐이오.' },
  iyu: { id:'iyu', name:'이유', birth:140, deathReal:198, deathVirtual:230, kind:'flavor', affiliation:'동탁군',
    stats:{atk:22, def:22, spd:20, int:76, cha:46, lead:26}, intro:'동탁 어른의 계책을 맡고 있는 이유요.' },

  // -- C급 (지력 60~69) --
  huijijae: { id:'huijijae', name:'희지재', birth:165, deathReal:197, deathVirtual:255, kind:'flavor', affiliation:'조조군',
    stats:{atk:18, def:20, spd:16, int:68, cha:58, lead:20}, intro:'희지재라 하오. 조공께서 아끼시는 재주라 자부하오.' },
  bonggi: { id:'bonggi', name:'봉기', birth:150, deathReal:200, deathVirtual:240, kind:'flavor', affiliation:'조조군',
    stats:{atk:18, def:18, spd:16, int:67, cha:56, lead:18}, intro:'봉기라 하오.' },
  seonggongyeong: { id:'seonggongyeong', name:'성공영', birth:165, deathReal:225, deathVirtual:255, kind:'flavor', affiliation:'마초군',
    stats:{atk:22, def:22, spd:20, int:64, cha:48, lead:28}, intro:'마초 장군을 섬기는 성공영이오.' },
  jeongtak: { id:'jeongtak', name:'정탁', birth:145, deathReal:198, deathVirtual:235, kind:'flavor', affiliation:'동탁군',
    stats:{atk:20, def:20, spd:18, int:65, cha:44, lead:22}, intro:'정탁이라 하오.' },
  gyun: { id:'gyun', name:'마균', birth:200, deathReal:265, deathVirtual:290, kind:'flavor', affiliation:'조조군',
    stats:{atk:16, def:18, spd:16, int:66, cha:50, lead:15}, intro:'마균이라 하오. 손끝으로 세상을 이롭게 하는 재주가 좀 있소.' },
  jegalgak: { id:'jegalgak', name:'제갈각', birth:203, deathReal:253, deathVirtual:293, kind:'flavor', affiliation:'손권군',
    stats:{atk:48, def:44, spd:40, int:69, cha:62, lead:78}, intro:'제갈근의 아들, 제갈각이오. 붓만 든 이들과는 좀 다르지.' },
  yukjeok: { id:'yukjeok', name:'육적', birth:188, deathReal:219, deathVirtual:278, kind:'flavor', affiliation:'손권군',
    stats:{atk:16, def:16, spd:14, int:62, cha:60, lead:16}, intro:'육적이라 하오.' },
  ichan: { id:'ichan', name:'이찬', birth:160, deathReal:220, deathVirtual:250, kind:'flavor', affiliation:'무소속',
    stats:{atk:18, def:18, spd:16, int:61, cha:48, lead:18}, intro:'이찬이라 하오.' },
  jangso: { id:'jangso', name:'장소', birth:156, deathReal:236, deathVirtual:246, kind:'flavor', affiliation:'손권군',
    stats:{atk:20, def:22, spd:18, int:68, cha:70, lead:30}, intro:'강동의 원로, 장소요.' },
  bojeul: { id:'bojeul', name:'보즐', birth:172, deathReal:246, deathVirtual:262, kind:'flavor', affiliation:'손권군',
    stats:{atk:18, def:20, spd:16, int:65, cha:58, lead:20}, intro:'보즐이라 하오.' },
  banjun: { id:'banjun', name:'반준', birth:180, deathReal:249, deathVirtual:270, kind:'flavor', affiliation:'손권군',
    stats:{atk:22, def:24, spd:20, int:64, cha:56, lead:24}, intro:'반준이라 하오.' },
  yukgae: { id:'yukgae', name:'육개', birth:178, deathReal:244, deathVirtual:268, kind:'flavor', affiliation:'손권군',
    stats:{atk:36, def:34, spd:30, int:63, cha:54, lead:55}, intro:'육개라 하오. 직언도 서슴지 않고, 칼도 놓지 않소.' },
  jangon: { id:'jangon', name:'장온', birth:193, deathReal:230, deathVirtual:283, kind:'flavor', affiliation:'손권군',
    stats:{atk:16, def:18, spd:16, int:62, cha:56, lead:16}, intro:'장온이라 하오.' },
  nakthong: { id:'nakthong', name:'낙통', birth:180, deathReal:230, deathVirtual:270, kind:'flavor', affiliation:'손권군',
    stats:{atk:16, def:16, spd:14, int:61, cha:50, lead:16}, intro:'낙통이라 하오.' },
  ochan: { id:'ochan', name:'오찬', birth:178, deathReal:225, deathVirtual:268, kind:'flavor', affiliation:'손권군',
    stats:{atk:18, def:18, spd:16, int:60, cha:46, lead:16}, intro:'오찬이라 하오.' },
  hwahaek: { id:'hwahaek', name:'화핵', birth:190, deathReal:264, deathVirtual:280, kind:'flavor', affiliation:'손권군',
    stats:{atk:14, def:16, spd:14, int:64, cha:52, lead:15}, intro:'화핵이라 하오. 붓으로 강동의 일을 기록하고 있소.' },
  wangyun: { id:'wangyun', name:'왕윤', birth:137, deathReal:192, deathVirtual:227, kind:'flavor', affiliation:'후한 조정',
    stats:{atk:20, def:22, spd:18, int:67, cha:62, lead:25}, intro:'사도 왕윤이오. 한실이 이 지경이 된 게 통탄스러울 따름이오.' },
  yangsong: { id:'yangsong', name:'양송', birth:170, deathReal:215, deathVirtual:260, kind:'flavor', affiliation:'장로군',
    stats:{atk:18, def:18, spd:16, int:60, cha:38, lead:18}, intro:'장로 어른을 섬기는 양송이오.' },
  wanghae: { id:'wanghae', name:'왕해', birth:165, deathReal:220, deathVirtual:255, kind:'flavor', affiliation:'서주',
    stats:{atk:18, def:18, spd:16, int:61, cha:50, lead:18}, intro:'서주의 왕해라 하오.' },
  heosa: { id:'heosa', name:'허사', birth:168, deathReal:218, deathVirtual:258, kind:'flavor', affiliation:'서주',
    stats:{atk:18, def:18, spd:16, int:62, cha:52, lead:18}, intro:'서주의 허사라 하오.' },
  hwanbeom: { id:'hwanbeom', name:'환범', birth:180, deathReal:249, deathVirtual:270, kind:'flavor', affiliation:'조조군',
    stats:{atk:20, def:20, spd:18, int:65, cha:56, lead:25}, intro:'환범이라 하오.' },
  wangrang: { id:'wangrang', name:'왕랑', birth:150, deathReal:228, deathVirtual:240, kind:'flavor', affiliation:'조조군',
    stats:{atk:18, def:20, spd:16, int:66, cha:60, lead:22}, intro:'왕랑이라 하오. 경학을 논하는 것을 좋아하오.' },
  yehyeong: { id:'yehyeong', name:'예형', birth:173, deathReal:198, deathVirtual:263, kind:'flavor', affiliation:'무소속',
    stats:{atk:16, def:16, spd:14, int:65, cha:44, lead:16}, intro:'예형이라 하오. 세상에 마음에 차는 인물이 드물군.' },
  imak: { id:'imak', name:'이막', birth:175, deathReal:230, deathVirtual:265, kind:'flavor', affiliation:'촉한',
    stats:{atk:18, def:18, spd:16, int:60, cha:52, lead:18}, intro:'이막이라 하오.' },
  wangru: { id:'wangru', name:'왕루', birth:170, deathReal:228, deathVirtual:260, kind:'flavor', affiliation:'촉한',
    stats:{atk:16, def:18, spd:16, int:60, cha:56, lead:16}, intro:'왕루라 하오.' },
  jinbok: { id:'jinbok', name:'진복', birth:168, deathReal:230, deathVirtual:258, kind:'flavor', affiliation:'촉한',
    stats:{atk:16, def:16, spd:14, int:63, cha:58, lead:16}, intro:'진복이라 하오. 말재간이라면 누구에게도 지지 않소.' },
  eompo: { id:'eompo', name:'엄포', birth:158, deathReal:200, deathVirtual:248, kind:'flavor', affiliation:'원소군',
    stats:{atk:32, def:30, spd:28, int:60, cha:42, lead:32}, intro:'원소 어른 휘하의 엄포요.' },
  sunsim: { id:'sunsim', name:'순심', birth:165, deathReal:220, deathVirtual:255, kind:'flavor', affiliation:'조조군',
    stats:{atk:16, def:18, spd:16, int:64, cha:56, lead:16}, intro:'순욱의 사촌, 순심이오.' },
  jangsong: { id:'jangsong', name:'장송', birth:165, deathReal:212, deathVirtual:255, kind:'flavor', affiliation:'유장군',
    stats:{atk:16, def:16, spd:14, int:66, cha:54, lead:20}, intro:'익주의 장송이라 하오. 이 땅의 지도라면 내 머릿속에 다 있소.' },
  gabeom: { id:'gabeom', name:'가범', birth:160, deathReal:214, deathVirtual:250, kind:'flavor', affiliation:'유장군',
    stats:{atk:18, def:18, spd:16, int:60, cha:48, lead:18}, intro:'익주의 가범이오.' },
  yunjik: { id:'yunjik', name:'윤직', birth:160, deathReal:215, deathVirtual:250, kind:'flavor', affiliation:'무소속',
    stats:{atk:20, def:20, spd:18, int:60, cha:44, lead:20}, intro:'윤직이라 하오.' },
  gachung: { id:'gachung', name:'가충', birth:217, deathReal:282, deathVirtual:307, kind:'flavor', affiliation:'조조군',
    stats:{atk:22, def:22, spd:20, int:64, cha:48, lead:24}, intro:'가충이라 하오.' },
  goeryang: { id:'goeryang', name:'괴량', birth:150, deathReal:210, deathVirtual:240, kind:'flavor', affiliation:'유표군',
    stats:{atk:18, def:20, spd:16, int:64, cha:58, lead:20}, intro:'괴월의 형, 괴량이오.' },
  busun: { id:'busun', name:'부손', birth:170, deathReal:225, deathVirtual:260, kind:'flavor', affiliation:'손권군',
    stats:{atk:16, def:18, spd:16, int:60, cha:50, lead:16}, intro:'부손이라 하오.' },
  nugyu: { id:'nugyu', name:'누규', birth:160, deathReal:210, deathVirtual:250, kind:'flavor', affiliation:'무소속',
    stats:{atk:18, def:18, spd:16, int:60, cha:42, lead:16}, intro:'누규라 하오.' },
  sinpyeong: { id:'sinpyeong', name:'신평', birth:150, deathReal:204, deathVirtual:240, kind:'flavor', affiliation:'원소군',
    stats:{atk:20, def:20, spd:18, int:62, cha:52, lead:22}, intro:'원소 어른을 섬기는 신평이오. 심배와는 뜻이 좀 다르오.' },
  isuk: { id:'isuk', name:'이숙', birth:155, deathReal:199, deathVirtual:245, kind:'flavor', affiliation:'동탁군',
    stats:{atk:28, def:26, spd:24, int:61, cha:46, lead:32}, intro:'이숙이라 하오. 사람 구슬리는 데는 자신 있소.' },
  ijeok: { id:'ijeok', name:'이적', birth:150, deathReal:240, deathVirtual:240, kind:'flavor', affiliation:'촉한',
    stats:{atk:16, def:18, spd:16, int:63, cha:62, lead:22}, intro:'이적이라 하오. 오래전부터 유 사군을 따랐소.' },
  dongyun: { id:'dongyun', name:'동윤', birth:200, deathReal:246, deathVirtual:290, kind:'flavor', affiliation:'촉한',
    stats:{atk:18, def:20, spd:16, int:68, cha:66, lead:24}, intro:'동윤이라 하오. 승상께서 곧다며 아끼시오.' },
  goong: { id:'goong', name:'고옹', birth:168, deathReal:243, deathVirtual:258, kind:'flavor', affiliation:'손권군',
    stats:{atk:18, def:18, spd:16, int:69, cha:68, lead:26}, intro:'고옹이라 하오. 신중함이 내 무기요.' },
  deungyun: { id:'deungyun', name:'등윤', birth:210, deathReal:258, deathVirtual:300, kind:'flavor', affiliation:'촉한',
    stats:{atk:20, def:20, spd:18, int:62, cha:56, lead:20}, intro:'등지의 아들, 등윤이오.' },
  jobi: { id:'jobi', name:'조비', birth:187, deathReal:226, deathVirtual:277, kind:'flavor', affiliation:'조조군',
    stats:{atk:40, def:38, spd:34, int:68, cha:64, lead:72}, intro:'조공의 아들, 조비요. 글도 검도 소홀히 하지 않소.' },
  donghwa: { id:'donghwa', name:'동화', birth:165, deathReal:221, deathVirtual:255, kind:'flavor', affiliation:'촉한',
    stats:{atk:16, def:18, spd:16, int:61, cha:58, lead:18}, intro:'동화라 하오. 옛 주공(유장)께도 곧게 간언했었소.' },
  dugi: { id:'dugi', name:'두기', birth:163, deathReal:224, deathVirtual:253, kind:'flavor', affiliation:'조조군',
    stats:{atk:18, def:18, spd:16, int:63, cha:60, lead:22}, intro:'두기라 하오. 백성 다스리는 일을 맡고 있소.' },
  yubok: { id:'yubok', name:'유복', birth:170, deathReal:225, deathVirtual:260, kind:'flavor', affiliation:'조조군',
    stats:{atk:16, def:16, spd:14, int:62, cha:52, lead:16}, intro:'유복이라 하오.' },
  goyu: { id:'goyu', name:'고유', birth:165, deathReal:235, deathVirtual:255, kind:'flavor', affiliation:'조조군',
    stats:{atk:18, def:18, spd:16, int:64, cha:54, lead:20}, intro:'고유라 하오. 옳지 않은 일에는 입을 다물지 않소.' },
  wangryeon: { id:'wangryeon', name:'왕련', birth:170, deathReal:225, deathVirtual:260, kind:'flavor', affiliation:'촉한',
    stats:{atk:14, def:16, spd:14, int:60, cha:54, lead:14}, intro:'왕련이라 하오. 소금과 쇠를 다루는 일을 맡고 있소.' },
  yangui: { id:'yangui', name:'양의', birth:190, deathReal:235, deathVirtual:280, kind:'flavor', affiliation:'촉한',
    stats:{atk:22, def:22, spd:20, int:65, cha:46, lead:30}, intro:'양의라 하오. 군량과 행군 절차라면 내게 맡기시오.' },
  mogae: { id:'mogae', name:'모개', birth:160, deathReal:216, deathVirtual:250, kind:'flavor', affiliation:'조조군',
    stats:{atk:18, def:18, spd:16, int:64, cha:58, lead:20}, intro:'모개라 하오. 사람 보는 눈만큼은 자신 있소.' },
  hwaheum: { id:'hwaheum', name:'화흠', birth:157, deathReal:232, deathVirtual:247, kind:'flavor', affiliation:'조조군',
    stats:{atk:18, def:18, spd:16, int:63, cha:50, lead:18}, intro:'화흠이라 하오.' },
  sinbi: { id:'sinbi', name:'신비', birth:170, deathReal:235, deathVirtual:260, kind:'flavor', affiliation:'조조군',
    stats:{atk:20, def:20, spd:18, int:62, cha:56, lead:22}, intro:'신비라 하오. 굽힐 말은 굽히지 않소.' },
  // 위나라 중신 장제(蔣濟) - 동탁군 장수 장제(張濟, 기존 'jangje')와는 한글
  // 표기만 같은 별개 인물이라 id를 구분한다.
  jangje_wi: { id:'jangje_wi', name:'장제', birth:180, deathReal:249, deathVirtual:270, kind:'flavor', affiliation:'조조군',
    stats:{atk:22, def:22, spd:20, int:65, cha:54, lead:24}, intro:'조공을 섬기는 장제라 하오.' },
  jingyo: { id:'jingyo', name:'진교', birth:175, deathReal:237, deathVirtual:265, kind:'flavor', affiliation:'조조군',
    stats:{atk:16, def:18, spd:16, int:64, cha:56, lead:18}, intro:'진교라 하오. 법과 절차를 다루고 있소.' },
  yeomsang: { id:'yeomsang', name:'염상', birth:160, deathReal:199, deathVirtual:250, kind:'flavor', affiliation:'원술군',
    stats:{atk:30, def:28, spd:26, int:60, cha:46, lead:34}, intro:'원술군의 염상이오.' },
  paengyang: { id:'paengyang', name:'팽양', birth:175, deathReal:214, deathVirtual:265, kind:'flavor', affiliation:'촉한',
    stats:{atk:20, def:20, spd:18, int:62, cha:48, lead:20}, intro:'팽양이라 하오. 재주는 있는데, 다들 나를 아니꼽게 보더군.' },
  yupa: { id:'yupa', name:'유파', birth:165, deathReal:222, deathVirtual:255, kind:'flavor', affiliation:'촉한',
    stats:{atk:16, def:18, spd:16, int:63, cha:52, lead:18}, intro:'유파라 하오.' },
  wonhwan: { id:'wonhwan', name:'원환', birth:160, deathReal:215, deathVirtual:250, kind:'flavor', affiliation:'무소속',
    stats:{atk:18, def:18, spd:16, int:60, cha:46, lead:18}, intro:'원환이라 하오.' },
  jubi: { id:'jubi', name:'주비', birth:145, deathReal:210, deathVirtual:235, kind:'flavor', affiliation:'손권군',
    stats:{atk:18, def:20, spd:16, int:61, cha:54, lead:22}, intro:'주비라 하오. 강동의 오랜 원로요.' },
  yeoye: { id:'yeoye', name:'여예', birth:165, deathReal:225, deathVirtual:255, kind:'flavor', affiliation:'촉한',
    stats:{atk:16, def:16, spd:14, int:60, cha:52, lead:16}, intro:'여예라 하오. 곳간 채우는 일을 맡고 있소.' },
  eomjun: { id:'eomjun', name:'엄준', birth:170, deathReal:225, deathVirtual:260, kind:'flavor', affiliation:'손권군',
    stats:{atk:26, def:26, spd:24, int:60, cha:48, lead:30}, intro:'엄준이라 하오.' },
  dumi: { id:'dumi', name:'두미', birth:168, deathReal:222, deathVirtual:258, kind:'flavor', affiliation:'촉한',
    stats:{atk:16, def:16, spd:14, int:60, cha:50, lead:16}, intro:'두미라 하오.' },
  jangye: { id:'jangye', name:'장예', birth:175, deathReal:231, deathVirtual:265, kind:'flavor', affiliation:'촉한',
    stats:{atk:20, def:20, spd:18, int:62, cha:46, lead:22}, intro:'장예라 하오. 법은 엄히 다뤄야 한다고 믿소.' },
  wangryeol: { id:'wangryeol', name:'왕렬', birth:141, deathReal:218, deathVirtual:231, kind:'flavor', affiliation:'조조군',
    stats:{atk:14, def:16, spd:14, int:61, cha:58, lead:14}, intro:'왕렬이라 하오. 벼슬보다 뜻을 지키는 게 편하더군.' },
  jinrim: { id:'jinrim', name:'진림', birth:160, deathReal:217, deathVirtual:250, kind:'flavor', affiliation:'조조군',
    stats:{atk:14, def:16, spd:14, int:65, cha:56, lead:14}, intro:'진림이라 하오. 격문 하나로 사람 등골을 서늘하게 할 수 있소.' },
  chaeong: { id:'chaeong', name:'채옹', birth:133, deathReal:192, deathVirtual:223, kind:'flavor', affiliation:'후한 조정',
    stats:{atk:14, def:14, spd:12, int:68, cha:62, lead:14}, intro:'채옹이라 하오. 글과 거문고를 벗삼아 살아왔소.' },
  heoso: { id:'heoso', name:'허소', birth:150, deathReal:195, deathVirtual:240, kind:'flavor', affiliation:'무소속',
    stats:{atk:14, def:14, spd:12, int:62, cha:50, lead:14}, intro:'허소라 하오. 사람 됨됨이를 한마디로 평하는 게 내 재주요.' },
  yangbu: { id:'yangbu', name:'양부', birth:165, deathReal:235, deathVirtual:255, kind:'flavor', affiliation:'조조군',
    stats:{atk:22, def:22, spd:20, int:60, cha:52, lead:26}, intro:'양부라 하오. 옳지 않은 것은 그냥 넘기지 않소.' },
  sasonseo: { id:'sasonseo', name:'사손서', birth:165, deathReal:220, deathVirtual:255, kind:'flavor', affiliation:'무소속',
    stats:{atk:16, def:16, spd:14, int:60, cha:54, lead:16}, intro:'사손서라 하오.' },
  deungji: { id:'deungji', name:'등지', birth:178, deathReal:251, deathVirtual:268, kind:'flavor', affiliation:'촉한',
    stats:{atk:20, def:20, spd:18, int:64, cha:62, lead:24}, intro:'등지라 하오. 오나라와의 화친, 내가 다녀오겠소.' },
  jinjin: { id:'jinjin', name:'진진', birth:175, deathReal:235, deathVirtual:265, kind:'flavor', affiliation:'촉한',
    stats:{atk:18, def:18, spd:16, int:63, cha:58, lead:20}, intro:'진진이라 하오. 승상께서 믿고 맡기신 일이 있소.' },
  jongye: { id:'jongye', name:'종예', birth:180, deathReal:240, deathVirtual:270, kind:'flavor', affiliation:'촉한',
    stats:{atk:16, def:18, spd:16, int:61, cha:56, lead:18}, intro:'종예라 하오.' },
  hansung: { id:'hansung', name:'한숭', birth:160, deathReal:215, deathVirtual:250, kind:'flavor', affiliation:'유표군',
    stats:{atk:18, def:18, spd:16, int:62, cha:42, lead:20}, intro:'한숭이라 하오.' },

  // -- D급 (지력 60 미만) --
  chojoo: { id:'chojoo', name:'초주', birth:199, deathReal:270, deathVirtual:289, kind:'flavor', affiliation:'촉한',
    stats:{atk:12, def:14, spd:12, int:58, cha:44, lead:14}, intro:'초주라 하오. 천문을 보아 길흉을 헤아리곤 하오.' },
  geukjeong: { id:'geukjeong', name:'극정', birth:185, deathReal:255, deathVirtual:275, kind:'flavor', affiliation:'촉한',
    stats:{atk:12, def:12, spd:10, int:56, cha:48, lead:12}, intro:'극정이라 하오. 지나온 일들을 기록해두고 있소.' },
  naemin: { id:'naemin', name:'내민', birth:180, deathReal:250, deathVirtual:270, kind:'flavor', affiliation:'촉한',
    stats:{atk:14, def:14, spd:12, int:50, cha:42, lead:14}, intro:'내민이라 하오.' },
  yunmuk: { id:'yunmuk', name:'윤묵', birth:178, deathReal:248, deathVirtual:268, kind:'flavor', affiliation:'촉한',
    stats:{atk:14, def:14, spd:12, int:48, cha:40, lead:14}, intro:'윤묵이라 하오.' },
  bisi: { id:'bisi', name:'비시', birth:190, deathReal:253, deathVirtual:280, kind:'flavor', affiliation:'촉한',
    stats:{atk:16, def:16, spd:14, int:54, cha:52, lead:18}, intro:'비시라 하오. 옳다 싶은 말은 삼키지 않소.' },
  heojeong: { id:'heojeong', name:'허정', birth:150, deathReal:222, deathVirtual:240, kind:'flavor', affiliation:'촉한',
    stats:{atk:10, def:12, spd:10, int:50, cha:60, lead:12}, intro:'허정이라 하오. 명망이라면 남부럽지 않소만…' },
  wangchan: { id:'wangchan', name:'왕찬', birth:177, deathReal:217, deathVirtual:267, kind:'flavor', affiliation:'조조군',
    stats:{atk:12, def:12, spd:10, int:56, cha:50, lead:14}, intro:'왕찬이라 하오. 글재주로 이름을 좀 얻었소.' },
  eombaekho: { id:'eombaekho', name:'엄백호', birth:155, deathReal:197, deathVirtual:245, kind:'flavor', affiliation:'강동',
    stats:{atk:34, def:30, spd:28, int:42, cha:38, lead:40}, intro:'강동의 엄백호요.' },
  heogong: { id:'heogong', name:'허공', birth:150, deathReal:196, deathVirtual:240, kind:'flavor', affiliation:'강동',
    stats:{atk:28, def:26, spd:24, int:44, cha:40, lead:32}, intro:'오군 태수 허공이오.' },
  jangmak: { id:'jangmak', name:'장막', birth:150, deathReal:195, deathVirtual:240, kind:'flavor', affiliation:'반동탁연합',
    stats:{atk:26, def:26, spd:24, int:46, cha:48, lead:32}, intro:'진류태수 장막이오. 반동탁연합에 뜻을 함께했소.' },
  gwakyuji: { id:'gwakyuji', name:'곽유지', birth:185, deathReal:250, deathVirtual:275, kind:'flavor', affiliation:'촉한',
    stats:{atk:14, def:14, spd:12, int:52, cha:50, lead:14}, intro:'곽유지라 하오.' },
  beongeon: { id:'beongeon', name:'번건', birth:180, deathReal:245, deathVirtual:270, kind:'flavor', affiliation:'촉한',
    stats:{atk:14, def:14, spd:12, int:48, cha:46, lead:14}, intro:'번건이라 하오.' },
  ibok: { id:'ibok', name:'이복', birth:178, deathReal:246, deathVirtual:268, kind:'flavor', affiliation:'촉한',
    stats:{atk:14, def:14, spd:12, int:50, cha:48, lead:14}, intro:'이복이라 하오. 사신으로 다녀올 일이 있으면 불러주시오.' },
  hajong: { id:'hajong', name:'하종', birth:182, deathReal:250, deathVirtual:272, kind:'flavor', affiliation:'촉한',
    stats:{atk:12, def:12, spd:10, int:48, cha:44, lead:12}, intro:'하종이라 하오.' },
  maenggwang: { id:'maenggwang', name:'맹광', birth:175, deathReal:240, deathVirtual:265, kind:'flavor', affiliation:'촉한',
    stats:{atk:10, def:12, spd:10, int:50, cha:46, lead:12}, intro:'맹광이라 하오.' },
  samarang: { id:'samarang', name:'사마랑', birth:171, deathReal:224, deathVirtual:261, kind:'flavor', affiliation:'조조군',
    stats:{atk:20, def:20, spd:18, int:58, cha:56, lead:24}, intro:'사마의의 형, 사마랑이오.' },
  jangbeom: { id:'jangbeom', name:'장범', birth:160, deathReal:210, deathVirtual:250, kind:'flavor', affiliation:'무소속',
    stats:{atk:16, def:16, spd:14, int:44, cha:36, lead:16}, intro:'장범이라 하오.' },
  wanggwang: { id:'wanggwang', name:'왕광', birth:150, deathReal:192, deathVirtual:240, kind:'flavor', affiliation:'반동탁연합',
    stats:{atk:22, def:22, spd:20, int:46, cha:44, lead:26}, intro:'하내태수 왕광이오.' },
  janggi: { id:'janggi', name:'장기', birth:170, deathReal:230, deathVirtual:260, kind:'flavor', affiliation:'조조군',
    stats:{atk:16, def:16, spd:14, int:52, cha:48, lead:16}, intro:'장기라 하오.' },
  onhoe: { id:'onhoe', name:'온회', birth:172, deathReal:228, deathVirtual:262, kind:'flavor', affiliation:'조조군',
    stats:{atk:14, def:14, spd:12, int:50, cha:46, lead:14}, intro:'온회라 하오.' },
  joeom: { id:'joeom', name:'조엄', birth:168, deathReal:225, deathVirtual:258, kind:'flavor', affiliation:'조조군',
    stats:{atk:14, def:14, spd:12, int:48, cha:44, lead:14}, intro:'조엄이라 하오.' },
  dooseop: { id:'dooseop', name:'두습', birth:165, deathReal:230, deathVirtual:255, kind:'flavor', affiliation:'조조군',
    stats:{atk:16, def:16, spd:14, int:52, cha:50, lead:16}, intro:'두습이라 하오.' },
  wigi: { id:'wigi', name:'위기', birth:150, deathReal:220, deathVirtual:240, kind:'flavor', affiliation:'후한 조정',
    stats:{atk:12, def:12, spd:10, int:50, cha:46, lead:12}, intro:'위기라 하오. 옛 조정을 오래 섬겼소.' },
  jeonghon: { id:'jeonghon', name:'정혼', birth:170, deathReal:228, deathVirtual:260, kind:'flavor', affiliation:'조조군',
    stats:{atk:14, def:14, spd:12, int:48, cha:44, lead:14}, intro:'정혼이라 하오.' },
};

// 책사형(지력형) vs 무력형 판정 — 등용 경로가 갈리는 기준
function isScholarType(rd) {
  return !!(rd && rd.stats && rd.stats.int > rd.stats.atk);
}
