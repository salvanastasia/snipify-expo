import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { getLyricSnippets, getLyricSnippetsByUserId, LyricSnippet, updateSnippetColor } from "@/lib/storage";
import { getColorsFromImageUrl } from "@/lib/albumArtColors";
import { useAuth } from "@/lib/auth-context";
import { SnippetGridCard, SNIPPET_GRID_CARD_GAP } from "@/components/SnippetGridCard";

interface Profile {
  id: string;
  full_name: string;
  profile_image_url: string | null;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [snippets, setSnippets] = useState<LyricSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [artistsInCommon, setArtistsInCommon] = useState<{ name: string; imageUrl: string | null }[]>([]);
  const [artistsInCommonModalOpen, setArtistsInCommonModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const isOwn = user?.id === id;
      const [profileRes, snippetsData, mySnippetsData] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        getLyricSnippetsByUserId(id),
        !isOwn && user ? getLyricSnippets() : Promise.resolve([]),
      ]);
      const profileData = profileRes.data;
      setProfile(profileData);
      setSnippets(snippetsData);

      // Artists in common (only for friend's profile when logged in)
      if (!isOwn && user && mySnippetsData.length > 0 && snippetsData.length > 0) {
        const theirArtists = new Map<string, string | null>();
        snippetsData.forEach((s) => {
          if (!theirArtists.has(s.artist_name)) {
            theirArtists.set(s.artist_name, s.artist_art_url || s.album_art_url || null);
          }
        });
        const myArtistNames = new Set(mySnippetsData.map((s) => s.artist_name));
        const common: { name: string; imageUrl: string | null }[] = [];
        theirArtists.forEach((imageUrl, name) => {
          if (myArtistNames.has(name)) {
            common.push({ name, imageUrl });
          }
        });
        setArtistsInCommon(common);
      } else {
        setArtistsInCommon([]);
      }

      // Fetch colors for old snippets that don't have colors
      const snippetsWithoutColors = snippetsData.filter(
        (s) => !s.color && s.album_art_url
      );

      // Update colors in background (don't block UI)
      for (const snippet of snippetsWithoutColors) {
        try {
          const color = await getColorsFromImageUrl(snippet.album_art_url);
          if (color) {
            await updateSnippetColor(snippet.id, color);
            // Update local state
            setSnippets((prev) =>
              prev.map((s) => (s.id === snippet.id ? { ...s, color } : s))
            );
          }
        } catch (e) {
          console.error(`Failed to fetch color for snippet ${snippet.id}:`, e);
        }
      }

      // Check follow status
      if (user) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", id)
          .single();
        setIsFollowing(!!followData);

        const { count } = await supabase
          .from("follows")
          .select("id", { count: "exact" })
          .eq("following_id", id);
        setFollowersCount(count || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!user || !id) return;
    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", id);
      setIsFollowing(false);
      setFollowersCount((c) => c - 1);
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: id });
      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Ghost profile header */}
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, styles.ghostAvatar]} />
            <View style={[styles.ghostText, { width: 160, height: 24, marginTop: 8 }]} />
            <View style={[styles.ghostText, { width: 100, height: 14, marginTop: 8 }]} />
            <View style={styles.ghostButton} />
          </View>
          {/* Ghost section title */}
          <View style={[styles.ghostText, { width: 120, height: 20, marginBottom: 16 }]} />
          {/* Ghost snippet cards */}
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.ghostCard}>
              <View style={styles.ghostCardTopRow}>
                <View style={styles.ghostCardLyrics}>
                  <View style={[styles.ghostText, { width: "100%", height: 16 }]} />
                  <View style={[styles.ghostText, { width: "90%", height: 16, marginTop: 8 }]} />
                  <View style={[styles.ghostText, { width: "70%", height: 16, marginTop: 8 }]} />
                </View>
                <View style={[styles.ghostAlbumArt]} />
              </View>
              <View style={styles.ghostCardFooter}>
                <View style={[styles.ghostText, { width: 80, height: 14 }]} />
                <View style={[styles.ghostText, { width: 60, height: 12, marginTop: 4 }]} />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isOwnProfile = user?.id === id;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          {profile?.profile_image_url ? (
            <Image
              source={{ uri: profile.profile_image_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color="rgba(255,255,255,0.4)" />
            </View>
          )}
          <ThemedText style={styles.name}>{profile?.full_name || "Unknown User"}</ThemedText>
          <ThemedText style={styles.followers}>
            {followersCount} {followersCount === 1 ? "follower" : "followers"}
          </ThemedText>

          {!isOwnProfile && user && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={toggleFollow}
            >
              <ThemedText style={[styles.followText, isFollowing && styles.followingText]}>
                {isFollowing ? "Following" : "Follow"}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Artists in common - left aligned at top of snippets section */}
        {!isOwnProfile && user && artistsInCommon.length > 0 && (
          <TouchableOpacity
            style={styles.artistsInCommonRow}
            onPress={() => setArtistsInCommonModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.artistsInCommon}>
              <View style={styles.artistsInCommonAvatars}>
                {artistsInCommon.slice(0, 3).map((artist, index) => (
                  <View
                    key={artist.name}
                    style={[
                      styles.artistAvatar,
                      index > 0 && styles.artistAvatarOverlap,
                    ]}
                  >
                    {artist.imageUrl ? (
                      <Image
                        source={{ uri: artist.imageUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="musical-notes" size={14} color="rgba(255,255,255,0.5)" />
                    )}
                  </View>
                ))}
              </View>
              <View style={styles.artistsInCommonText}>
                <ThemedText style={styles.artistsInCommonCount}>
                  {artistsInCommon.length} artist{artistsInCommon.length !== 1 ? "s" : ""} in common
                </ThemedText>
                <ThemedText style={styles.artistsInCommonNames} numberOfLines={2}>
                  {artistsInCommon.length <= 2
                    ? artistsInCommon.map((a) => a.name).join(", ")
                    : `${artistsInCommon.slice(0, 2).map((a) => a.name).join(", ")} and ${artistsInCommon.length - 2} other${artistsInCommon.length - 2 !== 1 ? "s" : ""}`}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Snippets (grid by default for public profile) */}
        <ThemedText style={styles.sectionTitle}>
          {snippets.length} {snippets.length === 1 ? "Snippet" : "Snippets"}
        </ThemedText>
        <View style={styles.snippetsGrid}>
          {(() => {
            const rows: LyricSnippet[][] = [];
            for (let i = 0; i < snippets.length; i += 2) {
              rows.push(snippets.slice(i, i + 2));
            }
            return rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.snippetsGridRow}>
                {row.map((snippet) => (
                  <SnippetGridCard key={snippet.id} snippet={snippet} readOnly />
                ))}
              </View>
            ));
          })()}
        </View>
      </ScrollView>

      <Modal
        visible={artistsInCommonModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setArtistsInCommonModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setArtistsInCommonModalOpen(false)}
        >
          <View style={styles.modalCard} pointerEvents="auto">
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>In common artists</ThemedText>
              <TouchableOpacity
                onPress={() => setArtistsInCommonModalOpen(false)}
                hitSlop={12}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={artistsInCommon}
              keyExtractor={(item) => item.name}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <View style={styles.modalArtistRow}>
                  <View style={styles.modalArtistAvatar}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="musical-notes" size={20} color="rgba(255,255,255,0.5)" />
                    )}
                  </View>
                  <ThemedText style={styles.modalArtistName}>{item.name}</ThemedText>
                </View>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  backButton: {
    padding: 16,
    alignSelf: "flex-start",
  },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  artistsInCommonRow: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  artistsInCommon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  artistsInCommonAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  artistAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#282828",
    borderWidth: 2,
    borderColor: "#121212",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  artistAvatarOverlap: {
    marginLeft: -10,
  },
  artistsInCommonText: {
    maxWidth: 220,
  },
  artistsInCommonCount: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  artistsInCommonNames: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    backgroundColor: "#282828",
    borderRadius: 20,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  modalClose: { padding: 4 },
  modalList: {
    padding: 16,
    paddingBottom: 24,
  },
  modalArtistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  modalArtistAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#383838",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  modalArtistName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  profileHeader: { alignItems: "center", gap: 8, marginBottom: 24 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: {
    backgroundColor: "#282828",
    justifyContent: "center",
    alignItems: "center",
  },
  name: { color: "#fff", fontSize: 24, fontWeight: "700" },
  followers: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  followButton: {
    backgroundColor: "#fff",
    borderRadius: 100,
    paddingHorizontal: 32,
    paddingVertical: 10,
    marginTop: 8,
  },
  followingButton: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#555" },
  followText: { color: "#000", fontWeight: "600" },
  followingText: { color: "#fff" },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  snippetsGrid: { gap: SNIPPET_GRID_CARD_GAP },
  snippetsGridRow: {
    flexDirection: "row",
    gap: SNIPPET_GRID_CARD_GAP,
    marginBottom: SNIPPET_GRID_CARD_GAP,
  },
  // Ghost skeleton
  ghostAvatar: { backgroundColor: "rgba(255,255,255,0.06)" },
  ghostText: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 4,
  },
  ghostButton: {
    width: 120,
    height: 40,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 8,
  },
  ghostCard: {
    borderRadius: 30,
    marginBottom: 12,
    minHeight: 180,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  ghostCardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  ghostCardLyrics: { flex: 1 },
  ghostAlbumArt: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  ghostCardFooter: { marginTop: 12 },
});
