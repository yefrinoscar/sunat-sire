import { heroui } from "@heroui/theme";

const emerald = {
  50: "#eefcf5",
  100: "#d5f6e6",
  200: "#aeead1",
  300: "#79d7b6",
  400: "#43bd97",
  500: "#1aa27d",
  600: "#0e8365",
  700: "#0f6852",
  800: "#105343",
  900: "#0e4437",
} as const;

const amber = {
  50: "#fffaeb",
  100: "#fdf0c8",
  200: "#fbdf8c",
  300: "#f8c94f",
  400: "#f6b427",
  500: "#ef930f",
  600: "#d46e09",
  700: "#b04c0c",
  800: "#8f3a10",
  900: "#753011",
} as const;

export default heroui({
  layout: {
    radius: {
      small: "6px",
      medium: "10px",
      large: "16px",
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
        background: "#f6f5f1",
        foreground: "#1d211f",
        divider: "rgba(29, 33, 31, 0.09)",
        focus: emerald[600],
        content1: "#fdfdfb",
        content2: "#f1f0ea",
        content3: "#e6e5dd",
        content4: "#d8d7cd",
        primary: { ...emerald, DEFAULT: emerald[600], foreground: "#ffffff" },
        success: { ...emerald, DEFAULT: emerald[600], foreground: "#ffffff" },
        warning: { ...amber, DEFAULT: amber[500], foreground: "#3d2703" },
      },
    },
    dark: {
      colors: {
        background: "#0d1211",
        foreground: "#e6ebe8",
        divider: "rgba(230, 235, 232, 0.09)",
        focus: emerald[400],
        content1: "#141b19",
        content2: "#1b2421",
        content3: "#243029",
        content4: "#2e3c34",
        primary: {
          ...emerald,
          DEFAULT: emerald[400],
          foreground: "#06231b",
        },
        success: { ...emerald, DEFAULT: emerald[400], foreground: "#06231b" },
        warning: { ...amber, DEFAULT: amber[400], foreground: "#2c1c02" },
      },
    },
  },
});
