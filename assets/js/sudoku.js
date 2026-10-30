/**
 * sudoku.js — puzzle engine.
 *
 * Pure functions only: no DOM, no globals. Everything here works on plain
 * 9x9 arrays of numbers, where 0 means "empty cell".
 */

export const GRID_SIZE = 9;
const BOX_SIZE = 3;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;

/** Clue counts per level. Fewer clues means a harder puzzle. */
export const DIFFICULTIES = {
  easy: { label: 'Easy', clues: 45 },
  medium: { label: 'Medium', clues: 36 },
  hard: { label: 'Hard', clues: 30 },
  expert: { label: 'Expert', clues: 26 },
};

/** Creates a 9x9 grid filled with zeros. */
export function createGrid() {
  return Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(0));
}

/** Deep copies a grid. */
export function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

/**
 * Checks whether `value` may be placed at (row, col) without repeating a
 * digit in its row, column or 3x3 box. The target cell is ignored.
 */
export function isSafe(grid, row, col, value) {
  for (let i = 0; i < GRID_SIZE; i += 1) {
    if (grid[row][i] === value || grid[i][col] === value) return false;
  }

  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let r = boxRow; r < boxRow + BOX_SIZE; r += 1) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c += 1) {
      if (grid[r][c] === value) return false;
    }
  }

  return true;
}

/** Fisher-Yates shuffle, returns a new array. */
function shuffle(items) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Randomised backtracking fill. Mutates `grid`, returns success flag. */
function fillGrid(grid) {
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    if (grid[row][col] !== 0) continue;

    const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const value of candidates) {
      if (!isSafe(grid, row, col, value)) continue;
      grid[row][col] = value;
      if (fillGrid(grid)) return true;
      grid[row][col] = 0;
    }
    return false;
  }
  return true;
}

/**
 * Counts solutions of `grid`, stopping as soon as `limit` is reached.
 * Used to guarantee a puzzle has exactly one solution.
 */
export function countSolutions(grid, limit = 2) {
  const work = cloneGrid(grid);
  let found = 0;

  const search = () => {
    let bestRow = -1;
    let bestCol = -1;
    let bestCandidates = null;

    // Minimum-remaining-values heuristic keeps this fast enough for the browser.
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if (work[row][col] !== 0) continue;
        const candidates = [];
        for (let value = 1; value <= GRID_SIZE; value += 1) {
          if (isSafe(work, row, col, value)) candidates.push(value);
        }
        if (candidates.length === 0) return;
        if (!bestCandidates || candidates.length < bestCandidates.length) {
          bestRow = row;
          bestCol = col;
          bestCandidates = candidates;
          if (candidates.length === 1) break;
        }
      }
      if (bestCandidates && bestCandidates.length === 1) break;
    }

    if (bestCandidates === null) {
      found += 1;
      return;
    }

    for (const value of bestCandidates) {
      work[bestRow][bestCol] = value;
      search();
      work[bestRow][bestCol] = 0;
      if (found >= limit) return;
    }
  };

  search();
  return found;
}

/**
 * Builds a puzzle for the given difficulty.
 * @returns {{puzzle: number[][], solution: number[][]}}
 */
export function generatePuzzle(difficulty = 'medium') {
  const targetClues = DIFFICULTIES[difficulty]?.clues ?? DIFFICULTIES.medium.clues;

  const solution = createGrid();
  fillGrid(solution);

  const puzzle = cloneGrid(solution);
  const positions = shuffle([...Array(CELL_COUNT).keys()]);
  let clues = CELL_COUNT;

  for (const position of positions) {
    if (clues <= targetClues) break;

    const row = Math.floor(position / GRID_SIZE);
    const col = position % GRID_SIZE;
    const removed = puzzle[row][col];
    if (removed === 0) continue;

    puzzle[row][col] = 0;
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[row][col] = removed; // removing it would allow a second solution
    } else {
      clues -= 1;
    }
  }

  return { puzzle, solution };
}

/** Returns the list of digit conflicts currently on the board. */
export function findConflicts(grid) {
  const conflicts = [];

  const isDuplicate = (cells) => {
    const seen = new Map();
    for (const [row, col] of cells) {
      const value = grid[row][col];
      if (value === 0) continue;
      if (seen.has(value)) {
        conflicts.push([row, col], seen.get(value));
      } else {
        seen.set(value, [row, col]);
      }
    }
  };

  for (let i = 0; i < GRID_SIZE; i += 1) {
    isDuplicate(Array.from({ length: GRID_SIZE }, (_, j) => [i, j]));
    isDuplicate(Array.from({ length: GRID_SIZE }, (_, j) => [j, i]));
  }

  for (let boxRow = 0; boxRow < GRID_SIZE; boxRow += BOX_SIZE) {
    for (let boxCol = 0; boxCol < GRID_SIZE; boxCol += BOX_SIZE) {
      const cells = [];
      for (let r = boxRow; r < boxRow + BOX_SIZE; r += 1) {
        for (let c = boxCol; c < boxCol + BOX_SIZE; c += 1) cells.push([r, c]);
      }
      isDuplicate(cells);
    }
  }

  return conflicts;
}

/** True when every cell matches the solution. */
export function isSolved(grid, solution) {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] !== solution[row][col]) return false;
    }
  }
  return true;
}
