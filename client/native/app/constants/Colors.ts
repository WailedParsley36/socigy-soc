export const Colors: { [theme: string]: any } = {
  light: {
    background: "#FAFAFA",
    "level-1": "#ECECEE",
    "level-2": "#E4E4E7",
    "level-3": "#D4D4D8",
    "level-4": "#A1A1AA",
    "level-5": "#71717A",
    foreground: "#09090B",
  },
  dark: {
    background: "#09090B",
    "level-1": "#18181B",
    "level-2": "#27272A",
    "level-3": "#3F3F46",
    "level-4": "#52525B",
    "level-5": "#71717A",
    foreground: "#FAFAFA",
  },
};

export let Theme = "dark";

export class ThemeChange {
  constructor() {}

  static setTheme(newTheme: string) {
    Theme = newTheme;
  }
}
