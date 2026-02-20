import { supabase } from "./supabase";

export interface LyricSnippet {
  id: string;
  user_id: string;
  song_title: string;
  artist_name: string;
  album_art_url: string | null;
  artist_art_url: string | null;
  lyrics: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export async function getLyricSnippets(): Promise<LyricSnippet[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("lyric_snippets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error in getLyricSnippets:", error);
    return [];
  }
}

export async function getLyricSnippetsByUserId(userId: string): Promise<LyricSnippet[]> {
  try {
    const { data, error } = await supabase
      .from("lyric_snippets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching snippets for user:", error);
    return [];
  }
}

export async function saveLyricSnippet(
  songTitle: string,
  artistName: string,
  albumArtUrl: string | null,
  lyrics: string,
  color: string | null
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  // Check if we already have artist art for this artist
  let artistArtUrl: string | null = null;
  const { data: existingSnippets } = await supabase
    .from("lyric_snippets")
    .select("artist_art_url")
    .eq("artist_name", artistName.trim())
    .not("artist_art_url", "is", null)
    .limit(1);

  if (existingSnippets && existingSnippets.length > 0) {
    artistArtUrl = existingSnippets[0].artist_art_url;
  }

  // If no artist art, fetch from Deezer directly
  if (!artistArtUrl) {
    try {
      const res = await fetch(
        `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName.trim())}&limit=5`
      );
      const data = await res.json();
      if (data?.data?.length > 0) {
        const normalize = (s: string) =>
          s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const target = normalize(artistName);
        const match =
          data.data.find((a: any) => normalize(a.name) === target) || data.data[0];
        artistArtUrl = match?.picture_xl || match?.picture_big || match?.picture || null;
      }
    } catch (e) {
      console.error("Error fetching artist image:", e);
    }
  }

  const { error } = await supabase.from("lyric_snippets").insert({
    user_id: user.id,
    song_title: songTitle.trim(),
    artist_name: artistName.trim(),
    album_art_url: albumArtUrl,
    artist_art_url: artistArtUrl,
    lyrics: lyrics.trim(),
    color,
  });

  if (error) throw error;
}

export async function deleteLyricSnippet(id: string): Promise<void> {
  const { error } = await supabase.from("lyric_snippets").delete().eq("id", id);
  if (error) throw error;
}

export async function updateLyricSnippet(snippet: LyricSnippet): Promise<void> {
  const { error } = await supabase
    .from("lyric_snippets")
    .update(snippet)
    .eq("id", snippet.id);
  if (error) throw error;
}
