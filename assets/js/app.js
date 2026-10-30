/**
 * app.js — UI layer for the Sudoku game.
 *
 * Owns game state, renders the board and wires up input (pointer, touch and
 * keyboard) plus sound. Puzzle logic lives in sudoku.js, audio in audio.js.
 */

import {
  GRID_SIZE,
  DIFFICULTIES,
  createGrid,
  cloneGrid,
  generatePuzzle,
  isSolved,
} from './sudoku.js';

import { play, unlock, setMuted, isMuted } from './audio.js';

const MAX_MISTAKES = 3;
const MAX_HINTS = 3;
const STORAGE_KEY = 'sudoku.game.v2';
const THEME_KEY = 'sudoku.theme';
const MUTE_KEY = 'sudoku.muted';

/* ---------- DOM references ---------- */

const els = {
  board: document.getElementById('board'),
  pad: document.getElementById('pad'),
  levels: document.getElementById('difficulties'),
  statDifficulty: document.getElementById('statDifficulty'),
  statTimer: document.getElementById('statTimer'),
  statMistakes: document.getElementById('statMistakes'),
  statHints: document.getElementById('statHints'),
  btnUndo: document.getElementById('btnUndo'),
  btnErase: document.getElementById('btnErase'),
  btnNotes: document.getElementById('btnNotes'),
  btnHint: document.getElementById('btnHint'),
  soundToggle: document.getElementById('soundToggle'),
  themeToggle: document.getElementById('themeToggle'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  modalText: document.getElementById('modalText'),
  modalPrimary: document.getElementById('modalPrimary'),
  modalSecondary: document.getElementById('modalSecondary'),
};

/* ---------- State ---------- */

const state = {
  puzzle: createGrid(),
  solution: createGrid(),
  board: createGrid(),
  notes: createNotesGrid(),
  hintsUsed: createGrid(),
  selected: null,
  difficulty: 'medium',
  mistakes: 0,
  hints: MAX_HINTS,
  seconds: 0,
  notesMode: false,
  status: 'playing', // 'playing' | 'won' | 'lost'
  history: [],
};

const cellElements = createGrid();
let timerId = null;

function createNotesGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => new Set()),
  );
}

/* ---------- Boot ---------- */

buildBoard();
buildNumberPad();
buildLevelButtons();
applySavedTheme();
applySavedSound();
bindEvents();

if (!restoreGame()) {
  startNewGame('medium', { silent: true });
}
render();

/* ---------- Board construction ---------- */

/** Builds nine boxes of nine cells, so the 3x3 rhythm comes from the layout. */
function buildBoard() {
  els.board.innerHTML = '';

  for (let box = 0; box < GRID_SIZE; box += 1) {
    const boxEl = document.createElement('div');
    boxEl.className = 'box';

    for (let i = 0; i < GRID_SIZE; i += 1) {
      const row = Math.floor(box / 3) * 3 + Math.floor(i / 3);
      const col = (box % 3) * 3 + (i % 3);

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute('role', 'gridcell');
      cell.addEventListener('click', () => selectCell(row, col));

      boxEl.appendChild(cell);
      cellElements[row][col] = cell;
    }

    els.board.appendChild(boxEl);
  }
}

function buildNumberPad() {
  els.pad.innerHTML = '';

  for (let value = 1; value <= GRID_SIZE; value += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pad__btn';
    button.dataset.value = String(value);
    button.setAttribute('aria-label', `Place ${value}`);
    button.innerHTML = `<span>${value}</span><span class="pad__count" data-count aria-hidden="true">9</span>`;
    button.addEventListener('click', () => placeValue(value));
    els.pad.appendChild(button);
  }
}

function buildLevelButtons() {
  els.levels.innerHTML = '';

  Object.entries(DIFFICULTIES).forEach(([key, config]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'level';
    button.dataset.difficulty = key;
    button.textContent = config.label;
    button.addEventListener('click', () => startNewGame(key));
    els.levels.appendChild(button);
  });
}

/* ---------- Game lifecycle ---------- */

function startNewGame(difficulty, { silent = false } = {}) {
  const { puzzle, solution } = generatePuzzle(difficulty);

  state.puzzle = puzzle;
  state.solution = solution;
  state.board = cloneGrid(puzzle);
  state.notes = createNotesGrid();
  state.hintsUsed = createGrid();
  state.selected = null;
  state.difficulty = difficulty;
  state.mistakes = 0;
  state.hints = MAX_HINTS;
  state.seconds = 0;
  state.notesMode = false;
  state.status = 'playing';
  state.history = [];

  hideModal();
  startTimer();
  render();
  saveGame();

  if (!silent) play('start');
}

function startTimer() {
  stopTimer();
  timerId = window.setInterval(() => {
    state.seconds += 1;
    els.statTimer.textContent = formatTime(state.seconds);
    if (state.seconds % 5 === 0) saveGame();
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/* ---------- Interaction ---------- */

function selectCell(row, col) {
  if (state.status !== 'playing') return;
  state.selected = { row, col };
  render();
}

function placeValue(value) {
  if (state.status !== 'playing' || !state.selected) return;

  const { row, col } = state.selected;
  if (state.puzzle[row][col] !== 0) return; // given cells are locked

  pushHistory(row, col);

  if (state.notesMode) {
    toggleNote(row, col, value);
    play('note');
  } else if (state.board[row][col] === value) {
    state.board[row][col] = 0; // tapping the same digit clears the cell
    play('erase');
  } else {
    commitValue(row, col, value);
  }

  render();
  saveGame();
}

function toggleNote(row, col, value) {
  if (state.board[row][col] !== 0) {
    state.board[row][col] = 0;
    state.notes[row][col].clear();
  }
  const notes = state.notes[row][col];
  if (notes.has(value)) notes.delete(value);
  else notes.add(value);
}

function commitValue(row, col, value) {
  state.board[row][col] = value;
  state.notes[row][col].clear();

  if (value !== state.solution[row][col]) {
    state.mistakes += 1;
    play('error');
    if (state.mistakes >= MAX_MISTAKES) endGame('lost');
    return;
  }

  play('place');
  clearPeerNotes(row, col, value);

  if (isSolved(state.board, state.solution)) {
    endGame('won');
  }
}

/** Once a digit is correct, drop it from the notes of its row, column and box. */
function clearPeerNotes(row, col, value) {
  for (let i = 0; i < GRID_SIZE; i += 1) {
    state.notes[row][i].delete(value);
    state.notes[i][col].delete(value);
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      state.notes[r][c].delete(value);
    }
  }
}

function eraseCell() {
  if (state.status !== 'playing' || !state.selected) return;

  const { row, col } = state.selected;
  if (state.puzzle[row][col] !== 0) return;
  if (state.board[row][col] === 0 && state.notes[row][col].size === 0) return;

  pushHistory(row, col);
  state.board[row][col] = 0;
  state.notes[row][col].clear();
  play('erase');
  render();
  saveGame();
}

function useHint() {
  if (state.status !== 'playing') return;

  if (state.hints <= 0) {
    showModal({
      title: 'No hints left',
      text: 'All three hints for this puzzle are used. Every grid has a single solution — keep going, you can finish it.',
      primaryLabel: 'Keep playing',
      primaryAction: hideModal,
      secondaryLabel: 'New puzzle',
      secondaryAction: () => startNewGame(state.difficulty),
    });
    return;
  }

  const target = pickHintCell();
  if (!target) return;

  const { row, col } = target;
  pushHistory(row, col);
  state.board[row][col] = state.solution[row][col];
  state.notes[row][col].clear();
  state.hintsUsed[row][col] = 1;
  state.hints -= 1;
  clearPeerNotes(row, col, state.solution[row][col]);
  state.selected = { row, col };

  play('hint');

  if (isSolved(state.board, state.solution)) endGame('won');

  render();
  saveGame();
}

/** Prefers the selected cell, otherwise the first empty cell. */
function pickHintCell() {
  if (state.selected) {
    const { row, col } = state.selected;
    if (state.puzzle[row][col] === 0 && state.board[row][col] !== state.solution[row][col]) {
      return { row, col };
    }
  }

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (state.board[row][col] === 0) return { row, col };
    }
  }
  return null;
}

function undo() {
  if (state.status !== 'playing') return;

  const entry = state.history.pop();
  if (!entry) return;

  state.board[entry.row][entry.col] = entry.value;
  state.notes[entry.row][entry.col] = new Set(entry.notes);
  state.selected = { row: entry.row, col: entry.col };
  play('undo');
  render();
  saveGame();
}

function pushHistory(row, col) {
  state.history.push({
    row,
    col,
    value: state.board[row][col],
    notes: [...state.notes[row][col]],
  });
  if (state.history.length > 200) state.history.shift();
}

function toggleNotesMode() {
  state.notesMode = !state.notesMode;
  play('note');
  render();
}

/* ---------- Rendering ---------- */

function render() {
  const selected = state.selected;
  const selectedValue = selected ? state.board[selected.row][selected.col] : 0;

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const cell = cellElements[row][col];
      const value = state.board[row][col];
      const isGiven = state.puzzle[row][col] !== 0;
      const isWrong = value !== 0 && value !== state.solution[row][col];
      const isPeer =
        selected !== null &&
        (selected.row === row ||
          selected.col === col ||
          (Math.floor(selected.row / 3) === Math.floor(row / 3) &&
            Math.floor(selected.col / 3) === Math.floor(col / 3)));
      const isMatch = selectedValue !== 0 && value === selectedValue;

      const classes = ['cell'];
      if (isGiven) classes.push('cell--given');
      if (state.hintsUsed[row][col]) classes.push('cell--hint');
      if (isPeer) classes.push('cell--peer');
      if (isMatch) classes.push('cell--match');
      if (selected && selected.row === row && selected.col === col) classes.push('cell--selected');
      if (isWrong) classes.push('cell--error');

      cell.className = classes.join(' ');

      if (value !== 0) {
        cell.textContent = String(value);
      } else if (state.notes[row][col].size > 0) {
        cell.innerHTML = renderNotes(state.notes[row][col]);
      } else {
        cell.textContent = '';
      }

      const label = value === 0 ? 'empty' : String(value);
      cell.setAttribute(
        'aria-label',
        `Row ${row + 1}, column ${col + 1}: ${label}${isGiven ? ', given' : ''}`,
      );
    }
  }

  updateStats();
  updatePad();
}

function renderNotes(notes) {
  let html = '<span class="cell__notes">';
  for (let value = 1; value <= GRID_SIZE; value += 1) {
    html += `<span>${notes.has(value) ? value : ''}</span>`;
  }
  return `${html}</span>`;
}

function updateStats() {
  els.statDifficulty.textContent = DIFFICULTIES[state.difficulty].label;
  els.statTimer.textContent = formatTime(state.seconds);
  els.statMistakes.textContent = `${state.mistakes} of ${MAX_MISTAKES} mistakes`;
  els.statHints.textContent = `${state.hints} ${state.hints === 1 ? 'hint' : 'hints'}`;

  els.btnNotes.setAttribute('aria-pressed', String(state.notesMode));
  els.btnUndo.disabled = state.history.length === 0 || state.status !== 'playing';
  els.btnHint.disabled = state.hints <= 0 || state.status !== 'playing';

  els.levels.querySelectorAll('.level').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.difficulty === state.difficulty));
  });
}

function updatePad() {
  const counts = new Array(GRID_SIZE + 1).fill(0);
  state.board.flat().forEach((value) => {
    if (value !== 0) counts[value] += 1;
  });

  els.pad.querySelectorAll('.pad__btn').forEach((button) => {
    const value = Number(button.dataset.value);
    const remaining = GRID_SIZE - counts[value];
    button.querySelector('[data-count]').textContent = String(Math.max(remaining, 0));
    button.disabled = remaining <= 0 || state.status !== 'playing';
  });
}

/* ---------- End of round ---------- */

function endGame(result) {
  state.status = result;
  stopTimer();
  saveGame();

  if (result === 'won') {
    play('win');
    showModal({
      title: 'Puzzle solved',
      text: `Clean finish in ${formatTime(state.seconds)} — ${state.mistakes} ${
        state.mistakes === 1 ? 'mistake' : 'mistakes'
      } and ${MAX_HINTS - state.hints} ${
        MAX_HINTS - state.hints === 1 ? 'hint' : 'hints'
      } used.`,
      primaryLabel: 'Play again',
      primaryAction: () => startNewGame(state.difficulty),
      secondaryLabel: 'Next level',
      secondaryAction: () => startNewGame(nextDifficulty(state.difficulty)),
    });
    return;
  }

  play('lose');
  showModal({
    title: 'Out of mistakes',
    text: `Three wrong entries ended this round after ${formatTime(
      state.seconds,
    )}. Every puzzle has exactly one solution, so the same level is always winnable.`,
    primaryLabel: 'New puzzle',
    primaryAction: () => startNewGame(state.difficulty),
    secondaryLabel: 'Close',
    secondaryAction: hideModal,
  });
}

function nextDifficulty(current) {
  const keys = Object.keys(DIFFICULTIES);
  const index = keys.indexOf(current);
  return keys[Math.min(index + 1, keys.length - 1)];
}

/* ---------- Modal ---------- */

function showModal({ title, text, primaryLabel, primaryAction, secondaryLabel, secondaryAction }) {
  els.modalTitle.textContent = title;
  els.modalText.textContent = text;

  els.modalPrimary.textContent = primaryLabel;
  els.modalPrimary.onclick = primaryAction;

  els.modalSecondary.textContent = secondaryLabel;
  els.modalSecondary.onclick = secondaryAction;

  els.modal.hidden = false;
  els.modalPrimary.focus();
}

function hideModal() {
  els.modal.hidden = true;
}

/* ---------- Events ---------- */

function bindEvents() {
  els.btnUndo.addEventListener('click', undo);
  els.btnErase.addEventListener('click', eraseCell);
  els.btnNotes.addEventListener('click', toggleNotesMode);
  els.btnHint.addEventListener('click', useHint);
  els.soundToggle.addEventListener('click', toggleSound);
  els.themeToggle.addEventListener('click', toggleTheme);

  els.modal.addEventListener('click', (event) => {
    if (event.target === els.modal) hideModal();
  });

  document.addEventListener('keydown', handleKeydown);

  // Browsers only allow audio after a gesture; warm the context on the first one.
  const warmUp = () => unlock();
  document.addEventListener('pointerdown', warmUp, { once: true });
  document.addEventListener('keydown', warmUp, { once: true });
}

function handleKeydown(event) {
  if (!els.modal.hidden) {
    if (event.key === 'Escape') hideModal();
    return;
  }

  const key = event.key;

  if (key >= '1' && key <= '9') {
    event.preventDefault();
    placeValue(Number(key));
    return;
  }

  switch (key) {
    case 'Backspace':
    case 'Delete':
    case '0':
      event.preventDefault();
      eraseCell();
      break;

    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
      event.preventDefault();
      moveSelection(key);
      break;

    case 'n':
    case 'N':
      toggleNotesMode();
      break;

    case 'h':
    case 'H':
      useHint();
      break;

    case 'u':
    case 'U':
      undo();
      break;

    case 'm':
    case 'M':
      toggleSound();
      break;

    case 'Escape':
      state.selected = null;
      render();
      break;

    default:
      break;
  }
}

function moveSelection(key) {
  const current = state.selected || { row: 0, col: 0 };
  let { row, col } = current;

  if (key === 'ArrowUp') row = (row + GRID_SIZE - 1) % GRID_SIZE;
  if (key === 'ArrowDown') row = (row + 1) % GRID_SIZE;
  if (key === 'ArrowLeft') col = (col + GRID_SIZE - 1) % GRID_SIZE;
  if (key === 'ArrowRight') col = (col + 1) % GRID_SIZE;

  selectCell(row, col);
  cellElements[row][col].focus({ preventScroll: true });
}

/* ---------- Theme and sound preferences ---------- */

function applySavedTheme() {
  const saved = readStorage(THEME_KEY);
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  setTheme(saved || (prefersLight ? 'light' : 'dark'));
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  setTheme(next);
  writeStorage(THEME_KEY, next);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  els.themeToggle.setAttribute(
    'aria-label',
    theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme',
  );
}

function applySavedSound() {
  setSound(readStorage(MUTE_KEY) !== 'on');
}

function toggleSound() {
  const turningOn = isMuted();
  setSound(turningOn);
  if (turningOn) play('note');
}

/** Updates the mute state, the button and the stored preference. */
function setSound(enabled) {
  setMuted(!enabled);
  els.soundToggle.setAttribute('aria-pressed', String(enabled));
  els.soundToggle.setAttribute('aria-label', enabled ? 'Sound effects on' : 'Sound effects muted');
  writeStorage(MUTE_KEY, enabled ? 'off' : 'on');
}

/* ---------- Persistence ---------- */

function saveGame() {
  const snapshot = {
    puzzle: state.puzzle,
    solution: state.solution,
    board: state.board,
    notes: state.notes.map((row) => row.map((notes) => [...notes])),
    hintsUsed: state.hintsUsed,
    difficulty: state.difficulty,
    mistakes: state.mistakes,
    hints: state.hints,
    seconds: state.seconds,
    notesMode: state.notesMode,
    status: state.status,
  };
  writeStorage(STORAGE_KEY, snapshot);
}

function restoreGame() {
  const saved = readStorage(STORAGE_KEY, true);
  if (!saved || !Array.isArray(saved.board) || saved.board.length !== GRID_SIZE) return false;

  state.puzzle = saved.puzzle;
  state.solution = saved.solution;
  state.board = saved.board;
  state.notes = saved.notes.map((row) => row.map((notes) => new Set(notes)));
  state.hintsUsed = saved.hintsUsed;
  state.difficulty = saved.difficulty in DIFFICULTIES ? saved.difficulty : 'medium';
  state.mistakes = saved.mistakes;
  state.hints = saved.hints;
  state.seconds = saved.seconds;
  state.notesMode = Boolean(saved.notesMode);
  state.status = saved.status;
  state.history = [];

  if (state.status === 'playing') startTimer();
  return true;
}

function readStorage(key, isJson = false) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return isJson ? JSON.parse(raw) : raw;
  } catch (error) {
    console.warn('Could not read saved data:', error);
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (error) {
    console.warn('Could not save data:', error);
  }
}
