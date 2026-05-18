/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0F4C81", light: "#1A73E8" },
        accent: "#F59E0B",
      },
    },
  },
  plugins: [],
};
