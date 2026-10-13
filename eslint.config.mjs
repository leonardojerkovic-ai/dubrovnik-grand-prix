import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// Prijenos iz .eslintrc.json (ESLint 8). Pravila su ista; mijenja se samo
// oblik. Redoslijed je bitan: kasniji blokovi nadjačavaju raniji, kao i
// overrides u staroj konfiguraciji.
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["warn", "smart"],
      "prefer-const": "warn",
      // Novo u eslint-config-next 16, nije postojalo u 15. Tri mjesta
      // (registrations-provider, tournament-countdown, app/alati/nagrade/alat)
      // sinkroniziraju stanje u efektu namjerno. Ostaje upozorenje dok se
      // ne prepišu, da se ne bi razbio build pri nadogradnji.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Skripte i ono što piše u log namjerno smiju koristiti console.
  {
    files: ["scripts/**/*.ts", "lib/fide/**/*.ts", "lib/email.ts"],
    rules: {
      "no-console": "off",
    },
  },
  // Testovi drže pomoćne varijable bez potrebe za prefiksom.
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    ignores: ["node_modules/", ".next/", "prisma/migrations/"],
  },
];

export default eslintConfig;
