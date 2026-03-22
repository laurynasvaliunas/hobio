/**
 * Jest setup file — runs BEFORE the test framework.
 * Contains all jest.mock() calls for native modules to avoid
 * NativeWind/CSS interop issues with jest.mock() hoisting.
 */

// ---------- Expo winter runtime fix ----------
// jest-expo installs lazy getters for WinterCG globals (structuredClone,
// __ExpoImportMetaRegistry, etc.). When the getters fire they require()
// modules that crash in Jest's sandbox.
// CRITICAL: Do NOT read globalThis.structuredClone — that triggers the getter!
function _safeDefine(name, value) {
  try {
    Object.defineProperty(globalThis, name, {
      value: value,
      configurable: true,
      writable: true,
      enumerable: false,
    });
  } catch (_e) { /* non-configurable */ }
}
_safeDefine("structuredClone", function _sc(val) { return JSON.parse(JSON.stringify(val)); });
_safeDefine("__ExpoImportMetaRegistry", { url: "file:///test" });

// ---------- Supabase client ----------
// Must be mocked before any store/hook/component imports it
jest.mock("../../src/lib/supabase", () => {
  var mockSelect = jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    order: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue({ data: [], error: null }) }),
    in: jest.fn().mockResolvedValue({ data: [], error: null }),
    gte: jest.fn().mockReturnValue({ lte: jest.fn().mockResolvedValue({ data: [], error: null }) }),
  });
  var mockFrom = jest.fn().mockReturnValue({
    select: mockSelect,
    insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: null }) }) }),
    update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: null, error: null }), match: jest.fn().mockResolvedValue({ data: null, error: null }) }),
    delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) }),
    upsert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: null }) }) }),
  });
  return {
    supabase: {
      from: mockFrom,
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signInWithPassword: jest.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
        signUp: jest.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
        updateUser: jest.fn().mockResolvedValue({ data: null, error: null }),
      },
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ data: { path: "test.jpg" }, error: null }),
          getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "https://example.com/test.jpg" } }),
        }),
      },
      channel: jest.fn().mockReturnValue({ on: jest.fn().mockReturnThis(), subscribe: jest.fn(), unsubscribe: jest.fn() }),
    },
  };
});

// ---------- NativeWind / CSS ----------
jest.mock("nativewind", () => ({
  styled: (component) => component,
  useColorScheme: () => ({ colorScheme: "light", setColorScheme: () => {} }),
  cssInterop: () => {},
}));
jest.mock("../../global.css", () => ({}), { virtual: true });

// ---------- Expo modules ----------
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(false),
    setParams: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  usePathname: () => "/",
  Link: "Link",
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
  Redirect: () => null,
}));

jest.mock("expo-font", () => ({
  useFonts: () => [true, null],
  isLoaded: jest.fn().mockReturnValue(true),
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

jest.mock("expo-image", () => ({ Image: "Image" }));
jest.mock("expo-blur", () => ({ BlurView: "BlurView" }));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-local-authentication", () => ({
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 },
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 54.6872, longitude: 25.2797 },
  }),
  Accuracy: { Balanced: 3 },
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "test-token" }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  MediaTypeOptions: { Images: "Images" },
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

jest.mock("expo-file-system", () => ({
  documentDirectory: "/mock/documents/",
  readAsStringAsync: jest.fn().mockResolvedValue(""),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-constants", () => ({
  default: { expoConfig: { extra: {} } },
}));

jest.mock("expo-linking", () => ({
  createURL: jest.fn((path) => `hobio://${path}`),
  openURL: jest.fn(),
}));

jest.mock("expo-status-bar", () => ({ StatusBar: "StatusBar" }));

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: "manipulated.jpg" }),
  SaveFormat: { JPEG: "jpeg", PNG: "png" },
}));

// ---------- React Native ecosystem ----------
jest.mock("react-native-safe-area-context", () => {
  const RN = require("react-native");
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: (props) => require("react").createElement(RN.View, props, props.children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  };
});

jest.mock("react-native-gesture-handler", () => {
  const RN = require("react-native");
  return {
    GestureHandlerRootView: ({ children }) => children,
    Swipeable: "Swipeable",
    DrawerLayout: "DrawerLayout",
    State: {},
    PanGestureHandler: "PanGestureHandler",
    TapGestureHandler: "TapGestureHandler",
    FlingGestureHandler: "FlingGestureHandler",
    LongPressGestureHandler: "LongPressGestureHandler",
    ScrollView: RN.ScrollView,
    FlatList: RN.FlatList,
    TouchableOpacity: RN.TouchableOpacity,
  };
});

jest.mock("react-native-reanimated", () => {
  const RN = require("react-native");
  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (component) => component,
      View: RN.View,
      Text: RN.Text,
      Image: RN.Image,
      ScrollView: RN.ScrollView,
      addWhitelistedNativeProps: jest.fn(),
      addWhitelistedUIProps: jest.fn(),
    },
    useSharedValue: (init) => ({ value: init }),
    useAnimatedStyle: (fn) => fn(),
    useDerivedValue: (fn) => ({ value: fn() }),
    useAnimatedScrollHandler: () => jest.fn(),
    withTiming: (val) => val,
    withSpring: (val) => val,
    withDecay: (val) => val,
    withDelay: (_, val) => val,
    withSequence: (...vals) => vals[vals.length - 1],
    withRepeat: (val) => val,
    Easing: { linear: jest.fn(), ease: jest.fn(), bezier: jest.fn() },
    FadeIn: { duration: jest.fn().mockReturnThis(), delay: jest.fn().mockReturnThis() },
    FadeOut: { duration: jest.fn().mockReturnThis() },
    FadeInDown: { duration: jest.fn().mockReturnThis(), delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
    FadeInUp: { duration: jest.fn().mockReturnThis(), delay: jest.fn().mockReturnThis() },
    SlideInRight: { duration: jest.fn().mockReturnThis() },
    SlideOutRight: { duration: jest.fn().mockReturnThis() },
    Layout: { duration: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
    LinearTransition: { springify: jest.fn().mockReturnThis() },
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    interpolate: jest.fn(),
    Extrapolation: { CLAMP: "clamp" },
    cancelAnimation: jest.fn(),
  };
});

jest.mock("react-native-screens", () => ({
  enableScreens: jest.fn(),
}));

jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  const RN = require("react-native");
  const BottomSheet = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      snapToIndex: jest.fn(),
      close: jest.fn(),
      expand: jest.fn(),
      collapse: jest.fn(),
    }));
    return React.createElement(RN.View, null, props.children);
  });
  BottomSheet.displayName = "BottomSheet";
  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetView: (props) => React.createElement(RN.View, null, props.children),
    BottomSheetScrollView: (props) => React.createElement(RN.View, null, props.children),
    BottomSheetTextInput: "TextInput",
    BottomSheetBackdrop: () => null,
  };
});

jest.mock("lucide-react-native", () => {
  return new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === "__esModule") return true;
        return () => null;
      },
    }
  );
});

jest.mock("react-native-maps", () => {
  const React = require("react");
  const RN = require("react-native");
  const MapView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ animateToRegion: jest.fn() }));
    return React.createElement(RN.View, props, props.children);
  });
  MapView.displayName = "MapView";
  return {
    __esModule: true,
    default: MapView,
    Marker: (props) => React.createElement(RN.View, props),
    Callout: (props) => React.createElement(RN.View, props),
    PROVIDER_GOOGLE: "google",
  };
});

jest.mock("react-native-map-clustering", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: (props) => React.createElement(RN.View, props, props.children),
  };
});

jest.mock("react-native-svg", () => {
  const React = require("react");
  const RN = require("react-native");
  const makeMock = (name) => (props) => React.createElement(RN.View, { ...props, testID: name });
  return {
    __esModule: true,
    default: makeMock("Svg"),
    Svg: makeMock("Svg"),
    Circle: makeMock("Circle"),
    Rect: makeMock("Rect"),
    Path: makeMock("Path"),
    G: makeMock("G"),
    Text: makeMock("SvgText"),
    Line: makeMock("Line"),
    Defs: makeMock("Defs"),
    LinearGradient: makeMock("LinearGradient"),
    Stop: makeMock("Stop"),
  };
});

jest.mock("react-native-signature-canvas", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        readSignature: jest.fn(),
        clearSignature: jest.fn(),
      }));
      return React.createElement(RN.View, props);
    }),
  };
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
}));

jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: (props) => React.createElement(RN.View, props),
  };
});

jest.mock("@stripe/stripe-react-native", () => ({
  StripeProvider: ({ children }) => children,
  useStripe: () => ({
    initPaymentSheet: jest.fn().mockResolvedValue({}),
    presentPaymentSheet: jest.fn().mockResolvedValue({}),
    confirmPaymentSheetPayment: jest.fn().mockResolvedValue({}),
  }),
  usePaymentSheet: () => ({
    initPaymentSheet: jest.fn().mockResolvedValue({}),
    presentPaymentSheet: jest.fn().mockResolvedValue({}),
    loading: false,
  }),
}));

jest.mock("@expo-google-fonts/nunito", () => ({
  useFonts: () => [true, null],
  Nunito_400Regular: "Nunito_400Regular",
  Nunito_500Medium: "Nunito_500Medium",
  Nunito_600SemiBold: "Nunito_600SemiBold",
  Nunito_700Bold: "Nunito_700Bold",
  Nunito_800ExtraBold: "Nunito_800ExtraBold",
}));

// ---------- Asset mocks ----------
jest.mock("../../assets/hobio-logo.png", () => 1, { virtual: true });

// ---------- Console silencing ----------
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});
