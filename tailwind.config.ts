import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bone: "#f6f5f1",
        paper: "#ffffff",
        ink: "#141414",
        mute: "#5c5c5c",
        faint: "#8a8a84",
        line: "#e4e2db",
        accent: {
          DEFAULT: "#2563eb",
          ink: "#1d4ed8",
          soft: "#eef3ff",
        },
        ok: "#0f766e",
        danger: "#b42318",
        warn: "#b45309",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        control: "10px",
      },
      boxShadow: {
        drop: "0 1px 2px rgba(20,20,20,0.04), 0 10px 28px rgba(20,20,20,0.05)",
        glow: "0 0 0 4px rgba(37,99,235,0.14)",
      },
      transitionDuration: {
        180: "180ms",
      },
      keyframes: {
        enter: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "none" },
        },
        progress: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(220%)" },
        },
      },
      animation: {
        enter: "enter 180ms ease-out",
        progress: "progress 1.15s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
