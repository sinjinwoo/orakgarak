/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1f2937",
        secondary: "#6b7280",
      },
      animation: {
        "spin-slow": "spin 12s linear infinite",
        float: "float 4s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 0, 0, 0.2)" },
        },
      },
    },
  },
  plugins: [],
};
