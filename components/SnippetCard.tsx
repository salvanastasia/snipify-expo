import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
        style={styles.card}
        onPress={() => setLyricsOpen(true)}
        activeOpacity={0.9}
      >
        {/* Linear gradient background */}
        <LinearGradient
          colors={[bgColor, bgColorDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.cardContent}>
          {/* Top: lyrics only */}
          <Text style={styles.lyrics} numberOfLines={4}>
            {snippet.lyrics}
          </Text>

          {/* Bottom: album art (left) + song/artist (middle) */}
          <View style={styles.footer}>
            {snippet.album_art_url ? (
              <Image source={{ uri: snippet.album_art_url }} style={styles.albumArt} />
            ) : (
              <View style={[styles.albumArt, styles.albumArtPlaceholder]}>
                <Ionicons name="musical-notes" size={20} color="rgba(255,255,255,0.4)" />
              </View>
            )}
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>{snippet.song_title}</Text>
              <Text style={styles.artistName} numberOfLines={1}>{snippet.artist_name}</Text>
            </View>
          </View>

          {/* Trash icon: bottom right, respecting padding */}
          {!readOnly && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
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
    borderRadius: 30,
    marginBottom: 12,
    overflow: "hidden",
    minHeight: 180,
  },
  cardContent: {
    padding: 16,
    flex: 1,
    position: "relative",
  },
  lyrics: {
    flex: 1,
    color: "rgba(255,255,255,0.95)",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 28,
    paddingBottom: 24,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 36,
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  albumArtPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  songInfo: {
    flex: 1,
    justifyContent: "center",
  },
  songTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    fontWeight: "600",
  },
  artistName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 2,
  },
  deleteButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    padding: 4,
  },
});
