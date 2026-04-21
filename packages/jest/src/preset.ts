import path from 'node:path';

// Minimal Jest preset providing only the universal settings.
// Does NOT include transform or moduleNameMapper — those are project-specific.
const preset = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.snapshots.tsx'],
  setupFiles: [path.resolve(__dirname, './setup')],
  setupFilesAfterEnv: [path.resolve(__dirname, './framework')],
};

module.exports = preset;
