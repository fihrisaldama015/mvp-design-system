// Tokens first: the theme comes from the generated src/tokens/tailwind.tokens.js (npm run tokens:build).
import tokens from "./src/tokens/tailwind.tokens.js";

const { fontWeight, opacity, blur, backdropBlur, ...replaced } = tokens.theme;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,mdx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    ...replaced,
    boxShadow: { ...replaced.boxShadow, none: "none" },
    extend: { ...tokens.extend, fontWeight, opacity, blur, backdropBlur },
  },
  plugins: tokens.plugins,
};
