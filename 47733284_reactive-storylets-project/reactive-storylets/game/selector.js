// Storylet pool + selection logic.
//
// This is the actual system under test. Ink/inkjs only stores prose and
// tracks the two numeric variables (trust, ruthlessness) that the player's
// choices update. It has no concept of "pick the best-fitting storylet from
// a pool" - that selection step is implemented here, independently of Ink,
// and is run between choice points to decide which Ink knot to jump to next.
//
// Two selection strategies operate over the SAME pools, so the only
// variable that differs between the reactive and control conditions is the
// selection rule itself:
//   - selectReactive(tier, state): eligibility-filtered, most-specific match
//   - selectRandom(tier, state):   uniform random choice, ignoring state
//
// The game has 8 choice points. Tier N is the storylet hand-off that follows
// choice N (tiers 1-7 are mid-story scenes; tier 8 is the ending). Every
// choice adds +2 to exactly one of trust / ruthlessness, so after N choices
// trust + ruthlessness === 2N, and the player's "lean" (trust minus
// ruthlessness) is a single number that summarises their accumulated choices:
//   lean >= 2  -> trusting (ally storylets)
//   lean <= -2 -> ruthless (rival storylets)
//   lean === 0 -> evenly balanced (mixed storylets; only reachable after an
//                 even number of choices)

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.StoryletSystem = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const TIER_COUNT = 8;

    const lean = (s) => s.trust - s.ruthlessness;

    // Eligibility predicates shared by the mid-story tiers.
    const isTrusting = (s) => lean(s) >= 2;
    const isRuthless = (s) => lean(s) <= -2;
    const isBalanced = (s) => lean(s) === 0;

    function storylet(id, description, specificity, requires) {
        return { id, knot: id, description, specificity, requires };
    }

    const pool = {
        1: [
            storylet('t1_ally', 'A technician you helped offers a lead on a supply cache.', 1, isTrusting),
            storylet('t1_rival', 'Someone is tracking you through the vents.', 1, isRuthless)
        ],
        2: [
            storylet('t2_ally', 'An ally from earlier catches up and pledges support.', 1, isTrusting),
            storylet('t2_rival', 'A stranger confronts you over the supplies you kept.', 1, isRuthless),
            storylet('t2_mixed', 'Signs of a stranger deliberately keeping their distance.', 1, isBalanced)
        ],
        3: [
            storylet('t3_ally', 'A stranger has heard good things about you and offers a torch.', 1, isTrusting),
            storylet('t3_rival', 'Your reputation has gone before you; a hostile word is scratched on the wall.', 1, isRuthless)
        ],
        4: [
            storylet('t4_ally', 'A radio message promises rescue teams are on their way down.', 1, isTrusting),
            storylet('t4_rival', 'Silence, and the sense of being the only one being careful.', 1, isRuthless),
            storylet('t4_mixed', 'A fragment of a transmission suggests you are not alone.', 1, isBalanced)
        ],
        5: [
            storylet('t5_ally', 'People you helped have scouted ahead and wave you through.', 1, isTrusting),
            storylet('t5_rival', 'Unhurried footsteps are following you a few corridors back.', 1, isRuthless)
        ],
        6: [
            storylet('t6_ally', 'Someone has left a lantern burning for you.', 1, isTrusting),
            storylet('t6_rival', 'A pair of eyes watches you from the far end of a corridor.', 1, isRuthless),
            storylet('t6_mixed', 'Two lit routes, one warm and one cold; neither entirely safe.', 1, isBalanced)
        ],
        7: [
            storylet('t7_ally', 'Laughter drifts up the stairwell from those behind you.', 1, isTrusting),
            storylet('t7_rival', 'A silent stairwell and a structure that will not hold much longer.', 1, isRuthless)
        ],
        // Tier 8: endings. After 8 choices trust + ruthlessness === 16, so
        // trust is one of 0, 2, 4, ... 16 and the bands below tile every
        // reachable state exactly. Alternates with the same condition exist
        // for content variety; ties are broken randomly (see selectReactive).
        8: [
            storylet('hopeful_ending', 'Strongly trusting: several allies escape with the player.', 1, (s) => s.trust >= 14),
            storylet('bittersweet_ally_ending', 'Mostly trusting: a few allies escape with the player.', 1, (s) => s.trust >= 10 && s.trust < 14),
            storylet('uneasy_truce_ending', 'Evenly balanced: an uneasy truce with a shadowing stranger.', 1, (s) => s.trust === 8),
            storylet('fragile_alliance_ending', 'Evenly balanced (alternate): a fragile alliance at the hatch.', 1, (s) => s.trust === 8),
            storylet('lonely_survivor_ending', 'Mostly ruthless: the player survives mostly alone.', 1, (s) => s.trust >= 4 && s.trust < 8),
            storylet('downfall_ending', 'Strongly ruthless: the player escapes alone, by design.', 1, (s) => s.trust < 4),
            storylet('solitary_triumph_ending', 'Strongly ruthless (alternate): a hollow solitary escape.', 1, (s) => s.trust < 4)
        ]
    };

    function eligible(tier, state) {
        return pool[tier].filter((storylet) => storylet.requires(state));
    }

    // Reactive condition: filter by eligibility, then take the MOST
    // SPECIFIC matching storylet(s). Several storylets may legitimately
    // share the same eligibility condition (e.g. the two alternate endings
    // for each band) to give the pool content variety; when that happens,
    // selection is still entirely state-gated - only storylets whose
    // condition is satisfied are ever in play - but the specific pick among
    // an equally-specific tie is randomised.
    function selectReactive(tier, state) {
        const candidates = eligible(tier, state);
        if (candidates.length === 0) {
            // Defensive only: the bands above cover every reachable state.
            return pool[tier][0];
        }
        const topSpecificity = Math.max(...candidates.map((c) => c.specificity));
        const topMatches = candidates.filter((c) => c.specificity === topSpecificity);
        const idx = Math.floor(Math.random() * topMatches.length);
        return topMatches[idx];
    }

    // Control condition: uniform-random choice from the SAME pool,
    // completely ignoring player state. This isolates selection strategy
    // as the only variable that differs from the reactive condition.
    function selectRandom(tier, state) {
        const all = pool[tier];
        const idx = Math.floor(Math.random() * all.length);
        return all[idx];
    }

    function select(mode, tier, state) {
        if (mode === 'reactive') return selectReactive(tier, state);
        if (mode === 'random') return selectRandom(tier, state);
        throw new Error(`Unknown selection mode: ${mode}`);
    }

    return { pool, TIER_COUNT, tierCount: TIER_COUNT, eligible, selectReactive, selectRandom, select };
}));
