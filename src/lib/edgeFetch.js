import { supabase } from "../supabaseClient";

const EDGE_URL = (typeof window !== "undefined" && window.__SUPABASE_EDGE_URL__)
  || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// ── Authenticated Edge Function fetch ──────────────────────────────────────
export async function edgeFetch(path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not logged in. Please refresh and try again.");
  const res = await fetch(`${EDGE_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || `Server error ${res.status}`);
  return data;
}

