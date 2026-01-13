/**
 * TNA Generator Utility - Project A
 * Logic: TNA-XXXX1234$
 */

const generateTnaCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789'; // Notice this is 'numbers'

    let randomLetters = '';
    for (let i = 0; i < 4; i++) {
        randomLetters += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    let randomNumbers = '';
    for (let i = 0; i < 4; i++) {
        // FIXED: Using 'numbers' (the string defined above)
        randomNumbers += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return `TNA-${randomLetters}${randomNumbers}$`;
};

const isValidTna = (tna) => {
    const tnaRegex = /^TNA-[A-Z]{4}\d{4}\$$/;
    return tnaRegex.test(tna);
};

module.exports = {
    generateTnaCode,
    isValidTna
};