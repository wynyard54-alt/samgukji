const Dialogue = (function () {
  const box = document.getElementById('dialogue-box');
  const nameEl = document.getElementById('dialogue-name');
  const textEl = document.getElementById('dialogue-text');
  const nextHint = document.getElementById('dialogue-next');

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

  function render() {
    const line = queue[idx];
    nameEl.textContent = line.speaker;
    nameEl.dataset.kind = line.speaker === '내레이션' ? 'narration' : 'speech';
    textEl.textContent = line.text;
    nextHint.textContent = idx < queue.length - 1 ? '▼ 클릭 또는 Enter로 계속' : '▼ 클릭 또는 Enter로 닫기';
  }

  function advance() {
    if (!active) return;
    idx++;
    if (idx >= queue.length) {
      active = false;
      box.classList.add('hidden');
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
