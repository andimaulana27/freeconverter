import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bone: "#f7f7f7",
        paper: "#ffffff",
        ink: "#111111",
        mute: "#6b6b6b",
        faint: "#746d69",
        line: "#e8e8e8",
        accent: {
          DEFAULT: "#d92d28",
          ink: "#b91c1c",
          soft: "#fdecec",
        },
        ok: "#0f7a56",
        danger: "#c62828",
        warn: "#b45309",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
        control: "8px",
      },
      boxShadow: {
        drop: "0 1px 0 rgba(17,17,17,0.04)",
        glow: "0 0 0 3px rgba(229,50,45,0.16)",
      },
      transitionDuration: {
        180: "180ms",
        280: "280ms",
      },
      keyframes: {
        enter: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
        chip: {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "none" },
        },
        progress: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(220%)" },
        },
        arrow: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(5px)" },
        },
        mark: {
          from: { transform: "scale(0.86)", opacity: "0.4" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.45" },
          "100%": { transform: "scale(1.35)", opacity: "0" },
        },
        route: {
          "0%": { transform: "translate(0, -50%)", opacity: "0" },
          "15%": { opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { transform: "translate(104px, -50%)", opacity: "0" },
        },
      },
      animation: {
        enter: "enter 280ms ease-out",
        chip: "chip 220ms ease-out",
        progress: "progress 1.05s ease-in-out infinite",
        arrow: "arrow 1.6s ease-in-out infinite",
        mark: "mark 220ms ease-out",
        pulseRing: "pulseRing 900ms ease-out infinite",
        route: "route 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
