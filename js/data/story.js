const STORY = {
  intro: [
    { speaker: '관우', text: '이 어지러운 세상, 뜻을 함께할 이가 있다면 얼마나 좋겠소.', scene: 'assets/illust/dowon_market.jpg' },
    { speaker: '장비', text: '나 장익덕, 재물은 있어도 함께 큰일을 할 사람이 없어 답답했소!', scene: 'assets/illust/dowon_market.jpg' },
    { speaker: '유비', text: '나 유현덕이오. 가진 것은 없으나 한실을 다시 일으키고픈 뜻만은 크외다.', scene: 'assets/illust/dowon_market.jpg' },
    { speaker: '관우', text: '그 뜻, 나 관운장이 함께하겠소.', scene: 'assets/illust/dowon_market.jpg' },
    { speaker: '장비', text: '복숭아나무 아래서 의형제를 맺읍시다! 한날한시에 나지 못했으나, 죽을 땐 한날한시에 죽기를!', scene: 'assets/illust/dowon_market.jpg' },
    { speaker: '내레이션', text: '184년, 탁현의 어느 봄날. 세 사람은 하늘에 제를 올리고 의형제를 맺었다.', scene: 'assets/illust/dowon_oath.jpg', holdMs: 3500 },
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
  // 그림이 준비되면 각 줄에 scene 필드로 삽화 경로를 연결한다.
  act1_dokwoo: [
    { speaker: '내레이션', text: '안희현위가 된 유비는 백성들을 잘 챙겼지만, 감찰관 독우가 뇌물을 요구하며 괴롭히기 시작했다.' },
    { speaker: '내레이션', text: '이를 참다못한 장비가 크게 화를 내며 독우를 버드나무에 묶고 매질하였다.' },
    { speaker: '유비', text: '놓아 주거라, 모든 것이 이 벼슬로부터 난 일이다. 차라리 내가 벼슬을 내려놓겠다.' },
    { speaker: '장비', text: '어렵게 얻은 우리 형님 관직인데…' },
    { speaker: '관우', text: '네 잘못이 아니다. 저런 탐관오리는 다시는 허튼짓 못하게 엄히 다스리는 게 맞다.' },
    { speaker: '유비', text: '대주성으로 가서 우선 몸을 피하자.' },
    { speaker: '내레이션', text: '대주성으로 피신한 유비 일행은 대주 태수 유회의 병력 지원을 받아 어양으로 향했다.' },
  ],

  jangsun_call: [
    { speaker: '유우', text: '자네가 유회 태수가 보낸 원군인가?' },
    { speaker: '유우', text: '관공, 한시가 급하오. 형님과 함께 장순을 진압해주오!' },
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
  jangsun_aftermath: [
    { speaker: '내레이션', text: '장순의 난을 평정한 공이 공손찬의 귀에까지 들어갔다.' },
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
    { speaker: '내레이션', text: '관우가 돌아왔을 때, 조조가 데워준 술은 아직 따뜻했다.' },
    { speaker: '장비', text: '형님, 정말 술이 식기도 전에 돌아오셨소!' },
    { speaker: '내레이션', text: '관우가 화웅의 목을 장막 앞에 내려놓자, 좌중이 찬물을 끼얹은 듯 조용해졌다.' },
    { speaker: '조조', text: '하하! 내 사람 보는 눈이 틀리지 않았소!' },
    { speaker: '내레이션', text: '원술은 아무 말도 하지 못한 채 낯빛만 붉어졌다.' },
  ],

  camp_arrive: [
    { speaker: '내레이션', text: '유비 삼형제는 공손찬의 깃발 아래 낙양 인근 반동탁연합 진영에 도착했다.' },
    { speaker: '공손찬', text: '자, 원소 어른께 인사드리세. 이들이 내가 말한 현덕의 아우들이오.' },
    { speaker: '원소', text: '흠, 이름 없는 의용군이라… 두고 보겠소.' },
  ],
  camp_songgyeon_battle: [
    { speaker: '내레이션', text: '손견이 선봉을 자원해 사수관으로 나섰으나, 동탁의 맹장 화웅에게 크게 밀리고 있다는 전갈이 왔다.' },
    { speaker: '손견', text: '크윽… 이 화웅이란 놈, 보통내기가 아니구나!' },
    { speaker: '원소', text: '손견 공이 밀릴 정도라니… 누가 나가 저 화웅을 처치하겠소?' },
    { speaker: '내레이션', text: '원소 휘하의 장수 유섭이 자신 있게 나섰다.' },
    { speaker: '유섭', text: '제가 나가 화웅의 목을 베어오겠습니다!' },
    { speaker: '내레이션', text: '그러나 유섭은 화웅과 몇 합 겨루지도 못하고 목숨을 잃고 말았다.' },
    { speaker: '한복', text: '제 상장 반봉이라면 화웅을 이길 수 있을 것입니다!' },
    { speaker: '내레이션', text: '반봉이 도끼를 들고 나섰지만, 그 역시 화웅의 상대가 되지 못했다.' },
    { speaker: '원소', text: '허어… 내 아끼는 장수 안량과 문추가 이 자리에 없는 것이 참으로 안타깝구나!' },
    { speaker: '내레이션', text: '장막 안이 무겁게 가라앉았다. 아무도 선뜻 나서지 못했다.' },
    { speaker: '관우', text: '제가 나가 화웅의 목을 베어 바치겠습니다.' },
  ],
  camp_gwanwoo_volunteer: [
    { speaker: '원술', text: '네놈은 뭐하는 자이기에 감히 나선단 말이냐?' },
    { speaker: '공손찬', text: '제 아우 되는 사람으로, 마궁수 관우라 하오.' },
    { speaker: '원술', text: '흥, 겨우 활 쏘는 병졸 주제에! 저놈을 당장 끌어내라!' },
    { speaker: '조조', text: '잠깐! 이 사람의 생김새가 예사롭지 않은데, 화웅이 이 사람의 신분을 물어보기야 하겠소? 한번 내보내 봅시다.' },
    { speaker: '원소', text: '말단 궁수를 내보냈다가 화웅에게 비웃음만 사면 어찌하오?' },
    { speaker: '조조', text: '이 사람의 기개를 보니 범상치 않소. 만약 이기지 못하거든, 그때 책망해도 늦지 않을 것이오.' },
    { speaker: '내레이션', text: '조조가 손수 데운 술 한 잔을 관우에게 건넸다.' },
    { speaker: '조조', text: '우선 이 술 한 잔 들고 나가시게.' },
    { speaker: '관우', text: '술은 잠시 두십시오. 다녀와서 마시겠습니다.' },
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
    { speaker: '여포', text: '흥, 오늘은 이만하지. 다음에 또 보자!' },
    { speaker: '내레이션', text: '여포는 방천화극을 거두고 관 안으로 사라졌다.' },
  ],
  warmap_clear: [
    { speaker: '내레이션', text: '호로관의 동탁군이 완전히 무너졌다. 제후 연합군은 여세를 몰아 장안으로 향하는 길목, 함곡관으로 진군했다.' },
  ],

  hamgokgwan_pre: [
    { speaker: '내레이션', text: '왕윤의 계책으로 여포가 동탁을 베었다는 소식이 전해졌다. 그러나 잔당 이각·곽사가 저항하고 있었다.' },
    { speaker: '이각', text: '동탁 어른은 가셨지만, 우리까지 무너질 성싶으냐!' },
    { speaker: '관우', text: '역적의 잔당들, 이곳에서 끝을 보자.' },
  ],
  hamgokgwan_post: [
    { speaker: '곽사', text: '훗날 반드시 돌아오리라!' },
    { speaker: '내레이션', text: '낙양은 조정의 손에 돌아왔으나, 잔당은 서쪽으로 흩어졌다. 유비 삼형제의 이름이 천하에 알려지기 시작했다…' },
    { speaker: '내레이션', text: '— 챕터1 클리어 · 챕터2는 아직 준비 중입니다 —' },
  ],
};
