import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { LyricSnippet } from "@/lib/storage";
import { LyricSnippetExpandedModal } from "./LyricSnippetExpandedModal";

const CARD_GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HORIZONTAL_PADDING = 24 * 2;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING - CARD_GAP) / 2;
const CARD_ASPECT = 146 / 150;
const TILT_DEG = -5;
const TILT_OFFSET_X = -10;

interface Props {
  snippet: LyricSnippet;
  readOnly?: boolean;
  onDelete?: (id: string) => void;
}

export function SnippetGridCard({ snippet, readOnly = false, onDelete }: Props) {
  const [lyricsOpen, setLyricsOpen] = useState(false);

  const colors = snippet.color?.split("|") || ["#8B8E98", "#6B6E78"];
  const bgColor = colors[0] || "#8B8E98";
  const bgColorDark = colors[1] || "#6B6E78";

  const handleDelete = (e: any) => {
    e?.stopPropagation?.();
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
      <View style={styles.outerContainer}>
        <View style={styles.tiltedBack} />
        <TouchableOpacity
          style={[styles.card, { aspectRatio: 1 / CARD_ASPECT }]}
          onPress={() => setLyricsOpen(true)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[bgColor, bgColorDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardContent}>
            <View style={styles.lyricsPlaceholder}>
              <View style={styles.placeholderLine} />
              <View style={[styles.placeholderLine, styles.placeholderLineShort]} />
              <View style={[styles.placeholderLine, styles.placeholderLineShorter]} />
            </View>
            <View style={styles.footer}>
            {snippet.album_art_url ? (
              <Image source={{ uri: snippet.album_art_url }} style={styles.albumArt} />
            ) : (
              <View style={[styles.albumArt, styles.albumArtPlaceholder]}>
                <Ionicons name="musical-notes" size={16} color="rgba(255,255,255,0.4)" />
              </View>
            )}
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {snippet.song_title}
              </Text>
              <Text style={styles.artistName} numberOfLines={1}>
                {snippet.artist_name}
              </Text>
            </View>
          </View>
          {!readOnly && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <LyricSnippetExpandedModal
        visible={lyricsOpen}
        onClose={() => setLyricsOpen(false)}
        snippet={snippet}
        readOnly={readOnly}
        onDelete={onDelete}
      />
    </>
  );
}

const CONTAINER_PADDING = 10;
const CARD_CONTENT_WIDTH = CARD_WIDTH - CONTAINER_PADDING * 2;
const CARD_CONTENT_HEIGHT = CARD_CONTENT_WIDTH * CARD_ASPECT;

const styles = StyleSheet.create({
  outerContainer: {
    width: CARD_WIDTH,
    padding: CONTAINER_PADDING,
  },
  tiltedBack: {
    position: "absolute",
    width: CARD_CONTENT_WIDTH,
    height: CARD_CONTENT_HEIGHT,
    left: CONTAINER_PADDING + TILT_OFFSET_X,
    top: CONTAINER_PADDING,
    borderRadius: 16,
    backgroundColor: "#282828",
    transform: [{ rotate: `${TILT_DEG}deg` }],
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    position: "relative",
  },
  lyricsPlaceholder: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  placeholderLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    width: "100%",
  },
  placeholderLineShort: { width: "85%" },
  placeholderLineShorter: { width: "70%" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingRight: 24,
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  albumArtPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  songInfo: { flex: 1, minWidth: 0 },
  songTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },
  artistName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginTop: 2,
  },
  deleteButton: {
    position: "absolute",
    right: 8,
    bottom: 8,
    padding: 4,
  },
});

export const SNIPPET_GRID_CARD_WIDTH = CARD_WIDTH;
export const SNIPPET_GRID_CARD_GAP = CARD_GAP;
