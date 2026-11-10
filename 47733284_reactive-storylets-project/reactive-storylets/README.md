# Reactive Storylets

A browser-playable, text-based narrative game built to answer one research question:

> **Does narrative content selected to match a player's accumulated choices (a "reactive" storylet system) produce higher perceived narrative coherence than the same content pool delivered by random selection (a control condition)?**

This repository is the COMP3180 Final Project codebase for 47733284 Stephen Tsai. It contains the game itself, the technical documentation for the system under test, and the evaluation instrument used to answer the research question above.

## What this is

Most text-based narrative games are built as **branching trees**: every possible path is hand-authored in advance. This project instead implements a **storylet system** (a form of quality-based narrative, after Ashwell 2015 and Short 2016): a pool of independent, tagged narrative fragments ("storylets"), each eligible under specific conditions on tracked player state. Instead of the author wiring up every path, a **selection algorithm** picks the best-fitting eligible storylet at runtime.

The project implements **two selection algorithms over the identical storylet pool**, so they can be directly compared:

| Condition | Selection rule |
|---|---|
| **Reactive** | Filters storylets by eligibility against the player's tracked state (`trust`, `ruthlessness`), then picks the most specific eligible match. |
| **Random (control)** | Picks uniformly at random from the same pool, ignoring player state entirely. |

Because both conditions draw from the same pool and the same Ink-authored prose, selection strategy is the only variable that differs between them — which is what makes the evaluation study (see [`evaluation/`](evaluation/)) a genuine controlled comparison rather than a before/after impression.

## Repository structure

```
reactive-storylets/
├── game/                   # The playable prototype
│   ├── story.ink           # Ink source: prose + state tracking (trust, ruthlessness)
│   ├── story.json          # Compiled Ink story (generated — see below)
│   ├── compile.js          # Compiles story.ink -> story.json via inkjs's Compiler
│   ├── selector.js          # The storylet pool + both selection algorithms
│   ├── player.js           # Browser driver: runs Ink, calls the selector, renders choices
│   ├── index.html          # The game page
│   └── ink.js              # inkjs browser runtime (vendored, see Third-party code below)
├── docs/
│   └── architecture.md     # Technical documentation of the system design
├── evaluation/
│   ├── protocol.md         # Target audience + method (participants, procedure, instruments)
│   └── survey_instrument.md # The actual survey questions used in the playtest study
└── package.json
```

## Running the game

The game is a static web page — no build step beyond compiling the Ink source once:

```bash
npm install            # installs inkjs
node game/compile.js   # compiles game/story.ink -> game/story.json
cd game
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html` in a browser.

You can also just double-click `game/index.html`: the compile step writes `game/story.js`, which embeds the story so the page works straight from disk with no server. (Add `?mode=random` to the address to open the control condition.)

- `http://localhost:8000/index.html?mode=reactive` — the reactive condition (default if `mode` is omitted)
- `http://localhost:8000/index.html?mode=random` — the random-selection control condition

The page shows one scene at a time (the outcome of your last choice, the storylet the selector picked, and the next decision), with a progress bar and a collapsible "Story so far" panel so players can look back. Choices can be clicked or selected with the 1 / 2 keys.

**Participants never see which condition they are in.** To inspect the mechanism yourself, add `&debug=1` to the URL, e.g. `index.html?mode=random&debug=1`. This reveals the condition, a log of which storylet was selected at each of the eight decision points and why, and a Restart button. Do not give participants a `debug=1` link.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full technical write-up: how state tracking, storylet eligibility, and selection specificity work, and why the pool/selector logic lives outside Ink rather than inside it.

## Evaluation

See [`evaluation/protocol.md`](evaluation/protocol.md) and [`evaluation/survey_instrument.md`](evaluation/survey_instrument.md) for the target audience, method, and the full survey instrument used to collect perceived-coherence data from playtesters.

## Individual contribution and tool use

All code in `game/`, `docs/`, and `evaluation/` (excluding the vendored `game/ink.js` runtime) was authored for this project. Ink ([inkle](https://www.inklestudios.com/ink/)) and its JavaScript port, inkjs, are used as third-party narrative-scripting middleware for prose delivery and variable tracking only; the storylet pool structure and both selection algorithms are original work, built specifically to test this project's research question. See the "Statement on Generative AI use" section of the Final Project Report for the required disclosure.

## Third-party code

- [Ink](https://github.com/inkle/ink) / [inkjs](https://github.com/y-lohse/inkjs) — MIT licensed narrative scripting engine and its JavaScript port. `game/ink.js` is the unmodified inkjs browser runtime bundle (`dist/ink.js` from the published npm package), vendored here so the game runs from a static file server with no build step.
