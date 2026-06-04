export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        panelSoft: "rgb(var(--color-panel-soft) / <alpha-value>)",
        neon: "rgb(var(--color-neon) / <alpha-value>)",
        hot: "rgb(var(--color-hot) / <alpha-value>)",
        sky: "rgb(var(--color-sky) / <alpha-value>)",
        warn: "rgb(var(--color-warn) / <alpha-value>)"
      },
      boxShadow: {
        glow: "0 0 28px rgba(56,245,181,.28), 0 0 42px rgba(255,61,216,.18)",
        deep: "0 26px 80px rgba(0,0,0,.42)"
      }
    }
  },
  plugins: []
};
