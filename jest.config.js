module.exports = {
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  testEnvironment: "node", // Required for testing React components
  setupFiles: ['/Users/eren/Documents/github/CS308/jest.setup.js'],
};