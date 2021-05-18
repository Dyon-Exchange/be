module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 90,
      functions: 0,
      lines: 0,
    },
  },
};
