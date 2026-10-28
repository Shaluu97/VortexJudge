const assert = require('assert');

// Simulate DOM serialization
function serializeVisual(nodes) {
    let out = '';
    nodes.forEach(n => {
        if (n.type === 'text') {
            out += n.text;
        } else if (n.type === 'math') {
            if (n.display) {
                out += '\n$$' + n.tex + '$$\n';
            } else {
                out += '$' + n.tex + '$';
            }
        } else if (n.type === 'br') {
            out += '\n';
        }
    });
    return out;
}

const mockNodes = [
    { type: 'text', text: 'Cheklov: ' },
    { type: 'math', tex: '1 \\le N \\le 10^5', display: false },
    { type: 'text', text: ' va yig‘indi:' },
    { type: 'math', tex: '\\sum_{i=1}^n a_i', display: true }
];

const serialized = serializeVisual(mockNodes);
console.log('Serialized text:');
console.log(serialized);

assert.ok(serialized.includes('$1 \\le N \\le 10^5$'));
assert.ok(serialized.includes('$$\\sum_{i=1}^n a_i$$'));
console.log('✓ Serialization works accurately!');
