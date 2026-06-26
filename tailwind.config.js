/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#005697",
        dark: "#00313a",
        accentRed: "#a24f4f",
        teal: { DEFAULT: "#75b5b4", dark: "#4a9a99", light: "#a8d4d3" },
        moss: { DEFAULT: "#00313a", light: "#004a57" },
        sky: { DEFAULT: "#d4eef5", dark: "#a8d9e8" },
        offwhite: "#f1f2f2",
        seablue: "#9bbfde",
        ember: "#a24f4f",
        pistachio: "#baebda",
        darkblue: "#005697",
        lavender: "#a49fc8",
      },
      fontFamily: {
        display: ['"DM Serif Display"', "Georgia", "serif"],
        body: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,49,58,0.10)",
        glow: "0 0 20px rgba(117,181,180,0.25)",
      },
    },
  },
  plugins: [],
};
