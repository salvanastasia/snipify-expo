import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme-context";

export function ThemedText({ style, ...props }: TextProps) {
  const { defaultFontFamily, defaultFontFamilyBold } = useTheme();
  const flatStyle = StyleSheet.flatten(style);
  const fontWeight = flatStyle?.fontWeight;
  const useBold =
    fontWeight === "bold" ||
    fontWeight === "700" ||
    fontWeight === "600";
  const fontFamily = useBold ? defaultFontFamilyBold : defaultFontFamily;
  return (
    <Text
      style={[{ fontFamily }, style]}
      {...props}
    />
  );
}
