export const Colors: { [theme: string]: any } = {
  light: {
    background: "#FAFAFA",
    "level-1": "#ECECEE",
    "level-2": "#E4E4E7",
    "level-3": "#D4D4D8",
    "level-4": "#A1A1AA",
    "level-5": "#71717A",
    foreground: "#09090B",

    // OLD
    "bg-default": "#FAFAFA",
    "bg-default-rgb": "rgba(14,17,19,A)",
    "bg-lighter": "#393939",
    "bg-light": "#A1A1AA",
    "bg-medium": "#71717A",

    "text-primary": "#FAFAFA",
    "text-secondary": "#E4E4E4",
    "text-third": "#E4E4E4",
    "text-inverted": "#000000",
    primary: "#D8D8D8",
  },
  dark: {
    background: "#09090B",
    "level-1": "#18181B",
    "level-2": "#27272A",
    "level-3": "#3F3F46",
    "level-4": "#52525B",
    "level-5": "#71717A",
    foreground: "#FAFAFA",

    // OLD
    "bg-default": "#09090B",
    "bg-default-rgb": "rgba(14,17,19,A)",
    "bg-lighter": "#393939",
    "bg-ultraslim": "#2D2D2D",
    "bg-slim": "#4F4F4F",
    "bg-light": "#52525B",
    "bg-medium": "#71717A",

    "text-primary": "#FAFAFA",
    "text-secondary": "#E4E4E4",
    "text-third": "#A1ABB1",
    "text-inverted": "#000000",
    primary: "#D8D8D8",
  },
};

export let Theme = "dark";

export class ThemeChange {
  constructor() {}

  static setTheme(newTheme: string) {
    Theme = newTheme;
  }
}
