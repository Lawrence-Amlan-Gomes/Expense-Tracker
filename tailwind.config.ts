/** @type {import('tailwindcss').Config} */
// Design tokens follow DESIGN.md (NerdWallet). Every colour is a CSS variable
// holding "R G B" channels, so one class works in both light and dark mode
// and still supports opacity modifiers (e.g. bg-primary/10).
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        soft: token("soft"),
        surface: token("surface"),
        mint: {
          50: token("mint-50"),
          100: token("mint-100"),
          200: token("mint-200"),
        },
        hairline: token("hairline"),
        "hairline-strong": token("hairline-strong"),
        ink: token("ink"),
        body: token("body"),
        muted: token("muted"),
        faint: token("faint"),
        primary: token("primary"),
        "primary-hover": token("primary-hover"),
        "primary-deep": token("primary-deep"),
        forest: token("forest"),
        "on-primary": token("on-primary"),
        brand: token("brand-text"),
        lime: {
          hero: token("lime-hero"),
          panel: token("lime-panel"),
          accent: token("lime-accent"),
          ribbon: token("lime-ribbon"),
          logo: token("logo-lime"),
        },
        link: token("link"),
        info: token("info"),
        error: token("error"),
        warn: token("warn"),
      },
      boxShadow: {
        nw: "0 4px 16px rgba(100,102,106,0.05), 0 16px 40px rgba(100,102,104,0.05)",
        "nw-overlay":
          "0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.06)",
      },
      maxWidth: {
        container: "1200px",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwind-scrollbar")],
};
