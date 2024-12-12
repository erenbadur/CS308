module.exports = {
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  testEnvironment: "node", // Required for testing React components
  setupFiles: ['<rootDir>/jest.setup.js'],
};