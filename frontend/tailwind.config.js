/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#00A86B", // green AQI style
        accent: "#FFCC00",
        dark: "#1A1A1A",
        light: "#F9FAFB",
        card: "#FFFFFF",
      },
    },
  },
  plugins: [],
};




