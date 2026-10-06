import type { Config } from "tailwindcss";

// Colors are CSS variables (space-separated RGB channels, defined in
// src/app/globals.css) so opacity modifiers like `bg-accent/15` keep working
// and the palette lives in one place.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: v("bg"),
          subtle: v("bg-subtle"),
          card: v("bg-card"),
          hover: v("bg-hover"),
          inset: v("bg-inset"),
        },
        border: {
          DEFAULT: v("border"),
          subtle: v("border-subtle"),
          strong: v("border-strong"),
        },
        fg: {
          DEFAULT: v("fg"),
          muted: v("fg-muted"),
          subtle: v("fg-subtle"),
        },
        accent: {
          DEFAULT: v("accent"),
          green: v("green"),
          red: v("red"),
          yellow: v("yellow"),
          purple: v("purple"),
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      keyframes: {
        trace: {
          from: { strokeDashoffset: "0" },
          to: { strokeDashoffset: "-120" },
        },
      },
      animation: {
        trace: "trace 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
