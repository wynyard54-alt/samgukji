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

  let p, e, round, maxRounds, retreatAt, onEnd, locked;

  function maxHP(stats) { return Math.round(60 + stats.def * 2); }

  function initFighter(charData, startHp) {
    const mh = maxHP(charData.stats);
    return {
      data: charData,
      hp: startHp != null ? Math.max(0, Math.min(mh, startHp)) : mh,
      maxHp: mh,
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
      p.gauge >= 100 ? `필살공격: ${(p.data.skills && p.data.skills[0]) || '필살공격'} (4)` : `필살공격 (기력 ${Math.floor(p.gauge)}%) (4)`;

    if (!locked) {
      const attackBtn = actionsEl.querySelector('[data-action="attack"]');
      if (attackBtn) attackBtn.focus();
    }
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
    const side = attacker === p ? 'player' : 'enemy';
    const oppSide = side === 'player' ? 'enemy' : 'player';

    if (mode === 'attack' && evasionRoll(defender.data.stats.spd, attacker.data.stats.spd)) {
      log(`${defender.data.name}이(가) ${attacker.data.name}의 공격을 회피했다!`);
      BattleEvents.emit('dodge', {
        attackerSide: side, defenderSide: oppSide,
        attackerId: attacker.data.id, defenderId: defender.data.id,
      });
      return;
    }
    let base = attacker.data.stats.atk * 0.6 - defender.data.stats.def * 0.3;
    base = Math.max(attacker.data.stats.atk * 0.2, base);
    let mult = mode === 'ultimate' ? 2.3 : 1.3;
    const variance = 0.85 + Math.random() * 0.3;
    let dmg = Math.round(base * mult * variance);
    if (defender.defending && mode !== 'ultimate') dmg = Math.round(dmg * 0.55);
    defender.hp -= dmg;
    const skillName = mode === 'ultimate' ? (attacker.data.skills && attacker.data.skills[0]) || '필살공격' : null;
    log(mode === 'ultimate'
      ? `${attacker.data.name}의 필살공격 【${skillName}】! ${defender.data.name}에게 ${dmg} 피해!`
      : `${attacker.data.name}의 공격! ${defender.data.name}에게 ${dmg} 피해.`);
    BattleEvents.emit('hit', {
      attackerSide: side, defenderSide: oppSide,
      attackerId: attacker.data.id, defenderId: defender.data.id,
      damage: dmg, isUltimate: mode === 'ultimate', skillName,
    });
  }

  function actGeneric(actor, opponent, action) {
    if (actor.hp <= 0) return;
    const side = actor === p ? 'player' : 'enemy';
    if (action === 'attack') {
      actor.gauge += 12;
      dealDamage(actor, opponent, 'attack');
    } else if (action === 'defend') {
      actor.defending = true;
      actor.gauge += 20;
      log(`${actor.data.name}이(가) 방어 태세를 갖췄다.`);
      BattleEvents.emit('defend', { side, actorId: actor.data.id });
    } else if (action === 'skill') {
      actor.gauge += 8;
      const heal = Math.round(actor.maxHp * 0.05);
      actor.hp = Math.min(actor.maxHp, actor.hp + heal);
      log(`${actor.data.name}이(가) 특기를 사용해 숨을 골랐다. (HP +${heal})`);
      BattleEvents.emit('special', { side, actorId: actor.data.id, heal });
    } else if (action === 'ultimate') {
      actor.gauge = 0;
      const skillName = (actor.data.skills && actor.data.skills[0]) || '필살공격';
      BattleEvents.emit('ultimateStart', { side, actorId: actor.data.id, skillName });
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

  function emitStatus() {
    BattleEvents.emit('hpChange', { side: 'player', actorId: p.data.id, hp: Math.max(0, p.hp), maxHp: p.maxHp });
    BattleEvents.emit('hpChange', { side: 'enemy', actorId: e.data.id, hp: Math.max(0, e.hp), maxHp: e.maxHp });
    BattleEvents.emit('gaugeChange', { side: 'player', actorId: p.data.id, gauge: Math.min(100, p.gauge) });
    BattleEvents.emit('gaugeChange', { side: 'enemy', actorId: e.data.id, gauge: Math.min(100, e.gauge) });
  }

  function resolveRound(playerAction) {
    if (locked) return;
    locked = true;
    p.defending = false; e.defending = false;
    const eAction = enemyChoose();

    BattleEvents.emit('actionStart', { side: 'player', action: playerAction, actorId: p.data.id });
    BattleEvents.emit('actionStart', { side: 'enemy', action: eAction, actorId: e.data.id });

    const order = p.data.stats.spd >= e.data.stats.spd ? ['p', 'e'] : ['e', 'p'];
    for (const who of order) {
      if (who === 'p') { if (p.hp > 0) actGeneric(p, e, playerAction); }
      else { if (e.hp > 0) actGeneric(e, p, eAction); }
      if (p.hp <= 0 || e.hp <= 0) break;
    }

    round++;
    const retreatReady = retreatAt != null && e.hp > 0 && e.hp <= e.maxHp * retreatAt;
    const battleEnding = p.hp <= 0 || e.hp <= 0 || retreatReady || (maxRounds && round >= maxRounds);
    if (!battleEnding) locked = false; // render()가 disabled 상태를 계산하기 전에 풀어야 필살공격 버튼이 실제로 눌린다
    render();
    emitStatus();
    BattleEvents.emit('roundEnd', { round });

    if (p.hp <= 0) { finish('lose'); return; }
    if (e.hp <= 0) { finish('win'); return; }
    if (retreatReady) { finish('retreat'); return; }
    if (maxRounds && round >= maxRounds) { finish('scripted-end'); return; }
  }

  function finish(outcome) {
    // hold: 연출 레이어가 battleEnd 리스너 안에서 동기적으로 payload.hold(ms)를
    // 늘려두면, 승리/패배 연출이 끝날 때까지 화면이 안 닫히고 기다려준다.
    // 아무도 손대지 않으면 기존과 동일하게 즉시 닫힘(hold 기본값 0).
    const payload = {
      outcome, playerId: p.data.id, enemyId: e.data.id,
      playerHp: Math.max(0, p.hp), enemyHp: Math.max(0, e.hp),
      hold: 0,
    };
    BattleEvents.emit('battleEnd', payload);
    setTimeout(() => {
      screen.classList.add('hidden');
      const cb = onEnd;
      onEnd = null;
      if (cb) cb({ outcome, playerHp: Math.max(0, p.hp), playerMaxHp: p.maxHp });
    }, Math.max(0, payload.hold));
  }

  function start(opts) {
    p = initFighter(opts.player, opts.startHp);
    e = initFighter(opts.enemy);
    round = 0;
    maxRounds = opts.maxRounds || null;
    retreatAt = opts.retreatAt || null;
    onEnd = opts.onEnd;
    locked = false;
    screen.classList.remove('hidden');
    log(`— ${e.data.name}와(과)의 일기토 시작 —`);
    render();
    BattleEvents.emit('battleStart', { player: p.data, enemy: e.data, playerMaxHp: p.maxHp, enemyMaxHp: e.maxHp });
    emitStatus();
  }

  actionsEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn || btn.disabled) return;
    resolveRound(btn.dataset.action);
  });

  const KEY_ACTION = { '1': 'attack', '2': 'defend', '3': 'skill', '4': 'ultimate' };
  window.addEventListener('keydown', (ev) => {
    if (screen.classList.contains('hidden')) return;
    const action = KEY_ACTION[ev.key];
    if (!action) return;
    const btn = actionsEl.querySelector(`[data-action="${action}"]`);
    if (btn && !btn.disabled) { ev.preventDefault(); resolveRound(action); }
  });

  return { start, maxHP };
})();
