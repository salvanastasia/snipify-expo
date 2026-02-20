import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LyricSnippet } from "@/lib/storage";
import { LyricsBottomSheet } from "./LyricsBottomSheet";

interface Props {
  snippet: LyricSnippet;
  readOnly?: boolean;
  onDelete?: (id: string) => void;
}

export function SnippetCard({ snippet, readOnly = false, onDelete }: Props) {
  const [lyricsOpen, setLyricsOpen] = useState(false);

  // Parse color from stored value
  const colors = snippet.color?.split("|") || ["#8B8E98", "#6B6E78"];
  const bgColor = colors[0] || "#8B8E98";
  const bgColorDark = colors[1] || "#6B6E78";

  const handleDelete = () => {
    Alert.alert("Delete Snippet", "Are you sure you want to delete this snippet?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete?.(snippet.id),
      },
    ]);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: bgColor }]}
        onPress={() => setLyricsOpen(true)}
        activeOpacity={0.9}
      >
        {/* Background gradient effect */}
        <View style={[styles.cardGradient, { backgroundColor: bgColorDark }]} />

        <View style={styles.cardContent}>
          <View style={styles.topRow}>
            <Text style={styles.lyrics} numberOfLines={4}>
              {snippet.lyrics}
            </Text>
            {/* Circular album art (top right) */}
            {snippet.album_art_url && (
              <Image source={{ uri: snippet.album_art_url }} style={styles.albumArt} />
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>{snippet.song_title}</Text>
              <Text style={styles.artistName} numberOfLines={1}>{snippet.artist_name}</Text>
            </View>
            {!readOnly && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <LyricsBottomSheet
        isOpen={lyricsOpen}
        onClose={() => setLyricsOpen(false)}
        song={{
          title: snippet.song_title,
          artist_names: snippet.artist_name,
          song_art_image_thumbnail_url: snippet.album_art_url || "",
        }}
        onSave={async () => {}}
        initialLyrics={snippet.lyrics}
        readOnly={readOnly}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    minHeight: 180,
  },
  cardGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45%",
    opacity: 0.4,
  },
  cardContent: {
    padding: 20,
    gap: 12,
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  lyrics: {
    flex: 1,
    color: "rgba(255,255,255,0.95)",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 28,
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 8,
  },
  songInfo: { flex: 1 },
  songTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
  },
  artistName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: { padding: 4 },
});
