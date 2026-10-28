const db = require('../src/db');
const bcrypt = require('bcryptjs');

const contestId = 1000016;

for (let i = 1; i <= 15; i++) {
  const username = 'student' + String(i).padStart(2, '0');
  const password = 'pass' + String(i).padStart(2, '0');
  const fullName = "O'quvchi " + i;
  const hash = bcrypt.hashSync(password, 10);

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  let uid;
  if (!existing) {
    const res = db.prepare("INSERT INTO users (username, password_hash, full_name, role, plain_password) VALUES (?, ?, ?, 'user', ?)").run(username, hash, fullName, password);
    uid = res.lastInsertRowid;
  } else {
    uid = existing.id;
    db.prepare('UPDATE users SET password_hash = ?, plain_password = ? WHERE id = ?').run(hash, password, uid);
  }

  db.prepare("INSERT OR IGNORE INTO contest_participants (contest_id, user_id, is_official, is_registered, status) VALUES (?, ?, 1, 1, 'REGISTERED')").run(contestId, uid);
  console.log(`[OK] ${username} | ${password} | ${fullName}`);
}
console.log('Successfully seeded 15 student accounts and registered to contest 1000016!');
