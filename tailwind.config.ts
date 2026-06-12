import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f1d1b",
        paper: "#fffaf7",
        rosewood: "#e11d48",
        moss: "#586b52",
        petal: "#f6d9dd",
        honey: "#f4c96d"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(72, 45, 39, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
