const assert = require('assert');
const AdmZip = require('adm-zip');

async function testGeneratorSuite() {
    console.log('Testing Complete Testcase Generator Suite...');

    // 1. Authenticate as admin via login endpoint
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin2026' })
    });
    const loginData = await loginRes.json();
    assert(loginData.success, 'Admin login failed');
    const token = loginData.token;
    const headers = {
        'Cookie': `token=${token}`,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. Normal JS generator run
    const defaultCode = `
function generateInputAndOutput() {
    const a = Math.floor(Math.random() * 100) + 1;
    const b = Math.floor(Math.random() * 100) + 1;
    const input = \`\${a} \${b}\`;
    const output = \`\${a + b}\`;
    return { input, output };
}

const tests = [];
const count = 10;
for (let i = 0; i < count; i++) {
    tests.push(generateInputAndOutput());
}
return tests;
    `;

    const res1 = await fetch('http://localhost:3000/api/admin/generator/run', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: defaultCode })
    });
    assert.strictEqual(res1.status, 200);
    const data1 = await res1.json();
    assert.strictEqual(data1.success, true);
    assert.strictEqual(data1.tests.length, 10);
    assert(data1.tests[0].input.includes(' '));
    console.log('✓ Normal run returned 10 valid tests');

    // 3. Error handling: syntax error
    const resBadSyntax = await fetch('http://localhost:3000/api/admin/generator/run', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: 'function broken { return 42;' })
    });
    assert.strictEqual(resBadSyntax.status, 400);
    const dataBad = await resBadSyntax.json();
    assert(dataBad.error, 'Should have error message');
    console.log('✓ Syntax error caught properly:', dataBad.error);

    // 4. Error handling: infinite loop timeout
    const resTimeout = await fetch('http://localhost:3000/api/admin/generator/run', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: 'while (true) {}' })
    });
    assert.strictEqual(resTimeout.status, 400);
    console.log('✓ Infinite loop caught via VM timeout');

    // 5. ZIP download test with manual edits
    const manualTests = [
        { input: '10 20\n', output: '30\n' },
        { input: '99 1\n', output: '100\n' },
        { input: '0 0\n', output: '0\n' }
    ];

    const resZip = await fetch('http://localhost:3000/api/admin/generator/download-zip', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tests: manualTests })
    });
    assert.strictEqual(resZip.status, 200);
    assert.strictEqual(resZip.headers.get('content-type'), 'application/zip');
    
    const arrayBuffer = await resZip.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));
    const entries = zip.getEntries();
    assert.strictEqual(entries.length, 6);
    
    const entryNames = entries.map(e => e.entryName).sort();
    assert.deepStrictEqual(entryNames, [
        '0001.in', '0001.out',
        '0002.in', '0002.out',
        '0003.in', '0003.out'
    ]);

    // Check content of 0001.in and 0001.out
    const in1 = zip.readAsText('0001.in');
    const out1 = zip.readAsText('0001.out');
    assert.strictEqual(in1, '10 20\n');
    assert.strictEqual(out1, '30\n');
    console.log('✓ ZIP contains accurate padded files and content');

    // 6. Empty test download rejection
    const resEmptyZip = await fetch('http://localhost:3000/api/admin/generator/download-zip', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tests: [] })
    });
    assert.strictEqual(resEmptyZip.status, 400);
    console.log('✓ Empty test list rejection handled properly');

    console.log('🎉 ALL TESTCASE GENERATOR TESTS PASSED 100%!');
}

testGeneratorSuite().catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
