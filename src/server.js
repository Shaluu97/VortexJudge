// Global error logging to prevent crashes before server binds to port
process.on('uncaughtException', (err) => {
    console.error('[CRITICAL UNCAUGHT EXCEPTION]:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL UNHANDLED REJECTION]:', reason);
});

const express = require('express');
const path = require('path');
const os = require('os');
const cookieParser = require('cookie-parser');

const db = require('./db');
const { authenticateToken, ensureAdminUser } = require('./auth');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (Render, Cloudflare, Kubernetes) for accurate client IP rate limiting
app.set('trust proxy', 1);

// Ensure admin user exists with credentials from Render Environment (or temporary secure token)
ensureAdminUser(db);

// Health check endpoints for Render, Kubernetes, Uptime monitors (responds before any auth/middleware)
app.get(['/health', '/api/health', '/ping'], (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'vortexjudge',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: db && typeof db.prepare === 'function' ? 'connected' : 'error',
        cloud_postgres: db.postgres ? db.postgres.getStatus() : { configured: false }
    });
});

// Initialize Cloud PostgreSQL integration (async, non-blocking)
if (db && db.postgres) {
    db.postgres.initPostgres(db).catch(err => {
        console.error('[PostgreSQL Startup Init Error]:', err.message);
    });
}

// Universal Production & Development CORS middleware
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        res.setHeader('Access-Control-Expose-Headers', 'Authorization');
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
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
    try {
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
    } catch (err) {
        res.sendFile(path.join(viewsDir, 'problem_solve.html'));
    }
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

// Detect LAN IP safely
function getLanIp() {
    try {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.')) {
                        return iface.address;
                    }
                }
            }
        }
    } catch (_) {}
    return '127.0.0.1';
}

const LAN_IP = getLanIp();

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n--------------------------------------------------');
    console.log('PLATFORMA SERVERI MUVAFFAQIYATLI ISHGA TUSHDI');
    console.log(`Port:           ${PORT}`);
    console.log(`Host:           0.0.0.0`);
    console.log(`Asosiy manzil:  http://0.0.0.0:${PORT}`);
    console.log(`Lokal IP (LAN): http://${LAN_IP}:${PORT}`);
    console.log(`Health check:   http://0.0.0.0:${PORT}/health`);
    console.log(`Admin panel:    http://0.0.0.0:${PORT}/admin`);
    console.log(`Loyiha papkasi: ${path.resolve(__dirname, '..')}`);
    console.log('--------------------------------------------------\n');
});

server.on('error', (err) => {
    console.error('[HTTP SERVER ERROR]:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[SYSTEM]: SIGTERM signal received: closing HTTP server gracefully...');
    server.close(() => {
        console.log('[SYSTEM]: HTTP server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('[SYSTEM]: SIGINT signal received: closing HTTP server gracefully...');
    server.close(() => {
        console.log('[SYSTEM]: HTTP server closed.');
        process.exit(0);
    });
});

module.exports = { app, server };
