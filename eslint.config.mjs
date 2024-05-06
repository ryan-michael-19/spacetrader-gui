import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import stylistic from '@stylistic/eslint-plugin';


export default [
  {
    ignores: ["**/.next/**", "types.d.ts"]
  },
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReactConfig,
  {
    plugins: {
      '@stylistic': stylistic
    }
  },
  {
    "rules": {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error", {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
    ]
    } 
  }

];