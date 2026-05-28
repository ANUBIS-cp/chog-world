import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0B0B0F",
          secondary: "#13131A",
          tertiary: "#1A1A24",
        },
        border: {
          DEFAULT: "#1E1E2E",
          hover: "#2A2A40",
        },
        text: {
          primary: "#F0F0F5",
          secondary: "#9CA3AF",
          tertiary: "#6B7280",
        },
        accent: {
          DEFAULT: "#7C5CFF",
          hover: "#8B6DFF",
        },
        upvote: "#FF8B60",
        downvote: "#9494FF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
