import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "var(--brand-navy)",
          blue: "var(--brand-blue)",
          red: "var(--brand-red)",
          silver: "var(--brand-silver)",
          ink: "var(--brand-ink)",
          bg: "var(--brand-bg)",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,.06), 0 10px 30px -12px rgba(30,136,229,.45)",
      },
    },
  },
  plugins: [],
};
export default config;