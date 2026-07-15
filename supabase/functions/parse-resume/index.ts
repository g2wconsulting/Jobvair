import { createClient } from "npm:@supabase/supabase-js@2";
import mammoth from "npm:mammoth@1.8.0";
import { extractText, getDocumentProxy } from "npm:unpdf@0.11.0";
import { callOpenAiJson, hasOpenAiKey } from "../_shared/openai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const EXTRACTION_SYSTEM_PROMPT = `You are a resume parser. You will be given extracted plain text from a candidate's
resume (originally a PDF, DOCX, or plain text file). Extract structured data from it.

Respond with ONLY a single JSON object matching this exact shape, and nothing else
(no markdown fences, no preamble, no commentary). Use null or empty arrays for anything
not present in the resume — never invent information:

{
  "full_name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "summary": "string or null — a professional summary, written from the resume if not already present",
  "skills": [
    { "skill_name": "string", "category": "string or null", "years_experience": number or null, "proficiency_level": "Beginner"|"Intermediate"|"Advanced"|"Expert"|null, "last_used_date": "YYYY-MM-DD or null" }
  ],
  "work_experience": [
    { "job_title": "string", "company": "string", "location": "string or null", "start_date": "YYYY-MM-DD or null", "end_date": "YYYY-MM-DD or null", "is_current": boolean, "description": "string" }
  ],
  "education": [
    { "institution": "string", "degree": "string or null", "major": "string or null", "graduation_year": number or null }
  ],
  "certifications": [
    { "name": "string", "issuing_org": "string or null", "issue_date": "YYYY-MM-DD or null", "expiry_date": "YYYY-MM-DD or null" }
  ],
  "profile_update": {
    "total_years_experience": number or null,
    "total_years_leadership": number or null
  },
  "industries": ["string"],
  "desired_titles": ["string"]
}

Rules:
- Dates should be normalized to YYYY-MM-DD; where a specific day isn't known, use the 1st of the month.
- "desired_titles" should be inferred from the candidate's most recent 1-2 job titles, not invented career changes.
- "industries" should reflect industries actually represented in their work history.
- Do not include anything outside the single JSON object.`;

async function extractPdfText(arrayBuffer) {
  const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
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

  const { user_id, storage_path, original_filename, parsed_resume_id } = body ?? {};
  if (!user_id || !storage_path || !parsed_resume_id) {
    return Response.json({ error: "Missing required fields: user_id, storage_path, parsed_resume_id." }, { status: 400, headers: corsHeaders });
  }
  if (user_id !== authedUserId) {
    return Response.json({ error: "user_id does not match the authenticated user." }, { status: 403, headers: corsHeaders });
  }

  const markFailed = async (message) => {
    await supabase.from("parsed_resumes").update({
      parse_status: "failed",
      error_message: message,
      updated_at: new Date().toISOString(),
    }).eq("id", parsed_resume_id);
  };

  if (!hasOpenAiKey()) {
    await markFailed("Resume parsing is not configured yet (missing AI provider key).");
    return Response.json({ error: "Resume parsing is not configured yet. Please contact support." }, { status: 503, headers: corsHeaders });
  }

  try {
    // The stored path is a display-style string like "resumes/<user_id>/<file>"
    // but the actual object key inside the "resumes" bucket omits that prefix.
    const objectKey = storage_path.replace(/^resumes\//, "");

    const { data: fileBlob, error: downloadError } = await supabase.storage.from("resumes").download(objectKey);
    if (downloadError || !fileBlob) {
      throw new Error(`Could not read the uploaded file: ${downloadError?.message || "not found"}`);
    }

    const filename = (original_filename || objectKey).toLowerCase();
    const arrayBuffer = await fileBlob.arrayBuffer();

    let resumeText;
    if (filename.endsWith(".pdf")) {
      resumeText = await extractPdfText(arrayBuffer);
      if (!resumeText?.trim()) throw new Error("Couldn't extract any text from this PDF (it may be a scanned image without real text).");
    } else if (filename.endsWith(".docx")) {
      const { value: text } = await mammoth.extractRawText({ arrayBuffer });
      if (!text?.trim()) throw new Error("Couldn't extract any text from this .docx file.");
      resumeText = text;
    } else if (filename.endsWith(".txt")) {
      resumeText = new TextDecoder("utf-8").decode(arrayBuffer);
    } else if (filename.endsWith(".doc")) {
      throw new Error("Legacy .doc files aren't supported yet — please save your resume as .docx or .pdf and try again.");
    } else {
      throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
    }

    const parsed = await callOpenAiJson(
      EXTRACTION_SYSTEM_PROMPT,
      `Resume text:\n\n${resumeText}\n\nExtract structured resume data from this, following the required JSON shape exactly.`,
      3000,
    );

    await supabase.from("parsed_resumes").update({
      parse_status: "completed",
      parsed_json: parsed,
      error_message: null,
      updated_at: new Date().toISOString(),
    }).eq("id", parsed_resume_id);

    return Response.json(parsed, { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[parse-resume] error:", message);
    await markFailed(message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
