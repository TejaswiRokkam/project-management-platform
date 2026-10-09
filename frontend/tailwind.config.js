/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Figtree", "system-ui", "sans-serif"] },
      colors: {
        ink: "#1c2733",       // main text
        paper: "#f4f5f2",     // page background
        board: "#e9ebe6",     // column background
        pine: { DEFAULT: "#1f6f5c", dark: "#175646", light: "#dcece6" }, // accent
      },
    },
  },
  plugins: [],
};
