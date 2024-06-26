import { __dirname, __filename } from './dirnameUtil.mjs'

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  globals: {
    TZ: 'UTC',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ESNext',
          module: 'ESNext',
          verbatimModuleSyntax: true,
        },
        useESM: true,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts'],
  rootDir: __dirname,
  testMatch: ['**/?(*.)+(spec|test).ts'],
}
