const fs = require('fs');
const katexCode = fs.readFileSync('public/katex/katex.min.js', 'utf8');
const vm = require('vm');
const context = { window: {}, document: {} };
context.window = context;
vm.createContext(context);
vm.runInContext(katexCode, context);
const katex = context.katex;

function renderRich(raw) {
    const displayMath = [];
    const inlineMath = [];
    let text = raw.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => {
        displayMath.push(m);
        return '%%DM_' + (displayMath.length - 1) + '%%';
    });
    text = text.replace(/\$([^\$\n]+?)\$/g, (_, m) => {
        inlineMath.push(m);
        return '%%IM_' + (inlineMath.length - 1) + '%%';
    });
    
    // Markdown replacement
    text = text.replace(/%%DM_(\d+)%%/g, (_, i) => {
        return '<div class="math-formula-block">' + katex.renderToString(displayMath[i].trim(), { displayMode: true, throwOnError: false }) + '</div>';
    });
    text = text.replace(/%%IM_(\d+)%%/g, (_, i) => {
        return '<span class="math-formula">' + katex.renderToString(inlineMath[i].trim(), { displayMode: false, throwOnError: false }) + '</span>';
    });
    return text;
}

const input = 'Berilgan $1 \\le N \\le 10^5$ va massiv $a_1, a_2, \\dots, a_n$ uchun qiymatni toping:\n$$\\sum_{i=1}^n a_i$$';
const res = renderRich(input);
console.log('Result contains katex class:', res.includes('class="katex"'));
console.log('Result contains ≤:', res.includes('≤'));
console.log('Result sample:', res.substring(0, 300));
