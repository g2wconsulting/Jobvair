// Central configuration for the AI Model Router (see modelRouter.ts).
//
// Add a new model, reassign a task to a different model, or change routing
// thresholds by editing THIS FILE ONLY. modelRouter.ts and every edge
// function that calls generateAIResponse() never need to change.

// ── Models ───────────────────────────────────────────────────────────────
//
// Escalation order, cheapest/fastest first. The router starts at whatever
// model a task is mapped to in TASK_MODEL_MAP below, and on failure
// escalates rightward through this list — nano -> mini -> gpt-5 — never
// past the end. To add a fourth tier, add it here (and to MODEL_INFO) and
// nothing else needs to change.
export const MODEL_TIER_ORDER = ["gpt-5-nano", "gpt-5-mini", "gpt-5"];

// Per-model metadata. Pricing is USD per 1,000,000 tokens, used only to
// produce the estimated cost written to logs — it never affects which
// model gets called.
//
// PRICING NOTE: gpt-5-nano's input price ($0.05 / 1M tokens) was provided
// directly. The other prices below (gpt-5-nano output, and all of
// gpt-5-mini/gpt-5) are reasonable placeholders scaled from typical
// nano/mini/full pricing ratios and are NOT verified against your actual
// OpenAI account — update them from your OpenAI billing dashboard for
// accurate cost logging.
export const MODEL_INFO = {
  "gpt-5-nano": { inputPricePerMillion: 0.05, outputPricePerMillion: 0.40 },
  "gpt-5-mini": { inputPricePerMillion: 0.25, outputPricePerMillion: 2.00 },
  "gpt-5": { inputPricePerMillion: 1.25, outputPricePerMillion: 10.00 },
};

// ── Task routing ─────────────────────────────────────────────────────────
//
// Maps a task type string to the model that should handle it by default.
// Add new task types here — no other file needs to change. Unmapped task
// types fall back to the cheapest tier (see selectModel in modelRouter.ts),
// so a typo or a forgotten mapping never silently escalates to the most
// expensive model.
export const TASK_MODEL_MAP = {
  // gpt-5-nano — structured, low-ambiguity tasks
  resume_parsing: "gpt-5-nano",
  structured_extraction: "gpt-5-nano",
  boolean_generation: "gpt-5-nano",
  formatting: "gpt-5-nano",
  categorization: "gpt-5-nano",
  tagging: "gpt-5-nano",
  job_description_parsing: "gpt-5-nano",
  json_generation: "gpt-5-nano",
  simple_qa: "gpt-5-nano",

  // gpt-5-mini — matching, scoring, reasoning
  resume_job_matching: "gpt-5-mini",
  resume_scoring: "gpt-5-mini",
  candidate_ranking: "gpt-5-mini",
  interview_question_generation: "gpt-5-mini",
  career_recommendations: "gpt-5-mini",
  reasoning: "gpt-5-mini",
  grant_eligibility_analysis: "gpt-5-mini",

  // gpt-5 — long-form writing and open-ended coaching
  resume_rewriting: "gpt-5",
  cover_letters: "gpt-5",
  career_coaching: "gpt-5",
  executive_summaries: "gpt-5",
  long_form_writing: "gpt-5",
  conversational_coaching: "gpt-5",
};

// ── Escalation / retry behavior ──────────────────────────────────────────
export const ROUTER_CONFIG = {
  // If a parsed JSON response includes a numeric confidence value (either
  // `confidence` directly, or `confidence.overall` — matching this app's
  // existing assistant/analysis response contracts) and it's below this
  // threshold, the router escalates to the next tier even though the
  // response was otherwise well-formed.
  confidenceThreshold: 0.55,

  // How many escalation attempts are allowed beyond the first. With 3
  // tiers configured above, 2 lets a request walk all the way from nano to
  // gpt-5 if it keeps failing.
  maxRetries: 2,

  // Text fragments that suggest the model is declining or unable to
  // complete the task rather than producing a usable structured response.
  // Checked case-insensitively against the raw response text before JSON
  // parsing is even attempted.
  refusalPhrases: [
    "i cannot complete",
    "i can't complete",
    "i am unable to",
    "i'm unable to",
    "as an ai",
    "i cannot help with",
    "i can't help with",
    "cannot fulfill this request",
    "i'm not able to",
    "i am not able to",
  ],
};
