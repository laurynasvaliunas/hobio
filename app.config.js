module.exports = ({ config }) => ({
  ...config,
  name: "Hobio",
  slug: "hobio",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  scheme: "hobio",
  splash: {
    image: "./assets/hobio-intro-logo.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.hobio.app",
    buildNumber: "1",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Hobio uses your location to show nearby groups on the map.",
      ITSAppUsesNonExemptEncryption: false,
    },
    // Apple Privacy Manifest (required May 2024+).
    // Reasons cover Required Reason API categories triggered by our deps:
    // expo-file-system / image-manipulator (FileTimestamp), AsyncStorage (UserDefaults),
    // Sentry (SystemBootTime), expo-file-system (DiskSpace).
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
          NSPrivacyAccessedAPITypeReasons: ["C617.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
          NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
          NSPrivacyAccessedAPITypeReasons: ["E174.1"],
        },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#D97758",
    },
    package: "com.hobio.app",
    versionCode: 1,
    edgeToEdgeEnabled: true,
    permissions: [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Hobio uses your location to show nearby groups on the map.",
      },
    ],
    "expo-web-browser",
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#D97758",
      },
    ],
    [
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/",
        project: "hobio",
        organization: "clyzio",
      },
    ],
    "expo-apple-authentication",
    [
      "@stripe/stripe-react-native",
      {
        merchantIdentifier: "merchant.com.hobio.app",
        enableGooglePay: false,
      },
    ],
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsImpl: "mapbox",
        RNMapboxMapsAccessToken:
          process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
        RNMapboxMapsDownloadToken:
          process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN || "",
      },
    ],
  ],
  extra: {
    router: {},
    eas: {
      projectId: "1b6481b2-6ed9-4c5d-8db5-90290c85ec52",
    },
  },
  owner: "laurynas.valiunas",
});
