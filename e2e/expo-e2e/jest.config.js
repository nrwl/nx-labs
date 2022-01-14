module.exports = {
  displayName: 'expo-e2e',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/e2e/expo-e2e',
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  testTimeout: 600000,
};
