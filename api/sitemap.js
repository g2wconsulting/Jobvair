// Dynamic sitemap for the public job board, served at /sitemap.xml via the
// vercel.json rewrite. A Vercel serverless function (not part of the Vite
// client bundle) — it queries Supabase directly with the anon key at
// request time, so newly published jobs show up without a rebuild. RLS
// (see supabase/migrations/0021_public_job_board.sql) already limits this
// to published jobs whose company hasn't opted out of the public board,
// so no extra filtering is needed here.

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const SITE_URL = process.env.SITE_URL || `https://${req.headers.host}`;

  const staticUrls = [`${SITE_URL}/`, `${SITE_URL}/jobs`];
  let jobUrls = [];

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data } = await supabase.from("jobs").select("slug, published_at").eq("status", "published");
      jobUrls = (data || []).map(j => ({ loc: `${SITE_URL}/jobs/${j.slug}`, lastmod: j.published_at }));
    } catch (err) {
      console.error("[sitemap] failed to load jobs:", err);
    }
  }

  const urlEntries = [
    ...staticUrls.map(loc => `  <url><loc>${loc}</loc></url>`),
    ...jobUrls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""}</url>`),
  ].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).send(xml);
}
