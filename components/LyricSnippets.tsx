import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "./ThemedText";
import { getLyricSnippets, deleteLyricSnippet, LyricSnippet, updateSnippetColor } from "@/lib/storage";
import { getColorsFromImageUrl } from "@/lib/albumArtColors";
import { useTheme } from "@/lib/theme-context";
import { LAYOUT_STORAGE_KEY } from "./ProfileName";
import type { SnippetsLayoutId } from "./ProfileName";
import { SnippetCard } from "./SnippetCard";
import { SnippetGridCard, SNIPPET_GRID_CARD_GAP } from "./SnippetGridCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PAGE_PADDING_H = 24;

export function LyricSnippets() {
  const { colors } = useTheme();
  const [snippets, setSnippets] = useState<LyricSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<SnippetsLayoutId>("list");
  const [listHeight, setListHeight] = useState<number | null>(null);
  const [gridHeight, setGridHeight] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const swiperHeight =
    layout === "list" ? listHeight : gridHeight;

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(LAYOUT_STORAGE_KEY).then((stored) => {
      if (stored === "list" || stored === "grid") setLayout(stored);
    });
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    const x = layout === "grid" ? SCREEN_WIDTH : 0;
    scrollRef.current.scrollTo({ x, animated: false });
  }, [layout]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getLyricSnippets();
      setSnippets(data);
      
      // Fetch colors for old snippets that don't have colors
      const snippetsWithoutColors = data.filter(
        (s) => !s.color && s.album_art_url
      );
      
      // Update colors in background (don't block UI)
      for (const snippet of snippetsWithoutColors) {
        try {
          const color = await getColorsFromImageUrl(snippet.album_art_url);
          if (color) {
            await updateSnippetColor(snippet.id, color);
            // Update local state
            setSnippets((prev) =>
              prev.map((s) => (s.id === snippet.id ? { ...s, color } : s))
            );
          }
        } catch (e) {
          console.error(`Failed to fetch color for snippet ${snippet.id}:`, e);
        }
      }
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

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const newLayout: SnippetsLayoutId = x >= SCREEN_WIDTH / 2 ? "grid" : "list";
    if (newLayout !== layout) {
      setLayout(newLayout);
      AsyncStorage.setItem(LAYOUT_STORAGE_KEY, newLayout);
    }
  };

  if (loading) {
    const isCream = colors.background === "#F2EDE7";
    const skeletonBg = isCream ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
    const skeletonLineBg = isCream ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
    return (
      <View style={styles.skeletonPage}>
        <View style={styles.pageInner}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.skeletonCard, { backgroundColor: skeletonBg }]}>
              <View style={styles.skeletonCardContent}>
                <View style={[styles.skeletonLine, { width: "100%", backgroundColor: skeletonLineBg }]} />
                <View style={[styles.skeletonLine, { width: "92%", marginTop: 8, backgroundColor: skeletonLineBg }]} />
                <View style={[styles.skeletonLine, { width: "78%", marginTop: 8, backgroundColor: skeletonLineBg }]} />
                <View style={[styles.skeletonLine, { width: "85%", marginTop: 8, backgroundColor: skeletonLineBg }]} />
                <View style={styles.skeletonFooter}>
                  <View style={[styles.skeletonAlbumArt, { backgroundColor: skeletonLineBg }]} />
                  <View style={styles.skeletonSongInfo}>
                    <View style={[styles.skeletonLine, { width: 80, height: 14, backgroundColor: skeletonLineBg }]} />
                    <View style={[styles.skeletonLine, { width: 56, height: 12, marginTop: 6, backgroundColor: skeletonLineBg }]} />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return <ThemedText style={styles.errorText}>{error}</ThemedText>;
  }

  if (snippets.length === 0) {
    return (
      <ThemedText style={[styles.emptyText, { color: colors.textMuted }]}>
        Search for a song above to save your first snippet!
      </ThemedText>
    );
  }

  const rows: LyricSnippet[][] = [];
  for (let i = 0; i < snippets.length; i += 2) {
    rows.push(snippets.slice(i, i + 2));
  }

  const listPage = (
    <View
      style={[styles.page, { width: SCREEN_WIDTH }]}
      onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
    >
      <View style={styles.pageInner}>
        {snippets.map((snippet, index) => (
          <SnippetCard
            key={snippet.id}
            snippet={snippet}
            onDelete={handleDelete}
            isLast={index === snippets.length - 1}
          />
        ))}
      </View>
    </View>
  );

  const gridPage = (
    <View
      style={[styles.page, styles.grid, { width: SCREEN_WIDTH }]}
      onLayout={(e) => setGridHeight(e.nativeEvent.layout.height)}
    >
      <View style={styles.pageInner}>
        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={[styles.gridRow, rowIndex === rows.length - 1 && styles.gridRowLast]}
          >
            {row.map((snippet) => (
              <SnippetGridCard key={snippet.id} snippet={snippet} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={swiperHeight != null ? { height: swiperHeight } : undefined}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={[styles.swiper, swiperHeight != null && { height: swiperHeight }]}
        contentContainerStyle={styles.swiperContent}
      >
        {listPage}
        {gridPage}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonPage: { paddingVertical: 4 },
  skeletonCard: {
    borderRadius: 30,
    marginBottom: 12,
    minHeight: 180,
    overflow: "hidden",
  },
  skeletonCardContent: {
    padding: 16,
    flex: 1,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 6,
  },
  skeletonFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    paddingRight: 36,
  },
  skeletonAlbumArt: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  skeletonSongInfo: { flex: 1 },
  errorText: { color: "#ff4444", fontSize: 14 },
  emptyText: { fontSize: 15 },
  swiper: { flexGrow: 0 },
  swiperContent: { flexGrow: 0, alignItems: "flex-start" },
  page: { flexGrow: 0 },
  pageInner: { paddingHorizontal: PAGE_PADDING_H },
  grid: { gap: SNIPPET_GRID_CARD_GAP },
  gridRow: {
    flexDirection: "row",
    gap: SNIPPET_GRID_CARD_GAP,
    marginBottom: SNIPPET_GRID_CARD_GAP,
  },
  gridRowLast: { marginBottom: 0 },
});
