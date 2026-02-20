import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup";

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      const msg = error?.message ?? "";
      const isNetworkError =
        msg === "Network request failed" ||
        (error?.name === "TypeError" && msg.includes("Network request failed"));
      if (isNetworkError) {
        Alert.alert(
          "Connection error",
          "Could not reach the server. Try:\n\n• Using the same Wi‑Fi as this device\n• Turning off VPN\n• Restarting the app\n• Using a phone hotspot if on simulator"
        );
      } else {
        Alert.alert("Error", msg || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) throw error;
      if (!data.user) throw new Error("User data missing after sign up");

      // Create profile in Supabase directly
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName.trim(),
        updated_at: new Date().toISOString(),
      });

      if (!data.session) {
        Alert.alert("Success", "Check your email to confirm your account!");
      }
    } catch (error: any) {
      const msg = error?.message ?? "";
      const isNetworkError =
        msg === "Network request failed" ||
        (error?.name === "TypeError" && msg.includes("Network request failed"));
      if (isNetworkError) {
        Alert.alert(
          "Connection error",
          "Could not reach the server. Try:\n\n• Using the same Wi‑Fi as this device\n• Turning off VPN\n• Restarting the app\n• Using a phone hotspot if on simulator"
        );
      } else {
        Alert.alert("Error", msg || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = () => router.push("/(auth)/recover");

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            {mode === "login" ? "Login to Snipify" : "Welcome to Snipify"}
          </Text>

          {/* Tab switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === "signup" && styles.tabActive]}
              onPress={() => setMode("signup")}
            >
              <Text style={[styles.tabText, mode === "signup" && styles.tabTextActive]}>
                Sign up
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "login" && styles.tabActive]}
              onPress={() => setMode("login")}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fields */}
          {mode === "signup" && (
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>
          </View>

          {mode === "signup" && (
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="rgba(255,255,255,0.5)"
                />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={mode === "login" ? handleLogin : handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitText}>
                {mode === "login" ? "Login" : "Register"}
              </Text>
            )}
          </TouchableOpacity>

          {mode === "login" && (
            <View style={styles.recoverContainer}>
              <Text style={styles.recoverText}>Forgot your password? </Text>
              <TouchableOpacity onPress={handleRecover}>
                <Text style={styles.recoverLink}>Recover</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#282828",
    borderRadius: 100,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#fff" },
  tabText: { color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  tabTextActive: { color: "#000" },
  input: {
    backgroundColor: "#282828",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 15,
  },
  passwordContainer: {
    flexDirection: "row",
    backgroundColor: "#282828",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 15,
  },
  eyeButton: { paddingHorizontal: 14 },
  submitButton: {
    backgroundColor: "#fff",
    borderRadius: 100,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitText: { color: "#000", fontWeight: "600", fontSize: 16 },
  recoverContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 4,
  },
  recoverText: { color: "rgba(255,255,255,0.6)" },
  recoverLink: { color: "#fff" },
});
