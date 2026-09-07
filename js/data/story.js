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
  // 도겸의 원군 요청. 삽화가 화면을 가리는 동안 자연스럽게 담현(서주) 지도로
  // 넘어가므로, 이어지는 seoju_wall_standoff에는 별도 화면전환 연출이 없어도 된다.
  seoju_urgent_call: [
    { speaker: '내레이션', text: '평원현에 다급한 파발이 도착했다.', scene: 'assets/illust/seoju_urgent.jpg' },
    { speaker: '전령', text: '유비 장군께 아룁니다! 서주자사 도겸 어른의 서신이옵니다!', scene: 'assets/illust/seoju_urgent.jpg' },
    { speaker: '유비', text: '(서신을 펼쳐 읽는다) …조조가 부친의 원수를 갚는다며 서주를 침공했다는구나.', scene: 'assets/illust/seoju_urgent.jpg' },
    { speaker: '유비', text: '도겸 어른께서 원군을 청하셨네. 아우들, 서주로 가세!', scene: 'assets/illust/seoju_urgent.jpg' },
    { speaker: '관우', text: '알겠습니다, 형님. 당장 채비하겠습니다.', scene: 'assets/illust/seoju_urgent.jpg' },
  ],

  seoju_wall_standoff: [
    { speaker: '내레이션', text: '서주 담현에 다다른 유비 삼형제는 곧장 성벽 위로 올랐다.' },
    { speaker: '관우', text: '저것이 조조의 군세입니까…! 듣던 것보다 훨씬 많군요.' },
    { speaker: '장비', text: '치, 숫자만 많으면 다냐! 한번 붙어보자고!' },
    { speaker: '도겸', text: '와주셔서 참으로 고맙소, 유 사군. 이 늙은 몸으로는 도저히 감당이 안 되는구려.' },
    { speaker: '유비', text: '병력이 많지 않으나, 힘닿는 데까지 돕겠습니다.' },
    { speaker: '도겸', text: '…부디 성벽만이라도 지켜주시오. 며칠만 버티면 원소 어른께도 원군을 청해두었소.' },
  ],

  // 연의에서는 대치만 하다 끝나지 않는다 - 성미 급한 장비가 조조 진영에
  // 나가 우금과 짧게 겨루고, 그 뒤에야 삼형제가 성 안으로 들어간다.
  seoju_jangbi_skirmish: [
    { speaker: '내레이션', text: '며칠째 대치가 이어지자, 성미 급한 장비가 참지 못하고 나섰다.' },
    { speaker: '장비', text: '저놈들 기세가 어느 정도인지 내 한번 찔러보고 오겠수!' },
    { speaker: '관우', text: '아우, 무리하지 말게. 살펴만 보고 오게.' },
    { speaker: '내레이션', text: '장비가 장팔사모를 꼬나쥐고 말을 몰아 조조 진영 앞으로 나섰다.' },
    { speaker: '장비', text: '이 안에 나설 자 없느냐! 연주의 겁쟁이들아!' },
    { speaker: '우금', text: '…흥, 어디서 굴러먹던 필부가 함부로 주둥이를 놀리느냐!' },
    { speaker: '내레이션', text: '우금이 창을 들고 나서 장비와 맞붙었다. 그러나 몇 합 겨루지도 못하고, 우금은 장비의 기세에 눌려 진영으로 물러나고 말았다.' },
    { speaker: '장비', text: '하하! 별거 아니구먼!' },
    { speaker: '내레이션', text: '조조 진영은 함부로 성문을 넘어 반격하지 않았다. 장비도 더는 뒤쫓지 않고 돌아왔다.' },
  ],

  seoju_city_entry: [
    { speaker: '도겸', text: '장군의 아우가 참으로 용맹하구려! 자, 어서 성 안으로 드시지요.' },
    { speaker: '유비', text: '감사합니다, 어른. 허나 이대로 대치만 이어가서는 근본적인 해결이 되지 않을 것입니다.' },
    { speaker: '내레이션', text: '유비 삼형제는 도겸을 따라 성 안으로 들어갔다.' },
  ],

  seoju_yubi_letter: [
    { speaker: '유비', text: '도겸 어른, 제게 한 가지 생각이 있습니다. 조조에게 서신을 보내보는 것이 어떻겠습니까?' },
    { speaker: '도겸', text: '서신이라니…? 그가 순순히 물러날 성싶소?' },
    { speaker: '유비', text: '대의로 설득해보고자 합니다. 밑져야 본전 아니겠습니까.' },
    { speaker: '내레이션', text: '유비는 손수 붓을 들어, 조조에게 대의를 들어 회군을 청하는 서신을 썼다.' },
    { speaker: '전령', text: '분부대로 조조 진영에 전하고 오겠습니다.' },
  ],

  puyang_report_retreat: [
    { speaker: '내레이션', text: '유비의 서신이 조조 진영에 전해진 그날, 진영이 갑자기 소란스러워졌다.' },
    { speaker: '조조(중군)', text: '…유비라는 자가 이런 글을 보낼 줄이야. 제법이군.' },
    { speaker: '전령', text: '주공! 급보입니다! 연주의 복양에서 장막과 진궁이 여포를 끌어들여 성을 빼앗았다 하옵니다!' },
    { speaker: '조조(중군)', text: '…뭐라? 여포가? 감히 내 뒤를 치다니!' },
    { speaker: '조조(중군)', text: '…마침 잘 됐다. 유비의 낯을 세워주는 셈 치고, 전군 회군한다! 서주는…다음에 다시 온다!' },
    { speaker: '내레이션', text: '조조의 대군이 썰물처럼 물러가기 시작했다.' },
    { speaker: '관우', text: '물러갑니다! 서주가…살았습니다!' },
  ],

  dogyeom_disband: [
    { speaker: '내레이션', text: '조조군이 완전히 물러가자, 도겸은 성문을 열고 유비 삼형제를 맞았다.' },
    { speaker: '도겸', text: '유 사군 덕분에 서주가 살았소. 이 은혜, 어찌 갚아야 할지 모르겠구려.' },
    { speaker: '유비', text: '당치 않습니다. 마땅히 해야 할 일을 했을 뿐입니다.' },
    { speaker: '도겸', text: '…실은 진작부터 생각해온 일이오. 이 서주, 그대가 맡아주지 않겠소?' },
    { speaker: '유비', text: '어찌 그런 말씀을! 도겸 어른께서 엄연히 계시는데, 제가 어찌 넘본단 말입니까.' },
    { speaker: '도겸', text: '…허허, 역시 사양하시는구려. 그대의 그런 마음이 더욱 미덥소. 이 이야기는 훗날 다시 하십시다.' },
    { speaker: '내레이션', text: '유비는 도겸의 청을 정중히 사양했으나, 서주와의 인연은 이렇게 시작되었다.' },
  ],

  // 자유탐방이 일정 기간 지나면 발동되는 도겸의 죽음과 유비의 서주 계승.
  // 삽화 한 장이 계속 화면을 덮은 채로 이어지는 하나의 연속된 장면이다.
  dogyeom_death: [
    { speaker: '내레이션', text: '서주에 자리를 잡은 지 얼마 지나지 않아, 도겸이 자리보전하고 눕고 말았다.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '전령', text: '유 사군! 도겸 어르신께서 위중하시다 합니다! 어서 처소로 와주십시오!', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '내레이션', text: '유비 삼형제가 서둘러 도겸의 처소로 향했다.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '도겸', text: '…어서 오셨구려, 유 사군. 이 늙은 몸이 이제 다한 모양이오.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '유비', text: '어른, 그런 말씀 마십시오! 어의를 불러오겠습니다!', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '도겸', text: '…허허, 이젠 의원도 소용없소. 그보다…', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '도겸', text: '전에 청했던 그 이야기, 다시 한 번 청하려 하오. 이 서주, 그대가 맡아주시오.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '미축', text: '사군, 도겸 어른의 뜻이 정녕 그러하십니다. 이제는 받아들이심이 옳을 듯합니다.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '관우', text: '형님, 도겸 어른의 마지막 청입니다. 부디 헤아려 주십시오.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '장비', text: '형님! 여기서까지 사양하면 도겸 어른 눈도 못 감으시겠수!', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '유비', text: '…알겠습니다. 어른의 뜻, 이 유비가 받들겠습니다.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '도겸', text: '…고맙소… 참으로… 고맙소…', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '내레이션', text: '그 말을 끝으로, 도겸은 편안히 눈을 감았다.', scene: 'assets/illust/dogyeom_deathbed.jpg' },
    { speaker: '내레이션', text: '서주 백성들은 새로운 주인, 유비를 맞이하게 되었다.' },
  ],
};
