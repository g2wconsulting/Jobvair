import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const ANALYSIS_SYSTEM_PROMPT = `You are an expert resume reviewer and recruiter helping a candidate understand how
well their resume matches a specific job, and how to improve it.

You will receive the candidate's resume content, profile details, skills, and a target
job description (or just a job title if no full description was provided).

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

function extractJson(rawText) {
  const cleaned = rawText.replace(/^```json\s*|```$/g, "").trim();
  return JSON.parse(cleaned);
}

async function callAnthropic(payload) {
  const userContent = JSON.stringify({
    resume_content: payload.resume_content || null,
    profile: payload.profile || {},
    skills: payload.skills || [],
    job_title: payload.job_title || null,
    company: payload.company || null,
    job_description: payload.job_description || null,
  });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const textBlock = Array.isArray(data.content) ? data.content.find(b => b.type === "text") : null;
  return extractJson(textBlock?.text ?? "");
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

  if (!body?.resume_content && !body?.job_title) {
    return Response.json({ error: "Provide either resume_content or at least a job_title to analyze." }, { status: 400, headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return Response.json({ error: "Resume Match is not configured yet (missing AI provider key). Please contact support." }, { status: 503, headers: corsHeaders });
  }

  try {
    const result = await callAnthropic(body);

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
