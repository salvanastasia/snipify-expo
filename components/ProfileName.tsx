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
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface Props {
  userId: string;
}

export function ProfileName({ userId }: Props) {
  const { signOut } = useAuth();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

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
    setEditing(false);
  };

  const handleSignOut = () => {
    Keyboard.dismiss();
    setEditing(false);
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
      setEditing(false);
    } catch {
      Alert.alert("Error", "Failed to update name.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.nameRow}
        onPress={() => { setDraft(name); setEditing(true); }}
      >
        <Text style={styles.name}>{name || "Add your name"}</Text>
        <Ionicons name="pencil" size={14} color="rgba(255,255,255,0.4)" />
      </TouchableOpacity>

      <Modal visible={editing} transparent animationType="fade" onRequestClose={handleCancel}>
        <View style={styles.overlayRoot}>
          <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} pointerEvents="none">
            <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
            colors={[
              "rgba(18, 18, 18, 0)",
              "rgba(18, 18, 18, 0)",
              "rgba(18, 18, 18, 0.25)",
              "rgba(18, 18, 18, 0.6)",
              "#121212",
            ]}
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
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>Edit Name</Text>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                autoFocus
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
              <View style={styles.buttons}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.saveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
                <Text style={styles.signOutText}>Sign Out</Text>
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
