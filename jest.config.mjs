export default {
  roots: ["<rootDir>/test"],
  testMatch: ["**/__tests__/**/*.+(ts|js)", "**/?(*.)+(spec|test).+(ts|js)"],
  transform: {
    "^.+\\.(ts)$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.{js,ts}", "!**/*.d.ts", "!**/node_modules/**"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
