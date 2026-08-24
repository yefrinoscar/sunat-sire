import { heroui } from "@heroui/theme";

const teal = {
  50: "#eef9f5",
  100: "#d4f0e7",
  200: "#a8e0cf",
  300: "#6ec9ad",
  400: "#38b291",
  500: "#0b6e58",
  600: "#095a48",
  700: "#084a3c",
  800: "#073b31",
  900: "#052e27",
} as const;

const copper = {
  50: "#fdf6ee",
  100: "#f9e8d4",
  200: "#f2cfa8",
  300: "#e8b076",
  400: "#c4893a",
  500: "#a8722a",
  600: "#8a5a22",
  700: "#6f471c",
  800: "#5a3918",
  900: "#4a2f15",
} as const;

export default heroui({
  layout: {
    radius: {
      small: "8px",
      medium: "12px",
      large: "20px",
    },
    fontSize: {
      tiny: "0.72rem",
      small: "0.855rem",
      medium: "0.955rem",
      large: "1.12rem",
    },
  },
  themes: {
    light: {
      colors: {
        background: "#faf8f4",
        foreground: "#1a1814",
        divider: "rgba(26, 24, 20, 0.07)",
        focus: teal[500],
        content1: "#fffcf8",
        content2: "#f3f0ea",
        content3: "#e8e4dc",
        content4: "#d9d4ca",
        default: {
          50: "#f7f5f1",
          100: "#eceae4",
          200: "#d9d4ca",
          300: "#b8b2a6",
          400: "#8f887c",
          500: "#6b645a",
          600: "#524c44",
          700: "#3f3a34",
          800: "#2e2a26",
          900: "#1a1814",
          DEFAULT: "#6b645a",
          foreground: "#1a1814",
        },
        primary: { ...teal, DEFAULT: teal[500], foreground: "#ffffff" },
        success: { ...teal, DEFAULT: teal[500], foreground: "#ffffff" },
        warning: { ...copper, DEFAULT: copper[400], foreground: "#2e1e08" },
      },
    },
    dark: {
      colors: {
        background: "#0c0f0e",
        foreground: "#e8ebe9",
        divider: "rgba(232, 235, 233, 0.08)",
        focus: teal[400],
        content1: "#131816",
        content2: "#1a201e",
        content3: "#222a27",
        content4: "#2c3531",
        default: {
          50: "#1a201e",
          100: "#222a27",
          200: "#2c3531",
          300: "#3d4844",
          400: "#5a6560",
          500: "#7a8580",
          600: "#9aa5a0",
          700: "#b8c0bc",
          800: "#d4dad7",
          900: "#e8ebe9",
          DEFAULT: "#7a8580",
          foreground: "#e8ebe9",
        },
        primary: { ...teal, DEFAULT: teal[400], foreground: "#052e27" },
        success: { ...teal, DEFAULT: teal[400], foreground: "#052e27" },
        warning: { ...copper, DEFAULT: copper[300], foreground: "#2e1e08" },
      },
    },
  },
});
