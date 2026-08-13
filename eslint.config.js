import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/**", "ios/**", "android/**", "node_modules/**", "**/*.json"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        /* vite の define で埋め込む版番号 */
        __APP_VERSION__: "readonly",
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "18.3" } },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,

      /* import の過不足を見つけるための2本。分割作業の安全網なので厳しくしておく */
      "no-undef": "error",
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          /* 「非対応の端末では何もしない」という catch を全編で使っている。
             受け取った例外を読まないのは意図どおりなので、ここは見ない */
          caughtErrors: "none",
        },
      ],

      /* このコードは props の型宣言を持たない方針なので切る */
      "react/prop-types": "off",
      /* catch { /* 何もしない *\/ } を多用している。意図的なので許す */
      "no-empty": ["error", { allowEmptyCatch: true }],
      /* 日本語の文中に全角スペースを字下げとして使っている箇所がある。
         文字列・テンプレート・JSXの本文の中でだけ許す（コードの中は今までどおり弾く） */
      "no-irregular-whitespace": [
        "error",
        { skipStrings: true, skipTemplates: true, skipJSXText: true, skipComments: true },
      ],
    },
  },
  {
    /* 設定ファイルとビルド用スクリプトは Node の文脈で動く */
    files: ["*.config.js", "scripts/**/*.mjs"],
    languageOptions: { globals: { ...globals.node } },
  },
];
