// Jest global setup – runs before each test file (before framework install).
// NOTE: @testing-library/jest-dom is imported via setupFilesAfterEnv.

// Polyfill TextEncoder / TextDecoder – required by react-router-dom v7 in jsdom
const { TextEncoder, TextDecoder } = require('node:util');
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

// Polyfill crypto.randomUUID for jsdom
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = {
    randomUUID: () => 'test-uuid-1234-5678-abcd-ef0123456789',
  };
} else if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () => 'test-uuid-1234-5678-abcd-ef0123456789';
}

