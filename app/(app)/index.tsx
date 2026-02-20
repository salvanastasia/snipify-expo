import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { SearchBar } from "@/components/SearchBar";
import { LyricSnippets } from "@/components/LyricSnippets";
import { TopArtists } from "@/components/TopArtists";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { ProfileName } from "@/components/ProfileName";
import { ProfileStats } from "@/components/ProfileStats";

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SearchBar onSnippetSaved={() => setRefreshKey((k) => k + 1)} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 80, paddingBottom: 40 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
    flexWrap: "wrap",
  },
  profileInfo: { flex: 1, gap: 4 },
  profileLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  signOutButton: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#555",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#333",
  },
  signOutText: { color: "#fff", fontSize: 13 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
});
