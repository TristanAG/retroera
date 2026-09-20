import nextVitals from "eslint-config-next/core-web-vitals";
import globals from "globals";

export default [
  { ignores: ["dist", ".next", "out", "next-env.d.ts"] },
  ...nextVitals,
  {
    files: ["server/**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
