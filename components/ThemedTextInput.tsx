import React from "react";
import { TextInput, TextInputProps } from "react-native";
import { useTheme } from "@/lib/theme-context";

export function ThemedTextInput({ style, ...props }: TextInputProps) {
  const { defaultFontFamily } = useTheme();
  return (
    <TextInput
      style={[{ fontFamily: defaultFontFamily }, style]}
      {...props}
    />
  );
}
