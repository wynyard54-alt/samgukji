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

  function show(lines, cb) {
    queue = lines;
    idx = 0;
    onDone = cb || null;
    active = true;
    box.classList.remove('hidden');
    render();
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
    nextHint.textContent = idx < queue.length - 1 ? '▼ 클릭 또는 Enter로 계속' : '▼ 클릭 또는 Enter로 닫기';
    setScene(line.scene);
  }

  function advance() {
    if (!active) return;
    idx++;
    if (idx >= queue.length) {
      active = false;
      box.classList.add('hidden');
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
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); advance(); }
  });

  return { show, isActive: () => active };
})();
