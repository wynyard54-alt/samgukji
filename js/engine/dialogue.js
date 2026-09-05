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

  function render() {
    const line = queue[idx];
    nameEl.textContent = line.speaker;
    nameEl.dataset.kind = line.speaker === '내레이션' ? 'narration' : 'speech';
    textEl.textContent = line.text;
    recordHistory(line);
    setScene(line.scene);
    clearAutoTimer();
    box.classList.remove('fading');
    if (sceneEl) sceneEl.classList.remove('fading');
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
