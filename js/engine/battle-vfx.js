// BattleVFX: BattleEvents를 구독해 전투 계산과 독립적으로 연출만 담당한다.
// BASE 3b3524f에서 제작, 7a77e26의 battleEnd payload.hold와 호환.
// 실제 캐릭터 PNG가 추가되면 CHARACTER_ART의 src만 연결하면 된다.
const BattleVFX = (function () {
  const screen = document.getElementById('battle-screen');
  if (!screen || typeof BattleEvents === 'undefined') return { init(){} };

  const CHARACTER_ART = {
    gwanwoo: { glyph: '關', weapon: '靑龍偃月刀', title: '미염공 관우', className: 'hero-green', src: 'assets/battle/duel_gwanwoo.png' },
    hwaung:  { glyph: '華', weapon: '長槍', title: '서량의 맹장 화웅', className: 'enemy-red', src: 'assets/battle/duel_hwaung.png' },
    yeopo:   { glyph: '呂', weapon: '方天畫戟', title: '비장 여포', className: 'enemy-red', src: 'assets/battle/duel_yeopo.png' },
  };

  let arena, playerActor, enemyActor, fxLayer, cutin, banner;
  let timers = [];

  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers(){ timers.forEach(clearTimeout); timers = []; }

  function ensureDOM() {
    if (arena) return;
    arena = document.createElement('div');
    arena.id = 'duel-arena';
    arena.innerHTML = `
      <div class="duel-sky"><span></span><span></span><span></span></div>
      <div class="duel-mountains"></div>
      <div class="duel-ground"><div class="duel-dust"></div></div>
      <div class="duel-versus-mark">一 騎 討</div>
      <div class="duel-actor player" id="duel-player-actor">
        <div class="duel-shadow"></div><div class="duel-horse"><i></i></div>
        <div class="duel-body"><div class="duel-plume"></div><div class="duel-head"></div><div class="duel-torso"></div><div class="duel-weapon"></div><b class="duel-glyph"></b></div>
        <div class="duel-actor-label"></div>
      </div>
      <div class="duel-actor enemy" id="duel-enemy-actor">
        <div class="duel-shadow"></div><div class="duel-horse"><i></i></div>
        <div class="duel-body"><div class="duel-plume"></div><div class="duel-head"></div><div class="duel-torso"></div><div class="duel-weapon"></div><b class="duel-glyph"></b></div>
        <div class="duel-actor-label"></div>
      </div>
      <div id="duel-fx-layer"></div>
      <div id="duel-cutin" class="hidden"><div class="cutin-glyph"></div><div class="cutin-copy"><small></small><strong></strong></div></div>
      <div id="duel-banner" class="hidden"></div>`;
    screen.insertBefore(arena, screen.firstChild);
    playerActor = arena.querySelector('#duel-player-actor');
    enemyActor = arena.querySelector('#duel-enemy-actor');
    fxLayer = arena.querySelector('#duel-fx-layer');
    cutin = arena.querySelector('#duel-cutin');
    banner = arena.querySelector('#duel-banner');
  }

  function artFor(id, data) {
    return CHARACTER_ART[id] || { glyph: (data?.name || '?')[0], weapon: '兵器', title: data?.name || id, className: 'generic' };
  }

  function setActor(el, data) {
    const art = artFor(data.id, data);
    el.dataset.id = data.id;
    el.classList.remove('hero-green','enemy-red','generic','raster-art','attack','hit','dodge','guard','special','ultimate');
    el.classList.add(art.className);
    el.classList.toggle('raster-art', !!art.src);
    el.querySelector('.duel-body').style.backgroundImage = art.src ? `url("${art.src}")` : '';
    el.querySelector('.duel-glyph').textContent = art.glyph;
    el.querySelector('.duel-actor-label').textContent = data.name;
    el.querySelector('.duel-weapon').dataset.weapon = art.weapon;
  }

  function actor(side){ return side === 'player' ? playerActor : enemyActor; }
  function opponent(side){ return side === 'player' ? enemyActor : playerActor; }
  function pulseClass(el, cls, ms=420){
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    later(()=>el.classList.remove(cls), ms);
  }

  function floatText(side, text, cls='damage') {
    const el = document.createElement('div');
    el.className = `duel-float ${cls} ${side}`;
    el.textContent = text;
    fxLayer.appendChild(el);
    later(()=>el.remove(), 950);
  }

  function slash(side, ultimate=false) {
    const el = document.createElement('div');
    el.className = `duel-slash ${side}${ultimate ? ' ultimate' : ''}`;
    fxLayer.appendChild(el);
    later(()=>el.remove(), ultimate ? 700 : 450);
  }

  function impact(side, ultimate=false) {
    const el = document.createElement('div');
    el.className = `duel-impact ${side}${ultimate ? ' ultimate' : ''}`;
    el.innerHTML = '<i></i><i></i><i></i><i></i>';
    fxLayer.appendChild(el);
    screen.classList.add(ultimate ? 'duel-shake-heavy' : 'duel-shake');
    later(()=>{ el.remove(); screen.classList.remove('duel-shake','duel-shake-heavy'); }, ultimate ? 650 : 360);
  }

  function onBattleStart({player, enemy}) {
    ensureDOM(); clearTimers();
    setActor(playerActor, player); setActor(enemyActor, enemy);
    arena.classList.remove('arena-enter'); void arena.offsetWidth; arena.classList.add('arena-enter');
    banner.textContent = `${player.name}  VS  ${enemy.name}`;
    banner.classList.remove('hidden');
    later(()=>banner.classList.add('hidden'), 1050);
  }

  function onHit(ev) {
    const a = actor(ev.attackerSide), d = actor(ev.defenderSide);
    pulseClass(a, ev.isUltimate ? 'ultimate' : 'attack', ev.isUltimate ? 700 : 430);
    later(()=>{
      slash(ev.attackerSide, ev.isUltimate);
      pulseClass(d, 'hit', ev.isUltimate ? 650 : 380);
      impact(ev.defenderSide, ev.isUltimate);
      floatText(ev.defenderSide, `-${ev.damage}`, ev.isUltimate ? 'damage ultimate' : 'damage');
    }, ev.isUltimate ? 170 : 90);
  }

  function onDodge(ev) {
    pulseClass(actor(ev.attackerSide), 'attack', 400);
    later(()=>{
      pulseClass(actor(ev.defenderSide), 'dodge', 520);
      floatText(ev.defenderSide, '회피!', 'dodge-text');
    }, 90);
  }

  function onDefend(ev){ pulseClass(actor(ev.side), 'guard', 650); floatText(ev.side, '방어!', 'guard-text'); }
  function onSpecial(ev){ pulseClass(actor(ev.side), 'special', 720); floatText(ev.side, `+${ev.heal}`, 'heal'); }

  function onUltimateStart(ev) {
    const el = actor(ev.side);
    const id = ev.actorId;
    const data = (typeof ROSTER !== 'undefined' && ROSTER[id]) || {name:id};
    const art = artFor(id, data);
    cutin.querySelector('.cutin-glyph').textContent = art.glyph;
    cutin.querySelector('.cutin-copy small').textContent = data.name || id;
    cutin.querySelector('.cutin-copy strong').textContent = ev.skillName || '필살공격';
    cutin.className = ev.side;
    screen.classList.add('ultimate-dim');
    pulseClass(el, 'charge', 750);
    later(()=>{ cutin.classList.add('hidden'); screen.classList.remove('ultimate-dim'); }, 720);
  }

  function onGauge({side,gauge}) {
    const el = actor(side); if (!el) return;
    el.classList.toggle('gauge-ready', gauge >= 100);
  }

  function onBattleEnd(ev) {
    // Claude BASE 7a77e26+: battleEnd payload의 hold 값을 늘리면
    // 기존 전투 로직을 건드리지 않고 종료 연출 시간을 확보할 수 있다.
    if (ev && typeof ev === 'object' && 'hold' in ev) ev.hold = Math.max(Number(ev.hold) || 0, 1900);

    const won = ev.outcome === 'win';
    const lost = ev.outcome === 'lose';
    const scripted = ev.outcome === 'scripted-end';
    const loser = won ? enemyActor : (lost ? playerActor : null);
    const winner = won ? playerActor : (lost ? enemyActor : null);

    if (loser) {
      later(() => loser.classList.add('duel-defeated'), 120);
    }
    if (winner) {
      later(() => winner.classList.add('duel-victor'), 260);
    }

    later(() => {
      banner.classList.remove('hidden');
      if (won) {
        const p = (typeof ROSTER !== 'undefined' && ROSTER[ev.playerId]) || {name:'승자'};
        banner.innerHTML = `<span class="duel-result-main">${p.name} 승리!</span><small>一 騎 當 千</small>`;
      } else if (lost) {
        banner.innerHTML = `<span class="duel-result-main">패배</span><small>다시 힘을 길러 도전하자</small>`;
      } else if (scripted) {
        banner.innerHTML = `<span class="duel-result-main">승부 종료</span>`;
      }
      banner.classList.add('duel-result');
    }, 520);

    // 사수관 관우 vs 화웅 전용 한 줄. 다른 전투에는 노출하지 않는다.
    if (won && ev.playerId === 'gwanwoo' && ev.enemyId === 'hwaung') {
      later(() => {
        const quote = document.createElement('div');
        quote.className = 'duel-victory-quote';
        quote.textContent = '술이 아직 식지 않았소.';
        fxLayer.appendChild(quote);
        later(() => quote.remove(), 950);
      }, 900);
    }
  }

  ensureDOM();
  BattleEvents.on('battleStart', onBattleStart);
  BattleEvents.on('hit', onHit);
  BattleEvents.on('dodge', onDodge);
  BattleEvents.on('defend', onDefend);
  BattleEvents.on('special', onSpecial);
  BattleEvents.on('ultimateStart', onUltimateStart);
  BattleEvents.on('gaugeChange', onGauge);
  BattleEvents.on('battleEnd', onBattleEnd);

  return { init: ensureDOM };
})();
