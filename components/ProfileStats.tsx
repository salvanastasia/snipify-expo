import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { supabase } from "@/lib/supabase";
import { FollowersFollowingSheet } from "./FollowersFollowingSheet";

interface Props {
  userId: string;
}

export function ProfileStats({ userId }: Props) {
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
        <Stat label="Snippets" value={snippetCount} />
        <Stat
          label="Followers"
          value={followersCount}
          onPress={() => setListModal({ open: true, type: "followers" })}
        />
        <Stat
          label="Following"
          value={followingCount}
          onPress={() => setListModal({ open: true, type: "following" })}
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
}: {
  label: string;
  value: number;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
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
  value: { color: "#fff", fontSize: 16, fontWeight: "700" },
  label: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
});
