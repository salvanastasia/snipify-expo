import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { getLyricSnippets, deleteLyricSnippet, LyricSnippet } from "@/lib/storage";
import { SnippetCard } from "./SnippetCard";

export function LyricSnippets() {
  const [snippets, setSnippets] = useState<LyricSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getLyricSnippets();
      setSnippets(data);
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
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (snippets.length === 0) {
    return (
      <Text style={styles.emptyText}>
        Search for a song above to save your first snippet!
      </Text>
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
  emptyText: { color: "rgba(255,255,255,0.5)", fontSize: 15 },
});
