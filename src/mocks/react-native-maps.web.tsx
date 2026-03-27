/**
 * Web stub for react-native-maps.
 * react-native-maps uses native-only APIs that don't work on web.
 * This stub exports no-op components so Metro can bundle on web without errors.
 */
import React from "react";
import { View } from "react-native";

const Stub = () => null;

export default { ...View, Marker: Stub, Callout: Stub };
export const MapView = Stub;
export const Marker = Stub;
export const Callout = Stub;
export const Polygon = Stub;
export const Polyline = Stub;
export const Circle = Stub;
export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = null;
