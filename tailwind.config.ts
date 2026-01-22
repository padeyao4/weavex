// tailwind.config.js
module.exports = {
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        heading: ["Inter", "sans-serif"], // 标题用相同字体但加粗
      },
      colors: {
        // 背景层级
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        sidebar: "rgb(var(--color-sidebar) / <alpha-value>)",
        navbar: "rgb(var(--color-navbar) / <alpha-value>)",
        content: "rgb(var(--color-content) / <alpha-value>)",

        // 文字
        fg: "rgb(var(--color-fg) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        heading: "rgb(var(--color-heading) / <alpha-value>)",

        // 按钮 & 交互
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover) / <alpha-value>)",
          active: "rgb(var(--color-primary-active) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
          hover: "rgb(var(--color-secondary-hover) / <alpha-value>)",
        },

        // 状态 & 边框
        selected: "rgb(var(--color-selected) / <alpha-value>)",
        stroke: "rgb(var(--color-stroke) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
