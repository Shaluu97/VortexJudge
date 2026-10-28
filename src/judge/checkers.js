/**
 * RoboContest Offline Checkers with Presentation Error (PE) Support
 */

function normalizeLineBreaks(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function normalize(str) {
    return normalizeLineBreaks(str).trim();
}

function tokenize(str) {
    return normalize(str).split(/\s+/).filter(Boolean);
}

/**
 * Strict Checker (3-level verification):
 * Level 1: Strict Match (char-by-char) -> AC
 * Level 2: Presentation Error (whitespace, empty lines, trailing spaces, or case mismatch) -> PE
 * Level 3: Content mismatch -> WA
 */
function checkStrict(participantOutput, expectedOutput) {
    const p = normalizeLineBreaks(participantOutput);
    const e = normalizeLineBreaks(expectedOutput);

    // 1. Strict Match: Character by character identical
    if (p === e) {
        return { verdict: 'AC', message: 'Ok (To‘liq belgima-belgi mos keldi)' };
    }

    // 2. Presentation Error (PE) detection
    const pTokens = p.trim().split(/\s+/).filter(Boolean);
    const eTokens = e.trim().split(/\s+/).filter(Boolean);

    const pNoSpace = p.replace(/\s+/g, '');
    const eNoSpace = e.replace(/\s+/g, '');

    // Check 2A: Tokens match exactly, but layout / spacing / newlines differ
    const tokensIdentical = (pTokens.length === eTokens.length) &&
        pTokens.every((tok, idx) => tok === eTokens[idx]);

    if (tokensIdentical || pNoSpace === eNoSpace) {
        let diffReason = 'ortiqcha probel yoki format farqi';
        if (p.trim() === e.trim()) {
            diffReason = 'qator oxiridagi probel yoki qo‘shimcha bo‘sh qator';
        }
        return {
            verdict: 'PE',
            message: `Taqdimot xatosi (${diffReason})`
        };
    }

    // Check 2B: Case mismatch (e.g. "YES" vs "yes"), with or without whitespace difference
    const pTokensLower = pTokens.map(t => t.toLowerCase());
    const eTokensLower = eTokens.map(t => t.toLowerCase());

    const tokensIdenticalLower = (pTokensLower.length === eTokensLower.length) &&
        pTokensLower.every((tok, idx) => tok === eTokensLower[idx]);

    const pNoSpaceLower = pNoSpace.toLowerCase();
    const eNoSpaceLower = eNoSpace.toLowerCase();

    if (tokensIdenticalLower || pNoSpaceLower === eNoSpaceLower) {
        return {
            verdict: 'PE',
            message: 'Taqdimot xatosi: katta-kichik harflar registri mos kelmadi (Case mismatch)'
        };
    }

    // 3. Otherwise: Wrong Answer (Values / tokens do not match)
    if (pTokens.length !== eTokens.length) {
        return {
            verdict: 'WA',
            message: `Tokenlar soni mos kelmadi: kutilgan ${eTokens.length}, olingan ${pTokens.length}`
        };
    }

    for (let i = 0; i < eTokens.length; i++) {
        if (pTokens[i] !== eTokens[i]) {
            return {
                verdict: 'WA',
                message: `${i + 1}-tokenda xatolik: kutilgan "${eTokens[i]}", olingan "${pTokens[i]}"`
            };
        }
    }

    return { verdict: 'WA', message: 'Kutilgan natija bilan mos kelmadi' };
}

/**
 * Token-based / Relaxed Checker:
 * Whitespace and newlines between tokens are ignored, but values and casing are verified.
 * If values match case-insensitively, reports PE.
 */
function checkDefault(participantOutput, expectedOutput) {
    const pTokens = tokenize(participantOutput);
    const eTokens = tokenize(expectedOutput);

    if (pTokens.length !== eTokens.length) {
        // Check if case-insensitive matches count and values
        const pTokensLower = pTokens.map(t => t.toLowerCase());
        const eTokensLower = eTokens.map(t => t.toLowerCase());
        if (pTokensLower.length === eTokensLower.length && pTokensLower.every((t, i) => t === eTokensLower[i])) {
            return {
                verdict: 'PE',
                message: 'Taqdimot xatosi: katta-kichik harflar registri mos kelmadi (Case mismatch)'
            };
        }
        return {
            verdict: 'WA',
            message: `Tokenlar soni mos kelmadi: kutilgan ${eTokens.length}, olingan ${pTokens.length}`
        };
    }

    let hasCaseMismatch = false;
    for (let i = 0; i < eTokens.length; i++) {
        if (pTokens[i] !== eTokens[i]) {
            if (pTokens[i].toLowerCase() === eTokens[i].toLowerCase()) {
                hasCaseMismatch = true;
            } else {
                return {
                    verdict: 'WA',
                    message: `${i + 1}-tokenda xatolik: kutilgan "${eTokens[i]}", olingan "${pTokens[i]}"`
                };
            }
        }
    }

    if (hasCaseMismatch) {
        return {
            verdict: 'PE',
            message: 'Taqdimot xatosi: katta-kichik harflar registri mos kelmadi (Case mismatch)'
        };
    }

    return { verdict: 'AC', message: 'Ok' };
}

function checkCaseInsensitive(participantOutput, expectedOutput) {
    const pTokens = tokenize(participantOutput).map(t => t.toLowerCase());
    const eTokens = tokenize(expectedOutput).map(t => t.toLowerCase());

    if (pTokens.length !== eTokens.length) {
        return {
            verdict: 'WA',
            message: `Tokenlar soni mos kelmadi: kutilgan ${eTokens.length}, olingan ${pTokens.length}`
        };
    }

    for (let i = 0; i < eTokens.length; i++) {
        if (pTokens[i] !== eTokens[i]) {
            return {
                verdict: 'WA',
                message: `${i + 1}-tokenda xatolik: kutilgan "${eTokens[i]}", olingan "${pTokens[i]}"`
            };
        }
    }

    return { verdict: 'AC', message: 'Ok' };
}

function checkAnyOf(participantOutput, expectedOutput) {
    const possibleAnswers = expectedOutput.split('---OR---').map(s => s.trim()).filter(Boolean);

    if (possibleAnswers.length === 0) {
        return checkStrict(participantOutput, expectedOutput);
    }

    let firstPe = null;
    for (const ans of possibleAnswers) {
        const res = checkStrict(participantOutput, ans);
        if (res.verdict === 'AC') {
            return res;
        }
        if (res.verdict === 'PE' && !firstPe) {
            firstPe = res;
        }
    }

    if (firstPe) return firstPe;
    return { verdict: 'WA', message: 'Kiritilgan javoblarning hech biriga mos kelmadi' };
}

function evaluate(checkerType, participantOutput, expectedOutput) {
    switch (checkerType) {
        case 'strict':
            return checkStrict(participantOutput, expectedOutput);
        case 'case_insensitive':
            return checkCaseInsensitive(participantOutput, expectedOutput);
        case 'any_of':
            return checkAnyOf(participantOutput, expectedOutput);
        case 'relaxed':
        case 'default':
        default:
            return checkDefault(participantOutput, expectedOutput);
    }
}

module.exports = {
    evaluate,
    checkStrict,
    checkDefault,
    checkCaseInsensitive,
    checkAnyOf,
    normalizeLineBreaks,
    normalize,
    tokenize
};
