import React, { useEffect, useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  full_name: string;
  profile_image_url: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
}

export function FollowersFollowingSheet({ isOpen, onClose, userId, type }: Props) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");
    setProfiles([]);
    fetchList();
  }, [isOpen, userId, type]);

  const fetchList = async () => {
    try {
      let userIds: string[] = [];

      if (type === "followers") {
        // Get follower_ids (people who follow this user)
        const { data: followsData, error: followsError } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", userId);

        if (followsError) throw followsError;
        userIds = (followsData || []).map((f) => f.follower_id);
      } else {
        // Get following_ids (people this user follows)
        const { data: followsData, error: followsError } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", userId);

        if (followsError) throw followsError;
        userIds = (followsData || []).map((f) => f.following_id);
      }

      if (userIds.length === 0) {
        setProfiles([]);
        return;
      }

      // Fetch profiles for these user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, profile_image_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);
    } catch (e: any) {
      console.error("Failed to load list:", e);
      setError("Failed to load list.");
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (profileId: string) => {
    router.push(`/(app)/user/${profileId}`);
    onClose();
  };

  const renderUserRow = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={styles.userRow}
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.7}
    >
      {item.profile_image_url ? (
        <Image source={{ uri: item.profile_image_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={20} color="rgba(255,255,255,0.4)" />
        </View>
      )}
      <ThemedText style={styles.userName}>{item.full_name || "Unknown User"}</ThemedText>
    </TouchableOpacity>
  );

  const renderGhostLoader = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <View key={index} style={styles.userRow}>
        <View style={[styles.avatar, styles.ghostAvatar]} />
        <View style={styles.ghostTextContainer}>
          <View style={[styles.ghostText, { width: "70%" }]} />
          <View style={[styles.ghostText, { width: "40%", marginTop: 6 }]} />
        </View>
      </View>
    ));
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>
            {type === "followers" ? "Followers" : "Following"}
          </ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.content}>
            {renderGhostLoader()}
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : profiles.length === 0 ? (
          <View style={styles.centered}>
            <ThemedText style={styles.emptyText}>
              No {type === "followers" ? "followers" : "following"} yet
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={profiles}
            renderItem={renderUserRow}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: { padding: 4 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { color: "rgba(255,255,255,0.5)", fontSize: 15 },
  emptyText: { color: "rgba(255,255,255,0.4)", fontSize: 15 },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#282828",
  },
  avatarPlaceholder: {
    backgroundColor: "#282828",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  // Ghost loader styles
  ghostAvatar: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  ghostTextContainer: {
    flex: 1,
  },
  ghostText: {
    height: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 4,
  },
});
