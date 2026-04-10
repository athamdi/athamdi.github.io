import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://example.supabase.co";
const FALLBACK_SUPABASE_ANON = "public-anon-key-placeholder";
const FALLBACK_SUPABASE_SERVICE = "service-role-key-placeholder";

function resolvePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON;
  return { url, anon };
}

const publicConfig = resolvePublicConfig();

export const supabase = createClient(publicConfig.url, publicConfig.anon, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const getSupabaseAdmin = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? FALLBACK_SUPABASE_SERVICE;

  return createClient(publicConfig.url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
