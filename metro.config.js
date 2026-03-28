const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Stub native-only map libraries on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    if (moduleName === "react-native-maps") {
      return {
        filePath: path.resolve(__dirname, "src/mocks/react-native-maps.web.tsx"),
        type: "sourceFile",
      };
    }
    if (moduleName === "@rnmapbox/maps") {
      return {
        filePath: path.resolve(__dirname, "src/mocks/rnmapbox-maps.web.tsx"),
        type: "sourceFile",
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
