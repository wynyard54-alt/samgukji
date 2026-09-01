const Battle = (function () {
  const screen = document.getElementById('battle-screen');
  const logEl = document.getElementById('battle-log');
  const actionsEl = document.getElementById('battle-actions');

  const pPortrait = document.getElementById('battle-p-portrait');
  const pName = document.getElementById('battle-p-name');
  const pHpFill = document.getElementById('battle-p-hpfill');
  const pHpText = document.getElementById('battle-p-hptext');
  const pGaugeFill = document.getElementById('battle-p-gaugefill');

  const ePortrait = document.getElementById('battle-e-portrait');
  const eName = document.getElementById('battle-e-name');
  const eHpFill = document.getElementById('battle-e-hpfill');
  const eHpText = document.getElementById('battle-e-hptext');
  const eGaugeFill = document.getElementById('battle-e-gaugefill');

  let p, e, round, maxRounds, onEnd, locked;

  function maxHP(stats) { return Math.round(80 + stats.def * 0.5); }

  function initFighter(charData) {
    return {
      data: charData,
      hp: maxHP(charData.stats),
      maxHp: maxHP(charData.stats),
      gauge: 0,
      defending: false,
    };
  }

  function log(msg) {
    const li = document.createElement('div');
    li.textContent = msg;
    logEl.appendChild(li);
    logEl.scrollTop = logEl.scrollHeight;
    while (logEl.children.length > 40) logEl.removeChild(logEl.firstChild);
  }

  function render() {
    pName.textContent = p.data.name;
    pPortrait.style.background = colorFor(p.data.id);
    pPortrait.textContent = p.data.name[0];
    pHpFill.style.width = Math.max(0, (p.hp / p.maxHp) * 100) + '%';
    pHpText.textContent = `${Math.max(0, p.hp)} / ${p.maxHp}`;
    pGaugeFill.style.width = Math.min(100, p.gauge) + '%';

    eName.textContent = e.data.name;
    ePortrait.style.background = colorFor(e.data.id);
    ePortrait.textContent = e.data.name[0];
    eHpFill.style.width = Math.max(0, (e.hp / e.maxHp) * 100) + '%';
    eHpText.textContent = `${Math.max(0, e.hp)} / ${e.maxHp}`;
    eGaugeFill.style.width = Math.min(100, e.gauge) + '%';

    document.getElementById('btn-ultimate').disabled = p.gauge < 100 || locked;
    document.getElementById('btn-ultimate').textContent =
      p.gauge >= 100 ? `필살기: ${(p.data.skills && p.data.skills[0]) || '필살기'}` : `필살기 (기력 ${Math.floor(p.gauge)}%)`;
  }

  function colorFor(id) {
    const palette = { gwanwoo: '#2f6d3f', jangbi: '#8a3b2a' };
    if (palette[id]) return palette[id];
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
    return `hsl(${h},45%,38%)`;
  }

  function evasionRoll(defenderSpd, attackerSpd) {
    const chance = Math.max(0, Math.min(35, (defenderSpd - attackerSpd) * 0.3 + 5));
    return Math.random() * 100 < chance;
  }

  function dealDamage(attacker, defender, mode) {
    if (mode === 'attack' && evasionRoll(defender.data.stats.spd, attacker.data.stats.spd)) {
      log(`${defender.data.name}이(가) ${attacker.data.name}의 공격을 회피했다!`);
      return;
    }
    let base = attacker.data.stats.atk - defender.data.stats.def * 0.5;
    base = Math.max(5, base);
    let mult = mode === 'ultimate' ? 2.2 : 1.3;
    const variance = 0.85 + Math.random() * 0.3;
    let dmg = Math.round(base * mult * variance);
    if (defender.defending && mode !== 'ultimate') dmg = Math.round(dmg * 0.55);
    defender.hp -= dmg;
    const skillName = mode === 'ultimate' ? (attacker.data.skills && attacker.data.skills[0]) || '필살기' : null;
    log(mode === 'ultimate'
      ? `${attacker.data.name}의 필살기 【${skillName}】! ${defender.data.name}에게 ${dmg} 피해!`
      : `${attacker.data.name}의 공격! ${defender.data.name}에게 ${dmg} 피해.`);
  }

  function actGeneric(actor, opponent, action) {
    if (actor.hp <= 0) return;
    if (action === 'attack') {
      actor.gauge += 12;
      dealDamage(actor, opponent, 'attack');
    } else if (action === 'defend') {
      actor.defending = true;
      actor.gauge += 20;
      log(`${actor.data.name}이(가) 방어 태세를 갖췄다.`);
    } else if (action === 'skill') {
      actor.gauge += 8;
      const heal = Math.round(actor.maxHp * 0.05);
      actor.hp = Math.min(actor.maxHp, actor.hp + heal);
      log(`${actor.data.name}이(가) 특기를 사용해 숨을 골랐다. (HP +${heal})`);
    } else if (action === 'ultimate') {
      actor.gauge = 0;
      dealDamage(actor, opponent, 'ultimate');
    }
  }

  function enemyChoose() {
    if (e.gauge >= 100 && Math.random() < 0.6) return 'ultimate';
    if (e.hp / e.maxHp < 0.3 && Math.random() < 0.5) return 'defend';
    const r = Math.random();
    if (r < 0.65) return 'attack';
    if (r < 0.85) return 'skill';
    return 'defend';
  }

  function resolveRound(playerAction) {
    if (locked) return;
    locked = true;
    p.defending = false; e.defending = false;
    const eAction = enemyChoose();

    const order = p.data.stats.spd >= e.data.stats.spd ? ['p', 'e'] : ['e', 'p'];
    for (const who of order) {
      if (who === 'p') { if (p.hp > 0) actGeneric(p, e, playerAction); }
      else { if (e.hp > 0) actGeneric(e, p, eAction); }
      if (p.hp <= 0 || e.hp <= 0) break;
    }

    round++;
    render();

    if (p.hp <= 0) { finish('lose'); return; }
    if (e.hp <= 0) { finish('win'); return; }
    if (maxRounds && round >= maxRounds) { finish('scripted-end'); return; }
    locked = false;
  }

  function finish(outcome) {
    screen.classList.add('hidden');
    const cb = onEnd;
    onEnd = null;
    if (cb) cb({ outcome });
  }

  function start(opts) {
    p = initFighter(opts.player);
    e = initFighter(opts.enemy);
    round = 0;
    maxRounds = opts.maxRounds || null;
    onEnd = opts.onEnd;
    locked = false;
    screen.classList.remove('hidden');
    log(`— ${e.data.name}와(과)의 일기토 시작 —`);
    render();
  }

  actionsEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn || btn.disabled) return;
    resolveRound(btn.dataset.action);
  });

  return { start };
})();
