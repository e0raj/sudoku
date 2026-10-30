# Sudoku

A clean, fast Sudoku game that runs entirely in your browser. Plain HTML, CSS and JavaScript — no framework, no build step, no trackers, no ads.

**[Play it here →](https://e0raj.github.io/sudoku/)**

---

## What it is

A full 9×9 Sudoku with four difficulty levels, pencil notes, hints, undo, a timer and sound effects. Every puzzle is generated fresh in the browser, and every one of them has exactly one solution — so the grid can always be solved by logic alone, without guessing.

The board, the number row and the controls all fit on one screen on a phone. Below the game there is a short write-up on what Sudoku is, where it came from and why it is worth ten minutes of your day.

## Features

- **Generated puzzles, not a fixed list.** A randomised backtracking fill creates a complete grid, then clues are removed one at a time and kept removed only while a single solution remains.
- **Four levels.** Easy starts with 45 clues, Medium 36, Hard 30, Expert 26.
- **Pencil notes.** Mark candidate digits per cell; a correctly placed digit is cleaned out of the notes in its row, column and box automatically.
- **Undo, erase and three hints** per round, with a three-mistake limit.
- **Live highlighting** of the selected cell, its row, column, box and every matching digit.
- **Sound effects** synthesised with the Web Audio API — nothing is downloaded, and one tap mutes them.
- **Autosave.** Refresh or close the tab and the same round comes back, timer and notes included.
- **Dark and light themes**, full keyboard play, and a layout that works from desktop down to small phones.
- **Built to be found.** Descriptive metadata, Open Graph and Twitter cards, JSON-LD structured data, a sitemap, `robots.txt` and a web app manifest.

## Keyboard

| Key | Action |
| --- | --- |
| `1` – `9` | Place a digit in the selected cell |
| `Backspace` / `Delete` / `0` | Erase the selected cell |
| Arrow keys | Move the selection |
| `N` | Toggle notes mode |
| `H` | Use a hint |
| `U` | Undo |
| `M` | Mute or unmute sound |
| `Esc` | Clear the selection |

## Project layout

```
sudoku/
├── index.html                the game and the about section
├── about.html                rules, strategy and FAQ
├── robots.txt
├── sitemap.xml
├── site.webmanifest          installable web app metadata
├── assets/
│   ├── css/
│   │   └── style.css         themes, grid, controls, typography
│   ├── img/
│   │   ├── favicon.svg
│   │   ├── apple-touch-icon.png
│   │   ├── rules.svg         diagram used in the about section
│   │   └── og-image.png      social preview card
│   └── js/
│       ├── sudoku.js         puzzle engine — pure functions, no DOM
│       ├── audio.js          Web Audio sound effects
│       └── app.js            game state, rendering and input
└── README.md
```

The three JavaScript files are deliberately separate: `sudoku.js` knows nothing about the page, `audio.js` knows nothing about the game, and `app.js` wires the two together with the interface. That makes the engine easy to test on its own:

```js
import { generatePuzzle, countSolutions } from './assets/js/sudoku.js';

const { puzzle, solution } = generatePuzzle('hard');

console.log(countSolutions(puzzle, 2)); // 1 — exactly one solution
```

## How it is built

| Part | What it does |
| --- | --- |
| `sudoku.js` | Grid creation, randomised fill, solution counting, puzzle generation |
| `audio.js` | Oscillator-based sound effects with gain envelopes |
| `app.js` | State, rendering, pointer and keyboard input, autosave, preferences |
| `style.css` | Two themes from one set of custom properties, responsive sizing |

No dependencies, no bundler, no analytics. The whole thing is a handful of static files.

## Credits

Designed and built by **[Raj (e0raj)](https://github.com/e0raj)** — game design, puzzle engine, interface, sound and writing.

The puzzle format itself comes from **Howard Garns**, whose "Number Place" was published by Dell Magazines in 1979, and from **Nikoli**, who named it Sudoku in Japan in 1984. Icons and diagrams are hand-drawn SVG.

## Licence

[MIT](LICENSE) — use it, change it, share it.
