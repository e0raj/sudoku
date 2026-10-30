# Sudoku

A clean, full-screen Sudoku game that runs entirely in the browser — no frameworks, no build step, no trackers.

**Play it live:** https://e0raj.github.io/sudoku/

## Features

- **Properly generated puzzles.** Every grid comes from a randomised backtracking fill, then clues are removed one at a time and kept removed only if exactly one solution remains. There is no hard-coded puzzle list.
- **Four difficulty levels** — Easy (45 clues), Medium (36), Hard (30), Expert (26).
- **Sound effects** synthesised with the Web Audio API — a soft blip for a correct digit, a low buzz for a wrong one, a chime for hints and a rising arpeggio when you finish. No audio files are downloaded; mute with the speaker button or the `M` key.
- **Pencil notes** with automatic clean-up: a correct digit disappears from the notes in its row, column and box.
- **Undo, erase and three hints** per round, plus a three-mistake limit.
- **Live highlighting** of the selected cell, its row, column, box and every matching digit.
- **Autosave** — the puzzle, timer and notes survive a refresh.
- **Dark and light themes**, full keyboard play, and a layout that fits without scrolling from desktop down to small phones.
- **SEO ready** — descriptive metadata, Open Graph and Twitter cards, JSON-LD structured data, `robots.txt`, `sitemap.xml` and a web app manifest.

## Keyboard controls

| Key | Action |
| --- | --- |
| `1`–`9` | Place a digit in the selected cell |
| `Backspace` / `Delete` / `0` | Erase the selected cell |
| Arrow keys | Move the selection |
| `N` | Toggle notes mode |
| `H` | Use a hint |
| `U` | Undo |
| `M` | Mute or unmute sound |
| `Esc` | Clear the selection |

## Project structure

```
sudoku/
├── index.html                  # the game
├── about.html                  # rules, strategy and FAQ
├── robots.txt
├── sitemap.xml
├── site.webmanifest            # installable web app metadata
├── assets/
│   ├── css/
│   │   └── style.css           # theme variables, grid, controls, responsive rules
│   ├── img/
│   │   ├── favicon.svg
│   │   ├── apple-touch-icon.png
│   │   └── og-image.png        # social preview card
│   └── js/
│       ├── sudoku.js           # puzzle engine — pure functions, no DOM
│       ├── audio.js            # Web Audio sound effects
│       └── app.js              # game state, rendering and input
└── README.md
```

`assets/js/sudoku.js` has no DOM dependencies, so it can be imported and tested on its own:

```js
import { generatePuzzle, countSolutions } from './assets/js/sudoku.js';

const { puzzle, solution } = generatePuzzle('hard');
console.log(countSolutions(puzzle, 2)); // 1 — exactly one solution
```

## Run it locally

The JavaScript loads as ES modules, so serve the folder rather than opening `file://`:

```bash
git clone https://github.com/e0raj/sudoku.git
cd sudoku
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Tech

Vanilla HTML, CSS and JavaScript (ES modules), plus the Web Audio API for sound. No dependencies, no bundler, no analytics. Hosted on GitHub Pages.

## Licence

MIT — see [LICENSE](LICENSE).
