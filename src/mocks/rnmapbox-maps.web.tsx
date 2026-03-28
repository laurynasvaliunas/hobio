/**
 * Web stub for @rnmapbox/maps.
 * Mapbox GL uses native modules that cannot run on web.
 * This stub exports no-op components so Metro can bundle on web without errors.
 */
import React from "react";
import { View } from "react-native";

const Stub = () => null;
const StubForwardRef = React.forwardRef(() => null);

const MapboxGL = {
  setAccessToken: (_token: string) => {},
  MapView: Stub,
  Camera: StubForwardRef,
  MarkerView: Stub,
  PointAnnotation: Stub,
  UserLocation: Stub,
  ShapeSource: Stub,
  SymbolLayer: Stub,
  CircleLayer: Stub,
  LineLayer: Stub,
  Images: Stub,
};

export default MapboxGL;
export const setAccessToken = (_token: string) => {};
export const MapView = Stub;
export const Camera = StubForwardRef;
export const MarkerView = Stub;
export const PointAnnotation = Stub;
export const UserLocation = Stub;
