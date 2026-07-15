import { createClient } from "npm:@supabase/supabase-js@2";
import { generateAIResponse, hasOpenAiKey } from "../_shared/modelRouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const ANALYSIS_SYSTEM_PROMPT = `You are an expert resume reviewer and recruiter helping a candidate understand how
well their resume matches a specific job, and how to improve it.

You will receive the candidate's resume content, profile details, skills, and a target
job description (or just a job title if no full description was provided). The job
description may sometimes be raw extracted text from a scraped job posting webpage,
which can include unrelated site navigation, footer text, or boilerplate — focus on
identifying and using only the actual job posting content within it.

Respond with ONLY a single JSON object matching this exact shape, and nothing else
(no markdown fences, no preamble, no commentary):

{
  "match_score": number (0-100, how well this resume fits this job),
  "matching_skills": ["skills the candidate already has that this job wants"],
  "missing_skills": ["skills or qualifications the job wants that the candidate's resume doesn't show"],
  "transferable_skills": ["skills the candidate has that aren't an exact match but are relevant/transferable"],
  "job_fit_explanation": "2-4 sentence plain-English explanation of the match score and overall fit",
  "rewritten_professional_summary": "a tailored 2-3 sentence professional summary for this specific job, based on the candidate's real background",
  "recommended_resume_keywords": ["ATS-relevant keywords from the job description the candidate should naturally work into their resume"],
  "rewritten_experience_bullets": ["2-4 improved, quantified bullet points rewritten from the candidate's actual experience to better match this job"],
  "career_recommendations": ["1-3 sentences of career-development advice specific to this candidate and this target role"],
  "next_steps": ["2-4 short, concrete action items the candidate should take next"]
}

Rules:
- Never invent employment history, credentials, or skills not present in the candidate's actual background.
- Base match_score on genuine alignment between the resume and the job description, not on wishful thinking.
- If no real job description was provided (only a title), be explicit in job_fit_explanation that this is a general assessment for that role type.
- Do not include anything outside the single JSON object.`;

function htmlToText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchJobDescriptionFromUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("That doesn't look like a valid URL. Please check it and try again.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let res;
  try {
    res = await fetch(parsed.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; JobvairBot/1.0; +https://jobvair.com)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
  } catch (err) {
    throw new Error(`Couldn't reach that URL (${err instanceof Error ? err.message : "network error"}). Please paste the job description text directly instead.`);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`That page returned an error (HTTP ${res.status}). It may require a login or block automated access — please paste the job description text directly instead.`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("html") && !contentType.includes("text")) {
    throw new Error("That URL didn't return a readable web page. Please paste the job description text directly instead.");
  }

  const html = await res.text();
  const text = htmlToText(html);
  if (!text || text.length < 100) {
    throw new Error("Couldn't find readable content on that page (it may require JavaScript to load, or block automated access). Please paste the job description text directly instead.");
  }

  // Cap length to keep prompt size/cost reasonable — the system prompt is
  // built to find the actual job posting within a noisy full-page extract.
  return text.slice(0, 20000);
}

async function callAi(payload) {
  const userContent = JSON.stringify({
    resume_content: payload.resume_content || null,
    profile: payload.profile || {},
    skills: payload.skills || [],
    job_title: payload.job_title || null,
    company: payload.company || null,
    job_description: payload.job_description || null,
  });

  // This single call both scores the match AND rewrites the summary/bullets,
  // so it doesn't map perfectly to one task bucket — "resume_scoring" is the
  // closest fit since the match score/fit explanation is its primary output.
  const { data } = await generateAIResponse(
    "resume_scoring",
    { system: ANALYSIS_SYSTEM_PROMPT, user: userContent },
    { maxOutputTokens: 2500 },
  );
  return data;
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed. Use POST." }, { status: 405, headers: corsHeaders });
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return Response.json({ error: "Missing Authorization bearer token." }, { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return Response.json({ error: "Invalid or expired session." }, { status: 401, headers: corsHeaders });
  }
  const authedUserId = userData.user.id;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request body." }, { status: 400, headers: corsHeaders });
  }

  if (body?.user_id && body.user_id !== authedUserId) {
    return Response.json({ error: "user_id does not match the authenticated user." }, { status: 403, headers: corsHeaders });
  }

  // Verify resume ownership when a resume_id is present.
  if (body?.resume_id) {
    const { data: resumeRow, error: resumeError } = await supabase
      .from("resumes")
      .select("id, user_id")
      .eq("id", body.resume_id)
      .maybeSingle();
    if (resumeError || !resumeRow || resumeRow.user_id !== authedUserId) {
      return Response.json({ error: "Resume not found or not owned by the authenticated user." }, { status: 403, headers: corsHeaders });
    }
  }

  // If a job posting URL was provided instead of pasted text, fetch and
  // extract it server-side (arbitrary third-party fetches from the browser
  // would be blocked by CORS almost everywhere, so this has to happen here).
  if (body?.job_url && !body?.job_description) {
    try {
      body.job_description = await fetchJobDescriptionFromUrl(body.job_url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ error: message }, { status: 422, headers: corsHeaders });
    }
  }

  if (!body?.resume_content && !body?.job_title) {
    return Response.json({ error: "Provide either resume_content or at least a job_title to analyze." }, { status: 400, headers: corsHeaders });
  }

  if (!hasOpenAiKey()) {
    return Response.json({ error: "Resume Match is not configured yet (missing AI provider key). Please contact support." }, { status: 503, headers: corsHeaders });
  }

  try {
    const result = await callAi(body);

    const { error: insertError } = await supabase.from("ai_analyses").insert({
      user_id: authedUserId,
      resume_id: body.resume_id || null,
      job_title: body.job_title || null,
      company: body.company || null,
      job_description: body.job_description || null,
      match_score: typeof result.match_score === "number" ? result.match_score : null,
      result_json: result,
    });
    if (insertError) {
      console.error("[analyze-resume] failed to persist analysis:", insertError.message);
    }

    return Response.json(result, { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze-resume] error:", message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
