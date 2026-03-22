// Ensure React Native's native fetch is used everywhere,
// preventing whatwg-fetch XHR polyfill from causing "Network request failed" errors.
import "react-native-url-polyfill/auto";

import "./global.css";
import "expo-router/entry";
