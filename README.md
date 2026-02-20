# Snipify - Expo App

Conversione da Next.js a React Native / Expo della web app Snipify.

## Setup

### 1. Installa le dipendenze
```bash
npm install
```

### 2. Configura le variabili d'ambiente
Copia `.env` e inserisci le tue credenziali Supabase:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### 3. Aggiungi expo-image-picker
```bash
npx expo install expo-image-picker
```

### 4. Avvia
```bash
npx expo start
```
Poi scansiona il QR con Expo Go, oppure premi `i` per iOS o `a` per Android.

---

## Struttura del progetto

```
snipify-expo/
├── app/
│   ├── _layout.tsx          # Root layout + auth redirect
│   ├── (auth)/
│   │   ├── login.tsx        # Login / Sign up
│   │   └── recover.tsx      # Password recovery
│   └── (app)/
│       ├── index.tsx        # Home screen
│       └── user/[id].tsx    # Profilo utente
├── components/
│   ├── SearchBar.tsx        # Barra di ricerca con dropdown
│   ├── LyricsBottomSheet.tsx # Modal lyrics (sostituisce LyricsModal)
│   ├── LyricSnippets.tsx    # Lista snippet
│   ├── SnippetCard.tsx      # Card singolo snippet
│   ├── TopArtists.tsx       # Artisti top
│   ├── ProfilePhoto.tsx     # Foto profilo con upload
│   ├── ProfileName.tsx      # Nome con modifica inline
│   └── ProfileStats.tsx     # Statistiche profilo
└── lib/
    ├── supabase.ts          # Client Supabase (con AsyncStorage)
    ├── storage.ts           # CRUD lyric snippets
    └── auth-context.tsx     # AuthProvider
```

## Differenze rispetto alla versione web

| Web (Next.js) | App (Expo) |
|---|---|
| `next/navigation` | `expo-router` |
| `localStorage` | `AsyncStorage` |
| `window.dispatchEvent` | Prop callbacks / refresh key |
| API routes (`/api/...`) | Chiamate dirette a Supabase / Deezer / lrclib |
| shadcn/ui | Componenti custom React Native |
| `Dialog` / `Modal` HTML | `Modal` React Native / `presentationStyle="pageSheet"` |
| CSS / Tailwind | `StyleSheet.create` |

## Note importanti

- La ricerca canzoni va direttamente all'API Deezer (non passa per API route)
- I testi vanno direttamente a lrclib.net
- L'upload foto profilo usa Supabase Storage bucket `profile-images`
- Lo status bar è già configurato light su dark background in `app.json`
