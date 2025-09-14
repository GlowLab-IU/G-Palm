/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
   theme: { extend: { colors: { brand: { DEFAULT: "#0ead13" } } } },
  plugins: [],
  presets: [require("nativewind/preset")],
};

