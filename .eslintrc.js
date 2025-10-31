module.exports = {
  root: true,
  extends: ["eslint:recommended", "prettier"],
  env: {
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  settings: {
    next: {
      rootDir: ["apps/web"],
    },
  },
  ignorePatterns: ["node_modules/", "dist/", "build/", ".turbo/", ".next/"],
  plugins: ["simple-import-sort"],
  overrides: [
    {
      files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
      extends: ["next/core-web-vitals", "prettier"],
      parserOptions: {
        project: "apps/web/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      rules: {
        "simple-import-sort/imports": [
          "warn",
          {
            groups: [
              ["^react$", "^next", "^@?\\w"],
              ["^(@english-app)(/.*|$)"],
              ["^@/"],
              ["^\\u0000"],
              ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
              ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
              ["^.+\\.s?css$"],
            ],
          },
        ],
        "simple-import-sort/exports": "warn",
      },
    },
    {
      files: ["packages/**/*.{ts,tsx}"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint", "simple-import-sort"],
      extends: ["plugin:@typescript-eslint/recommended", "prettier"],
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "react/display-name": "off",
        "@next/next/no-html-link-for-pages": "off",
        "simple-import-sort/imports": [
          "warn",
          {
            groups: [
              ["^react$", "^@?\\w"],
              ["^(@english-app)(/.*|$)"],
              ["^\\u0000"],
              ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
              ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
              ["^.+\\.s?css$"],
            ],
          },
        ],
        "simple-import-sort/exports": "warn",
      },
    },
    {
      files: ["prisma/**/*.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: ["plugin:@typescript-eslint/recommended", "prettier"],
      parserOptions: {
        project: "prisma/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      rules: {},
    },
    {
      files: ["types/**/*.d.ts"],
      parser: "@typescript-eslint/parser",
      extends: ["plugin:@typescript-eslint/recommended", "prettier"],
      parserOptions: {
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
      rules: {},
    },
    {
      files: ["*.{js,mjs,cjs}", ".*rc.js"],
      env: {
        node: true,
      },
    },
  ],
};
