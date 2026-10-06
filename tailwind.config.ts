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
        sans: [
          "var(--font-sans)",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      // Type scale. 11px is reserved for uppercase labels and threshold
      // labels; anything people need to read is 12px or larger.
      fontSize: {
        "2xs": ["11px", { lineHeight: "16px" }],
        xs: ["12px", { lineHeight: "17px" }],
        ui: ["13px", { lineHeight: "19px" }],
        sm: ["14px", { lineHeight: "20px" }],
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
