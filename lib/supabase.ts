import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Validate Supabase configuration
const isValidConfig = 
  supabaseUrl && 
  supabaseUrl !== "your_supabase_url_here" && 
  supabaseUrl.startsWith("https://") &&
  supabaseAnonKey &&
  supabaseAnonKey !== "your_supabase_anon_key_here";

if (!isValidConfig) {
  console.warn(
    "⚠️  Supabase is not configured. Please update your .env file:\n" +
    "EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n" +
    "EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
  );
}

// Use a valid format URL to prevent Supabase validation errors
// Operations will fail until proper credentials are configured
const url = isValidConfig ? supabaseUrl : "https://placeholder.supabase.co";
const key = isValidConfig ? supabaseAnonKey : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

// Use React Native's global fetch explicitly (avoids bundler/polyfill issues
// that can cause "Network request failed" in Expo / RN)
export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: global.fetch,
  },
});
