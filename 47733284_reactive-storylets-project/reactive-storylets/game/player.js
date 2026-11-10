// Browser driver: runs the compiled Ink story, and splices in a
// storylet-pool selection step (via selector.js) after each choice.
//
// URL params:
//   ?mode=reactive (default) | random   -> the selection condition under test
//   ?debug=1                            -> researcher view: shows the condition,
//                                          the storylet selection log and a
//                                          restart button. Never shown to
//                                          evaluation participants.
//
// The page shows one "scene" at a time: the consequence of the player's last
// choice, the storylet the selector picked, and the next choice prompt.
// Earlier scenes are kept in a collapsible "Story so far" panel so players
// can look back when judging how well the story hangs together.

(function () {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') === 'random' ? 'random' : 'reactive';
    const debug = params.get('debug') === '1';
    if (debug) document.body.classList.add('debug');

    const TOTAL = window.StoryletSystem.tierCount; // choice points == tiers

    const sceneEl = document.getElementById('scene');
    const choicesEl = document.getElementById('choices');
    const progressLabel = document.getElementById('progress-label');
    const progressBar = document.getElementById('progress-bar');
    const historyEl = document.getElementById('history');
    const historyList = document.getElementById('history-list');
    const modeEl = document.getElementById('mode-label');
    const logEl = document.getElementById('selection-log');
    const restartBtn = document.getElementById('restart-btn');

    modeEl.textContent = mode === 'reactive'
        ? 'Condition: Reactive (selection matches the player\'s choices)'
        : 'Condition: Random control (selection ignores the player\'s choices)';

    let story = null;
    let tier = 0;          // storylet hand-offs completed so far
    let batch = [];        // paragraphs belonging to the scene being built
    let history = [];      // finished scenes: { paras, chosen }
    let keyHandler = null;

    function freshState() {
        return {
            trust: story.variablesState['trust'],
            ruthlessness: story.variablesState['ruthlessness']
        };
    }

    function logSelection(tierNum, storylet, state) {
        const li = document.createElement('li');
        li.textContent = `Tier ${tierNum} -> "${storylet.id}" ` +
            `(trust=${state.trust}, ruthlessness=${state.ruthlessness}, mode=${mode})`;
        logEl.appendChild(li);
    }

    // --- progress -------------------------------------------------------

    function buildProgressBar() {
        progressBar.innerHTML = '';
        for (let i = 0; i < TOTAL; i++) progressBar.appendChild(document.createElement('span'));
    }

    function updateProgress(finished) {
        const made = history.length;
        const segs = progressBar.children;
        for (let i = 0; i < segs.length; i++) {
            segs[i].className = i < made ? 'done' : (!finished && i === made ? 'current' : '');
            if (finished) segs[i].className = 'done';
        }
        progressLabel.textContent = finished ? 'Complete' : `Choice ${made + 1} of ${TOTAL}`;
    }

    // --- rendering ------------------------------------------------------

    function renderScene(paras, choices, finished) {
        sceneEl.innerHTML = '';
        choicesEl.innerHTML = '';
        choicesEl.style.animation = 'none';
        window.scrollTo(0, 0);

        paras.forEach((text, i) => {
            const p = document.createElement('p');
            p.textContent = text;
            p.style.animationDelay = `${i * 0.35}s`;
            // The last paragraph before a choice is the decision prompt.
            if (!finished && i === paras.length - 1) p.className = 'prompt';
            sceneEl.appendChild(p);
        });

        if (finished) {
            const end = document.createElement('p');
            end.className = 'the-end';
            end.textContent = '— The End —';
            end.style.animationDelay = `${paras.length * 0.35}s`;
            sceneEl.appendChild(end);
        } else {
            choices.forEach((choice, i) => {
                const btn = document.createElement('button');
                const key = document.createElement('span');
                key.className = 'key';
                key.textContent = String(i + 1);
                const label = document.createElement('span');
                label.textContent = choice.text;
                btn.appendChild(key);
                btn.appendChild(label);
                btn.addEventListener('click', () => choose(choice, paras));
                choicesEl.appendChild(btn);
            });
            // Reveal the choices after the scene text has faded in.
            void choicesEl.offsetWidth;
            choicesEl.style.animation = '';
            choicesEl.style.animationDelay = `${paras.length * 0.35}s`;
        }

        updateProgress(finished);
        renderHistory();
        bindKeys(finished ? [] : choices, paras);
    }

    function renderHistory() {
        historyList.innerHTML = '';
        history.forEach((scene, i) => {
            const wrap = document.createElement('div');
            wrap.className = 'history-scene';
            const label = document.createElement('div');
            label.className = 'label';
            label.textContent = `Scene ${i + 1}`;
            wrap.appendChild(label);
            scene.paras.forEach((t) => {
                const p = document.createElement('p');
                p.textContent = t;
                wrap.appendChild(p);
            });
            const chosen = document.createElement('div');
            chosen.className = 'chosen';
            chosen.textContent = `You chose: ${scene.chosen}`;
            wrap.appendChild(chosen);
            historyList.appendChild(wrap);
        });
        historyEl.hidden = history.length === 0;
    }

    function bindKeys(choices, paras) {
        if (keyHandler) document.removeEventListener('keydown', keyHandler);
        keyHandler = (e) => {
            const n = parseInt(e.key, 10);
            if (n >= 1 && n <= choices.length) choose(choices[n - 1], paras);
        };
        document.addEventListener('keydown', keyHandler);
    }

    // --- story flow -----------------------------------------------------

    function choose(choice, paras) {
        history.push({ paras: paras.slice(), chosen: choice.text });
        batch = [];
        story.ChooseChoiceIndex(choice.index);
        advance();
    }

    // Advances Ink until it needs a player choice, or has reached the end of
    // the story. When Ink runs out of content with no choices pending, that
    // is a storylet hand-off point: ask the selector which knot comes next.
    function advance() {
        while (true) {
            while (story.canContinue) {
                const line = story.Continue().trim();
                if (line.length > 0) batch.push(line);
            }
            if (story.currentChoices.length > 0) {
                renderScene(batch, story.currentChoices, false);
                return;
            }
            if (tier < TOTAL) {
                tier += 1;
                const state = freshState();
                const storylet = window.StoryletSystem.select(mode, tier, state);
                logSelection(tier, storylet, state);
                story.ChoosePathString(storylet.knot);
                continue;
            }
            renderScene(batch, [], true);
            return;
        }
    }

    function startStory() {
        sceneEl.innerHTML = '';
        choicesEl.innerHTML = '';
        logEl.innerHTML = '';
        history = [];
        batch = [];
        tier = 0;
        buildProgressBar();
        updateProgress(false);

        // story.js (generated by compile.js) embeds the story so the game also
        // works when index.html is opened directly from disk; fall back to
        // fetching story.json when served over http.
        const begin = (content) => { story = new inkjs.Story(content); advance(); };
        if (window.STORY_CONTENT) {
            begin(window.STORY_CONTENT);
        } else {
            fetch('story.json')
                .then((res) => res.json())
                .then(begin)
                .catch((err) => {
                    sceneEl.textContent = 'Failed to load the story: ' + err.message;
                    console.error(err);
                });
        }
    }

    restartBtn.addEventListener('click', startStory);

    // Loaded at the end of <body>, so the DOM is ready.
    startStory();
})();
