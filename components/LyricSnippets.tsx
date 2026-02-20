import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLyricSnippets, deleteLyricSnippet, LyricSnippet, updateSnippetColor } from "@/lib/storage";
import { getColorsFromImageUrl } from "@/lib/albumArtColors";
import { useTheme } from "@/lib/theme-context";
import { LAYOUT_STORAGE_KEY } from "./ProfileName";
import type { SnippetsLayoutId } from "./ProfileName";
import { SnippetCard } from "./SnippetCard";
import { SnippetGridCard, SNIPPET_GRID_CARD_GAP } from "./SnippetGridCard";

export function LyricSnippets() {
  const { colors } = useTheme();
  const [snippets, setSnippets] = useState<LyricSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<SnippetsLayoutId>("list");

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(LAYOUT_STORAGE_KEY).then((stored) => {
      if (stored === "list" || stored === "grid") setLayout(stored);
    });
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getLyricSnippets();
      setSnippets(data);
      
      // Fetch colors for old snippets that don't have colors
      const snippetsWithoutColors = data.filter(
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
    } catch {
      setError("Failed to load snippets.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLyricSnippet(id);
      setSnippets((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // handle error
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (snippets.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        Search for a song above to save your first snippet!
      </Text>
    );
  }

  if (layout === "grid") {
    const rows: LyricSnippet[][] = [];
    for (let i = 0; i < snippets.length; i += 2) {
      rows.push(snippets.slice(i, i + 2));
    }
    return (
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.map((snippet) => (
              <SnippetGridCard
                key={snippet.id}
                snippet={snippet}
              />
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View>
      {snippets.map((snippet) => (
        <SnippetCard
          key={snippet.id}
          snippet={snippet}
          onDelete={handleDelete}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { padding: 24, alignItems: "center" },
  errorText: { color: "#ff4444", fontSize: 14 },
  emptyText: { fontSize: 15 },
  grid: { gap: SNIPPET_GRID_CARD_GAP },
  gridRow: {
    flexDirection: "row",
    gap: SNIPPET_GRID_CARD_GAP,
    marginBottom: SNIPPET_GRID_CARD_GAP,
  },
});
