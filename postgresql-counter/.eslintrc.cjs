module.exports = {
  env: {
    node: true,
    es2023: true,
  },
  extends: "standard-with-typescript",
  plugins: [
    "@typescript-eslint",
    "node",
    "prettier",
    "eslint-plugin-tsdoc",
    "import",
  ],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
  },
  rules: {},
};
