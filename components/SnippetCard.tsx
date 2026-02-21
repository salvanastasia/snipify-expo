import React, { useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "./ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LyricSnippet } from "@/lib/storage";
import { LyricsBottomSheet } from "./LyricsBottomSheet";
import { useTheme } from "@/lib/theme-context";
import { darkenHexForContrast, lightenHexByBlendingWithWhite } from "@/lib/albumArtColors";

interface Props {
  snippet: LyricSnippet;
  readOnly?: boolean;
  onDelete?: (id: string) => void;
  isLast?: boolean;
}

export function SnippetCard({ snippet, readOnly = false, onDelete, isLast }: Props) {
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const { theme } = useTheme();

  // Parse color from stored value (lighter|darker from album art)
  const colors = snippet.color?.split("|") || ["#8B8E98", "#6B6E78"];
  const bgColor = colors[0] || "#8B8E98";
  const bgColorDark = colors[1] || "#6B6E78";
  const isFlat = theme === "flat";
  const flatBg = isFlat ? lightenHexByBlendingWithWhite(bgColor) : null;
  const flatText = isFlat ? darkenHexForContrast(bgColorDark) : null;
  const textColor = isFlat ? flatText! : "rgba(255,255,255,0.95)";
  const artistColor = isFlat ? flatText! : "rgba(255,255,255,0.6)";
  const iconColor = isFlat ? flatText! : "rgba(255,255,255,0.4)";
  const trashColor = isFlat ? flatText! : "rgba(255,255,255,0.6)";

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
        style={[styles.card, isLast && styles.cardLast]}
        onPress={() => setLyricsOpen(true)}
        activeOpacity={0.9}
      >
        {isFlat ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: flatBg! }]} />
        ) : (
          <LinearGradient
            colors={[bgColor, bgColorDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View style={styles.cardContent}>
          <ThemedText style={[styles.lyrics, { color: textColor }]} numberOfLines={4}>
            {snippet.lyrics}
          </ThemedText>

          <View style={styles.footer}>
            {snippet.album_art_url ? (
              <Image source={{ uri: snippet.album_art_url }} style={styles.albumArt} />
            ) : (
              <View style={[styles.albumArt, styles.albumArtPlaceholder]}>
                <Ionicons name="musical-notes" size={16} color={iconColor} />
              </View>
            )}
            <View style={styles.songInfo}>
              <ThemedText style={[styles.songTitle, { color: textColor }]} numberOfLines={1}>{snippet.song_title}</ThemedText>
              <ThemedText style={[styles.artistName, { color: artistColor }]} numberOfLines={1}>{snippet.artist_name}</ThemedText>
            </View>
          </View>

          {!readOnly && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={18} color={trashColor} />
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
  cardLast: { marginBottom: 0 },
  cardContent: {
    padding: 16,
    flex: 1,
    position: "relative",
  },
  lyrics: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
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
    width: 38,
    height: 38,
    borderRadius: 10,
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
    fontSize: 15,
    fontWeight: "600",
  },
  artistName: {
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
