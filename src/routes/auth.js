const express = require('express');
const router = express.Router();
const db = require('../db');
const { loginUser, logoutUser, hashPassword, updateUserSession } = require('../auth');
const { authLimiter } = require('../rateLimit');

router.post('/login', authLimiter, (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Login va parolni kiriting' });
    }

    const authRes = loginUser(username.trim(), password);
    if (!authRes) {
        return res.status(401).json({ error: 'Login yoki parol noto‘g‘ri' });
    }

    res.cookie('token', authRes.token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
    res.json({ success: true, token: authRes.token, user: authRes.user });
});

router.post('/logout', (req, res) => {
    const token = req.cookies?.token || req.headers['authorization']?.replace('Bearer ', '');
    logoutUser(token);
    res.clearCookie('token');
    res.json({ success: true });
});

router.get('/me', (req, res) => {
    if (req.user) {
        // Always fetch fresh profile info from DB to ensure real-time accuracy
        const userRow = db.prepare('SELECT id, username, full_name, role, rating, school, grade, theme FROM users WHERE id = ?').get(req.user.id);
        res.json({ authenticated: true, user: userRow || req.user });
    } else {
        res.json({ authenticated: false, user: null });
    }
});

router.get('/profile', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiyadan o‘tmagansiz' });
    }
    const userRow = db.prepare('SELECT id, username, full_name, role, rating, school, grade, theme FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, user: userRow || req.user });
});

const handleProfileUpdate = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiyadan o‘tmagansiz' });
    }

    const { username, full_name, school, grade, password, confirm_password } = req.body;

    if (!username || !username.trim()) {
        return res.status(400).json({ error: 'Foydalanuvchi nomi (login) kiritilishi shart' });
    }
    if (!full_name || !full_name.trim()) {
        return res.status(400).json({ error: 'Ism va Familiya (F.I.Sh) kiritilishi shart' });
    }

    const cleanUsername = username.trim();
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(cleanUsername, req.user.id);
    if (existing) {
        return res.status(400).json({ error: 'Ushbu foydalanuvchi nomi allaqachon band. Iltimos, boshqa login tanlang.' });
    }

    let updateSql = 'UPDATE users SET username = ?, full_name = ?, school = ?, grade = ?';
    const params = [cleanUsername, full_name.trim(), (school || '').trim(), (grade || '').trim()];

    if (password && password.trim().length > 0) {
        if (password.length < 4) {
            return res.status(400).json({ error: 'Yangi parol kamida 4 ta belgidan iborat bo‘lishi kerak' });
        }
        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Kiritilgan yangi parollar bir-biriga mos kelmadi' });
        }
        updateSql += ', password_hash = ?, plain_password = ?';
        params.push(hashPassword(password), '');
    }

    updateSql += ' WHERE id = ?';
    params.push(req.user.id);

    try {
        db.prepare(updateSql).run(...params);

        const updatedUser = db.prepare('SELECT id, username, full_name, role, rating, school, grade, theme FROM users WHERE id = ?').get(req.user.id);
        
        // Update live memory session
        updateUserSession(req.user.id, updatedUser);

        res.json({
            success: true,
            message: 'Profilingiz muvaffaqiyatli saqlandi!',
            user: updatedUser
        });
    } catch (err) {
        res.status(500).json({ error: 'Profilni saqlashda xatolik: ' + err.message });
    }
};

router.put('/profile', handleProfileUpdate);
router.post('/profile', handleProfileUpdate);

router.post('/setup-admin', authLimiter, (req, res) => {
    const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
    if (adminExists) {
        return res.status(400).json({ error: 'Administrator akkaunti allaqachon mavjud' });
    }

    const { username, password, full_name } = req.body;
    if (!username || !password || !full_name) {
        return res.status(400).json({ error: 'Barcha maydonlarni to‘ldiring' });
    }

    db.prepare(`
        INSERT INTO users (username, password_hash, full_name, role, rating)
        VALUES (?, ?, ?, 'admin', 2500)
    `).run(username.trim(), hashPassword(password), full_name.trim());

    res.json({ success: true, message: 'Administrator muvaffaqiyatli yaratildi' });
});

module.exports = router;
