# Sudoku

A clean, fast Sudoku game that runs entirely in the browser — no frameworks, no build step, no trackers.

**Play it live:** https://e0raj.github.io/sudoku/

![Difficulty levels: Easy, Medium, Hard, Expert](https://img.shields.io/badge/levels-easy%20%C2%B7%20medium%20%C2%B7%20hard%20%C2%B7%20expert-6f8cff)

## Features

- **Properly generated puzzles.** Every grid is created by a randomised backtracking fill and then dug out cell by cell, keeping only removals that leave exactly one solution. No hard-coded puzzle list.
- **Four difficulty levels** — Easy (45 clues), Medium (36), Hard (30), Expert (26).
- **Pencil notes** for candidate digits, with automatic clean-up: when a digit is placed correctly, it disappears from the notes in its row, column and box.
- **Undo, erase and three hints** per round.
- **Live feedback** — highlights for the selected cell, its row, column and box, and every matching digit.
- **Mistake limit** of three wrong entries, plus a timer that pauses when the round ends.
- **Autosave** — refresh or close the tab and the round picks up where you left off.
- **Dark and light themes**, keyboard play, and a layout that works down to small phone screens.

## Keyboard controls

| Key | Action |
| --- | --- |
| `1`–`9` | Place a digit in the selected cell |
| `Backspace` / `Delete` / `0` | Erase the selected cell |
| Arrow keys | Move the selection |
| `N` | Toggle notes mode |
| `H` | Use a hint |
| `U` | Undo |
| `Esc` | Clear the selection |

## Project structure

```
sudoku/
├── index.html          # page shell and layout
├── assets/
│   ├── css/
│   │   └── style.css   # theme variables, board, pad, responsive rules
│   └── js/
│       ├── sudoku.js   # puzzle engine — pure functions, no DOM
│       └── app.js      # game state, rendering and input
└── README.md
```

The engine in `sudoku.js` has no DOM dependencies, so it can be imported and tested on its own (for example with Node):

```js
import { generatePuzzle, countSolutions } from './assets/js/sudoku.js';

const { puzzle, solution } = generatePuzzle('hard');
console.log(countSolutions(puzzle, 2)); // 1 — exactly one solution
```

## Run it locally

Because the JavaScript is loaded as ES modules, open it through a local server rather than `file://`:

```bash
git clone https://github.com/e0raj/sudoku.git
cd sudoku
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Tech

Vanilla HTML, CSS and JavaScript (ES modules). No dependencies, no bundler, no analytics. Hosted with GitHub Pages.

## Licence

MIT — see [LICENSE](LICENSE).
