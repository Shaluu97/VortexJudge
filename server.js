// Root launcher for VortexJudge Platform Server
// Implements early error catching and anti-crash fallback to prevent Render boot loops

process.on('uncaughtException', (err) => {
    console.error('[CRITICAL UNCAUGHT EXCEPTION]:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL UNHANDLED REJECTION]:', reason);
});

try {
    require('./src/server');
} catch (err) {
    console.error('[FATAL SERVER START ERROR]:', err);
    // Emergency server to keep the port open so Render does not crash-loop
    const http = require('http');
    const port = process.env.PORT || 3000;
    const emergencyServer = http.createServer((req, res) => {
        if (req.url === '/health' || req.url === '/ping') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ status: 'emergency_mode', error: err.message }));
        }
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('VortexJudge Server Startup Error:\n\n' + err.stack);
    });
    emergencyServer.listen(port, '0.0.0.0', () => {
        console.log(`[EMERGENCY SERVER]: Listening on 0.0.0.0:${port} to prevent Render crash loop.`);
    });
}
