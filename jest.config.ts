import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: false,
  moduleFileExtensions: [
    "js",
    "json",
    "ts"
  ],
  rootDir: 'src',
};

export default config;
