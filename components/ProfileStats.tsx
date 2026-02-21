import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { supabase } from "@/lib/supabase";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/lib/theme-context";
import { FollowersFollowingSheet } from "./FollowersFollowingSheet";

interface Props {
  userId: string;
}

export function ProfileStats({ userId }: Props) {
  const { colors } = useTheme();
  const [snippetCount, setSnippetCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [listModal, setListModal] = useState<{ open: boolean; type: "followers" | "following" | null }>({
    open: false,
    type: null,
  });

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    const [snippetsRes, followersRes, followingRes] = await Promise.all([
      supabase.from("lyric_snippets").select("id", { count: "exact" }).eq("user_id", userId),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
    ]);

    if (!snippetsRes.error) {
      setSnippetCount(snippetsRes.count || 0);
    }
    if (!followersRes.error) {
      setFollowersCount(followersRes.count || 0);
    } else {
      console.warn("Failed to load followers count:", followersRes.error);
    }
    if (!followingRes.error) {
      setFollowingCount(followingRes.count || 0);
    } else {
      console.warn("Failed to load following count:", followingRes.error);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Stat label="Snippets" value={snippetCount} colors={colors} />
        <Stat
          label="Followers"
          value={followersCount}
          onPress={() => setListModal({ open: true, type: "followers" })}
          colors={colors}
        />
        <Stat
          label="Following"
          value={followingCount}
          onPress={() => setListModal({ open: true, type: "following" })}
          colors={colors}
        />
      </View>
      {listModal.type && (
        <FollowersFollowingSheet
          isOpen={listModal.open}
          onClose={() => setListModal({ open: false, type: null })}
          userId={userId}
          type={listModal.type}
        />
      )}
    </>
  );
}

function Stat({
  label,
  value,
  onPress,
  colors,
}: {
  label: string;
  value: number;
  onPress?: () => void;
  colors: { text: string; textMuted: string };
}) {
  const content = (
    <View style={styles.stat}>
      <ThemedText style={[styles.value, { color: colors.text }]}>{value}</ThemedText>
      <ThemedText style={[styles.label, { color: colors.textMuted }]}>{label}</ThemedText>
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 20,
    marginTop: 8,
  },
  stat: { alignItems: "flex-start" },
  value: { fontSize: 16, fontWeight: "700" },
  label: { fontSize: 12 },
});
