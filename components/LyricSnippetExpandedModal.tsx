import React, { useEffect, useRef } from "react";
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { BlurView } from "expo-blur";
import { ThemedText } from "./ThemedText";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { LyricSnippet } from "@/lib/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN = 24;
const CARD_MAX_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;

interface Props {
  visible: boolean;
  onClose: () => void;
  snippet: LyricSnippet;
}

const ENTRANCE_DURATION = 350;
const ENTRANCE_EASING = Easing.out(Easing.cubic);

export function LyricSnippetExpandedModal({
  visible,
  onClose,
  snippet,
}: Props) {
  const translateY = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(200);
      opacity.setValue(0);
      scale.setValue(0.8);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ENTRANCE_DURATION,
          easing: ENTRANCE_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ENTRANCE_DURATION,
          easing: ENTRANCE_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: ENTRANCE_DURATION,
          easing: ENTRANCE_EASING,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(200);
      opacity.setValue(0);
      scale.setValue(0.8);
    }
  }, [visible]);

  const colors = snippet.color?.split("|") || ["#8B8E98", "#6B6E78"];
  const bgColor = colors[0] || "#8B8E98";
  const bgColorDark = colors[1] || "#6B6E78";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlayRoot}>
        <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} pointerEvents="none">
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        </View>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.cardWrapper} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.cardOuter,
              {
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
            pointerEvents="auto"
          >
            <LinearGradient
              colors={[bgColor, bgColorDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradient}
            />
            <View style={styles.cardContent}>
              <ScrollView
                style={styles.lyricsScroll}
                contentContainerStyle={styles.lyricsContent}
                showsVerticalScrollIndicator={false}
              >
                <ThemedText style={styles.lyrics}>{snippet.lyrics}</ThemedText>
              </ScrollView>
              <View style={styles.footer}>
                {snippet.album_art_url ? (
                  <Image source={{ uri: snippet.album_art_url }} style={styles.albumArt} />
                ) : (
                  <View style={[styles.albumArt, styles.albumArtPlaceholder]}>
                    <Ionicons name="musical-notes" size={18} color="rgba(255,255,255,0.4)" />
                  </View>
                )}
                <View style={styles.songInfo}>
                  <ThemedText style={styles.songTitle} numberOfLines={1}>
                    {snippet.song_title}
                  </ThemedText>
                  <ThemedText style={styles.artistName} numberOfLines={1}>
                    {snippet.artist_name}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
  },
  cardWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: CARD_MARGIN,
  },
  cardOuter: {
    width: "100%",
    maxWidth: CARD_MAX_WIDTH,
    borderRadius: 24,
    overflow: "hidden",
    maxHeight: "80%",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    padding: 20,
    position: "relative",
  },
  lyricsScroll: {
    maxHeight: 320,
  },
  lyricsContent: {
    paddingBottom: 20,
  },
  lyrics: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 28,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  albumArtPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  songInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  songTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "600",
  },
  artistName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginTop: 2,
  },
});
