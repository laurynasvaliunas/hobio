const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

/** Expo Go has no Mapbox native module — bundle the stub unless a dev/client build sets this. */
const useNativeMapbox = process.env.EXPO_PUBLIC_NATIVE_MAPBOX === "true";
const mapboxStubPath = path.resolve(__dirname, "src/mocks/rnmapbox-maps.stub.tsx");

// Stub native-only map libraries on web and when Mapbox native isn’t linked (Expo Go).
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@rnmapbox/maps") {
    const useStub = platform === "web" || !useNativeMapbox;
    if (useStub) {
      return {
        filePath: mapboxStubPath,
        type: "sourceFile",
      };
    }
  }
  if (platform === "web") {
    if (moduleName === "react-native-maps") {
      return {
        filePath: path.resolve(__dirname, "src/mocks/react-native-maps.web.tsx"),
        type: "sourceFile",
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
