import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { ThemedText } from "./ThemedText";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveLyricSnippet } from "@/lib/storage";
import { getColorsFromImageUrl } from "@/lib/albumArtColors";
import { LyricsBottomSheet } from "./LyricsBottomSheet";

/** Fascia bassa quando tastiera chiusa (solo blur + gradient sopra la search bar) */
const STRIP_HEIGHT_CLOSED = 120;
/** Altezza overlay sopra tastiera quando aperta (copre search bar + risultati) */
const OVERLAY_HEIGHT_KEYBOARD_OPEN = 56 + 400 + 16;
const BLUR_INTENSITY = 48;

const RECENT_SEARCHES_KEY = "recent-searches";
const MAX_RECENT = 6;

interface SearchResult {
  id: number;
  title: string;
  artist_names: string;
  song_art_image_thumbnail_url: string;
  album_name?: string;
  duration?: number;
  isUser?: boolean;
}

interface Props {
  onSnippetSaved: () => void;
}

export function SearchBar({ onSnippetSaved }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<"songs" | "friends">("songs");
  const [selectedSong, setSelectedSong] = useState<SearchResult | null>(null);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  
  // Animated values for smooth transitions
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const searchBarBottom = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((val) => {
      if (val) setRecentSearches(JSON.parse(val));
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    
    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates.height;
      setKeyboardHeight(height);
      
      // Animate overlay fade-in
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
      
      // Animate search bar slide-up (4px above keyboard)
      Animated.timing(searchBarBottom, {
        toValue: height + 4,
        duration: Platform.OS === 'ios' ? 250 : 300,
        useNativeDriver: false, // bottom position requires layout animation
      }).start();
    });
    
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      
      // Animate overlay fade-out
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
      
      // Animate search bar slide-down
      Animated.timing(searchBarBottom, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? 250 : 300,
        useNativeDriver: false,
      }).start();
    });
    
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) { setResults([]); setIsOpen(false); return; }
      setLoading(true);
      setError("");
      setIsOpen(true);
      try {
        if (searchMode === "songs") {
          const res = await fetch(
            `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=15`
          );
          const data = await res.json();
          const hits = (data?.data || []).map((song: any) => ({
            id: song.id,
            title: song.title,
            artist_names: song.artist?.name || "Unknown",
            song_art_image_thumbnail_url: song.album?.cover_medium || "",
            album_name: song.album?.title || "",
            duration: song.duration || 0,
          }));
          setResults(hits);
          if (hits.length === 0) setError("No songs found");
        } else {
          // Search users via Supabase directly
          const { supabase } = await import("@/lib/supabase");
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, profile_image_url")
            .ilike("full_name", `%${q}%`)
            .limit(10);
          const userResults = (data || []).map((u: any) => ({
            id: u.id,
            title: u.full_name,
            artist_names: "User",
            song_art_image_thumbnail_url: u.profile_image_url || "",
            isUser: true,
          }));
          setResults(userResults);
          if (userResults.length === 0) setError("No users found");
        }
      } catch {
        setError("Search failed");
      } finally {
        setLoading(false);
      }
    },
    [searchMode]
  );

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 300);
  };

  const saveRecent = async (song: SearchResult) => {
    const updated = [
      { ...song, timestamp: Date.now() },
      ...recentSearches.filter((s) => s.id !== song.id).slice(0, MAX_RECENT - 1),
    ];
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSelect = (song: SearchResult) => {
    if (song.isUser) {
      router.push(`/(app)/user/${song.id}`);
      closeSearch();
      return;
    }
    setSelectedSong(song);
    saveRecent(song);
    setLyricsOpen(true);
    closeSearch();
  };

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    Keyboard.dismiss();
  };

  const handleSave = async (snippet: {
    songTitle: string;
    artist: string;
    albumArt: string;
    lyrics: string;
  }) => {
    const color = await getColorsFromImageUrl(snippet.albumArt || null);
    await saveLyricSnippet(snippet.songTitle, snippet.artist, snippet.albumArt, snippet.lyrics, color);
    onSnippetSaved();
  };

  const showRecent = searchMode === "songs" && recentSearches.length > 0 && !query.trim();
  const listData = results.length > 0 ? results : showRecent ? recentSearches : [];

  const bottomInset = keyboardHeight > 0 ? 8 : Math.max(insets.bottom, 8);
  const isKeyboardOpen = keyboardHeight > 0;

  return (
    <>
      {/* Sfondo: tastiera chiusa = solo gradient; tastiera aperta = overlay blur + gradient per leggibilità risultati */}
      <View
        pointerEvents="none"
        style={[
          styles.gradientContainer,
          isKeyboardOpen
            ? {
                top: 0,
                bottom: keyboardHeight,
              }
            : {
                bottom: 0,
                height: STRIP_HEIGHT_CLOSED + 56 + bottomInset,
              },
        ]}
      >
        {isKeyboardOpen && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}>
            <BlurView intensity={BLUR_INTENSITY} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
        )}
        <LinearGradient
          colors={[
            "rgba(18, 18, 18, 0)",
            "rgba(18, 18, 18, 0)",
            "rgba(18, 18, 18, 0.25)",
            "rgba(18, 18, 18, 0.6)",
            "#121212",
          ]}
          locations={[0, 0.5, 0.72, 0.88, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>
      {/* Fixed at bottom: from bottom = keyboard, then search bar, then results */}
      <Animated.View
        style={[
          styles.wrapper,
          {
            bottom: searchBarBottom, // Animated value: keyboardHeight + 4
            paddingBottom: bottomInset,
          },
        ]}
      >
        {/* Results above the search bar (order: bottom = keyboard → searchbar → results) */}
        {isOpen && (
          <View style={styles.dropdown}>
            {loading ? (
              <ActivityIndicator color="#fff" style={{ padding: 16 }} />
            ) : error && results.length === 0 ? (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            ) : showRecent && results.length === 0 ? (
              <>
                <View style={styles.recentHeader}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.4)" />
                  <ThemedText style={styles.recentLabel}>Recent searches</ThemedText>
                </View>
                <FlatList
                  data={recentSearches}
                  keyExtractor={(item) => `${item.id}-${item.timestamp}`}
                  renderItem={({ item }) => <SongRow song={item} onPress={() => handleSelect(item)} />}
                  scrollEnabled={false}
                />
              </>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => <SongRow song={item} onPress={() => handleSelect(item)} />}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 360 }}
              />
            )}
          </View>
        )}

        {/* Search bar con blur 24px applicato direttamente */}
        <View style={styles.inputRowWrapper}>
          <BlurView intensity={BLUR_INTENSITY} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.inputRow}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder={`Search for ${searchMode === "songs" ? "a song" : "friends"}...`}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={query}
              onChangeText={handleChange}
              onFocus={() => { if (!query && recentSearches.length > 0) setIsOpen(true); }}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.modeToggle}
              onPress={() => {
                setSearchMode((m) => (m === "songs" ? "friends" : "songs"));
                setResults([]);
                setIsOpen(false);
              }}
            >
              <ThemedText style={styles.modeText}>{searchMode === "songs" ? "Songs" : "Friends"}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Backdrop to close */}
      {isOpen && (
        <TouchableOpacity style={styles.backdrop} onPress={closeSearch} activeOpacity={1} />
      )}

      {/* Lyrics bottom sheet */}
      {selectedSong && (
        <LyricsBottomSheet
          isOpen={lyricsOpen}
          onClose={() => setLyricsOpen(false)}
          song={selectedSong}
          onSave={handleSave}
        />
      )}
    </>
  );
}

function SongRow({ song, onPress }: { song: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.songRow} onPress={onPress}>
      <Image
        source={{ uri: song.song_art_image_thumbnail_url || undefined }}
        style={[styles.songArt, song.isUser && { borderRadius: 24 }]}
        defaultSource={require("../assets/placeholder.png")}
      />
      <View style={styles.songInfo}>
        <ThemedText style={styles.songTitle} numberOfLines={1}>{song.title}</ThemedText>
        <ThemedText style={styles.songArtist} numberOfLines={1}>
          {song.isUser ? "User" : song.artist_names}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 999,
    overflow: "hidden",
  },
  inputRowWrapper: {
    borderRadius: 100,
    height: 48,
    overflow: "hidden",
  },
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: "transparent",
  },
  searchIcon: { marginRight: 2 },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
  },
  modeToggle: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  modeText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "500" },
  dropdown: {
    backgroundColor: "#282828",
    borderRadius: 16,
    marginBottom: 8,
    overflow: "hidden",
    maxHeight: 400,
    transform: [{ translateY: 0 }],
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  songArt: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#383838" },
  songInfo: { flex: 1 },
  songTitle: { color: "#fff", fontSize: 15, fontWeight: "500" },
  songArtist: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 2 },
  errorText: { color: "rgba(255,255,255,0.5)", padding: 16, textAlign: "center" },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  recentLabel: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  backdrop: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99,
  },
});
