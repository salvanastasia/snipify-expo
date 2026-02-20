import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { SearchBar } from "@/components/SearchBar";
import { LyricSnippets } from "@/components/LyricSnippets";
import { TopArtists } from "@/components/TopArtists";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { ProfileName } from "@/components/ProfileName";
import { ProfileStats } from "@/components/ProfileStats";

const TOP_GRADIENT_HEIGHT = 64;

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (!user) return null;

  const gradientColors: readonly [string, string, ...string[]] =
    colors.background === "#121212"
      ? ["#121212", "rgba(18, 18, 18, 0.6)", "rgba(18, 18, 18, 0.25)", "rgba(18, 18, 18, 0)", "rgba(18, 18, 18, 0)"]
      : [colors.background, `${colors.background}99`, `${colors.background}40`, `${colors.background}00`, `${colors.background}00`];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        pointerEvents="none"
        style={[styles.topGradient, { height: insets.top + TOP_GRADIENT_HEIGHT }]}
      >
        <LinearGradient
          colors={gradientColors}
          locations={[0, 0.12, 0.28, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <ScrollView
          style={[styles.scroll, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          }
        >
          <View style={styles.profileHeader}>
            <View style={styles.profileHeaderRow}>
              <ProfilePhoto userId={user.id} />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileLabel, { color: colors.textMuted }]}>Profile</Text>
                <ProfileName
                  userId={user.id}
                  profileSetupOpen={profileSetupOpen}
                  onProfileSetupClose={() => {
                  setProfileSetupOpen(false);
                  setRefreshKey((k) => k + 1);
                }}
                />
                <ProfileStats userId={user.id} />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.profileSetupBtn, { backgroundColor: colors.input }]}
              onPress={() => setProfileSetupOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.profileSetupBtnText, { color: colors.text }]}>Profile Setup</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Snippets</Text>
            <View style={styles.snippetsSwiperWrapper}>
              <LyricSnippets key={`snippets-${refreshKey}`} />
            </View>
          </View>

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
  container: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "transparent" },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    overflow: "hidden",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 0, paddingBottom: 80 },
  profileHeader: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingTop: 98,
    paddingBottom: 24,
    gap: 16,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  profileInfo: { flex: 1, gap: 4 },
  profileSetupBtn: {
    alignSelf: "stretch",
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  profileSetupBtnText: { fontSize: 15, fontWeight: "600" },
  profileLabel: { fontSize: 12 },
  section: { paddingHorizontal: 24, marginTop: 16 },
  snippetsSwiperWrapper: { marginHorizontal: -24 },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
});
