/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 requires this preset
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ["Nunito_400Regular"],
        "nunito-medium": ["Nunito_500Medium"],
        "nunito-semibold": ["Nunito_600SemiBold"],
        "nunito-bold": ["Nunito_700Bold"],
        "nunito-extrabold": ["Nunito_800ExtraBold"],
      },
      colors: {
        primary: {
          DEFAULT: "#0A5DA3",
          light: "#3D8FD4",
          dark: "#074A82",
        },
        secondary: {
          DEFAULT: "#2EAE6D",
          light: "#5FD69A",
          dark: "#1F8A52",
        },
        accent: {
          DEFAULT: "#E8942E",
          light: "#F5B66A",
          dark: "#C47A1F",
        },
        warning: {
          DEFAULT: "#F5C542",
          dark: "#D4A520",
        },
        danger: {
          DEFAULT: "#D64545",
          dark: "#B33030",
        },
        background: "#F5F7FA",
        surface: "#FFFFFF",
        "text-primary": "#1A2B3D",
        "text-secondary": "#5A6978",
        border: "#E0E6ED",
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        input: "10px",
      },
      fontSize: {
        "heading-xl": ["28px", { lineHeight: "36px", fontWeight: "700" }],
        "heading-lg": ["22px", { lineHeight: "28px", fontWeight: "600" }],
        "heading-md": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
    },
  },
  plugins: [],
};
