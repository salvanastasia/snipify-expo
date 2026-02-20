import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";

interface Props {
  userId: string;
}

export function ProfilePhoto({ userId }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("profile_image_url")
      .eq("id", userId)
      .single();
    if (data?.profile_image_url) setImageUrl(data.profile_image_url);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setUploading(true);

    try {
      const fileName = `${userId}-${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: fileName,
        type: "image/jpeg",
      } as any);

      const { data: uploadData, error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, formData, { contentType: "multipart/form-data", upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      await supabase
        .from("profiles")
        .update({ profile_image_url: publicUrl })
        .eq("id", userId);

      setImageUrl(publicUrl);
    } catch (e) {
      Alert.alert("Error", "Failed to upload photo.");
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <TouchableOpacity onPress={pickImage} style={styles.container} disabled={uploading}>
      {uploading ? (
        <View style={[styles.avatar, styles.placeholder]}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]}>
          <Ionicons name="person" size={48} color="rgba(255,255,255,0.4)" />
        </View>
      )}
      <View style={styles.editBadge}>
        <Ionicons name="camera" size={14} color="#000" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative", width: 90, height: 90 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  placeholder: {
    backgroundColor: "#282828",
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
