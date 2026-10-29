const XLSX = require('xlsx');
const db = require('./db');
const { hashPassword } = require('./auth');

function generateRandomPassword(length = 8) {
    const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < length; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
}

function generateUniqueUsername(base = 'user') {
    let cleanBase = String(base).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanBase || cleanBase.length < 3) cleanBase = 'student';
    while (true) {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        const username = `${cleanBase}_${randNum}`;
        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (!existing) return username;
    }
}

function processExcelImport(fileBuffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
        throw new Error('Excel faylda yetarli ma‘lumot topilmadi (kamida sarlavha va 1 qator bo‘lishi kerak).');
    }

    const header = rows[0].map(h => String(h || '').trim().toLowerCase());
    
    // Find column indexes
    let idxIsm = header.findIndex(h => h.includes('ism') && !h.includes('familiya') && !h.includes('f.i.sh'));
    let idxFamiliya = header.findIndex(h => h.includes('familiya') || h.includes('familya'));
    let idxFish = header.findIndex(h => h.includes('f.i.sh') || h.includes('fish') || h.includes('to‘liq ism') || h.includes('fio'));
    let idxSinf = header.findIndex(h => h.includes('sinf') || h.includes('kurs') || h.includes('sinfi'));
    let idxMaktab = header.findIndex(h => h.includes('maktab') || h.includes('muassasa') || h.includes('maktabi') || h.includes('litsey'));

    // Fallbacks if header labels don't match
    if (idxIsm === -1 && idxFish === -1) idxIsm = 0;
    if (idxFamiliya === -1 && idxFish === -1 && rows[0].length > 1) idxFamiliya = 1;
    if (idxSinf === -1 && rows[0].length > 2) idxSinf = 2;
    if (idxMaktab === -1 && rows[0].length > 3) idxMaktab = 3;

    const createdUsers = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        let firstName = '';
        let lastName = '';
        let fullName = '';
        let sinf = idxSinf !== -1 && row[idxSinf] ? String(row[idxSinf]).trim() : '';
        let maktab = idxMaktab !== -1 && row[idxMaktab] ? String(row[idxMaktab]).trim() : 'Aniqlanmagan';

        if (idxFish !== -1 && row[idxFish]) {
            fullName = String(row[idxFish]).trim();
            const parts = fullName.split(/\s+/);
            lastName = parts[0] || '';
            firstName = parts.slice(1).join(' ') || '';
        } else {
            firstName = idxIsm !== -1 && row[idxIsm] ? String(row[idxIsm]).trim() : '';
            lastName = idxFamiliya !== -1 && row[idxFamiliya] ? String(row[idxFamiliya]).trim() : '';
            fullName = [lastName, firstName].filter(Boolean).join(' ').trim();
        }

        if (!fullName || fullName.length < 2) continue;

        const baseSlug = (firstName || lastName || 'student').toLowerCase().replace(/[^a-z]/g, '').substring(0, 8);
        const username = generateUniqueUsername(baseSlug);
        const plainPassword = generateRandomPassword(8);
        const passwordHash = hashPassword(plainPassword);

        db.prepare(`
            INSERT INTO users (username, password_hash, plain_password, full_name, first_name, last_name, school, grade, role, rating)
            VALUES (?, ?, '', ?, ?, ?, ?, ?, 'user', 1200)
        `).run(username, passwordHash, fullName, firstName, lastName, maktab, sinf);

        createdUsers.push({
            index: createdUsers.length + 1,
            fullName,
            firstName,
            lastName,
            school: maktab,
            grade: sinf,
            username,
            password: plainPassword
        });
    }

    if (createdUsers.length === 0) {
        throw new Error('Fayldan birorta ham foydalanuvchi ma‘lumoti o‘qib olinmadi.');
    }

    // Build downloadable Excel workbook
    const outputData = [
        ['№', 'Ism va Familiya', 'Maktab', 'Sinf', 'Login', 'Parol']
    ];

    for (const u of createdUsers) {
        outputData.push([u.index, u.fullName, u.school, u.grade, u.username, u.password]);
    }

    const newWs = XLSX.utils.aoa_to_sheet(outputData);
    newWs['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 25 }, { wch: 10 }, { wch: 18 }, { wch: 15 }];

    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newWs, 'O‘quvchilar ro‘yxati');

    const outBuffer = XLSX.write(newWb, { type: 'buffer', bookType: 'xlsx' });

    return {
        count: createdUsers.length,
        users: createdUsers,
        excelBuffer: outBuffer
    };
}

function generateExcelTemplate() {
    const templateData = [
        ['Familiyasi', 'Ismi', 'Maktabi', 'Sinfi'],
        ['Aliyev', 'Vali', '1-maktab', '9-A'],
        ['Karimova', 'Zilola', 'Prezident maktabi', '10-B'],
        ['Toshmatov', 'Anvar', '15-IDUM', '11-A']
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 25 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Oquvchilar_Shablon');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function exportUsersListToExcel(users) {
    const outputData = [
        ['№', 'Ism va Familiya', 'Maktab', 'Sinf', 'Login', 'Parol', 'Roli', 'Reyting', 'Yechilgan masalalar']
    ];

    users.forEach((u, i) => {
        const pwd = '••••••••';
        outputData.push([
            i + 1,
            u.full_name || '',
            u.school || '',
            u.grade || '',
            u.username,
            pwd,
            u.role === 'admin' ? 'Administrator' : 'Ishtirokchi',
            u.rating || 1200,
            u.solved_count || 0
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(outputData);
    ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 25 }, { wch: 10 }, { wch: 20 }, { wch: 16 }, { wch: 15 }, { wch: 12 }, { wch: 18 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Barcha foydalanuvchilar');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
    processExcelImport,
    generateExcelTemplate,
    exportUsersListToExcel
};
