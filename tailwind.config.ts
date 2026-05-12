import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0b0d12",
          subtle: "#11141b",
          card: "#151924",
          hover: "#1b2030",
        },
        border: {
          DEFAULT: "#222838",
          subtle: "#1a1f2c",
        },
        fg: {
          DEFAULT: "#e6e8ee",
          muted: "#9099ad",
          subtle: "#6b7388",
        },
        accent: {
          DEFAULT: "#5b8def",
          green: "#34d399",
          red: "#f87171",
          yellow: "#fbbf24",
          purple: "#a78bfa",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
