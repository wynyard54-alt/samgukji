const STORY = {
  intro: [
    { speaker: '관우', text: '이 어지러운 세상, 뜻을 함께할 이가 있다면 얼마나 좋겠소.', scene: 'assets/illust/dowon_market.jpg' },
    { speaker: '장비', text: '나 장익덕, 재물은 있어도 함께 큰일을 할 사람이 없어 답답했소!', scene: 'assets/illust/dowon_market.jpg' },
    { speaker: '유비', text: '나 유현덕이오. 가진 것은 없으나 한실을 다시 일으키고픈 뜻만은 크외다.', scene: 'assets/illust/dowon_market.jpg' },
    { speaker: '관우', text: '그 뜻, 나 관운장이 함께하겠소.', scene: 'assets/illust/dowon_market.jpg' },
    { speaker: '장비', text: '복숭아나무 아래서 의형제를 맺읍시다! 한날한시에 나지 못했으나, 죽을 땐 한날한시에 죽기를!', scene: 'assets/illust/dowon_market.jpg' },
    { speaker: '내레이션', text: '184년, 탁현의 어느 봄날. 세 사람은 하늘에 제를 올리고 의형제를 맺었다.', scene: 'assets/illust/dowon_oath.jpg', holdMs: 3500 },
  ],

  // 도원결의 직후 유비를 처음 찾아갔을 때 받는 첫 임무 설명.
  act1_briefing: [
    { speaker: '유비', text: '아우, 왔는가.' },
    { speaker: '유비', text: '탁현에 황건적 무리가 날뛰고 있다 하네. 그 두목이 정원지라는 자라더군.' },
    { speaker: '유비', text: '아우들이 나서서 저 자를 처치해 주게.' },
  ],

  act1_report: [
    { speaker: '추정', text: '그대들의 공이 크오. 조정에 보고해 상을 내리겠소.' },
    { speaker: '유비', text: '관직보다, 이 세상을 바로잡을 힘을 얻고 싶을 뿐이오.' },
    { speaker: '내레이션', text: '황건적을 물리친 이야기가 탁현 곳곳에 퍼지면서 유비의 이름이 널리 알려졌다.' },
    { speaker: '내레이션', text: '그 소문을 들은 장정 500여 명이 유비 휘하에 들어오기를 자청했다. — 184년 여름' },
  ],

  goseung_incident: [
    { speaker: '유비', text: '한데 아직 마음을 놓기는 이르오.' },
    { speaker: '유비', text: '방금 전갈이 왔는데, 시장 한복판에 황건적 잔당 하나가 또 나타나 행패를 부리고 있다 하오.' },
    { speaker: '유비', text: '고승이라는 자라 들었소. 아우가 가서 처리해주겠소?' },
  ],

  act1_appointment: [
    { speaker: '유비', text: '두 황건적 잔당을 모두 처치했으니, 이제 이 공을 조정에 알릴 수 있겠소.' },
    { speaker: '내레이션', text: '탁현 일대의 황건적을 평정한 공으로, 유비는 안희현위에 제수되었다.' },
    { speaker: '유비', text: '아우들, 이제 안희로 떠날 준비를 하세.' },
  ],

  // 안희현위가 된 유비가 감찰관 독우에게 뇌물을 요구받고, 장비가 매질하는 사건.
  act1_dokwoo: [
    { speaker: '내레이션', text: '안희현위가 된 유비는 백성들을 잘 챙겼지만, 감찰관 독우가 뇌물을 요구하며 괴롭히기 시작했다.', scene: 'assets/illust/anhee_dokwoo.jpg' },
    { speaker: '내레이션', text: '이를 참다못한 장비가 크게 화를 내며 독우를 버드나무에 묶고 매질하였다.', scene: 'assets/illust/anhee_dokwoo.jpg' },
    { speaker: '유비', text: '놓아 주거라, 모든 것이 이 벼슬로부터 난 일이다. 차라리 내가 벼슬을 내려놓겠다.', scene: 'assets/illust/anhee_dokwoo.jpg' },
    { speaker: '장비', text: '어렵게 얻은 우리 형님 관직인데…', scene: 'assets/illust/anhee_dokwoo.jpg' },
    { speaker: '관우', text: '네 잘못이 아니다. 저런 탐관오리는 다시는 허튼짓 못하게 엄히 다스리는 게 맞다.', scene: 'assets/illust/anhee_dokwoo.jpg' },
    { speaker: '유비', text: '대주성으로 가서 우선 몸을 피하자.' },
    { speaker: '내레이션', text: '대주성으로 피신한 유비 일행은 대주 태수 유회의 병력 지원을 받아 어양으로 향했다.' },
  ],

  jangsun_call: [
    { speaker: '유우', text: '자네가 유회 태수가 보낸 원군인가?' },
    { speaker: '관우', text: '관운장이오.' },
    { speaker: '유우', text: '고작 그 정도 병력으로 어찌 10만 반군을 막는단 말이오.' },
    { speaker: '유우', text: '이 근방의 유력한 인사들을 찾아가 병사를 좀 더 모으시오. 최소 2000은 넘어야 승산이 있을 것이오.' },
  ],

  jangsun_yubi_join: [
    { speaker: '유비', text: '유우 공에게 이야기는 들었네.' },
    { speaker: '유비', text: '나도 장비와 함께 군세를 이끌고 가겠네, 아우도 얼른 따라와 주게!' },
  ],

  jangsun_yubi_depart: [
    { speaker: '내레이션', text: '유비와 장비가 이끄는 선봉대가 먼저 말을 몰아 앞서나갔다.' },
    { speaker: '관우', text: '형님, 너무 서두르지 마십시오! 나도 뒤따르겠소!' },
  ],

  jangsun_yubi_defeat: [
    { speaker: '전령', text: '급보요! 유비 공의 선봉대가 장순의 반란군과 먼저 부딪혔으나 크게 패퇴했다 하오!' },
    { speaker: '전령', text: '유비 공께서 화살을 맞고 쓰러지셨으나, 다행히 병사들이 구해내 목숨은 건지셨다 하오.' },
    { speaker: '관우', text: '형님이…! 이제라도 서둘러야겠다.' },
  ],

  jangsun_victory: [
    { speaker: '유우', text: '그대의 공이 참으로 크네. 이 땅의 백성들이 두 발 뻗고 잘 수 있게 됐어.' },
    { speaker: '내레이션', text: '장순의 난이 평정되었다는 소식이 각지에 전해졌다.' },
  ],

  // 장순의 난 진압 직후, 별도 삽화·장면전환 없이 메시지만으로 처리하는 관직 승진.
  // 공손찬은 유우 휘하 지휘관으로 이 싸움에 함께 있었으므로, 전해들은 것이 아니라
  // 직접 지켜본 것으로 서술한다.
  jangsun_aftermath: [
    { speaker: '공손찬', text: '이 눈으로 직접 지켜보았네, 오늘 그대들의 활약을.' },
    { speaker: '공손찬', text: '독우를 매질한 죄는 내가 나서서 무마해두었네. 자네 같은 인재를 썩힐 수야 있나.' },
    { speaker: '내레이션', text: '공손찬의 천거로, 유비는 평원현령에 제수되었다.' },
  ],

  act1_forced: [
    { speaker: '내레이션', text: '어느덧 186년, 더는 지체할 수 없는 때가 되었다.' },
    { speaker: '유비', text: '아우들, 이만 이곳을 정리하고 안희로 떠나야겠소.' },
    { speaker: '내레이션', text: '황건적 잔당은 뒤이어 온 관군에 의해 소탕되었다는 소식이 전해졌다.' },
  ],

  act2_forced: [
    { speaker: '유비', text: '아우들, 더는 지체할 수 없소. 지금 당장 사수관으로 출정해야겠소!' },
  ],

  act2_call: [
    { speaker: '전령', text: '낙양에서 급보요! 하진 대장군이 살해되고, 동탁이란 자가 황제를 갈아치웠다 하오!', scene: 'assets/illust/pyeongwon_urgent.jpg' },
    { speaker: '관우', text: '나라의 근본을 뒤흔드는 자로군.', scene: 'assets/illust/pyeongwon_urgent.jpg' },
    { speaker: '전령', text: '원소를 비롯한 제후들이 토벌군을 일으켰고, 공손찬 어른도 격문을 보내셨소.', scene: 'assets/illust/pyeongwon_urgent.jpg' },
    { speaker: '장비', text: '드디어 우리도 나설 때다!', scene: 'assets/illust/pyeongwon_urgent.jpg' },
    { speaker: '내레이션', text: '유비 삼형제는 공손찬의 깃발 아래 반동탁 연합에 합류했다. — 189~190년' },
  ],

  sasugwan_pre: [
    { speaker: '내레이션', text: '사수관. 동탁의 맹장 화웅이 제후군을 연파하며 기세등등해 있었다.' },
    { speaker: '화웅', text: '이런 촌뜨기들까지 나선단 말이냐? 목이나 내놓아라!' },
    { speaker: '관우', text: '말이 많구나. 술 한 잔 데워질 시간이면 충분하다.' },
  ],
  sasugwan_post: [
    { speaker: '내레이션', text: '관우가 돌아왔을 때, 조조가 데워준 술은 아직 따뜻했다.', scene: 'assets/illust/sasugwan_victory.jpg' },
    { speaker: '장비', text: '형님, 정말 술이 식기도 전에 돌아오셨소!', scene: 'assets/illust/sasugwan_victory.jpg' },
    { speaker: '내레이션', text: '관우가 화웅의 목을 장막 앞에 내려놓자, 좌중이 찬물을 끼얹은 듯 조용해졌다.', scene: 'assets/illust/sasugwan_victory.jpg' },
    { speaker: '조조', text: '하하! 내 사람 보는 눈이 틀리지 않았소!', scene: 'assets/illust/sasugwan_victory.jpg' },
    { speaker: '내레이션', text: '원술은 아무 말도 하지 못한 채 낯빛만 붉어졌다.', scene: 'assets/illust/sasugwan_victory.jpg' },
  ],

  camp_arrive: [
    { speaker: '내레이션', text: '유비 삼형제는 공손찬의 깃발 아래 낙양 인근 반동탁연합 진영에 도착했다.' },
    { speaker: '공손찬', text: '자, 원소 어른께 인사드리세. 이들이 내가 말한 현덕의 아우들이오.' },
    { speaker: '원소', text: '흠, 이름 없는 의용군이라… 두고 보겠소.' },
  ],
  camp_songgyeon_battle: [
    { speaker: '내레이션', text: '손견이 선봉을 자원해 사수관으로 나섰으나, 동탁의 맹장 화웅에게 크게 밀리고 있다는 전갈이 왔다.' },
    { speaker: '손견', text: '크윽… 이 화웅이란 놈, 보통내기가 아니구나!' },
    { speaker: '원소', text: '손견 공이 밀릴 정도라니… 누가 나가 저 화웅을 처치하겠소?', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '내레이션', text: '원소 휘하의 장수 유섭이 자신 있게 나섰다.', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '유섭', text: '제가 나가 화웅의 목을 베어오겠습니다!', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '내레이션', text: '그러나 유섭은 화웅과 몇 합 겨루지도 못하고 목숨을 잃고 말았다.', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '한복', text: '제 상장 반봉이라면 화웅을 이길 수 있을 것입니다!', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '내레이션', text: '반봉이 도끼를 들고 나섰지만, 그 역시 화웅의 상대가 되지 못했다.', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '원소', text: '허어… 내 아끼는 장수 안량과 문추가 이 자리에 없는 것이 참으로 안타깝구나!', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '내레이션', text: '장막 안이 무겁게 가라앉았다. 아무도 선뜻 나서지 못했다.', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '관우', text: '제가 나가 화웅의 목을 베어 바치겠습니다.', scene: 'assets/illust/sasugwan_pledge.jpg' },
  ],
  camp_gwanwoo_volunteer: [
    { speaker: '원술', text: '네놈은 뭐하는 자이기에 감히 나선단 말이냐?', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '공손찬', text: '제 아우 되는 사람으로, 마궁수 관우라 하오.', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '원술', text: '흥, 겨우 활 쏘는 병졸 주제에! 저놈을 당장 끌어내라!', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '조조', text: '잠깐! 이 사람의 생김새가 예사롭지 않은데, 화웅이 이 사람의 신분을 물어보기야 하겠소? 한번 내보내 봅시다.', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '원소', text: '말단 궁수를 내보냈다가 화웅에게 비웃음만 사면 어찌하오?', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '조조', text: '이 사람의 기개를 보니 범상치 않소. 만약 이기지 못하거든, 그때 책망해도 늦지 않을 것이오.', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '내레이션', text: '조조가 손수 데운 술 한 잔을 관우에게 건넸다.', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '조조', text: '우선 이 술 한 잔 들고 나가시게.', scene: 'assets/illust/sasugwan_pledge.jpg' },
    { speaker: '관우', text: '술은 잠시 두십시오. 다녀와서 마시겠습니다.', scene: 'assets/illust/sasugwan_pledge.jpg' },
  ],

  warmap_intro: [
    { speaker: '내레이션', text: '사수관이 뚫리자 동탁군은 호로관으로 물러나 진을 쳤다. 제후 연합군도 뒤이어 진격했다.' },
    { speaker: '관우', text: '아직 끝나지 않았다. 호로관까지 밀어붙인다!' },
  ],
  warmap_yeopo_taunt: [
    { speaker: '여포', text: '흥, 사수관 하나 넘었다고 우쭐대지 마라! 이 여포가 살아있는 한 호로관은 못 넘는다!' },
  ],
  warmap_jangbi_out: [
    { speaker: '장비', text: '내가 먼저 붙어보겠소!' },
    { speaker: '내레이션', text: '장비가 장팔사모를 들고 여포에게 달려들었다.' },
  ],
  warmap_jangbi_push: [
    { speaker: '내레이션', text: '몇 합 겨루지도 못하고 장비가 밀리기 시작했다.' },
    { speaker: '관우', text: '(장비와 이 정도로 호각을 이루는 장수가 있다니…!)' },
  ],
  warmap_yubi_assist: [
    { speaker: '유비', text: '아우 혼자 두어선 안 되겠소, 나도 돕겠소!' },
  ],
  warmap_yeopo_defeat: [
    { speaker: '내레이션', text: '여포의 창끝이 매섭게 파고들었다. 도저히 버텨낼 수 없었다.' },
    { speaker: '내레이션', text: '유비군은 크게 밀려나 호로관 앞에서 물러섰다.' },
  ],
  warmap_yeopo_flee: [
    { speaker: '여포', text: '흥, 오늘은 이만하지. 다음에 또 보자!', scene: 'assets/illust/hogwan_yeopo_retreat.jpg' },
    { speaker: '내레이션', text: '여포는 방천화극을 거두고 관 안으로 사라졌다.', scene: 'assets/illust/hogwan_yeopo_retreat.jpg', holdMs: 3500 },
  ],
  warmap_clear: [
    { speaker: '내레이션', text: '호로관의 동탁군이 완전히 무너졌다. 제후 연합군은 여세를 몰아 장안으로 향하는 길목, 함곡관으로 진군했다.' },
  ],

  hamgokgwan_pre: [
    { speaker: '내레이션', text: '왕윤의 계책으로 여포가 동탁을 베었다는 소식이 전해졌다. 그러나 잔당 이각·곽사가 저항하고 있었다.' },
    { speaker: '이각', text: '동탁 어른은 가셨지만, 우리까지 무너질 성싶으냐!' },
    { speaker: '관우', text: '역적의 잔당들, 이곳에서 끝을 보자.' },
  ],
  // 이각을 물리친 직후, 곧바로 곽사 전투로 넘어가버리면 두 전투가 한 덩어리처럼
  // 느껴진다. 짧게라도 숨 고르는 지점을 준다.
  hamgokgwan_igak_result: [
    { speaker: '내레이션', text: '이각은 얼마 버티지 못하고 말머리를 돌려 서쪽으로 달아났다.' },
    { speaker: '관우', text: '아직 곽사가 남았다. 끝까지 몰아붙인다!' },
  ],
  hamgokgwan_post: [
    { speaker: '곽사', text: '훗날 반드시 돌아오리라!' },
    { speaker: '내레이션', text: '곽사마저 달아나며, 함곡관의 저항이 완전히 끝났다.' },
    { speaker: '내레이션', text: '낙양은 마침내 조정의 손에 돌아왔고, 유비 삼형제의 이름은 천하에 알려지기 시작했다.' },
    { speaker: '내레이션', text: '— 챕터1 클리어 —', holdMs: 2400 },
    { speaker: '내레이션', text: '챕터2는 아직 준비 중입니다.' },
  ],

  // ---- 챕터2 (관우) : 서주 - 삼양서주 [장면1] ----
  // 정사와 연의가 갈리는 지점부터는 이후 쭉 연의를 기준으로 삼는다.
  // 삽화가 화면을 가리는 동안 자연스럽게 담현(서주) 지도로 넘어가므로,
  // 이어지는 seoju_wall_standoff_intro에는 별도 화면전환 연출이 없어도 된다.
  seoju_urgent_call: [
    { speaker: '내레이션', text: '미축은 황건적으로부터 북해태수 공융을 도우러 온 유비를 만난다.', scene: 'assets/illust/seoju_urgent.jpg' },
    { speaker: '미축', text: '유비 장군님… 제발 서주를 도와주십시오!', scene: 'assets/illust/seoju_urgent.jpg' },
    { speaker: '유비', text: '(서신을 펼쳐 읽는다) …조조가 부친의 원수를 갚는다며 서주를 침공했다는구나.', scene: 'assets/illust/seoju_urgent.jpg' },
    { speaker: '유비', text: '도겸 어른께서 오해를 받고 계시다니, 제가 도와드리겠습니다.', scene: 'assets/illust/seoju_urgent.jpg' },
    { speaker: '미축', text: '‘조조와 적이 되는 것을 마다 않고 우리 서주를 도와주신다니!’', scene: 'assets/illust/seoju_urgent.jpg' },
  ],

  // 도착과 동시에 카메라가 조조 군세 쪽으로 올라가며 3초간 비춰준다
  // (holdMs로 자동 진행 - main.js에서 이 대사와 함께 panCameraTo를 건다).
  seoju_wall_standoff_intro: [
    { speaker: '내레이션', text: '서주 담현에 다다른 유비 삼형제는 이미 서주를 둘러싼 조조 군세를 바라봤다.', holdMs: 3000 },
  ],

  // 연의에서는 대치만 하다 끝나지 않는다 - 성미 급한 장비가 우금과 붙어
  // 가볍게 물리친다. 이 대사 다음에 실제 일기토(장비 vs 우금)가 재생되고,
  // 승리하면 seoju_wall_standoff_result로 이어진다. 그 뒤로도 아직 성벽
  // 밖(카메라도 조조 진영 쪽)이고, 다음 배열(seoju_wall_standoff_city)부터
  // 성 안으로 들어간 뒤라 main.js에서 그 사이에 플레이어를 성문 쪽으로
  // 옮기고 카메라도 되돌린다.
  seoju_wall_standoff_pre: [
    { speaker: '관우', text: '저것이 조조의 군세입니까…! 듣던 것보다 훨씬 많군요.' },
    { speaker: '장비', text: '치, 숫자만 많으면 다냐! 한번 붙어보자고! 이몸이 나가신다!' },
  ],
  seoju_wall_standoff_result: [
    { speaker: '내레이션', text: '조조군에서 우금이 나섰지만 장비의 적수는 되지 못했다.' },
  ],

  // 성 안으로 들어간 뒤, 도겸과 만나 편지를 보내기로 한다.
  seoju_wall_standoff_city: [
    { speaker: '도겸', text: '힘든 길을 와 주셨군요. 참으로 고맙소, 이 늙은 몸으로는 도저히 감당이 안 되는구려.' },
    { speaker: '유비', text: '인사올립니다, 도겸님. 우선 조조에게 편지를 보내 싸움을 멈추자고 설득해 보겠습니다.' },
    { speaker: '도겸', text: '그렇게만 된다면 더 바랄 게 없습니다.' },
    { speaker: '도겸', text: '…유비는 참 영웅이다. 저런 사람이 서주를 맡아준다면 걱정이 없을 텐데…' },
  ],

  // 연의 원문 그대로: 조조는 편지를 읽고 크게 노하지만, 곽가가 저들을
  // 방심케 한 뒤 치자고 진언한다. 그 직후 연주 급보가 날아들자, 곽가는
  // 다시 "이 기회에 유비에게 인심이나 쓰는 셈 치고 물러나자"고 권해
  // 조조가 그 말을 따른다 - 편지는 명분일 뿐, 실제로 물러나는 이유는
  // 어디까지나 연주(복양)를 잃을 위기 때문이다.
  puyang_report_retreat: [
    { speaker: '내레이션', text: '전령이 서신을 조조에게 전했다.' },
    { speaker: '조조', text: '…뭐라? 이 유비란 자가 감히 나를 훈계하려 드는구나!' },
    { speaker: '곽가', text: '주공, 잠시 노여움을 거두십시오. 차라리 저들을 방심케 한 뒤, 그 틈을 타 성을 치는 것이 상책입니다.' },
    { speaker: '전령', text: '주공! 급보입니다! 연주의 복양에서 장막과 진궁이 여포를 끌어들여 성을 빼앗았다 하옵니다!' },
    { speaker: '조조', text: '…뭐라? 여포가? 연주를 잃으면 내 돌아갈 곳이 없어진다!' },
    { speaker: '곽가', text: '주공, 오히려 잘 되었습니다. 이 기회에 유비에게 인심이나 쓰는 셈 치고, 군을 물려 연주부터 되찾으시지요.' },
    { speaker: '조조', text: '…좋다, 그리하자. 전군, 회군한다! 서주는…다음에 다시 온다!' },
    { speaker: '내레이션', text: '조조의 대군이 썰물처럼 물러가기 시작했다.' },
    { speaker: '미축', text: '물러갑니다! 서주가…살았습니다!' },
  ],

  dogyeom_disband: [
    { speaker: '내레이션', text: '조조군이 완전히 물러가자, 도겸은 유비에게 서주를 맡기려 했다.' },
    { speaker: '도겸', text: '유 사군 덕분에 서주가 살았소. 이 은혜, 어찌 갚아야 할지 모르겠구려.' },
    { speaker: '유비', text: '당치 않습니다. 마땅히 해야 할 일을 했을 뿐입니다.' },
    { speaker: '도겸', text: '…실은 진작부터 생각해온 일이오. 이 서주, 그대가 맡아주지 않겠소?' },
    { speaker: '유비', text: '그건 안 됩니다. 제가 서주를 차지하면, 전 흑심을 품고 서주에 온 사람이 되어 버립니다.' },
    { speaker: '도겸', text: '정 그렇다면 이 늙은이의 마지막 소원이라도 들어주시오.' },
    { speaker: '도겸', text: '서주 가까운 곳에 소패라는 지역이 있습니다. 그곳에 머물며 간간이 서주를 살펴주십시오.' },
    { speaker: '내레이션', text: '유비 일행은 도겸의 청을 정중히 사양하고, 소패에 머물게 되었다.' },
  ],

  // 자유탐방이 일정 기간 지나면 발동되는 도겸의 죽음과 유비의 서주 계승.
  // 삽화 한 장이 계속 화면을 덮은 채로 이어지는 하나의 연속된 장면이다.
  dogyeom_death: [
    { speaker: '내레이션', text: '서주에 자리를 잡은 지 얼마 지나지 않아, 도겸이 자리보전하고 눕고 말았다.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '전령', text: '유 사군! 도겸 어르신께서 위중하시다 합니다! 어서 처소로 와주십시오!', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '내레이션', text: '유비 삼형제가 서둘러 도겸의 처소로 향했다.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '유비', text: '어찌 이런 일이! 괜찮으십니까?', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '도겸', text: '…어서 오셨구려, 유 사군. 이 늙은 몸이 이제 다한 모양이오.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '도겸', text: '마지막으로 장군께 부탁이 있습니다. 부디 서주를 맡아주세요.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '유비', text: '두 아드님도 계신데 어찌 제게…', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '도겸', text: '모두들 듣거라… 내 아들들은 재주가 모자라 서주를 다스릴 수 없다.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '도겸', text: '유 장군만이 서주를 맡을 분이니, 모두 유 장군을 따르거라. 내 마지막 유언이다.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '내레이션', text: '그 말을 끝으로, 도겸은 눈을 감았다.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '미축', text: '유 장군, 도겸 어른의 뜻일 뿐 아니라 서주 백만 백성이 원하고 있습니다. 부디 헤아려 주십시오.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '내레이션', text: '결국 유비는 오랜 고민 끝에 서주를 다스리게 되었다.' },
  ],

  // ---- 챕터2 (관우) : 하비성 관청 [장면2] ----
  // 연의 원문 기준(이호경식지계 -> 구호탄랑지계). 계책 이름 자체는 10세
  // 눈높이에 어려워 대사에는 쓰지 않고 여기 주석에만 남긴다.
  habi_intro: [
    { speaker: '내레이션', text: '조조에게 연주 일대를 되빼앗기고, 복양과 정도에서도 패한 여포는 유비가 있는 서주로 향했다.', scene: 'assets/illust/habi_yeopo_march.jpg' },
    { speaker: '내레이션', text: '여포가 서주로 온다는 소식은 유비에게도 전해졌다.', scene: 'assets/illust/habi_yeopo_march.jpg' },
  ],

  habi_yeopo_debate: [
    { speaker: '장비', text: '형님! 절대 안돼요!' },
    { speaker: '미축', text: '맞습니다. 절대 받아주면 안됩니다.' },
  ],

  habi_yeopo_result: [
    { speaker: '유비', text: '지난날 여포가 연주를 공격해주어 우리가 서주를 지킬 수 있지 않았느냐.' },
    { speaker: '내레이션', text: '결국 유비는 여포를 맞이하여 소패성을 내어주었다.' },
  ],

  // 조조가 헌제를 허도로 옮긴 뒤 유비를 정식 서주목에 봉하면서, 동시에
  // 은밀한 밀서로 여포를 죽이라 명한다. 연의에서는 장비가 여포 앞에서
  // 이 사실을 그냥 폭로해버리고, 유비가 밀서 자체를 보여주며 수습한다.
  habi_xuchang_intercept: [
    { speaker: '내레이션', text: '그 무렵, 조조는 황제를 허도로 모셔 조정을 손에 넣었다.' },
    { speaker: '내레이션', text: '조조는 유비와 여포가 힘을 합칠 것을 두려워했다.' },
    { speaker: '내레이션', text: '그는 유비를 정식 서주목으로 봉하게 한 뒤, 별도의 밀서를 보내 여포를 죽이라 명했다.' },
    { speaker: '장비', text: '잘됐습니다! 그 의리 없는 놈을 지금 당장 베어버리죠!' },
    { speaker: '유비', text: '아니다. 궁지에 몰려 나를 찾아온 사람을 죽이는 것은 의롭지 못하다.' },
    { speaker: '내레이션', text: '이튿날, 여포가 유비의 서주목 임명을 축하하러 찾아왔다.' },
    { speaker: '내레이션', text: '여포를 본 장비가 여포를 치려 하자, 유비는 여포를 조용히 불러 조조가 보낸 밀서를 직접 보여주었다.', scene: 'assets/illust/habi_secret_letter.jpg' },
    { speaker: '여포', text: '…조조가 우리 둘을 서로 죽이게 하려는 것이었군.', scene: 'assets/illust/habi_secret_letter.jpg' },
    { speaker: '유비', text: '안심하시오. 나는 그런 불의를 행하지 않겠소.', scene: 'assets/illust/habi_secret_letter.jpg' },
    { speaker: '여포', text: '…고맙소, 현덕 공. 이 은혜는 잊지 않겠소.', scene: 'assets/illust/habi_secret_letter.jpg' },
    { speaker: '내레이션', text: '조조는 유비를 통해 여포 제거가 실패하자, 유비에게 원술과 싸우라는 황명을 보낸다.' },
  ],

  habi_messenger_call: [
    { speaker: '전령', text: '관우 장군님! 유비님께서 회의실로 부르십니다!' },
  ],

  habi_council: [
    { speaker: '미축', text: '주공, 이것도 조조의 계책인 듯합니다.' },
    { speaker: '유비', text: '나도 그렇게 생각하네. 하지만 황명을 어길 수는 없지.' },
    { speaker: '관우', text: '출전을 준비할까요?' },
    { speaker: '장비', text: '제가 남아서 지키겠소!' },
    { speaker: '유비', text: '서주성은 우리에게 너무나 중요한 곳이다. 술을 좋아하는 네가 괜찮겠느냐?' },
    { speaker: '장비', text: '그럼 형님이 올 때까지 이번에는 절대로 술을 마시지 않겠소! 걱정마시오!' },
    { speaker: '내레이션', text: '유비는 장비에게 금주할 것을 당부하며 관우와 함께 원술 토벌에 나섰다.' },
  ],

  // ---- 챕터2 (관우) : 회남 벌판 [장면3, 원술 정벌] ----
  hoenam_intro: [
    { speaker: '내레이션', text: '유비와 관우는 대군을 이끌고 회남 벌판에 이르렀다.' },
    { speaker: '관우', text: '원술의 군세가 곳곳에 진을 치고 있습니다. 하나씩 쳐부수며 나아가겠습니다.' },
  ],

  // 기령(관우군)과 교유(유비군)를 각각 실제로 격파해야 나온다 - 두 군세
  // 모두 플레이어가 직접 편성하고 [일기토]/[전투]/[책략]으로 지휘하며,
  // 어느 쪽이 먼저 끝나든 나머지 하나까지 끝나야 이 대사로 이어진다.
  hoenam_giryeong_win: [
    { speaker: '내레이션', text: '관우가 기령의 군세를 격파하는 동안, 반대편에서는 유비의 군세가 교유의 군세를 무너뜨렸다.' },
    { speaker: '내레이션', text: '기세가 꺾인 원술은 남은 군세를 이끌고 성 안에 틀어박혀 나오지 않았다.' },
  ],

  hoenam_jangbi_arrives: [
    { speaker: '내레이션', text: '대치가 이어지던 그때, 장비가 다급히 말을 몰아 달려왔다.' },
    { speaker: '장비', text: '형님! 관우! 큰일 났수! 하비성이… 하비성이 여포에게 넘어갔수!' },
    { speaker: '유비', text: '…뭐라? 익덕, 그게 무슨 소리인가!' },
    { speaker: '장비', text: '조표란 놈이 성문을 열어줬다지 뭐요! 면목이 없수, 형님!' },
    { speaker: '유비', text: '…원술은 나중에 다시 도모하자. 지금은 하비로 돌아가야 한다!' },
    { speaker: '내레이션', text: '유비 일행은 원술 정벌을 포기하고, 서둘러 하비로 발길을 돌렸다.' },
  ],

  // TODO(챕터2 다음 장면, 소패): 하비 함락 이후 유비 일행이 소패에 머물게 되는
  // 시점에 간옹을 노식처럼 발견형 서브퀘스트로 등장시킬 것. 연의에서는 고순·장료가
  // 소패를 공격해와 유비가 대책을 상의하는 장면에서 간옹이 처음 제대로 소개된다
  // ("현덕의 동향 사람으로, 패현에 와서 현덕을 뵈었고, 현덕이 막빈으로 대우하였다").
  // 막사 근처에서 발견 -> 대화로 소개되는 흐름으로 구현.
};
