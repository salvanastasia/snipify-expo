import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import type { ThemeId } from "@/lib/theme-context";
import { THEME_SWATCH_COLORS } from "@/lib/theme-context";

const FONT_STORAGE_KEY = "profile_font";
export const LAYOUT_STORAGE_KEY = "snippets_layout";
type FontChoice = "default" | "Doto";
export type SnippetsLayoutId = "list" | "grid";

const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: "default", label: "Default theme" },
  { id: "cream", label: "Cream theme" },
];

const LAYOUT_OPTIONS: { id: SnippetsLayoutId; label: string }[] = [
  { id: "list", label: "List" },
  { id: "grid", label: "Grid" },
];

interface Props {
  userId: string;
  profileSetupOpen: boolean;
  onProfileSetupClose: () => void;
}

export function ProfileName({ userId, profileSetupOpen, onProfileSetupClose }: Props) {
  const { signOut } = useAuth();
  const { theme, colors, setTheme } = useTheme();
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [font, setFont] = useState<FontChoice>("default");
  const [layout, setLayout] = useState<SnippetsLayoutId>("list");

  useEffect(() => {
    if (profileSetupOpen) setDraft(name);
  }, [profileSetupOpen, name]);

  useEffect(() => {
    load();
  }, [userId]);

  useEffect(() => {
    (async () => {
      try {
        const [fontStored, layoutStored] = await Promise.all([
          AsyncStorage.getItem(FONT_STORAGE_KEY),
          AsyncStorage.getItem(LAYOUT_STORAGE_KEY),
        ]);
        if (fontStored === "Doto" || fontStored === "default") setFont(fontStored);
        if (layoutStored === "list" || layoutStored === "grid") setLayout(layoutStored);
      } catch {}
    })();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    if (data?.full_name) setName(data.full_name);
  };

  const setFontAndPersist = (value: FontChoice) => {
    setFont(value);
    AsyncStorage.setItem(FONT_STORAGE_KEY, value).catch(() => {});
  };

  const setLayoutAndPersist = (value: SnippetsLayoutId) => {
    setLayout(value);
    AsyncStorage.setItem(LAYOUT_STORAGE_KEY, value).catch(() => {});
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    onProfileSetupClose();
  };

  const handleSignOut = () => {
    Keyboard.dismiss();
    onProfileSetupClose();
    signOut();
  };

  const handleSave = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: draft.trim() })
        .eq("id", userId);
      if (error) throw error;
      setName(draft.trim());
      onProfileSetupClose();
    } catch {
      Alert.alert("Error", "Failed to update name.");
    } finally {
      setSaving(false);
    }
  };

  const isCream = colors.background === "#F2EDE7";
  const overlayGradientColors = isCream
    ? ["rgba(242,237,231,0)", "rgba(242,237,231,0)", "rgba(242,237,231,0.25)", "rgba(242,237,231,0.6)", "#F2EDE7"]
    : ["rgba(18, 18, 18, 0)", "rgba(18, 18, 18, 0)", "rgba(18, 18, 18, 0.25)", "rgba(18, 18, 18, 0.6)", "#121212"];

  return (
    <>
      <View style={styles.nameRow}>
        <Text style={[styles.name, { color: colors.text }, font === "Doto" && { fontFamily: "Doto" }]}>
          {name || "Add your name"}
        </Text>
      </View>

      <Modal visible={profileSetupOpen} transparent animationType="fade" onRequestClose={handleCancel}>
        <View style={styles.overlayRoot}>
          <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} pointerEvents="none">
            <BlurView intensity={24} tint={isCream ? "light" : "dark"} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={overlayGradientColors}
              locations={[0, 0.5, 0.72, 0.88, 1]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>
          <ScrollView
            style={styles.overlayScroll}
            contentContainerStyle={styles.overlay}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.dialog, { backgroundColor: colors.card }]}>
              <Text style={[styles.dialogTitle, { color: colors.text }]} accessibilityRole="header">
                Profile Setup
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
                value={draft}
                onChangeText={setDraft}
                autoFocus
                placeholderTextColor={colors.textMuted}
                placeholder="Your name"
                accessibilityLabel="Profile name"
              />
              <View style={styles.themeRow}>
                <Text style={[styles.themeLabel, { color: colors.textMuted }]}>Theme</Text>
                <View style={styles.themeSwatches}>
                  {THEME_OPTIONS.map((opt) => {
                    const selected = theme === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.swatchOuter,
                          selected && { borderColor: colors.text, borderWidth: 3 },
                        ]}
                        onPress={() => setTheme(opt.id)}
                        accessibilityLabel={`${opt.label}${selected ? ", selected" : ""}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <View
                          style={[
                            styles.swatchInner,
                            { backgroundColor: THEME_SWATCH_COLORS[opt.id] },
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={styles.fontRow}>
                <Text style={[styles.fontLabel, { color: colors.textMuted }]}>Font</Text>
                <View style={styles.fontSwitcher}>
                  <TouchableOpacity
                    style={[
                      styles.fontAaOption,
                      { backgroundColor: font === "default" ? (isCream ? colors.text : "#fff") : colors.input },
                      font === "default" && { borderColor: colors.text, borderWidth: 2 },
                    ]}
                    onPress={() => setFontAndPersist("default")}
                    accessibilityLabel="Default font"
                    accessibilityRole="button"
                    accessibilityState={{ selected: font === "default" }}
                  >
                    <Text style={[styles.fontAaText, font === "default" ? (isCream ? { color: colors.background } : styles.fontOptionTextActive) : { color: colors.text }]}>
                      Aa
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.fontAaOption,
                      { backgroundColor: font === "Doto" ? (isCream ? colors.text : "#fff") : colors.input },
                      font === "Doto" && { borderColor: colors.text, borderWidth: 2 },
                    ]}
                    onPress={() => setFontAndPersist("Doto")}
                    accessibilityLabel="Doto font"
                    accessibilityRole="button"
                    accessibilityState={{ selected: font === "Doto" }}
                  >
                    <Text style={[styles.fontAaText, font === "Doto" ? (isCream ? { color: colors.background } : styles.fontOptionTextActive) : { color: colors.text }, { fontFamily: "Doto" }]}>
                      Aa
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.layoutRow}>
                <Text style={[styles.fontLabel, { color: colors.textMuted }]}>Layout</Text>
                <View style={styles.layoutSwitcher}>
                  {LAYOUT_OPTIONS.map((opt) => {
                    const selected = layout === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.layoutOption,
                          { backgroundColor: selected ? (isCream ? colors.text : "#fff") : colors.input },
                          selected && { borderColor: colors.text, borderWidth: 2 },
                        ]}
                        onPress={() => setLayoutAndPersist(opt.id)}
                        accessibilityLabel={`${opt.label} layout${selected ? ", selected" : ""}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Text style={[styles.layoutOptionText, selected ? (isCream ? { color: colors.background } : styles.fontOptionTextActive) : { color: colors.text }]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={styles.buttons}>
                <TouchableOpacity onPress={handleCancel} style={[styles.cancelBtn, { backgroundColor: colors.input }]}>
                  <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.saveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleSignOut} style={[styles.signOutBtn, { borderColor: colors.border }]}>
                <Text style={[styles.signOutText, { color: colors.text }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: { color: "#fff", fontSize: 22, fontWeight: "700" },
  overlayRoot: {
    flex: 1,
  },
  overlayScroll: { flex: 1 },
  overlay: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: "#282828",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    gap: 16,
  },
  dialogTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  fontRow: { gap: 8 },
  fontLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "500" },
  fontSwitcher: { flexDirection: "row", gap: 12, alignItems: "center" },
  fontAaOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  fontAaText: { fontSize: 22, fontWeight: "700" },
  fontOptionTextActive: { color: "#000", fontWeight: "600" },
  layoutRow: { gap: 8 },
  layoutSwitcher: { flexDirection: "row", gap: 8 },
  layoutOption: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  layoutOptionText: { fontSize: 15, fontWeight: "500" },
  themeRow: { gap: 10 },
  themeLabel: { fontSize: 18, fontWeight: "700" },
  themeSwatches: { flexDirection: "row", gap: 16, alignItems: "center" },
  swatchOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  input: {
    backgroundColor: "#383838",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
  },
  buttons: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 100,
    backgroundColor: "#383838",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 100,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#000", fontWeight: "600" },
  signOutBtn: {
    marginTop: 8,
    height: 44,
    borderRadius: 100,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: { color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: "500" },
});
