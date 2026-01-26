/**
 * Default Norwegian patterns
 */
export const NORWEGIAN_PATTERNS = {
    orgNumber: /\b\d{9}\b/,
    phoneNumber: /\b(?:\+47|0047)?[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/,
    postalCode: /\b\d{4}\b/,
    bankAccount: /\b\d{4}[\s.-]?\d{2}[\s.-]?\d{5}\b/,
    dateFormats: [
        /\b\d{1,2}\.\s?\d{1,2}\.\s?\d{2,4}\b/, // DD.MM.YYYY
        /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/, // DD/MM/YYYY
        /\b\d{4}-\d{2}-\d{2}\b/, // ISO format
    ],
    companySuffixes: ['AS', 'ASA', 'ANS', 'DA', 'ENK', 'NUF', 'SA', 'SE', 'BA'],
    currency: /\b(?:kr|NOK|kroner)[\s]?\d+(?:[,.\s]\d+)*\b/i,
};
//# sourceMappingURL=entities.js.map