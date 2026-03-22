module.exports = function (api) {
  api.cache(true);

  const isTest = process.env.NODE_ENV === "test";

  return {
    presets: [
      [
        "babel-preset-expo",
        isTest ? {} : { jsxImportSource: "nativewind" },
      ],
      // Disable NativeWind Babel preset in test to avoid _ReactNativeCSSInterop
      ...(isTest ? [] : ["nativewind/babel"]),
    ],
    plugins: ["react-native-reanimated/plugin"],
  };
};
