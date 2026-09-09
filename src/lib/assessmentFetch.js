// Unauthenticated Edge Function fetch for the candidate assessment portal.
// Candidates never log in — the anon key satisfies the Functions gateway's
// JWT check, and the Edge Function does its own authorization by
// validating the invite token against assessment_invitations. Never send
// a Supabase user session here; there isn't one.

const EDGE_URL = (typeof window !== "undefined" && window.__SUPABASE_EDGE_URL__)
  || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function assessmentFetch(path, body) {
  const res = await fetch(`${EDGE_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ANON_KEY}`,
      "apikey": ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || `Server error ${res.status}`);
  return data;
}
