import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getLyricSnippets } from "@/lib/storage";

interface Artist {
  name: string;
  imageUrl: string;
  count: number;
}

export function TopArtists() {
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
        <Text style={styles.title}>Top artists</Text>
        <ActivityIndicator color="#fff" style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (artists.length === 0) {
    return (
      <View>
        <Text style={styles.title}>Top artists</Text>
        <Text style={styles.emptyText}>Save some lyrics to see your top artists!</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Top artists</Text>
        <TouchableOpacity onPress={() => setShowAll(true)}>
          <Text style={styles.showAll}>Show all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {artists.slice(0, 10).map((artist) => (
          <ArtistItem key={artist.name} artist={artist} />
        ))}
      </ScrollView>

      {/* Show all modal */}
      <Modal visible={showAll} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAll(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>All Artists</Text>
              <Text style={styles.modalSubtitle}>{artists.length} artists</Text>
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
                  style={styles.modalAvatar}
                />
                <View style={styles.modalInfo}>
                  <Text style={styles.modalArtistName}>{item.name}</Text>
                  <Text style={styles.modalArtistCount}>
                    {item.count} {item.count === 1 ? "snippet" : "snippets"}
                  </Text>
                </View>
              </View>
            )}
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowAll(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ArtistItem({ artist }: { artist: Artist }) {
  return (
    <View style={styles.artistItem}>
      <Image source={{ uri: artist.imageUrl || undefined }} style={styles.artistImage} />
      <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
      <Text style={styles.artistCount}>
        {artist.count} {artist.count === 1 ? "snippet" : "snippets"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: "#fff", fontSize: 28, fontWeight: "700", marginBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  showAll: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  emptyText: { color: "rgba(255,255,255,0.5)", fontSize: 15 },
  scrollContent: { gap: 20, paddingRight: 16 },
  artistItem: { alignItems: "center", width: 120, gap: 8 },
  artistImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#282828" },
  artistName: { color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "center" },
  artistCount: { color: "rgba(255,255,255,0.5)", fontSize: 12, textAlign: "center" },
  modal: { flex: 1, backgroundColor: "#282828" },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "600" },
  modalSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 2 },
  modalList: { padding: 16, gap: 4 },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 10,
    borderRadius: 12,
  },
  modalAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#383838" },
  modalInfo: { flex: 1 },
  modalArtistName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modalArtistCount: { color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 2 },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  closeButton: {
    backgroundColor: "#fff",
    borderRadius: 100,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#000", fontWeight: "600", fontSize: 16 },
});
