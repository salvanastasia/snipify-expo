import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { SearchBar } from "@/components/SearchBar";
import { LyricSnippets } from "@/components/LyricSnippets";
import { TopArtists } from "@/components/TopArtists";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { ProfileName } from "@/components/ProfileName";
import { ProfileStats } from "@/components/ProfileStats";

const TOP_GRADIENT_HEIGHT = 64;

export default function HomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (!user) return null;

  return (
    <View style={styles.container}>
      {/* Gradient dalla cima (dietro status bar): #121212 → trasparente verso il basso */}
      <View
        pointerEvents="none"
        style={[styles.topGradient, { height: insets.top + TOP_GRADIENT_HEIGHT }]}
      >
        <LinearGradient
          colors={[
            "#121212",
            "rgba(18, 18, 18, 0.6)",
            "rgba(18, 18, 18, 0.25)",
            "rgba(18, 18, 18, 0)",
            "rgba(18, 18, 18, 0)",
          ]}
          locations={[0, 0.12, 0.28, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>
      <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <ProfilePhoto userId={user.id} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileLabel}>Profile</Text>
            <ProfileName userId={user.id} />
            <ProfileStats userId={user.id} />
          </View>
        </View>

        {/* Snippets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Snippets</Text>
          <LyricSnippets key={`snippets-${refreshKey}`} />
        </View>

        {/* Top Artists */}
        <View style={styles.section}>
          <TopArtists key={`artists-${refreshKey}`} />
        </View>
      </ScrollView>
      <SearchBar onSnippetSaved={() => setRefreshKey((k) => k + 1)} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  safeArea: { flex: 1, backgroundColor: "transparent" },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    overflow: "hidden",
  },
  scroll: { flex: 1, backgroundColor: "#121212" },
  scrollContent: { paddingTop: 0, paddingBottom: 80 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 98,
    paddingBottom: 24,
    gap: 16,
    flexWrap: "wrap",
  },
  profileInfo: { flex: 1, gap: 4 },
  profileLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  section: { paddingHorizontal: 24, marginTop: 24 },
  sectionTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
});
