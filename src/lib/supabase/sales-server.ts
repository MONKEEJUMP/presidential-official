import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function settings() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishableKey || !secretKey) {
    throw new Error("Sales tool Supabase configuration is unavailable.");
  }
  return { url, publishableKey, secretKey };
}

export async function createSalesAuthClient() {
  const { url, publishableKey } = settings();
  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        } catch {
          // Server Components cannot write cookies; Route Handlers refresh them.
        }
      },
    },
  });
}

export function createSalesAdminClient() {
  const { url, secretKey } = settings();
  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: { "User-Agent": "presidential-sales-server/1.0" },
    },
  });
}
