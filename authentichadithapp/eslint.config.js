// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      '__tests__/**',   // Jest test files use require() mocks by design
      'scripts/**',     // Node.js CJS scripts — __dirname is valid here
      'jest.setup.js',  // Jest setup file — jest global is provided by the runner
    ],
  },
]);
