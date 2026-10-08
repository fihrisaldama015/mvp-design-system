// Plain Tailwind on purpose: no custom colours, no tokens. The design system
// comes in a later step.
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,mdx}", "./.storybook/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
};
