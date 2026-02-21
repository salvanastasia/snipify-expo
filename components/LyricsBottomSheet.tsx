import React, { useEffect, useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Song {
  title: string;
  artist_names: string;
  song_art_image_thumbnail_url: string;
  album_name?: string;
  duration?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
  onSave: (snippet: { songTitle: string; artist: string; albumArt: string; lyrics: string }) => Promise<void>;
  initialLyrics?: string;
  readOnly?: boolean;
}

export function LyricsBottomSheet({ isOpen, onClose, song, onSave, initialLyrics, readOnly = false }: Props) {
  const [lyrics, setLyrics] = useState<string[]>([]);
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");
    setSelectedLines(new Set());
    fetchLyrics();
  }, [isOpen, song]);

  const fetchLyrics = async () => {
    try {
      const params = new URLSearchParams({
        artist: song.artist_names,
        title: song.title,
        ...(song.album_name ? { album: song.album_name } : {}),
        ...(song.duration ? { duration: String(song.duration) } : {}),
      });

      // Fetch from lrclib directly (same logic as the Next.js API route)
      const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(song.title)}&artist_name=${encodeURIComponent(song.artist_names)}`;
      const broadUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${song.artist_names} ${song.title}`)}`;

      const [searchRes, broadRes] = await Promise.all([
        fetch(searchUrl).then((r) => r.json()).catch(() => null),
        fetch(broadUrl).then((r) => r.json()).catch(() => null),
      ]);

      const tryExtract = (results: any) => {
        if (Array.isArray(results) && results.length > 0) {
          const match = results.find((r: any) => r.plainLyrics?.trim()) || results[0];
          return match?.plainLyrics || null;
        }
        return null;
      };

      const rawLyrics = tryExtract(searchRes) || tryExtract(broadRes);

      if (!rawLyrics) {
        setError("No lyrics available.");
        return;
      }

      const lines = rawLyrics
        .split("\n")
        .filter((l: string) => l.trim())
        .map((l: string) => l.trim());

      setLyrics(lines);

      // Pre-select initial lyrics if provided
      if (initialLyrics) {
        const initLines = initialLyrics.split("\n");
        for (let i = 0; i <= lines.length - initLines.length; i++) {
          if (initLines.every((line, j) => lines[i + j]?.trim() === line.trim())) {
            const sel = new Set<number>();
            for (let k = 0; k < initLines.length; k++) sel.add(i + k);
            setSelectedLines(sel);
            break;
          }
        }
      }
    } catch {
      setError("Failed to load lyrics.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLine = (index: number) => {
    if (readOnly) return;
    setSelectedLines((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedLines.size === 0) return;
    setSaving(true);
    try {
      const sorted = Array.from(selectedLines).sort((a, b) => a - b);
      const snippet = sorted.map((i) => lyrics[i]).join("\n");
      await onSave({
        songTitle: song.title,
        artist: song.artist_names,
        albumArt: song.song_art_image_thumbnail_url,
        lyrics: snippet,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: song.song_art_image_thumbnail_url }}
            style={styles.albumArt}
          />
          <View style={styles.songInfo}>
            <ThemedText style={styles.songTitle} numberOfLines={1}>{song.title}</ThemedText>
            <ThemedText style={styles.artistName} numberOfLines={1}>{song.artist_names}</ThemedText>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* Lyrics */}
        {loading ? (
          <ScrollView
            style={styles.lyricsScroll}
            contentContainerStyle={styles.lyricsContent}
            showsVerticalScrollIndicator={false}
          >
            {[100, 92, 88, 95, 78, 85, 70, 90, 65, 82].map((widthPct, index) => (
              <View key={index} style={styles.skeletonLine}>
                <View style={[styles.skeletonBar, { width: `${widthPct}%` }]} />
              </View>
            ))}
          </ScrollView>
        ) : error ? (
          <View style={styles.centered}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : (
          <ScrollView
            style={styles.lyricsScroll}
            contentContainerStyle={styles.lyricsContent}
            showsVerticalScrollIndicator={false}
          >
            {!readOnly && selectedLines.size === 0 && (
              <ThemedText style={styles.hint}>Tap lines to select your snippet</ThemedText>
            )}
            {lyrics.map((line, index) => {
              const isSelected = selectedLines.has(index);
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleLine(index)}
                  style={[styles.lyricLine, isSelected && styles.lyricLineSelected]}
                  activeOpacity={readOnly ? 1 : 0.7}
                >
                  {isSelected && <View style={styles.selectedBar} />}
                  <ThemedText style={[styles.lyricText, isSelected && styles.lyricTextSelected]}>
                    {line}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Save button */}
        {!readOnly && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, selectedLines.size === 0 && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={selectedLines.size === 0 || saving}
            >
              {saving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <ThemedText style={styles.saveText}>
                  Save {selectedLines.size > 0 ? `${selectedLines.size} line${selectedLines.size > 1 ? "s" : ""}` : "snippet"}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  albumArt: { width: 38, height: 38, borderRadius: 10 },
  songInfo: { flex: 1 },
  songTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  artistName: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 2 },
  closeButton: { padding: 4 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "rgba(255,255,255,0.5)", fontSize: 15 },
  hint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  lyricsScroll: { flex: 1 },
  lyricsContent: { paddingHorizontal: 20, paddingVertical: 20 },
  skeletonLine: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  skeletonBar: {
    height: 18,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  lyricLine: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lyricLineSelected: { backgroundColor: "rgba(255,255,255,0.18)" },
  selectedBar: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  lyricText: { color: "rgba(255,255,255,0.7)", fontSize: 17, lineHeight: 26, flex: 1, fontWeight: "700" },
  lyricTextSelected: { color: "#fff", fontWeight: "700" },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  saveButton: {
    backgroundColor: "#fff",
    borderRadius: 100,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveText: { color: "#000", fontWeight: "600", fontSize: 16 },
});
