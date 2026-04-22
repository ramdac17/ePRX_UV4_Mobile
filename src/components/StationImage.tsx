import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";
import Constants from "expo-constants";

interface Props {
  uri: string | null;
  style: StyleProp<ImageStyle>;
}

// ✅ Safe env access helper
const BACKEND_ROOT =
  Constants.expoConfig?.extra?.API_URL?.replace("/api", "") ||
  "https://eprxuv1-monorepo-production.up.railway.app";

export const StationImage = ({ uri, style }: Props) => {
  if (!uri) {
    return <Image source={require("@/assets/placeholder.png")} style={style} />;
  }

  let sourceUri = uri;

  if (!uri.startsWith("http")) {
    const cleanPath = uri.startsWith("/") ? uri : `/uploads/${uri}`;
    sourceUri = `${BACKEND_ROOT}${cleanPath}`;
  }

  return (
    <Image
      source={{ uri: sourceUri }}
      style={style}
      resizeMode="cover"
      key={sourceUri}
    />
  );
};
