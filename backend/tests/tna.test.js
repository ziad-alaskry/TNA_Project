const { generateTnaCode, isValidTna } = require('../src/utils/tnaGenerator');

describe('TNA Logic Tests', () => {
    test('should generate a valid TNA format', () => {
        const code = generateTnaCode();
        // Regex: TNA- [4 Letters] [4 Numbers] $
        expect(code).toMatch(/^TNA-[A-Z]{4}\d{4}\$$/);
    });

    test('should generate unique codes', () => {
        const code1 = generateTnaCode();
        const code2 = generateTnaCode();
        expect(code1).not.toBe(code2);
    });

    test('isValidTna should return true for correct format', () => {
        expect(isValidTna('TNA-ABCD1234$')).toBe(true);
        expect(isValidTna('INVALID-123')).toBe(false);
    });
});