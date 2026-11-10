# Architecture: Reactive Storylets

## 1. Overview

The system has three layers:

1. **Content layer (Ink / inkjs)** — authored prose, organised into knots, plus two tracked numeric variables (`trust`, `ruthlessness`) that player choices update.
2. **Selection layer (`selector.js`)** — a storylet pool and two selection algorithms that run entirely outside Ink. This is the layer under test.
3. **Presentation layer (`player.js` + `index.html`)** — drives the Ink story forward, calls the selector at each of the eight hand-off points, and renders choices/prose to the page.

This split matters: Ink gives a convenient, well-tested way to author branching prose and track state, but it has **no built-in concept of a storylet pool or a selection algorithm**. If the pool/selector logic were folded into Ink's own branching (e.g. a long chain of `{trust > ruthlessness: -> t2_ally | -> t2_rival}` conditionals repeated after every choice), the project would just be a disguised branching tree, and the reactive-vs-random comparison this project is evaluating would not be possible to isolate cleanly. Keeping selection in plain JavaScript, operating on an explicit pool data structure, is what makes the two conditions a true controlled comparison over the *same* content.

## 2. Content layer

`game/story.ink` defines:

- Two global variables: `trust`, `ruthlessness` (both start at 0).
- Eight **choice knots** (`choice_one` to `choice_eight`), each Ink-native: the player picks between two options, and each option adds +2 to exactly one of the two tracked variables (trust or ruthlessness).
- Eight **tiers of storylet knots**, each a short piece of prose with no choices of its own, that the story is redirected into *by the presentation layer*, not by Ink's own flow. Tier N follows choice N, and its storylets are named by the band of player state they suit:
  - Tiers 1-7 (mid-story scenes): an `_ally` storylet (trust-leaning state), a `_rival` storylet (ruthlessness-leaning state), and, after an even number of choices, a `_mixed` storylet (evenly balanced state). For example tier 2 holds `t2_ally`, `t2_rival` and `t2_mixed`; tier 1 holds only `t1_ally` and `t1_rival`, because an evenly balanced state is impossible after one choice.
  - Tier 8 (the ending, after `choice_eight`): seven endings split across five bands: `hopeful_ending`, `bittersweet_ally_ending`, `uneasy_truce_ending`, `fragile_alliance_ending`, `lonely_survivor_ending`, `downfall_ending`, `solitary_triumph_ending`. Two of the bands have an alternate ending with the same eligibility condition, for content variety.

In total the pool holds 24 storylets (17 mid-story scenes and 7 endings).

`game/compile.js` compiles `story.ink` to `story.json` using inkjs's bundled `Compiler`, which is what `player.js` loads and runs at runtime via `new inkjs.Story(storyContent)`.

## 3. Selection layer (`selector.js`)

This is the core contribution. The pool is a plain JS object keyed by tier:

```js
pool[tier] = [
  { id, knot, description, specificity, requires(state) => boolean },
  ...
];
```

- `requires(state)` is the **eligibility predicate**: a function of the tracked state (`{ trust, ruthlessness }`) that returns whether this storylet is allowed to appear.
- `specificity` is an integer hand-assigned per storylet (higher means a more specific match), used to break ties when several storylets are eligible at once. In the current 8-choice pool every storylet has specificity 1, because the eligibility bands already partition the reachable states cleanly; the mechanism is retained so a larger pool with overlapping bands (e.g. an unconditional fallback at specificity 0) works without changing the selector.

Two selection functions operate over the same pool:

- **`selectReactive(tier, state)`** — filters the tier's pool to storylets whose `requires(state)` is true, then returns the eligible storylet with the highest `specificity` (ties broken by declaration order, so a given state always resolves the same way). Every tier has at least one unconditional fallback storylet (`specificity: 0`), so this function always returns a result.
- **`selectRandom(tier, state)`** — ignores `state` entirely and returns a uniformly random storylet from the tier's pool.

`select(mode, tier, state)` is the single entry point `player.js` calls, dispatching to one of the two functions above based on the `mode` query parameter (`reactive` or `random`).

## 4. Presentation layer (`player.js`)

`player.js` drives the compiled story:

1. Calls `story.Continue()` in a loop until Ink either (a) presents choices, or (b) reaches an `-> END` with no choices pending.
2. Case (a): renders the choices as buttons; clicking one calls `story.ChooseChoiceIndex(index)` and resumes.
3. Case (b): this marks a **storylet hand-off point**. The driver reads the current state (`story.variablesState['trust']`, `story.variablesState['ruthlessness']`), calls `StoryletSystem.select(mode, tier, state)`, logs the decision (visible only in `?debug=1` view), and calls `story.ChoosePathString(storylet.knot)` to jump Ink into the chosen knot. This repeats for all eight tiers; after tier 8 (the ending), the story has nothing left to continue and the page shows "The End".

This loop is what turns eight independent choice points into a single playthrough whose *middle and ending content*, not just its choices, differs between the reactive and random conditions — which is the actual thing the evaluation study (see `evaluation/`) measures.

## 5. Why trust/ruthlessness and not a richer state model

The prototype intentionally uses two orthogonal numeric variables rather than a larger state space, so that:

- Eligibility predicates stay easy to reason about and verify by hand (important for defending the selection logic's correctness in this report).
- Because every choice moves exactly one variable by the same amount, the player's whole history after N choices reduces to a single "lean" (trust minus ruthlessness), and the eligibility predicates (`lean >= 2`, `lean <= -2`, `lean === 0`) tile every reachable state with no gaps. The ending bands are written the same way, over trust alone, since after 8 choices trust + ruthlessness is always 16.
- The same two variables generalise directly to the "accumulated choices" framing in the research question, without extra justification for what a larger state space would represent.

A larger-scale version of this system (more variables, more storylets, branching eligibility bands) would use the same architecture unchanged — only the pool definition in `selector.js` would grow.
