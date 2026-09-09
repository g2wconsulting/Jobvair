// Unauthenticated reads for the public job board (jobs.html). Candidates
// browsing here have no session — the Supabase client sends the anon key,
// and RLS (see supabase/migrations/0021_public_job_board.sql) scopes what
// comes back to published jobs whose company hasn't opted out of the
// public board.

import { supabase } from "../supabaseClient";

export async function listPublicJobs() {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, slug, title, department, location, work_arrangement, employment_type, salary_min, salary_max, salary_currency, published_at, companies(name, logo_url)")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPublicJobBySlug(slug) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*, companies(name, logo_url, website, industry, description)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data;
}
