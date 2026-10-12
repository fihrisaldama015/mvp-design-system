// Tailwind reads the design tokens from Figma (Graphene), generated into
// src/tokens/tailwind.tokens.js by scripts/figma/buildTokens.mjs. Never edit
// colours or scales here: change them in Figma and regenerate.
//
// Replaced by the tokens (Graphene has every Tailwind default key, so nothing is
// lost): colors, spacing, borderRadius, borderWidth, fontSize, screens, boxShadow.
// Extended (Graphene has only some of Tailwind's keys, old pages still use the
// rest): opacity, blur, backdropBlur, fontWeight.
import tokens from "./src/tokens/tailwind.tokens.js";

const { opacity, blur, backdropBlur, fontWeight, boxShadow, ...replaced } = tokens.theme;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,mdx}", "./.storybook/**/*.{js,jsx}"],
  // Tokens switch by themselves under [data-theme="dark"]; dark: variants are rarely needed.
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    ...replaced,
    boxShadow: { ...boxShadow, none: "none" },
    extend: { ...tokens.extend, opacity, blur, backdropBlur, fontWeight },
  },
  plugins: tokens.plugins,
};
