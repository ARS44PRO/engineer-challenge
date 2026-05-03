import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "src",
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js"],
  clearMocks: true,
};

export default config;
