import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0A0F1A",
        surface: "#111827",
        "mumbai-orange": "#F97316",
        amber: "#FBBF24",
        "alert-red": "#EF4444",
        "trust-green": "#10B981",
      },
    },
  },
  plugins: [],
};

export default config;
