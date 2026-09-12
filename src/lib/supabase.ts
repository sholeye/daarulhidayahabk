import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ydnfzodzfxgxoksdtqxg.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_e4A95JEmUPhw8hgoQy4xSg_O5R8NjNr";
const SUPABASE_PROJECT_MARKER = "dh-active-supabase-url";

const clearStaleSupabaseSessions = () => {
  if (typeof window === "undefined") return;

  const previousProjectUrl = window.localStorage.getItem(
    SUPABASE_PROJECT_MARKER,
  );
  if (previousProjectUrl === SUPABASE_URL) return;

  Object.keys(window.localStorage).forEach((key) => {
    const isSupabaseSessionKey =
      (key.startsWith("sb-") && key.endsWith("-auth-token")) ||
      key.includes("supabase.auth.token");

    if (isSupabaseSessionKey) {
      window.localStorage.removeItem(key);
    }
  });

  window.localStorage.setItem(SUPABASE_PROJECT_MARKER, SUPABASE_URL);
};

clearStaleSupabaseSessions();

export const createIsolatedAuthClient = () =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: undefined,
    },
  });

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = (): boolean => true;
