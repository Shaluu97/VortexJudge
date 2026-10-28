const express = require('express');
const path = require('path');
const os = require('os');
const cookieParser = require('cookie-parser');

const db = require('./db');
const { authenticateToken } = require('./auth');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Global error logging to prevent server crash
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED REJECTION]:', reason);
});

// CORS middleware for algo.xorazmiy.uz and local development
const ALLOWED_ORIGINS = [
    'http://algo.xorazmiy.uz',
    'http://algo.xorazmiy.uz:3000',
    'https://algo.xorazmiy.uz',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.xorazmiy.uz') || origin.endsWith('.xorazmiy.uz:3000'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/vendor/monaco-editor', express.static(path.join(__dirname, '..', 'node_modules', 'monaco-editor', 'min')));
app.use(authenticateToken);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

// View Routes
const viewsDir = path.join(__dirname, '..', 'views');

app.get('/', (req, res) => res.sendFile(path.join(viewsDir, 'index.html')));
app.get('/problems', (req, res) => res.sendFile(path.join(viewsDir, 'problems.html')));
app.get('/problems/:code', (req, res) => {
    const prob = db.prepare('SELECT id, is_public, is_secret, visibility FROM problems WHERE (code = ? OR id = ?) AND is_active = 1').get(req.params.code, req.params.code);
    if (!prob) {
        return res.status(404).sendFile(path.join(viewsDir, 'problem_solve.html'));
    }
    const isAdmin = req.user && req.user.role === 'admin';
    const isPublic = prob.is_public === 1 && (prob.is_secret === 0 || prob.is_secret === null) && (prob.visibility === 'public' || prob.visibility === null);
    if (!isPublic && !isAdmin) {
        return res.status(403).send(`
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>403 — Maxfiy Masala</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:var(--bg-main,#020817);color:var(--text-main,#f8fafc);font-family:system-ui,-apple-system,sans-serif;">
  <div style="text-align:center;max-width:520px;padding:2.5rem 2rem;background:var(--bg-card,#101929);border-radius:12px;border:1px solid rgba(255,255,255,0.08);box-shadow:0 10px 30px rgba(0,0,0,0.4);">
    <div style="font-size:3rem;margin-bottom:0.75rem;">🔒</div>
    <h1 style="font-size:1.5rem;font-weight:700;color:#ef4444;margin:0 0 0.75rem 0;">403 — Maxfiy Masala</h1>
    <p style="font-size:0.95rem;color:var(--text-muted,#94a3b8);line-height:1.6;margin:0 0 1.75rem 0;">
      Ushbu masala maxfiy hisoblanadi va umumiy katalogda ko‘rsatilmaydi. U faqat tegishli olimpiada doirasida ro‘yxatdan o‘tgan ishtirokchilar uchun mavjud.
    </p>
    <a href="/problems" class="btn btn-primary" style="display:inline-block;padding:0.6rem 1.4rem;text-decoration:none;font-weight:600;border-radius:8px;">← Masalalar ro‘yxatiga qaytish</a>
  </div>
</body>
</html>
        `);
    }
    res.sendFile(path.join(viewsDir, 'problem_solve.html'));
});
app.get('/submissions', (req, res) => res.sendFile(path.join(viewsDir, 'submissions.html')));
app.get('/submissions/:id', (req, res) => res.sendFile(path.join(viewsDir, 'submission_view.html')));
app.get(['/contests', '/olympiads'], (req, res) => res.sendFile(path.join(viewsDir, 'contests.html')));
app.get(['/contests/:id', '/olympiads/:id', '/olympiads/:id/problems'], (req, res) => res.sendFile(path.join(viewsDir, 'contests.html')));
app.get(['/contests/:contestId/problems/:problemId', '/olympiads/:contestId/problems/:problemId'], (req, res) => res.sendFile(path.join(viewsDir, 'contest_problem_solve.html')));
app.get('/users', (req, res) => res.sendFile(path.join(viewsDir, 'users.html')));
app.get('/how-it-works', (req, res) => res.sendFile(path.join(viewsDir, 'how_it_works.html')));
app.get('/login', (req, res) => res.sendFile(path.join(viewsDir, 'login.html')));
app.get('/admin/setup', (req, res) => res.sendFile(path.join(viewsDir, 'admin_setup.html')));
app.get('/admin/register', (req, res) => res.sendFile(path.join(viewsDir, 'admin_setup.html')));
app.get('/admin', (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.sendFile(path.join(viewsDir, 'admin.html'));
});

app.get([
    '/admin/contest-workspace',
    '/admin/contests/workspace',
    '/admin/contests/:id/manage',
    '/olympiads/edit/:id',
    '/admin/olympiads/edit/:id',
    '/olympiads/create',
    '/admin/olympiads/create'
], (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.sendFile(path.join(viewsDir, 'contest_workspace.html'));
});

// Detect LAN IP
function getLanIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                // Ignore virtual / apipa IPs if normal 192.168 or 10.x exists
                if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.')) {
                    return iface.address;
                }
            }
        }
    }
    // Fallback to first non-internal IPv4
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const LAN_IP = getLanIp();

app.listen(PORT, '0.0.0.0', () => {
    console.log('\n--------------------------------------------------');
    console.log('PLATFORMA SERVERI MUVAFFAQIYATLI ISHGA TUSHDI');
    console.log(`Asosiy manzil:  http://localhost:${PORT}`);
    console.log(`Lokal IP (LAN): http://${LAN_IP}:${PORT}`);
    console.log(`Admin panel:    http://localhost:${PORT}/admin`);
    console.log(`Loyiha papkasi: ${path.resolve(__dirname, '..')}`);
    console.log('--------------------------------------------------\n');
});
