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
          light: "#ff6a64",
        },
        ok: "#0f7a56",
        danger: "#c62828",
        warn: "#b45309",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "system-ui", "sans-serif"],
      },
      fontSize: {
        micro: ["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.12em" }],
        eyebrow: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.18em" }],
      },
      borderRadius: {
        control: "12px",
        card: "16px",
        tile: "20px",
        panel: "30px",
      },
      boxShadow: {
        drop: "0 1px 0 rgba(17,17,17,0.04)",
        glow: "0 0 0 3px rgba(229,50,45,0.16)",
        tile: "0 12px 32px rgba(40,27,22,0.07)",
        panel: "0 28px 80px rgba(40,27,22,0.10)",
        "panel-dark": "0 30px 86px rgba(35,24,20,0.20)",
        action: "0 12px 30px rgba(217,45,40,0.28)",
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
        shot: {
          "0%": { left: "0%", opacity: "0", transform: "translate(-50%, -50%) scale(0.35)" },
          "8%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          "70%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          "78%": { left: "100%", opacity: "1", transform: "translate(-50%, -50%) scale(1.25)" },
          "90%": { left: "100%", opacity: "0", transform: "translate(-50%, -50%) scale(0.35)" },
          "100%": { left: "100%", opacity: "0", transform: "translate(-50%, -50%) scale(0.35)" },
        },
        muzzle: {
          "0%, 18%, 100%": { opacity: "0", transform: "translate(50%, -50%) scale(0.4)" },
          "6%": { opacity: "1", transform: "translate(50%, -50%) scale(1.35)" },
          "12%": { opacity: "0.4", transform: "translate(50%, -50%) scale(0.9)" },
        },
        kick: {
          "0%, 20%, 100%": { transform: "translateX(0)" },
          "6%": { transform: "translateX(-5px)" },
          "12%": { transform: "translateX(2px)" },
        },
        impact: {
          "0%, 70%, 100%": { transform: "translateX(0) scale(1)" },
          "78%": { transform: "translateX(6px) scale(1.07)" },
          "86%": { transform: "translateX(-2px) scale(0.97)" },
          "92%": { transform: "translateX(1px) scale(1.02)" },
        },
        impactGlow: {
          "0%, 70%, 100%": { opacity: "0", transform: "translate(50%, -50%) scale(0.4)" },
          "76%": { opacity: "0.95", transform: "translate(50%, -50%) scale(1)" },
          "90%": { opacity: "0", transform: "translate(50%, -50%) scale(1.85)" },
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
        shot: "shot 2.2s cubic-bezier(0.2, 0.72, 0.18, 1) infinite",
        muzzle: "muzzle 2.2s cubic-bezier(0.2, 0.72, 0.18, 1) infinite",
        kick: "kick 2.2s cubic-bezier(0.2, 0.72, 0.18, 1) infinite",
        impact: "impact 2.2s cubic-bezier(0.2, 0.72, 0.18, 1) infinite",
        impactGlow: "impactGlow 2.2s cubic-bezier(0.2, 0.72, 0.18, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
