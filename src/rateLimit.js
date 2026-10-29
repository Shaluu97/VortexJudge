const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication / login endpoints.
 * Protects against brute-force attacks and credential stuffing.
 * Limit: 10 attempts per 15 minutes per IP.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 daqiqa
    max: 10, // 15 daqiqada har bir IP dan maksimal 10 ta urinish
    standardHeaders: true, // `RateLimit-*` sarlavhalari
    legacyHeaders: false, // `X-RateLimit-*` sarlavhalarini o'chirish
    statusCode: 429,
    message: {
        error: 'Juda ko‘p urinishlar aniqlandi. Xavfsizlik yuzasidan kirish 15 daqiqaga vaqtincha cheklandi. Iltimos, birozdan so‘ng qayta urinib ko‘ring.'
    }
});

/**
 * Rate limiter for code submissions and runner tests.
 * Protects against submission spam and compute exhaustion / DDoS.
 * Limit: 5 submissions per 30 seconds per IP.
 */
const submitLimiter = rateLimit({
    windowMs: 30 * 1000, // 30 soniya
    max: 5, // 30 soniyada har bir IP dan maksimal 5 ta yechim yuborish
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: 429,
    message: {
        error: 'Juda tez so‘rov yuborildi. Iltimos, server yuklamasini kamaytirish uchun keyingi yuborishdan oldin bir necha soniya kuting.'
    }
});

module.exports = {
    authLimiter,
    submitLimiter
};
