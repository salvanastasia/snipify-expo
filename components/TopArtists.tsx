import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { getLyricSnippets } from "@/lib/storage";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/lib/theme-context";

interface Artist {
  name: string;
  imageUrl: string;
  count: number;
}

export function TopArtists() {
  const { colors } = useTheme();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const snippets = await getLyricSnippets();
      const map = new Map<string, { count: number; imageUrl: string }>();

      snippets.forEach((s) => {
        const current = map.get(s.artist_name) || { count: 0, imageUrl: s.artist_art_url || s.album_art_url || "" };
        map.set(s.artist_name, { count: current.count + 1, imageUrl: current.imageUrl });
      });

      const sorted = Array.from(map.entries())
        .map(([name, { count, imageUrl }]) => ({ name, imageUrl, count }))
        .sort((a, b) => b.count - a.count);

      setArtists(sorted);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View>
        <ThemedText style={[styles.title, { color: colors.text }]}>Top artists</ThemedText>
        <ActivityIndicator color={colors.tint} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (artists.length === 0) {
    return (
      <View>
        <ThemedText style={[styles.title, { color: colors.text }]}>Top artists</ThemedText>
        <ThemedText style={[styles.emptyText, { color: colors.textMuted }]}>Save some lyrics to see your top artists!</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.root} collapsable={false}>
      <View style={styles.headerRow}>
        <ThemedText style={[styles.title, { color: colors.text }]}>Top artists</ThemedText>
        <TouchableOpacity onPress={() => setShowAll(true)} accessibilityLabel="Show all artists" accessibilityRole="button">
          <ThemedText style={[styles.showAll, { color: colors.textMuted }]}>Show all</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.scrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {artists.slice(0, 10).map((artist) => (
            <ArtistItem key={artist.name} artist={artist} colors={colors} />
          ))}
        </ScrollView>
      </View>

      <Modal visible={showAll} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAll(false)}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>All Artists</ThemedText>
              <ThemedText style={[styles.modalSubtitle, { color: colors.textMuted }]}>{artists.length} artists</ThemedText>
            </View>
          </View>

          <FlatList
            data={artists}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <View style={styles.modalRow}>
                <Image
                  source={{ uri: item.imageUrl || undefined }}
                  style={[styles.modalAvatar, { backgroundColor: colors.input }]}
                />
                <View style={styles.modalInfo}>
                  <ThemedText style={[styles.modalArtistName, { color: colors.text }]}>{item.name}</ThemedText>
                  <ThemedText style={[styles.modalArtistCount, { color: colors.textMuted }]}>
                    {item.count} {item.count === 1 ? "snippet" : "snippets"}
                  </ThemedText>
                </View>
              </View>
            )}
          />

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowAll(false)} accessibilityLabel="Close" accessibilityRole="button">
              <ThemedText style={styles.closeText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ArtistItem({ artist, colors }: { artist: Artist; colors: { text: string; textMuted: string; input: string } }) {
  return (
    <View style={styles.artistItem}>
      <Image source={{ uri: artist.imageUrl || undefined }} style={[styles.artistImage, { backgroundColor: colors.input }]} />
      <ThemedText style={[styles.artistName, { color: colors.text }]} numberOfLines={1}>{artist.name}</ThemedText>
      <ThemedText style={[styles.artistCount, { color: colors.textMuted }]}>
        {artist.count} {artist.count === 1 ? "snippet" : "snippets"}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: "visible" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  showAll: { fontSize: 14 },
  emptyText: { fontSize: 15 },
  scrollWrapper: {
    marginHorizontal: -24,
    width: Dimensions.get("window").width,
    overflow: "visible",
  },
  scrollContent: {
    gap: 20,
    paddingLeft: 24,
    paddingRight: 24,
  },
  artistItem: { alignItems: "center", width: 120, gap: 8 },
  artistImage: { width: 120, height: 120, borderRadius: 60 },
  artistName: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  artistCount: { fontSize: 12, textAlign: "center" },
  modal: { flex: 1 },
  modalHeader: { padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: "600" },
  modalSubtitle: { fontSize: 14, marginTop: 2 },
  modalList: { padding: 16, gap: 4 },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 10,
    borderRadius: 12,
  },
  modalAvatar: { width: 56, height: 56, borderRadius: 28 },
  modalInfo: { flex: 1 },
  modalArtistName: { fontSize: 16, fontWeight: "600" },
  modalArtistCount: { fontSize: 13, marginTop: 2 },
  modalFooter: { padding: 16, borderTopWidth: 1 },
  closeButton: {
    backgroundColor: "#fff",
    borderRadius: 100,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#000", fontWeight: "600", fontSize: 16 },
});
