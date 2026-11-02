/**
 * VortexJudge Editorial SVG Generator
 * Generates secure, syntax-highlighted SVG image snapshots of problem solutions
 * (C++, Python 3, Java 21) preventing direct text copying.
 */

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

const CPP_KEYWORDS = new Set([
    '#include', '#define', '#ifdef', '#ifndef', '#endif',
    'using', 'namespace', 'std', 'int', 'long', 'double', 'float', 'char', 'bool',
    'void', 'auto', 'vector', 'string', 'pair', 'map', 'set', 'queue', 'stack',
    'if', 'else', 'for', 'while', 'do', 'return', 'cin', 'cout', 'endl',
    'true', 'false', 'const', 'struct', 'class', 'public', 'private', 'sizeof'
]);

const PY_KEYWORDS = new Set([
    'import', 'from', 'as', 'def', 'class', 'return', 'if', 'elif', 'else',
    'for', 'while', 'in', 'and', 'or', 'not', 'is', 'print', 'input',
    'int', 'str', 'float', 'list', 'dict', 'set', 'len', 'range', 'sum',
    'min', 'max', 'True', 'False', 'None', 'sys', 'math', '__name__'
]);

const JAVA_KEYWORDS = new Set([
    'public', 'private', 'protected', 'class', 'static', 'void', 'main',
    'new', 'return', 'if', 'else', 'for', 'while', 'int', 'long', 'double',
    'boolean', 'char', 'String', 'Scanner', 'System', 'out', 'println',
    'print', 'true', 'false', 'import', 'java', 'util', 'Math', 'Arrays'
]);

function tokenizeLine(line, lang) {
    const tokens = [];
    const keywords = lang === 'py' || lang === 'python' ? PY_KEYWORDS :
                     lang === 'java' ? JAVA_KEYWORDS : CPP_KEYWORDS;
    const commentChar = lang === 'py' || lang === 'python' ? '#' : '//';

    let i = 0;
    while (i < line.length) {
        // Line comment
        if (line.substr(i, commentChar.length) === commentChar) {
            tokens.push({ type: 'comment', text: line.substring(i) });
            break;
        }

        // Strings
        if (line[i] === '"' || line[i] === "'") {
            const quote = line[i];
            let str = quote;
            i++;
            while (i < line.length && line[i] !== quote) {
                if (line[i] === '\\' && i + 1 < line.length) {
                    str += line[i] + line[i + 1];
                    i += 2;
                } else {
                    str += line[i];
                    i++;
                }
            }
            if (i < line.length) {
                str += line[i];
                i++;
            }
            tokens.push({ type: 'string', text: str });
            continue;
        }

        // Numbers
        if (/\d/.test(line[i]) && (i === 0 || /[^a-zA-Z0-9_]/.test(line[i - 1]))) {
            let num = '';
            while (i < line.length && /[\d\.]/.test(line[i])) {
                num += line[i];
                i++;
            }
            tokens.push({ type: 'number', text: num });
            continue;
        }

        // Identifiers / Keywords
        if (/[a-zA-Z_#]/.test(line[i])) {
            let word = '';
            while (i < line.length && /[a-zA-Z0-9_#]/.test(line[i])) {
                word += line[i];
                i++;
            }
            if (keywords.has(word)) {
                tokens.push({ type: 'keyword', text: word });
            } else {
                tokens.push({ type: 'identifier', text: word });
            }
            continue;
        }

        // Symbols / whitespace
        let sym = line[i];
        i++;
        while (i < line.length && !/[a-zA-Z0-9_#"'/\d]/.test(line[i])) {
            if (line.substr(i, commentChar.length) === commentChar) break;
            sym += line[i];
            i++;
        }
        tokens.push({ type: 'symbol', text: sym });
    }

    return tokens;
}

function getColorForType(type) {
    switch (type) {
        case 'keyword': return '#38bdf8'; // light sky blue
        case 'string': return '#a3e635';  // lime green
        case 'number': return '#fb923c';  // orange
        case 'comment': return '#64748b'; // muted slate grey
        case 'symbol': return '#94a3b8';  // slate grey
        default: return '#f1f5f9';        // white / off-white
    }
}

/**
 * Generates an SVG image string for the given code.
 * @param {string} codeText
 * @param {string} lang e.g. 'cpp', 'python', 'java'
 * @param {string} title e.g. "C++20 Rasmiy Yechim"
 * @returns {string} SVG xml string
 */
function generateCodeSvg(codeText, lang = 'cpp', title = 'Rasmiy Yechim') {
    const rawLines = String(codeText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const lines = rawLines.length > 0 ? rawLines : ['// Kod mavjud emas'];

    const lineHeight = 22;
    const headerHeight = 36;
    const gutterWidth = 50;
    const paddingRight = 30;
    const paddingBottom = 16;

    // Approximate max line character length to estimate SVG width
    let maxLen = 0;
    for (const l of lines) {
        if (l.length > maxLen) maxLen = l.length;
    }
    const charWidth = 8.4;
    const width = Math.max(680, Math.round(gutterWidth + (maxLen * charWidth) + paddingRight));
    const height = headerHeight + (lines.length * lineHeight) + paddingBottom;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#0f172a; border-radius:10px; font-family:'JetBrains Mono', Consolas, 'Courier New', monospace; font-size:13px; user-select:none; -webkit-user-select:none;">\n`;

    // Background
    svg += `  <rect width="100%" height="100%" fill="#0f172a" rx="10"/>\n`;

    // Header bar
    svg += `  <rect width="100%" height="${headerHeight}" fill="#141c2e" rx="10"/>\n`;
    svg += `  <rect y="${headerHeight - 6}" width="100%" height="6" fill="#141c2e"/>\n`;
    svg += `  <line x1="0" y1="${headerHeight}" x2="${width}" y2="${headerHeight}" stroke="#1e293b" stroke-width="1"/>\n`;

    // Window controls
    svg += `  <circle cx="20" cy="18" r="5.5" fill="#ef4444"/>\n`;
    svg += `  <circle cx="36" cy="18" r="5.5" fill="#f59e0b"/>\n`;
    svg += `  <circle cx="52" cy="18" r="5.5" fill="#10b981"/>\n`;

    // Header Title
    svg += `  <text x="${width / 2}" y="22" fill="#94a3b8" font-size="12" font-weight="600" text-anchor="middle">${escapeXml(title)}</text>\n`;

    // Security Badge
    svg += `  <text x="${width - 16}" y="22" fill="#f87171" font-size="11" font-weight="600" text-anchor="end">🔒 Nusxalash taqiqlangan</text>\n`;

    // Gutter background
    svg += `  <rect x="0" y="${headerHeight}" width="${gutterWidth}" height="${height - headerHeight}" fill="#090e1a"/>\n`;
    svg += `  <line x1="${gutterWidth}" y1="${headerHeight}" x2="${gutterWidth}" y2="${height}" stroke="#1e293b" stroke-width="1"/>\n`;

    // Render lines and tokens
    for (let idx = 0; idx < lines.length; idx++) {
        const lineY = headerHeight + (idx * lineHeight) + 16;
        const lineNum = idx + 1;

        // Line number
        svg += `  <text x="${gutterWidth - 12}" y="${lineY}" fill="#475569" font-size="12" text-anchor="end">${lineNum}</text>\n`;

        // Tokens
        const tokens = tokenizeLine(lines[idx], lang);
        svg += `  <text x="${gutterWidth + 14}" y="${lineY}" xml:space="preserve">`;

        for (const tok of tokens) {
            const color = getColorForType(tok.type);
            const fontStyle = tok.type === 'comment' ? ' font-style="italic"' : '';
            svg += `<tspan fill="${color}"${fontStyle}>${escapeXml(tok.text)}</tspan>`;
        }

        svg += `</text>\n`;
    }

    svg += `</svg>`;
    return svg;
}

module.exports = {
    generateCodeSvg,
    tokenizeLine,
    escapeXml
};
