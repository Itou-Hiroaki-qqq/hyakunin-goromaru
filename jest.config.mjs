import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.test.[jt]s", "**/*.test.[jt]s"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/app/api/**/route.ts",
    "!**/*.d.ts",
    "!**/__tests__/**",
  ],
};

export default createJestConfig(config);
