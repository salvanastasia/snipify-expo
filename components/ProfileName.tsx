import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import type { ThemeId, FontId } from "@/lib/theme-context";
import { THEME_SWATCH_COLORS } from "@/lib/theme-context";

export const LAYOUT_STORAGE_KEY = "snippets_layout";
export type SnippetsLayoutId = "list" | "grid";

const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: "default", label: "Default theme" },
  { id: "cream", label: "Cream theme" },
];

interface Props {
  userId: string;
  profileSetupOpen: boolean;
  onProfileSetupClose: () => void;
  onProfileSaved?: () => void;
}

export function ProfileName({ userId, profileSetupOpen, onProfileSetupClose, onProfileSaved }: Props) {
  const { signOut } = useAuth();
  const { theme, colors, setTheme, font, setFont, defaultFontFamily } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (profileSetupOpen) setDraft(name);
  }, [profileSetupOpen, name]);

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    if (data?.full_name) setName(data.full_name);
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    setMenuOpen(false);
    onProfileSetupClose();
  };

  const handleLogout = () => {
    setMenuOpen(false);
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
      onProfileSaved?.();
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
        <ThemedText style={[styles.name, { color: colors.text }]}>
          {name || "Add your name"}
        </ThemedText>
      </View>

      <Modal visible={profileSetupOpen} transparent animationType="slide" onRequestClose={handleCancel}>
        <TouchableOpacity style={styles.overlayRoot} activeOpacity={1} onPress={handleCancel}>
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
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.dialog,
                  { backgroundColor: colors.card, paddingBottom: 24 + insets.bottom },
                ]}
              >
                <View style={styles.dialogHeader}>
                  <ThemedText style={[styles.dialogTitle, { color: colors.text }]} accessibilityRole="header">
                Profile Setup
              </ThemedText>
                  <View style={styles.menuAnchor}>
                    <TouchableOpacity
                      style={styles.menuTrigger}
                      onPress={() => setMenuOpen((v) => !v)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
                    </TouchableOpacity>
                    {menuOpen && (
                      <View style={[styles.dropdown, { backgroundColor: colors.card }]}>
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={handleLogout}
                        >
                          <ThemedText style={[styles.dropdownItemText, { color: colors.text }]}>Logout</ThemedText>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
                <ThemedTextInput
                  style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
                  value={draft}
                  onChangeText={setDraft}
                  placeholderTextColor={colors.textMuted}
                  placeholder="Your name"
                  accessibilityLabel="Profile name"
                />
                <View style={styles.themeRow}>
                  <ThemedText style={[styles.sectionLabel, { color: colors.textMuted }]}>Theme</ThemedText>
                  <View style={styles.themeSwatches}>
                    {THEME_OPTIONS.map((opt) => {
                      const selected = theme === opt.id;
                      const swatchColor = THEME_SWATCH_COLORS[opt.id];
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.swatchOuter,
                            { borderColor: selected ? colors.text : "rgba(255,255,255,0.4)" },
                            selected ? styles.swatchOuterSelected : null,
                          ]}
                          onPress={() => setTheme(opt.id)}
                          accessibilityLabel={`${opt.label}${selected ? ", selected" : ""}`}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                        >
                          <View
                            style={[styles.swatchInner, { backgroundColor: swatchColor }]}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.fontRow}>
                  <ThemedText style={[styles.sectionLabel, { color: colors.textMuted }]}>Font</ThemedText>
                  <View style={styles.fontSwitcher}>
                    <TouchableOpacity
                      style={[
                        styles.fontAaOption,
                        { backgroundColor: font === "default" ? (isCream ? colors.text : "#fff") : colors.input },
                        font === "default" && styles.fontAaOptionSelected,
                      ]}
                      onPress={() => setFont("default")}
                      accessibilityLabel="Default font"
                      accessibilityRole="button"
                      accessibilityState={{ selected: font === "default" }}
                    >
                      <ThemedText style={[styles.fontAaText, font === "default" ? (isCream ? { color: colors.background } : styles.fontOptionTextActive) : { color: colors.text }]}>
                        Aa
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.fontAaOption,
                        { backgroundColor: font === "Doto" ? (isCream ? colors.text : "#fff") : colors.input },
                        font === "Doto" && styles.fontAaOptionSelected,
                      ]}
                      onPress={() => setFont("Doto")}
                      accessibilityLabel="Doto font"
                      accessibilityRole="button"
                      accessibilityState={{ selected: font === "Doto" }}
                    >
                      <ThemedText style={[styles.fontAaText, font === "Doto" ? (isCream ? { color: colors.background } : styles.fontOptionTextActive) : { color: colors.text }, { fontFamily: "Doto" }]}>
                        Aa
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.buttons}>
                  <TouchableOpacity onPress={handleCancel} style={[styles.cancelBtn, { backgroundColor: colors.input }]}>
                    <ThemedText style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
                    {saving ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <ThemedText style={styles.saveText}>Save</ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
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
    justifyContent: "flex-end",
  },
  overlayScroll: { flexGrow: 0 },
  overlay: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    flexGrow: 0,
  },
  dialog: {
    backgroundColor: "#282828",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    width: "100%",
    gap: 20,
  },
  dialogHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dialogTitle: { color: "#fff", fontSize: 20, fontWeight: "700", flex: 1 } as const,
  menuAnchor: { position: "relative" },
  menuTrigger: { padding: 8 },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 4,
    minWidth: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    zIndex: 10,
    elevation: 10,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: { fontSize: 15, fontWeight: "500" },
  sectionLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "500", marginBottom: 8 },
  fontRow: { gap: 8 },
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
  fontAaOptionSelected: { borderColor: "rgba(255,255,255,0.9)", borderWidth: 2 },
  fontAaText: { fontSize: 22, fontWeight: "700" },
  fontOptionTextActive: { color: "#000", fontWeight: "600" },
  themeRow: { gap: 8 },
  themeSwatches: { flexDirection: "row", gap: 16, alignItems: "center" },
  swatchOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchOuterSelected: { borderWidth: 3 },
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
});
