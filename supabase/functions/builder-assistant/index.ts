import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUILDER_ASSISTANT_PAYLOAD_VERSION = "builder_assistant_payload_v1";
const ASSISTANT_RESPONSE_VERSION = "builder_assistant_response_v1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

type ValidationIssue = {
  path: string;
  message: string;
};

type ValidationResult = {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const addError = (errors: ValidationIssue[], path: string, message: string) => {
  errors.push({ path, message });
};

function validateBuilderAssistantPayload(payload: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!isPlainObject(payload)) {
    addError(errors, "$", "Expected builder assistant payload to be an object.");
    return { valid: false, errors, warnings };
  }

  if (payload.version !== BUILDER_ASSISTANT_PAYLOAD_VERSION) {
    addError(errors, "$.version", `Expected version to be ${BUILDER_ASSISTANT_PAYLOAD_VERSION}.`);
  }

  ["resume_id", "user_id"].forEach(key => {
    const value = payload[key];
    if (value !== null && typeof value !== "string") {
      addError(errors, `$.${key}`, "Expected value to be a string or null.");
    }
  });

  if (typeof payload.resume_name !== "string") {
    addError(errors, "$.resume_name", "Expected resume_name to be a string.");
  }

  if (!isPlainObject(payload.header)) {
    addError(errors, "$.header", "Expected header to be an object.");
  }

  if (!Array.isArray(payload.sections)) {
    addError(errors, "$.sections", "Expected sections to be an array.");
  } else {
    payload.sections.forEach((section, index) => {
      if (!isPlainObject(section)) {
        addError(errors, `$.sections[${index}]`, "Expected section to be an object.");
        return;
      }
      if (typeof section.section_type !== "string" || !section.section_type.trim()) {
        addError(errors, `$.sections[${index}].section_type`, "Expected a non-empty section_type string.");
      }
    });
  }

  if (!Array.isArray(payload.jobs)) {
    addError(errors, "$.jobs", "Expected jobs to be an array.");
  }

  if (!isPlainObject(payload.template)) {
    addError(errors, "$.template", "Expected template to be an object.");
  }

  if (!isPlainObject(payload.profile_context)) {
    addError(errors, "$.profile_context", "Expected profile_context to be an object.");
  }

  if (payload.instruction !== undefined && typeof payload.instruction !== "string") {
    addError(errors, "$.instruction", "Expected instruction to be a string.");
  }

  if (payload.job_description !== undefined && typeof payload.job_description !== "string") {
    addError(errors, "$.job_description", "Expected job_description to be a string.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function createMockAssistantResponse(payload: Record<string, unknown>) {
  const sections = Array.isArray(payload.sections) ? payload.sections : [];
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  const summaryIndex = sections.findIndex(section =>
    isPlainObject(section) && section.section_type === "summary"
  );
  const summarySection = summaryIndex >= 0 && isPlainObject(sections[summaryIndex])
    ? sections[summaryIndex]
    : null;
  const summaryContent = isPlainObject(summarySection?.content) ? summarySection.content : {};
  const summaryText = summaryContent.text || summaryContent.body;
  const firstJob = jobs.find(isPlainObject) as Record<string, unknown> | undefined;
  const operations = [];
  const suggestions = [];

  if (summaryIndex >= 0 && !summaryText) {
    operations.push({
      op: "merge",
      target: `sections[${summaryIndex}].content`,
      value: {
        text: "Add a focused professional summary tailored to the target role.",
      },
      metadata: {
        reason: "Summary section is present but appears empty.",
        source: "builder_payload",
        evidence: ["summary section has no text"],
        confidence: 0.72,
        safe_to_apply: false,
      },
    });
  }

  if (firstJob) {
    const jobEvidence =
      typeof firstJob.job_title === "string" && firstJob.job_title.trim()
        ? firstJob.job_title
        : typeof firstJob.company === "string" && firstJob.company.trim()
          ? firstJob.company
          : "first job entry";

    suggestions.push({
      id: "mock_sug_1",
      type: "missing_metric",
      target: "jobs[0].description",
      message: "Consider adding a measurable outcome to the first work experience entry.",
      severity: "medium",
      confidence: 0.68,
      action: "improve_bullet",
      metadata: {
        reason: "Impact metrics help recruiters evaluate scope and results.",
        source: "builder_payload",
        evidence: [jobEvidence],
        confidence: 0.68,
        safe_to_apply: false,
      },
    });
  }

  return {
    version: ASSISTANT_RESPONSE_VERSION,
    message: "Mock assistant response generated by the builder-assistant Edge Function.",
    confidence: {
      overall: 0.75,
      rationale: "Development mock based on available builder payload fields only.",
    },
    patch: {
      header: {},
      sections: [],
      jobs: [],
      operations,
    },
    suggestions,
    warnings: [
      {
        code: "mock_response",
        message: "This response is a local mock and was not generated by an AI provider.",
        severity: "low",
      },
    ],
  };
}

// ── AI provider call ────────────────────────────────────────────────────────

const ASSISTANT_SYSTEM_PROMPT = `You are a resume-writing assistant embedded in a resume builder tool.
You receive a candidate's current resume state as structured JSON, plus an optional
free-text instruction and an optional job description.

You must respond with ONLY a single JSON object matching this exact shape, and nothing else
(no markdown fences, no preamble, no commentary):

{
  "version": "builder_assistant_response_v1",
  "message": "short human-readable explanation of what you propose",
  "confidence": { "overall": 0.0-1.0, "rationale": "short reason" },
  "patch": {
    "header": {},
    "sections": [],
    "jobs": [],
    "operations": [
      {
        "op": "update" | "merge" | "insert" | "append" | "remove",
        "target": "dot/bracket path into the payload, e.g. sections[0].content",
        "value": <new value>,
        "metadata": {
          "reason": "why you propose this",
          "source": "resume" | "job_description" | "profile",
          "evidence": ["short evidence strings"],
          "confidence": 0.0-1.0,
          "safe_to_apply": true | false
        }
      }
    ]
  },
  "suggestions": [
    {
      "id": "short id",
      "type": "rewrite_summary" | "improve_bullet" | "missing_metric" | "missing_skill" | "ats_keyword" | "tone_issue" | "formatting_issue" | "evidence_gap" | "section_reorder" | "add_section",
      "target": "path this suggestion relates to",
      "message": "human readable suggestion",
      "severity": "low" | "medium" | "high",
      "confidence": 0.0-1.0,
      "action": "machine readable action hint"
    }
  ],
  "warnings": [
    { "code": "short code", "message": "human readable caveat", "target": "optional path", "severity": "low" | "medium" | "high" }
  ]
}

Rules:
- Never invent employment history, dates, or credentials not present in the input.
- Prefer small, targeted operations over rewriting entire sections.
- Only mark "safe_to_apply": true for low-risk wording/formatting changes, never for factual claims.
- Whenever "message" or a suggestion describes a specific rewritten sentence, paragraph, or
  bullet point, you MUST ALSO include a matching entry in "patch.operations" that actually
  applies that exact text — never describe a concrete rewrite in prose without also encoding
  it as an operation the user can apply with one click. An empty "operations" array should
  only happen when you are giving purely observational feedback with no specific rewrite to offer.
- For "target", use the exact index of the section/job as it appears in the resume JSON you were
  given, e.g. "sections[2].content" for the third section in the input's sections array, or
  "jobs[0].bullet_points" for the first job. Match indices to the input you actually received —
  do not guess or renumber.
- Do not include anything outside the single JSON object.`;

async function callAnthropic(payload: Record<string, unknown>) {
  const instruction = typeof payload.instruction === "string" ? payload.instruction : "";
  const jobDescription = typeof payload.job_description === "string" ? payload.job_description : "";

  const userContent = JSON.stringify({
    instruction: instruction || "Improve this resume generally.",
    job_description: jobDescription || null,
    resume: {
      resume_name: payload.resume_name,
      header: payload.header,
      sections: payload.sections,
      jobs: payload.jobs,
      template: payload.template,
      profile_context: payload.profile_context,
    },
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
      max_tokens: 2000,
      system: ASSISTANT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const textBlock = Array.isArray(data.content)
    ? data.content.find((block: Record<string, unknown>) => block.type === "text")
    : null;
  const rawText = textBlock?.text ?? "";

  const cleaned = rawText.replace(/^```json\s*|```$/g, "").trim();
  return JSON.parse(cleaned);
}

// ── Run persistence (Phase 4) ───────────────────────────────────────────────

async function persistRun(params: {
  userId: string | null;
  resumeId: string | null;
  instruction: string | null;
  jobDescription: string | null;
  inputSnapshot: Record<string, unknown>;
  responseJson: Record<string, unknown>;
  status: "completed" | "error" | "mock";
  errorMessage?: string;
}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !params.userId) return;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.from("resume_assistant_runs").insert({
      user_id: params.userId,
      resume_id: params.resumeId,
      instruction: params.instruction,
      job_description: params.jobDescription,
      input_snapshot: params.inputSnapshot,
      response_json: params.responseJson,
      status: params.status,
      error_message: params.errorMessage ?? null,
    });
    if (error) {
      console.error("[builder-assistant] failed to persist run:", error.message);
    }
  } catch (err) {
    console.error("[builder-assistant] failed to persist run:", err instanceof Error ? err.message : err);
  }
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed. Use POST." },
      { status: 405, headers: corsHeaders },
    );
  }

  // ── Auth: verify the caller's Supabase JWT ────────────────────────────────
  const authHeader = request.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return Response.json({ error: "Missing Authorization bearer token." }, { status: 401, headers: corsHeaders });
  }

  let authedUserId: string | null = null;
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return Response.json({ error: "Invalid or expired session." }, { status: 401, headers: corsHeaders });
    }
    authedUserId = userData.user.id;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (_error) {
    return Response.json(
      {
        error: "Invalid JSON request body.",
      },
      { status: 400, headers: corsHeaders },
    );
  }

  const validation = validateBuilderAssistantPayload(payload);
  if (!validation.valid) {
    return Response.json(
      {
        error: "Invalid BuilderAssistantPayload.",
        validation,
      },
      { status: 400, headers: corsHeaders },
    );
  }

  const typedPayload = payload as Record<string, unknown>;

  // Derive user identity from the JWT rather than trusting the body's user_id.
  if (authedUserId && typedPayload.user_id && typedPayload.user_id !== authedUserId) {
    return Response.json(
      { error: "Payload user_id does not match the authenticated user." },
      { status: 403, headers: corsHeaders },
    );
  }

  // Verify resume ownership when a resume_id is present.
  if (authedUserId && typedPayload.resume_id && SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: resumeRow, error: resumeError } = await supabase
      .from("resumes")
      .select("id, user_id")
      .eq("id", typedPayload.resume_id)
      .maybeSingle();

    if (resumeError || !resumeRow || resumeRow.user_id !== authedUserId) {
      return Response.json(
        { error: "Resume not found or not owned by the authenticated user." },
        { status: 403, headers: corsHeaders },
      );
    }
  }

  if (!ANTHROPIC_API_KEY) {
    const mockResponse = createMockAssistantResponse(typedPayload);
    await persistRun({
      userId: authedUserId,
      resumeId: (typedPayload.resume_id as string) ?? null,
      instruction: (typedPayload.instruction as string) ?? null,
      jobDescription: (typedPayload.job_description as string) ?? null,
      inputSnapshot: typedPayload,
      responseJson: mockResponse,
      status: "mock",
    });
    return Response.json(mockResponse, { headers: corsHeaders });
  }

  try {
    const aiResponse = await callAnthropic(typedPayload);
    await persistRun({
      userId: authedUserId,
      resumeId: (typedPayload.resume_id as string) ?? null,
      instruction: (typedPayload.instruction as string) ?? null,
      jobDescription: (typedPayload.job_description as string) ?? null,
      inputSnapshot: typedPayload,
      responseJson: aiResponse,
      status: "completed",
    });
    return Response.json(aiResponse, { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[builder-assistant] AI provider error:", message);
    const fallback = {
      ...createMockAssistantResponse(typedPayload),
      message: "The assistant provider is temporarily unavailable. Showing a local suggestion instead.",
      warnings: [
        {
          code: "provider_error",
          message: "The AI provider request failed. This is a local fallback response.",
          severity: "medium",
        },
      ],
    };
    await persistRun({
      userId: authedUserId,
      resumeId: (typedPayload.resume_id as string) ?? null,
      instruction: (typedPayload.instruction as string) ?? null,
      jobDescription: (typedPayload.job_description as string) ?? null,
      inputSnapshot: typedPayload,
      responseJson: fallback,
      status: "error",
      errorMessage: message,
    });
    return Response.json(fallback, { headers: corsHeaders });
  }
});
