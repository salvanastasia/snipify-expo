import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { supabase } from "@/lib/supabase";

interface Props {
  userId: string;
}

export function ProfileStats({ userId }: Props) {
  const [snippetCount, setSnippetCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    const [snippetsRes, followersRes, followingRes] = await Promise.all([
      supabase.from("lyric_snippets").select("id", { count: "exact" }).eq("user_id", userId),
      supabase.from("follows").select("id", { count: "exact" }).eq("following_id", userId),
      supabase.from("follows").select("id", { count: "exact" }).eq("follower_id", userId),
    ]);

    setSnippetCount(snippetsRes.count || 0);
    setFollowersCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);
  };

  return (
    <View style={styles.container}>
      <Stat label="Snippets" value={snippetCount} />
      <Stat label="Followers" value={followersCount} />
      <Stat label="Following" value={followingCount} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
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
