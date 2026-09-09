import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#05060f",
          900: "#0a0d1f",
          800: "#0f1330",
          700: "#161b45",
        },
        neon: {
          blue: "#4d6bff",
          purple: "#9b5bff",
          violet: "#6f5bff",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(107, 92, 255, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
