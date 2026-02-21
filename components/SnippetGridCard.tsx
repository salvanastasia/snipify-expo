import React, { useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "./ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LyricSnippet } from "@/lib/storage";
import { LyricSnippetExpandedModal } from "./LyricSnippetExpandedModal";
import { useTheme } from "@/lib/theme-context";
import { darkenHexForContrast, lightenHexByBlendingWithWhite } from "@/lib/albumArtColors";

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
}

export function SnippetGridCard({ snippet, readOnly = false }: Props) {
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const { theme } = useTheme();

  const colors = snippet.color?.split("|") || ["#8B8E98", "#6B6E78"];
  const bgColor = colors[0] || "#8B8E98";
  const bgColorDark = colors[1] || "#6B6E78";
  const isFlat = theme === "flat";
  const flatBg = isFlat ? lightenHexByBlendingWithWhite(bgColor) : null;
  const flatText = isFlat ? darkenHexForContrast(bgColorDark) : null;
  const textColor = isFlat ? flatText! : "rgba(255,255,255,0.9)";
  const artistColor = isFlat ? flatText! : "rgba(255,255,255,0.6)";
  const iconColor = isFlat ? flatText! : "rgba(255,255,255,0.4)";
  const placeholderColor = isFlat ? (flatText! + "40") : "rgba(255,255,255,0.25)";

  return (
    <>
      <View style={styles.outerContainer}>
        <View style={styles.tiltedBack} />
        <TouchableOpacity
          style={[styles.card, { aspectRatio: 1 / CARD_ASPECT }]}
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
            <View style={styles.lyricsPlaceholder}>
              <View style={[styles.placeholderLine, { backgroundColor: placeholderColor }]} />
              <View style={[styles.placeholderLine, styles.placeholderLineShort, { backgroundColor: placeholderColor }]} />
              <View style={[styles.placeholderLine, styles.placeholderLineShorter, { backgroundColor: placeholderColor }]} />
            </View>
            <View style={styles.footer}>
            {snippet.album_art_url ? (
              <Image source={{ uri: snippet.album_art_url }} style={styles.albumArt} />
            ) : (
              <View style={[styles.albumArt, styles.albumArtPlaceholder]}>
                <Ionicons name="musical-notes" size={12} color={iconColor} />
              </View>
            )}
            <View style={styles.songInfo}>
              <ThemedText style={[styles.songTitle, { color: textColor }]} numberOfLines={1}>
                {snippet.song_title}
              </ThemedText>
              <ThemedText style={[styles.artistName, { color: artistColor }]} numberOfLines={1}>
                {snippet.artist_name}
              </ThemedText>
          </View>
          </View>
        </View>
        </TouchableOpacity>
      </View>

      <LyricSnippetExpandedModal
        visible={lyricsOpen}
        onClose={() => setLyricsOpen(false)}
        snippet={snippet}
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
    width: 30,
    height: 30,
    borderRadius: 8,
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
});

export const SNIPPET_GRID_CARD_WIDTH = CARD_WIDTH;
export const SNIPPET_GRID_CARD_GAP = CARD_GAP;
