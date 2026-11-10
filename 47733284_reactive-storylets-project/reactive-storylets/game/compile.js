// Compiles story.ink -> story.json using inkjs's bundled compiler.
const fs = require('fs');
const path = require('path');
const { Compiler } = require('inkjs/compiler/Compiler');

const inkPath = path.join(__dirname, 'story.ink');
const outPath = path.join(__dirname, 'story.json');

const inkSource = fs.readFileSync(inkPath, 'utf8');

const compiler = new Compiler(inkSource, {
    errorHandler: (message, type) => {
        console.error(`[Ink ${type}] ${message}`);
    }
});

const story = compiler.Compile();
const json = story.ToJson();

fs.writeFileSync(outPath, json);

// Also emit the story as a script file so index.html works when opened
// straight from disk (file:// pages cannot fetch() story.json).
const jsPath = path.join(__dirname, 'story.js');
fs.writeFileSync(jsPath, 'window.STORY_CONTENT = ' + json + ';\n');
console.log(`Compiled ${inkPath} -> ${outPath} (${json.length} bytes)`);
