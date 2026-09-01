// 타일: 0=잔디 1=길 2=건물(막힘) 3=물(막힘) 4=나무(막힘)
function rectFill(grid, x0, y0, x1, y1, v) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = v;
}

function makeGrid(w, h, base) {
  const g = [];
  for (let y = 0; y < h; y++) g.push(new Array(w).fill(base));
  return g;
}

const MAPS = {};

// ---------------- 탁현 ----------------
(function () {
  const w = 14, h = 10;
  const grid = makeGrid(w, h, 0);
  rectFill(grid, 0, 0, w - 1, 0, 4);
  rectFill(grid, 0, h - 1, w - 1, h - 1, 4);
  rectFill(grid, 0, 0, 0, h - 1, 4);
  rectFill(grid, w - 1, 0, w - 1, h - 1, 4);
  rectFill(grid, 2, 4, 4, 5, 2); // 유비 진영 막사
  rectFill(grid, 9, 2, 11, 3, 2); // 서당(노식)
  rectFill(grid, 6, 7, 7, 8, 3); // 작은 연못
  for (let x = 1; x < w - 1; x++) grid[6][x] = 1; // 큰 길

  MAPS.takhyeon = {
    name: '탁현',
    width: w, height: h,
    tiles: grid,
    playerStart: { x: 6, y: 5 },
    npcs: [
      { id: 'yubi', x: 3, y: 6, label: '유비' },
      { id: 'chujeong', x: 5, y: 3, label: '추정' },
      { id: 'noshik', x: 10, y: 5, label: '노식' },
      { id: 'yuwongi', x: 8, y: 6, label: '유원기' },
      { id: 'sossangJangsepyeong', x: 11, y: 7, label: '소쌍·장세평' },
      { id: 'gongyung', x: 2, y: 2, label: '공융' },
      { id: 'deungmu', x: 12, y: 8, label: '등무(황건적)' },
    ],
  };
})();

// ---------------- 평원현 ----------------
(function () {
  const w = 14, h = 10;
  const grid = makeGrid(w, h, 0);
  rectFill(grid, 0, 0, w - 1, 0, 4);
  rectFill(grid, 0, h - 1, w - 1, h - 1, 4);
  rectFill(grid, 0, 0, 0, h - 1, 4);
  rectFill(grid, w - 1, 0, w - 1, h - 1, 4);
  rectFill(grid, 2, 2, 4, 3, 2); // 관아
  rectFill(grid, 9, 6, 11, 7, 2); // 객잔
  for (let x = 1; x < w - 1; x++) grid[5][x] = 1;

  MAPS.pyeongwon = {
    name: '평원현',
    width: w, height: h,
    tiles: grid,
    playerStart: { x: 6, y: 5 },
    npcs: [
      { id: 'jeonhae', x: 3, y: 5, label: '전해' },
      { id: 'gwanjeong', x: 6, y: 2, label: '관정' },
      { id: 'eomgang', x: 9, y: 3, label: '엄강' },
      { id: 'jowoon', x: 12, y: 6, label: '조운(?)' },
      { id: 'mijuk', x: 10, y: 7, label: '미축' },
      { id: 'mibang', x: 11, y: 7, label: '미방' },
      { id: 'songgeon', x: 2, y: 7, label: '손건' },
      { id: 'ganong', x: 3, y: 8, label: '간옹' },
      { id: 'jindeung', x: 8, y: 8, label: '진등' },
    ],
  };
})();
