// 전투 로직(battle.js)과 연출(비주얼/애니메이션)을 분리하기 위한 이벤트 버스.
// battle.js는 계산 결과만 emit하고, 연출 담당 코드는 여기 구독해서 화면을 그린다.
// battle.js의 밸런스/로직이 바뀌어도 이 이벤트 이름과 payload 모양만 유지되면
// 연출 쪽 코드는 깨지지 않는다.
const BattleEvents = (function () {
  const listeners = {};

  function on(name, fn) {
    (listeners[name] = listeners[name] || []).push(fn);
    return () => off(name, fn);
  }

  function off(name, fn) {
    if (!listeners[name]) return;
    listeners[name] = listeners[name].filter((f) => f !== fn);
  }

  function emit(name, payload) {
    (listeners[name] || []).forEach((fn) => {
      try { fn(payload); } catch (err) { console.error('[BattleEvents]', name, err); }
    });
  }

  return { on, off, emit };
})();
