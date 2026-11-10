# Evaluation Protocol

This document specifies the target audience and method for the playtest study evaluating this project's research question:

> Does narrative content selected to match a player's accumulated choices (the reactive condition) produce higher perceived narrative coherence than the same content pool delivered by random selection (the control condition)?

This is a design/instrument document — it specifies *how* the study is run. Results and discussion of the data actually collected belong in the Final Project Report, not here (see `report/`).

## 1. Target audience

The target population is **players of narrative-driven interactive fiction** — people who already engage with choice-based or text-heavy narrative games (e.g. *Fallen London*, Choice of Games titles, visual novels, interactive fiction communities such as those around ifcomp.org). This population is the appropriate sample for two reasons:

1. **Construct validity.** Perceived narrative coherence is a judgment that depends on familiarity with the genre's conventions (what counts as a "payoff" to an earlier choice, what counts as filler). A sample unfamiliar with choice-based narrative games would be judging the game against the wrong baseline.
2. **Industry relevance.** The studios and teams who would actually decide whether to invest in a reactive storylet system over static/random content (e.g. narrative designers at interactive-fiction studios) care about exactly this population's response, not a general audience's. A finding that holds for genre-experienced players is the finding that matters for that industry decision.

No further demographic restriction (age, platform, nationality) is applied beyond being a competent English reader aged 16 or over, recruited via convenience and snowball sampling through university game-development networks and interactive-fiction community spaces (e.g. relevant subreddits/Discords), given the scope and timeframe of this project.

## 2. Method

**Design.** Between-subjects, random assignment. Each participant plays the game exactly **once**, in exactly **one** condition (reactive or random control) — not both — so that no participant's rating of one condition is anchored by having just played the other. Condition is selected by which link a participant is given (`?mode=reactive` or `?mode=random`); links are distributed in alternating/counterbalanced order as participants are recruited, blind to the participant (the UI does not label which condition is "better" or name the independent variable).

**Participants.** Convenience/snowball sample of players of narrative-driven interactive fiction (see Target Audience above). Target of 16–20 participants total, split across both conditions, consistent with the scope and hours budgeted for this deliverable in the Research Proposal; this is treated as a pilot-scale comparison rather than a fully powered study, and that limitation is addressed explicitly in the Results and Discussion.

**Procedure.**
1. Participant receives a link to the game (pre-assigned to one condition) and a link to the post-play survey.
2. Participant plays through the game once (eight choice points; allow roughly 5–10 minutes).
3. Immediately after reaching an ending, the participant completes the survey (see `survey_instrument.md`) — timing matters here, since coherence judgments are being measured close to the experience, not from memory days later.
4. No condition is revealed to the participant before or during the survey.

**Instrument.** A short post-play questionnaire combining Likert-scale coherence items, a perceived-influence item (testing the "illusion of agency" effect described in Day & Zhu, 2017), and two open-ended qualitative questions. Full instrument in `survey_instrument.md`.

**Data handling.** Responses are collected anonymously (no identifying information requested). Each response is tagged only with its condition (`reactive`/`random`) and a response timestamp.

## 3. Analysis plan

- **Quantitative:** mean coherence score (average of the two Likert coherence items) compared between conditions (reactive vs random). Given the pilot sample size, this is reported descriptively with the appropriate non-parametric test (e.g. Mann–Whitney U, given the small sample and ordinal Likert data) rather than assuming normality.
- **Perceived-vs-actual influence check:** the influence item is reported separately for each condition to test whether participants in the *random* condition nonetheless over-estimate how much their choices shaped the story — an illusion-of-agency effect that would complicate a simple "reactive wins" interpretation even if coherence scores favour the reactive condition.
- **Qualitative:** open-ended responses are read for recurring themes (e.g. specific moments participants cite as coherent or jarring) to contextualise the quantitative result, not to replace it.
