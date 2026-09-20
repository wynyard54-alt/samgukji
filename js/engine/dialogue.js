const Dialogue = (function () {
  const box = document.getElementById('dialogue-box');
  const nameEl = document.getElementById('dialogue-name');
  const textEl = document.getElementById('dialogue-text');
  const nextHint = document.getElementById('dialogue-next');
  const viewport = document.getElementById('explore-viewport');
  const sceneEl = document.getElementById('scene-illustration');
  const sceneImg = document.getElementById('scene-illustration-img');

  let queue = [];
  let idx = 0;
  let onDone = null;
  let active = false;
  let autoLocked = false; // line.holdMs로 자동 노출 중인 대사는 클릭/Enter로 넘길 수 없게 막는다
  let autoTimer = null;
  const FADE_MS = 500;

  // 기록(로그) 버튼에서 다시 볼 수 있도록, 실제로 화면에 표시된 대사를 순서대로 남겨둔다.
  const history = [];
  const HISTORY_MAX = 50;
  function recordHistory(line) {
    history.push({ speaker: line.speaker, text: line.text });
    if (history.length > HISTORY_MAX) history.shift();
  }

  function show(lines, cb) {
    queue = lines;
    idx = 0;
    onDone = cb || null;
    active = true;
    clearAutoTimer();
    autoLocked = false;
    box.classList.remove('hidden', 'fading');
    if (sceneEl) sceneEl.classList.remove('fading');
    render();
  }

  function clearAutoTimer() {
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
  }

  // 특정 대사 구간 동안에는 지도 대신 컷신 삽화를 보여준다 (line.scene에 이미지 경로가 있을 때만).
  function setScene(src) {
    if (!sceneEl) return;
    if (src) {
      sceneImg.src = src;
      sceneEl.classList.remove('hidden');
      if (viewport) viewport.classList.add('scene-active');
    } else {
      sceneEl.classList.add('hidden');
      if (viewport) viewport.classList.remove('scene-active');
    }
  }

  // holdMs 대사가 페이드아웃(opacity:0)까지 끝낸 뒤 다음 줄로 넘어갈 때, 그냥
  // classList.remove('fading')만 하면 opacity:0 -> 1로 값이 바뀌는 것 자체가
  // 같은 transition:opacity 규칙을 다시 타서 새 삽화가 순간적으로 나타나지
  // 않고 또 500ms에 걸쳐 서서히 나타나 버린다(의도한 holdMs보다 훨씬 길게
  // 화면이 어두운 상태로 남는 "이중 페이드" 버그). transition을 잠깐 꺼서
  // 다음 줄은 항상 즉시 100% 불투명하게 나타나게 하고, 그 다음 이 줄
  // 자신이 holdMs로 다시 페이드아웃할 때만 transition이 정상 작동하게 한다.
  function snapVisible(el) {
    if (!el) return;
    el.classList.add('no-transition');
    el.classList.remove('fading');
    void el.offsetWidth; // 강제 리플로우로 transition:none을 실제로 적용시킨 뒤에 클래스를 뗀다.
    el.classList.remove('no-transition');
  }

  function render() {
    const line = queue[idx];
    nameEl.textContent = line.speaker;
    nameEl.dataset.kind = line.speaker === '내레이션' ? 'narration' : 'speech';
    textEl.textContent = line.text;
    recordHistory(line);
    setScene(line.scene);
    clearAutoTimer();
    snapVisible(box);
    snapVisible(sceneEl);
    if (line.holdMs) {
      // 클릭/Enter로 넘기지 못하고, 지정된 시간만큼 그대로 보여준 뒤 페이드아웃하며 자동으로 넘어간다.
      autoLocked = true;
      nextHint.textContent = '';
      const waitMs = Math.max(0, line.holdMs - FADE_MS);
      autoTimer = setTimeout(() => {
        box.classList.add('fading');
        if (sceneEl) sceneEl.classList.add('fading');
        autoTimer = setTimeout(() => { autoLocked = false; advance(); }, FADE_MS);
      }, waitMs);
    } else {
      autoLocked = false;
      nextHint.textContent = idx < queue.length - 1 ? '▼ 클릭 또는 Enter로 계속' : '▼ 클릭 또는 Enter로 닫기';
    }
  }

  function advance() {
    if (!active || autoLocked) return;
    clearAutoTimer();
    idx++;
    if (idx >= queue.length) {
      active = false;
      box.classList.add('hidden');
      box.classList.remove('fading');
      setScene(null);
      const cb = onDone;
      onDone = null;
      if (cb) cb();
      return;
    }
    render();
  }

  box.addEventListener('click', advance);

  window.addEventListener('keydown', (ev) => {
    if (!active) return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      // 이 키 입력은 "대화를 닫는다"로만 처리한다. stopImmediatePropagation을 안 하면
      // advance()가 대화를 닫아 Dialogue.isActive()가 곧장 false가 되고, 같은 키 입력을
      // mapview.js의 keydown 리스너가 이어서 받아 인접한 인물과 새 대화를 즉시 열어버려
      // "누르자마자 대화가 다시 뜨는" 것처럼 보인다.
      ev.stopImmediatePropagation();
      advance();
    }
  });

  return { show, isActive: () => active, getHistory: () => history.slice() };
})();
