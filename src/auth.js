const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

const sessions = new Map(); // token -> user

function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

function isApiRequest(req) {
    const url = req.originalUrl || req.url || '';
    const base = req.baseUrl || '';
    const path = req.path || '';
    return url.startsWith('/api') || 
           base.startsWith('/api') || 
           path.startsWith('/api') ||
           (req.headers['accept'] && req.headers['accept'].includes('application/json')) ||
           Boolean(req.xhr);
}

function ensureAdminUser(database = db) {
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
    let adminPassword = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : null;
    let isTemporary = false;

    if (!adminPassword) {
        // Generate secure 16-character random hex token if not provided in environment
        adminPassword = crypto.randomBytes(8).toString('hex');
        isTemporary = true;
    }

    const passwordHash = hashPassword(adminPassword);

    try {
        const existing = database.prepare("SELECT id, username FROM users WHERE role = 'admin' OR username = ?").get(adminUsername);
        if (existing) {
            database.prepare(`
                UPDATE users 
                SET username = ?, password_hash = ?, plain_password = '', role = 'admin'
                WHERE id = ?
            `).run(adminUsername, passwordHash, existing.id);
        } else {
            database.prepare(`
                INSERT INTO users (username, password_hash, plain_password, full_name, role, rating)
                VALUES (?, ?, '', 'Administrator', 'admin', 2500)
            `).run(adminUsername, passwordHash);
        }

        // Wipe plain_password across all users in DB to enforce hashed storage
        database.prepare("UPDATE users SET plain_password = '' WHERE plain_password IS NOT NULL AND plain_password != ''").run();

        if (isTemporary) {
            console.warn('\n================================================================');
            console.warn('⚠️  XAVFSIZLIK OGOHLANTIRISHI (SECURITY WARNING):');
            console.warn('ADMIN_PASSWORD muhit o‘zgaruvchisi (Environment Variable) belgilanmagan!');
            console.warn('Xavfsiz vaqtinchalik admin hisobi yaratildi:');
            console.warn(`   Admin Login:  ${adminUsername}`);
            console.warn(`   Admin Parol:  ${adminPassword}`);
            console.warn('Iltimos, Render.com Dashboard -> Environment sozlamalarida ADMIN_USERNAME va ADMIN_PASSWORD ni kiritib qo‘ying!');
            console.warn('================================================================\n');
        } else {
            console.log(`[AUTH/SECURITY]: Admin hisobi muvaffaqiyatli yangilandi: "${adminUsername}"`);
        }
    } catch (e) {
        console.error('[AUTH/SECURITY] ensureAdminUser xatosi:', e.message);
    }
}

function loginUser(username, password) {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return null;
    let valid = false;
    try {
        if (user.password_hash) {
            valid = comparePassword(password, user.password_hash);
        }
    } catch (_) {}
    if (!valid && user.plain_password && String(user.plain_password).trim() === String(password).trim()) {
        valid = true;
        try {
            db.prepare("UPDATE users SET password_hash = ?, plain_password = '' WHERE id = ?").run(hashPassword(password), user.id);
        } catch (_) {}
    }
    if (!valid) return null;

    const token = generateToken();
    const sessionUser = {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        rating: user.rating,
        school: user.school || '',
        grade: user.grade || '',
        theme: user.theme || 'light'
    };
    sessions.set(token, sessionUser);
    try {
        db.prepare('INSERT OR REPLACE INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);
    } catch (e) {
        console.error('Session DB save error:', e.message);
    }
    return { token, user: sessionUser };
}

function updateUserSession(userId, updatedData) {
    for (const [token, sUser] of sessions.entries()) {
        if (sUser && sUser.id === userId) {
            Object.assign(sUser, updatedData);
        }
    }
}

function authenticateToken(req, res, next) {
    const token = req.cookies?.token || req.headers['authorization']?.replace('Bearer ', '');
    if (token) {
        if (sessions.has(token)) {
            req.user = sessions.get(token);
        } else {
            try {
                const user = db.prepare(`
                    SELECT u.id, u.username, u.full_name, u.role, u.rating, u.school, u.grade, u.theme 
                    FROM sessions s 
                    JOIN users u ON s.user_id = u.id 
                    WHERE s.token = ?
                `).get(token);
                if (user) {
                    user.theme = user.theme || 'light';
                    user.school = user.school || '';
                    user.grade = user.grade || '';
                    sessions.set(token, user);
                    req.user = user;
                } else {
                    req.user = null;
                }
            } catch (e) {
                req.user = null;
            }
        }
    } else {
        req.user = null;
    }
    next();
}

function requireAuth(req, res, next) {
    if (!req.user) {
        if (isApiRequest(req)) {
            return res.status(401).json({ error: 'Avtorizatsiyadan o‘tmagansiz. Kod yuborish uchun avval tizimga kiring.' });
        }
        return res.redirect('/login');
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        if (isApiRequest(req)) {
            return res.status(403).json({ error: 'Faqat administrator uchun ruxsat berilgan' });
        }
        return res.redirect('/login');
    }
    next();
}

function logoutUser(token) {
    if (token) {
        sessions.delete(token);
        try {
            db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
        } catch (e) {}
    }
}

module.exports = {
    hashPassword,
    comparePassword,
    ensureAdminUser,
    loginUser,
    logoutUser,
    authenticateToken,
    requireAuth,
    requireAdmin,
    updateUserSession
};
