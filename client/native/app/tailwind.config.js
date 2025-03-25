import { Platform } from "react-native";
import { Colors, Theme } from "./constants/Colors";

// Platform.select({
//   web: {
//     "inter-thin": "Inter Thin, sans-serif",
//     "inter-extralight": "Inter ExtraLight, sans-serif",
//     "inter-light": "Inter Light, sans-serif",
//     "inter-regular": "Inter, sans-serif",
//     "inter-medium": "Inter Medium, sans-serif",
//     "inter-semibold": "Inter SemiBold, sans-serif",
//     "inter-bold": "Inter Bold, sans-serif",
//     "inter-extrabold": "Inter ExtraBold, sans-serif",
//     "inter-black": "Inter Black, sans-serif",
//   },
//   default: 

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{ts,tsx,js,jsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ...Colors[Theme],
      },
      fontFamily: {
        "inter-thin": "Inter_100Thin",
        "inter-extralight": "Inter_200ExtraLight",
        "inter-light": "Inter_300Light",
        "inter-regular": "Inter_400Regular",
        "inter-medium": "Inter_500Medium",
        "inter-semibold": "Inter_600SemiBold",
        "inter-bold": "Inter_700Bold",
        "inter-extrabold": "Inter_800ExtraBold",
        "inter-black": "Inter_900Black",
      },
    },
  },
  plugins: [],
};
