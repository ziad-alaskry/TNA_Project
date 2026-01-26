/**
 * TNA Generator Utility - Project A
 * Logic: TNA-XXXX1111 (4 Letters + 4 Digits)
 * Matches Figma Page 7 Requirements
 */

const generateTnaCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let randomLetters = '';
    for (let i = 0; i < 4; i++) {
        randomLetters += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    let randomNumbers = '';
    for (let i = 0; i < 4; i++) {
        randomNumbers += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    // Removed the $ suffix to align with the Figma UI screenshots
    return `TNA-${randomLetters}${randomNumbers}`;
};

/**
 * Validates the TNA format for resolvers and binders.
 * Format: TNA-[4 LETTERS][4 DIGITS]
 */
const isValidTna = (tna) => {
    if (!tna) return false;
    const tnaRegex = /^TNA-[A-Z]{4}\d{4}$/;
    return tnaRegex.test(tna);
};

module.exports = {
    generateTnaCode,
    isValidTna
};