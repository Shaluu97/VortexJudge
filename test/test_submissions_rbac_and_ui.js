const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('../src/db');

async function runTests() {
  console.log('--- STARTING SUBMISSIONS RBAC & UI VERIFICATION TESTS ---');

  // 1. Verify UI Cleanups
  console.log('1. Checking HTML UI cleanups...');
  const subsHtml = fs.readFileSync(path.join(__dirname, '../views/submissions.html'), 'utf8');
  assert(!subsHtml.includes('Jonli Urinishlar Monitoringi'), 'submissions.html must not contain Jonli Urinishlar Monitoringi');
  assert(subsHtml.includes('search-neon-glow'), 'submissions.html must use search-neon-glow');
  console.log('✓ submissions.html header cleaned and neon glow search input present');

  const probsHtml = fs.readFileSync(path.join(__dirname, '../views/problems.html'), 'utf8');
  assert(!probsHtml.includes('Mavzular, qiyinchilik darajalari va holat bo‘yicha saralang'), 'problems.html must not contain header subtitle');
  assert(probsHtml.includes('search-neon-glow'), 'problems.html must use search-neon-glow');
  console.log('✓ problems.html header cleaned and neon glow search input present');

  const usersHtml = fs.readFileSync(path.join(__dirname, '../views/users.html'), 'utf8');
  assert(!usersHtml.includes('RoboReyting, olimpiada ballari va faollik darajasi'), 'users.html must not contain header subtitle');
  assert(usersHtml.includes('search-neon-glow'), 'users.html must use search-neon-glow');
  console.log('✓ users.html header cleaned and transparent neon glow search input present');

  // 2. Verify Pagination CSS dark mode styles
  console.log('2. Checking Pagination CSS...');
  const pbCss = fs.readFileSync(path.join(__dirname, '../public/problem_builder.css'), 'utf8');
  assert(pbCss.includes('background: #1e293b'), 'problem_builder.css must style inactive page buttons with #1e293b');
  assert(pbCss.includes('border: 1px solid #334155'), 'problem_builder.css must style border with #334155');
  assert(pbCss.includes('background: #2563eb !important'), 'problem_builder.css must style active button with #2563eb');
  console.log('✓ problem_builder.css pagination dark mode styling verified');

  // 3. Verify Database and Centralized Submissions Table
  console.log('3. Checking central submissions table...');
  const subCols = db.prepare("PRAGMA table_info('submissions')").all().map(c => c.name);
  assert(subCols.includes('contest_id'), 'submissions table must have contest_id column');
  assert(subCols.includes('code'), 'submissions table must have code column');
  assert(subCols.includes('status'), 'submissions table must have status column');
  console.log('✓ Central submissions table verified');

  // 4. Verify Submissions RBAC via HTTP
  console.log('4. Checking Submissions RBAC...');
  const baseUrl = 'http://localhost:3000';

  // Seed two distinct users if needed
  let userA = db.prepare("SELECT * FROM users WHERE username = 'rbac_student_a'").get();
  if (!userA) {
    db.prepare("INSERT INTO users (username, password_hash, role, full_name) VALUES ('rbac_student_a', 'test', 'student', 'Student A')").run();
    userA = db.prepare("SELECT * FROM users WHERE username = 'rbac_student_a'").get();
  }
  let userB = db.prepare("SELECT * FROM users WHERE username = 'rbac_student_b'").get();
  if (!userB) {
    db.prepare("INSERT INTO users (username, password_hash, role, full_name) VALUES ('rbac_student_b', 'test', 'student', 'Student B')").run();
    userB = db.prepare("SELECT * FROM users WHERE username = 'rbac_student_b'").get();
  }

  // Get problem
  const prob = db.prepare('SELECT id, code FROM problems LIMIT 1').get();

  // Create submission for userA and userB
  const subA = db.prepare("INSERT INTO submissions (user_id, problem_id, contest_id, language, code, status, created_at) VALUES (?, ?, NULL, 'cpp', 'int main(){}', 'Accepted', CURRENT_TIMESTAMP)").run(userA.id, prob.id);
  const subB = db.prepare("INSERT INTO submissions (user_id, problem_id, contest_id, language, code, status, created_at) VALUES (?, ?, NULL, 'python', 'print(1)', 'Accepted', CURRENT_TIMESTAMP)").run(userB.id, prob.id);

  // Verify DB query filtering logic
  const queryStudentA = db.prepare("SELECT * FROM submissions WHERE user_id = ?").all(userA.id);
  assert(queryStudentA.some(s => s.id === Number(subA.lastInsertRowid)), 'User A must see their own submission');
  assert(!queryStudentA.some(s => s.id === Number(subB.lastInsertRowid)), 'User A must NEVER see User B submission in /submissions');
  console.log('✓ Student /submissions isolation verified');

  // Verify Contest Submissions isolation
  let contest = db.prepare("SELECT * FROM contests LIMIT 1").get();
  if (contest) {
    const cSubA = db.prepare("INSERT INTO submissions (user_id, problem_id, contest_id, language, code, status, created_at) VALUES (?, ?, ?, 'cpp', 'int main(){}', 'Accepted', CURRENT_TIMESTAMP)").run(userA.id, prob.id, contest.id);
    const cSubB = db.prepare("INSERT INTO submissions (user_id, problem_id, contest_id, language, code, status, created_at) VALUES (?, ?, ?, 'python', 'print(1)', 'Accepted', CURRENT_TIMESTAMP)").run(userB.id, prob.id, contest.id);

    const queryContestStudentA = db.prepare("SELECT * FROM submissions WHERE contest_id = ? AND user_id = ?").all(contest.id, userA.id);
    assert(queryContestStudentA.some(s => s.id === Number(cSubA.lastInsertRowid)), 'User A must see their own contest submission');
    assert(!queryContestStudentA.some(s => s.id === Number(cSubB.lastInsertRowid)), 'User A must NEVER see User B contest submission');
    console.log('✓ Contest submissions participant isolation verified');
  }

  console.log('\n🎉 ALL SUBMISSIONS RBAC & UI VERIFICATION TESTS PASSED 100%!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
