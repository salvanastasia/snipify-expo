import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { getLyricSnippetsByUserId, LyricSnippet, updateSnippetColor } from "@/lib/storage";
import { getColorsFromImageUrl } from "@/lib/albumArtColors";
import { useAuth } from "@/lib/auth-context";
import { SnippetCard } from "@/components/SnippetCard";

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

  useEffect(() => {
    if (!id) return;
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [{ data: profileData }, snippetsData] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        getLyricSnippetsByUserId(id),
      ]);
      setProfile(profileData);
      setSnippets(snippetsData);

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
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
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
          <Text style={styles.name}>{profile?.full_name || "Unknown User"}</Text>
          <Text style={styles.followers}>
            {followersCount} {followersCount === 1 ? "follower" : "followers"}
          </Text>

          {!isOwnProfile && user && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={toggleFollow}
            >
              <Text style={[styles.followText, isFollowing && styles.followingText]}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Snippets */}
        <Text style={styles.sectionTitle}>
          {snippets.length} {snippets.length === 1 ? "Snippet" : "Snippets"}
        </Text>
        {snippets.map((snippet) => (
          <SnippetCard key={snippet.id} snippet={snippet} readOnly />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  centered: { flex: 1, backgroundColor: "#121212", justifyContent: "center", alignItems: "center" },
  backButton: { padding: 16 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
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
});
