// Shared server-side AI scoring service for Jobvair Assess.
//
// Used only for question types that genuinely need human-like judgment
// (long-form written responses scored against a fixed rubric). Every
// objective question type (multiple choice, true/false, numeric, typing,
// data entry, etc.) is scored deterministically elsewhere and never
// touches this file — that's what keeps AI cost near zero at volume.
//
// Returns structured JSON only, never an unstructured opinion, and never
// exposes the Anthropic API key or Supabase service-role key to a client.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = "claude-sonnet-4-6";

// $3.00 / $15.00 per 1M input/output tokens (claude-sonnet-4-6).
const INPUT_COST_PER_TOKEN = 3.0 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 15.0 / 1_000_000;

function extractJson(rawText: string) {
  const cleaned = rawText.replace(/^```json\s*|```$/g, "").trim();
  return JSON.parse(cleaned);
}

export interface RubricScoreResult {
  overall_score: number;
  criteria: Record<string, number>;
  summary: string;
  model: string;
  usage: { input_tokens: number; output_tokens: number; estimated_cost: number };
}

// Scores a candidate's written response against a fixed rubric (criteria +
// a 0-100 scale). Always returns the same JSON shape regardless of rubric
// contents, so callers never need to branch on rubric structure.
export async function scoreWrittenResponse(
  scenarioPrompt: string,
  candidateResponse: string,
  rubric: { criteria: string[]; scale?: number },
): Promise<RubricScoreResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Written-response scoring is not configured (missing AI provider key).");
  }
  const scale = rubric.scale || 100;
  const criteria = rubric.criteria?.length ? rubric.criteria : ["quality"];

  const systemPrompt = `You are an impartial job-skills assessment grader. Score the candidate's written
response to a workplace scenario STRICTLY against the fixed rubric criteria provided —
do not introduce criteria that aren't listed, and do not let unrelated impressions of the
candidate affect the score. Be consistent and evidence-based: point to what is actually
in the response.

Respond with ONLY a single JSON object matching this exact shape, and nothing else
(no markdown fences, no preamble, no commentary):

{
  "overall_score": number (0-${scale}, the overall quality of the response against the rubric),
  "criteria": { ${criteria.map(c => `"${c}": number (0-${scale})`).join(", ")} },
  "summary": "2-3 sentence explanation of the score, citing specifics from the response"
}`;

  const userContent = JSON.stringify({
    scenario: scenarioPrompt,
    candidate_response: candidateResponse,
    rubric_criteria: criteria,
    scale,
  });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
      // Pins inference to US infrastructure — required for the RFP's US
      // data-residency commitment. Without this, Anthropic may process the
      // request on non-US infrastructure (data at rest stays US either way).
      inference_geo: "us",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const textBlock = Array.isArray(data.content) ? data.content.find((b: { type: string }) => b.type === "text") : null;
  const result = extractJson(textBlock?.text ?? "");

  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  const estimatedCost = inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN;

  return {
    overall_score: typeof result.overall_score === "number" ? result.overall_score : 0,
    criteria: result.criteria || {},
    summary: result.summary || "",
    model: MODEL,
    usage: { input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost: estimatedCost },
  };
}
