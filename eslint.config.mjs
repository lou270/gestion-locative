import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Scripts exécutés par `node` au démarrage du conteneur, hors bundle
    // Next : ils doivent rester en CommonJS.
    files: ["prisma/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Les documents `@react-pdf/renderer` ne sont pas rendus dans le DOM :
    // une entité HTML y serait imprimée telle quelle dans le PDF.
    files: ["src/components/pdf/**/*.tsx"],
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
