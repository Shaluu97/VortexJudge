const assert = require('assert');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const db = require('../src/db');

async function run() {
    console.log('Testing End-to-End Subtask API & File Structure...');

    // 1. Authenticate as admin via login endpoint
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin2026' })
    });
    const loginData = await loginRes.json();
    assert(loginData.success, 'Admin login failed: ' + JSON.stringify(loginData));
    const token = loginData.token;
    const headers = {
        'Cookie': `token=${token}`,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. Create problem with subtask mode ON
    const code = 'PROB_SUB_' + Date.now();
    const createRes = await fetch('http://localhost:3000/api/admin/problems', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            code,
            title: 'Subtask E2E Problem',
            statement: 'Test statement for subtasks',
            input_format: 'Integers',
            output_format: 'Result',
            is_subtask: 1,
            has_subtasks: 1,
            subtasks: [
                { subtask_index: 1, score: 40 },
                { subtask_index: 2, score: 60 }
            ]
        })
    });
    const createData = await createRes.json();
    assert(createData.success, 'Problem creation failed: ' + JSON.stringify(createData));
    const problemId = createData.id;
    console.log(`✓ Problem created with ID: ${problemId}`);

    // 3. Verify subtasks endpoint
    const subRes = await fetch(`http://localhost:3000/api/admin/problems/${problemId}/subtasks`, { headers });
    const subData = await subRes.json();
    assert.strictEqual(subData.is_subtask, 1, 'is_subtask must be 1');
    assert.strictEqual(subData.subtasks.length, 2, 'Must return 2 subtasks');
    assert.strictEqual(subData.subtasks[0].subtask_index, 1, 'Subtask #1 index');
    assert.strictEqual(subData.subtasks[0].score, 40, 'Subtask #1 score must be 40');
    assert.strictEqual(subData.subtasks[1].subtask_index, 2, 'Subtask #2 index');
    assert.strictEqual(subData.subtasks[1].score, 60, 'Subtask #2 score must be 60');
    console.log('✓ GET /subtasks returned correct subtask list and scores');

    // 4. Test Subtask ZIP Upload
    const zip = new AdmZip();
    zip.addFile('1.in', Buffer.from('5 10\n', 'utf-8'));
    zip.addFile('1.out', Buffer.from('15\n', 'utf-8'));
    zip.addFile('2.in', Buffer.from('20 30\n', 'utf-8'));
    zip.addFile('2.out', Buffer.from('50\n', 'utf-8'));
    const zipBuffer = zip.toBuffer();

    const formHeaders = {
        'Cookie': `token=${token}`,
        'Authorization': `Bearer ${token}`
    };
    const blob = new Blob([zipBuffer], { type: 'application/zip' });
    const fd = new FormData();
    fd.append('zip_file', blob, 'subtask_1_tests.zip');

    const uploadRes = await fetch(`http://localhost:3000/api/admin/problems/${problemId}/subtasks/1/upload-zip`, {
        method: 'POST',
        headers: formHeaders,
        body: fd
    });
    const uploadData = await uploadRes.json();
    assert(uploadData.success, 'Subtask zip upload failed: ' + JSON.stringify(uploadData));
    assert.strictEqual(uploadData.count, 2, '2 test pairs should be extracted');
    console.log('✓ Subtask ZIP upload successfully extracted 2 testcases');

    // 5. Check directory on disk
    const subtaskDir = path.join(__dirname, '..', 'problems', String(problemId), 'subtasks', 'subtask_1');
    assert(fs.existsSync(subtaskDir), 'Directory problems/{id}/subtasks/subtask_1 must exist');
    assert(fs.existsSync(path.join(subtaskDir, '1.in')), '1.in must exist');
    assert(fs.existsSync(path.join(subtaskDir, '1.out')), '1.out must exist');
    console.log('✓ File system structure verified: problems/{id}/subtasks/subtask_1/1.in exists');

    // 6. Check subtasks endpoint reflects has_testcases
    const subResAfter = await fetch(`http://localhost:3000/api/admin/problems/${problemId}/subtasks`, { headers });
    const subDataAfter = await subResAfter.json();
    assert.strictEqual(subDataAfter.subtasks[0].has_testcases, 1, 'Subtask #1 must have has_testcases = 1');
    assert.strictEqual(subDataAfter.subtasks[0].tests_count, 2, 'Subtask #1 must have tests_count = 2');
    console.log('✓ Subtask status badge verified: has_testcases = 1, tests_count = 2');

    // 7. Delete Subtask #2
    const delRes = await fetch(`http://localhost:3000/api/admin/problems/${problemId}/subtasks/2`, {
        method: 'DELETE',
        headers
    });
    const delData = await delRes.json();
    assert(delData.success, 'Delete subtask failed');

    const subResFinal = await fetch(`http://localhost:3000/api/admin/problems/${problemId}/subtasks`, { headers });
    const subDataFinal = await subResFinal.json();
    assert.strictEqual(subDataFinal.subtasks.length, 1, 'Only 1 subtask should remain');
    assert.strictEqual(subDataFinal.subtasks[0].subtask_index, 1, 'Subtask #1 must remain');
    console.log('✓ Subtask #2 deleted, Subtask #1 preserved');

    // 8. Test ICPC upload
    const icpcZip = new AdmZip();
    icpcZip.addFile('1.in', Buffer.from('100\n', 'utf-8'));
    icpcZip.addFile('1.out', Buffer.from('200\n', 'utf-8'));
    const icpcBlob = new Blob([icpcZip.toBuffer()], { type: 'application/zip' });
    const icpcFd = new FormData();
    icpcFd.append('zip_file', icpcBlob, 'icpc_testcases.zip');

    const icpcRes = await fetch(`http://localhost:3000/api/admin/problems/${problemId}/upload-zip`, {
        method: 'POST',
        headers: formHeaders,
        body: icpcFd
    });
    const icpcData = await icpcRes.json();
    assert(icpcData.success, 'ICPC upload failed');
    const icpcDir = path.join(__dirname, '..', 'problems', String(problemId), 'tests');
    assert(fs.existsSync(icpcDir), 'Directory problems/{id}/tests must exist');
    console.log('✓ ICPC testcases upload and directory structure verified');

    // 9. Cleanup
    db.prepare('DELETE FROM subtasks WHERE problem_id = ?').run(problemId);
    db.prepare('DELETE FROM testcases WHERE problem_id = ?').run(problemId);
    db.prepare('DELETE FROM problems WHERE id = ?').run(problemId);
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    try {
        fs.rmSync(path.join(__dirname, '..', 'problems', String(problemId)), { recursive: true, force: true });
    } catch (_) {}

    console.log('ALL E2E SUBTASK & ICPC ARCHITECTURE TESTS PASSED! 🚀');
}

run().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
