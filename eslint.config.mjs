import next from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...next,
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@next/next/no-img-element": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "scripts/**", "docs/**", "next-env.d.ts"],
  },
];

export default config;
