/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/src/__tests__/jest.setup.js"],
  // setup.ts runs after framework (extend-expect, console spies)
  // jest-expo handles setupFilesAfterFramework internally
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|@gorhom/.*|lucide-react-native|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@stripe/.*|react-native-maps|react-native-map-clustering|react-native-signature-canvas|react-native-url-polyfill|@react-native-async-storage/.*|@react-native-community/.*|expo-router|expo-blur|expo-constants|expo-document-picker|expo-file-system|expo-font|expo-haptics|expo-image|expo-image-manipulator|expo-image-picker|expo-linking|expo-local-authentication|expo-location|expo-notifications|expo-secure-store|expo-sharing|expo-splash-screen|expo-status-bar)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@stores/(.*)$": "<rootDir>/src/stores/$1",
    "^@constants/(.*)$": "<rootDir>/src/constants/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1",
    // Block Expo's WinterCG runtime from loading (breaks in Jest)
    "expo/src/winter/runtime\\.native": "<rootDir>/src/__tests__/__mocks__/empty.js",
    "\\.css$": "<rootDir>/src/__tests__/__mocks__/empty.js",
  },
  testMatch: [
    "<rootDir>/src/__tests__/**/*.test.{ts,tsx}",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "!src/__tests__/**",
    "!**/*.d.ts",
  ],
};
