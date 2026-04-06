/**
 * Stub for @rnmapbox/maps when native Mapbox isn’t linked (Expo Go, tests, web via Metro).
 * Real map: set EXPO_PUBLIC_NATIVE_MAPBOX=true and use `expo run:ios` / a dev client build.
 */
import React from "react";
import { View, Text, StyleSheet, type ViewProps } from "react-native";

type MapViewProps = ViewProps & {
  children?: React.ReactNode;
  styleURL?: string;
  logoEnabled?: boolean;
  attributionEnabled?: boolean;
  compassEnabled?: boolean;
  scaleBarEnabled?: boolean;
  onRegionDidChange?: (e: { properties?: { center?: [number, number]; zoomLevel?: number } }) => void;
};

function MapView({ style, children, ..._rest }: MapViewProps) {
  return (
    <View style={[styles.mapShell, style]}>
      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>
          Map preview isn’t available in Expo Go. Run{" "}
          <Text style={styles.mono}>npm run ios</Text> (dev build) to use Mapbox.
        </Text>
      </View>
      {children}
    </View>
  );
}

const Camera = React.forwardRef<{ setCamera: (_opts: unknown) => void }, object>(function Camera(
  _props,
  ref
) {
  React.useImperativeHandle(ref, () => ({
    setCamera: () => {},
  }));
  return null;
});

const UserLocation = (_props: { visible?: boolean; androidRenderMode?: string }) => null;

function MarkerView({ children }: { children?: React.ReactNode; coordinate?: [number, number] }) {
  return <>{children}</>;
}

const MapboxGL = {
  setAccessToken: (_token: string) => {},
  MapView,
  Camera,
  MarkerView,
  PointAnnotation: () => null,
  UserLocation,
  ShapeSource: () => null,
  SymbolLayer: () => null,
  CircleLayer: () => null,
  LineLayer: () => null,
  Images: () => null,
};

export default MapboxGL;
export const setAccessToken = MapboxGL.setAccessToken;
export const MapView = MapView;
export const Camera = Camera;
export const MarkerView = MarkerView;
export const PointAnnotation = MapboxGL.PointAnnotation;
export const UserLocation = UserLocation;

const styles = StyleSheet.create({
  mapShell: {
    flex: 1,
    backgroundColor: "#E8E4E0",
  },
  hint: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 0,
  },
  hintText: {
    fontSize: 14,
    color: "#5C534A",
    textAlign: "center",
    lineHeight: 20,
  },
  mono: {
    fontFamily: "Menlo",
  },
});
