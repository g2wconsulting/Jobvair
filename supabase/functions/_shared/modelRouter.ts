// AI Model Router.
//
// This is the ONLY place in the codebase that should call OpenAI's chat
// completions API. Every edge function that needs an AI response should
// call generateAIResponse(taskType, prompt, options) below — nothing
// outside this file (and aiRouterConfig.ts) should ever reference a model
// name directly. That's what makes it possible to add a model, retune
// routing, or change pricing without touching any calling code.
import { MODEL_TIER_ORDER, MODEL_INFO, TASK_MODEL_MAP, ROUTER_CONFIG } from "./aiRouterConfig.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

export function hasOpenAiKey() {
  return Boolean(OPENAI_API_KEY);
}

function stripJsonFences(raw) {
  return raw.replace(/^```json\s*|^```\s*|```$/g, "").trim();
}

function looksLikeRefusal(rawText) {
  const lower = (rawText || "").toLowerCase();
  return ROUTER_CONFIG.refusalPhrases.some(phrase => lower.includes(phrase));
}

function extractConfidence(parsed) {
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    if (typeof parsed.confidence === "number") return parsed.confidence;
    if (parsed.confidence && typeof parsed.confidence === "object" && typeof parsed.confidence.overall === "number") {
      return parsed.confidence.overall;
    }
  }
  return null;
}

function estimateCost(model, inputTokens, outputTokens) {
  const info = MODEL_INFO[model];
  if (!info) return 0;
  return (inputTokens / 1_000_000) * info.inputPricePerMillion + (outputTokens / 1_000_000) * info.outputPricePerMillion;
}

function nextTier(model) {
  const idx = MODEL_TIER_ORDER.indexOf(model);
  if (idx === -1 || idx >= MODEL_TIER_ORDER.length - 1) return null;
  return MODEL_TIER_ORDER[idx + 1];
}

/**
 * Pick the model configured for a given task type (see aiRouterConfig.ts's
 * TASK_MODEL_MAP). Falls back to the cheapest configured tier if the task
 * type isn't mapped, so a typo or a forgotten mapping never silently jumps
 * to the most expensive model.
 *
 * @param {string} taskType
 * @returns {string} model name
 */
export function selectModel(taskType) {
  return TASK_MODEL_MAP[taskType] ?? MODEL_TIER_ORDER[0];
}

async function callModel(model, systemPrompt, userContent, maxOutputTokens) {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI is not configured (missing OPENAI_API_KEY).");
  }

  const started = Date.now();
  let res;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: maxOutputTokens,
      }),
    });
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - started, error: `Network error calling OpenAI: ${err instanceof Error ? err.message : String(err)}`, usage: null, rawText: "" };
  }
  const latencyMs = Date.now() - started;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, latencyMs, error: `OpenAI API error ${res.status}: ${text}`, usage: null, rawText: "" };
  }

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content ?? "";
  const usage = data?.usage ?? null;

  return { ok: true, latencyMs, rawText, usage, error: null };
}

function logRouterEvent(taskType, finalModel, attempts, totalLatencyMs, success) {
  const totalEstimatedCostUsd = attempts.reduce((sum, a) => sum + (a.estimatedCostUsd || 0), 0);
  console.log(JSON.stringify({
    event: "ai_model_router",
    taskType,
    finalModel,
    success,
    retries: Math.max(0, attempts.length - 1),
    totalLatencyMs,
    totalEstimatedCostUsd: Number(totalEstimatedCostUsd.toFixed(6)),
    attempts,
  }));
}

/**
 * The single entry point the rest of the app should use for any AI call.
 * Selects a model based on taskType (see aiRouterConfig.ts), calls it, and
 * validates the result — if the response isn't valid JSON, looks like a
 * refusal, or carries a confidence value below the configured threshold,
 * it automatically retries with the next tier up (nano -> mini -> gpt-5),
 * up to ROUTER_CONFIG.maxRetries additional attempts.
 *
 * Every attempt is logged (model, latency, estimated tokens/cost) as a
 * single structured JSON line so it's easy to grep/aggregate from Supabase
 * function logs.
 *
 * @param {string} taskType - see TASK_MODEL_MAP in aiRouterConfig.ts
 * @param {{system: string, user: string}} prompt
 * @param {{maxOutputTokens?: number, confidenceThreshold?: number}} [options]
 * @returns {Promise<{data: unknown, modelUsed: string, attempts: Array<Object>, totalLatencyMs: number}>}
 */
export async function generateAIResponse(taskType, prompt, options = {}) {
  const maxOutputTokens = options.maxOutputTokens ?? 2500;
  const confidenceThreshold = options.confidenceThreshold ?? ROUTER_CONFIG.confidenceThreshold;

  let model = selectModel(taskType);
  const attempts = [];
  const overallStart = Date.now();
  let lastError = null;

  for (let attemptNum = 0; attemptNum <= ROUTER_CONFIG.maxRetries; attemptNum += 1) {
    const result = await callModel(model, prompt.system, prompt.user, maxOutputTokens);

    const inputTokens = result.usage?.prompt_tokens ?? 0;
    const outputTokens = result.usage?.completion_tokens ?? 0;
    const estimatedCostUsd = estimateCost(model, inputTokens, outputTokens);

    if (!result.ok) {
      attempts.push({ model, success: false, latencyMs: result.latencyMs, error: result.error, estimatedInputTokens: inputTokens, estimatedOutputTokens: outputTokens, estimatedCostUsd });
      lastError = result.error;
      const next = nextTier(model);
      if (!next) break;
      model = next;
      continue;
    }

    if (looksLikeRefusal(result.rawText)) {
      attempts.push({ model, success: false, latencyMs: result.latencyMs, error: "Response looked like a refusal.", estimatedInputTokens: inputTokens, estimatedOutputTokens: outputTokens, estimatedCostUsd });
      lastError = "Model declined to complete the task.";
      const next = nextTier(model);
      if (!next) break;
      model = next;
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(stripJsonFences(result.rawText));
    } catch {
      attempts.push({ model, success: false, latencyMs: result.latencyMs, error: "Invalid JSON in response.", estimatedInputTokens: inputTokens, estimatedOutputTokens: outputTokens, estimatedCostUsd });
      lastError = "Model did not return valid JSON.";
      const next = nextTier(model);
      if (!next) break;
      model = next;
      continue;
    }

    const confidence = extractConfidence(parsed);
    if (confidence !== null && confidence < confidenceThreshold) {
      attempts.push({ model, success: false, latencyMs: result.latencyMs, error: `Confidence ${confidence} below threshold ${confidenceThreshold}.`, estimatedInputTokens: inputTokens, estimatedOutputTokens: outputTokens, estimatedCostUsd });
      lastError = "Confidence below threshold.";
      const next = nextTier(model);
      if (!next) break;
      model = next;
      continue;
    }

    // Success.
    attempts.push({ model, success: true, latencyMs: result.latencyMs, estimatedInputTokens: inputTokens, estimatedOutputTokens: outputTokens, estimatedCostUsd });
    const totalLatencyMs = Date.now() - overallStart;
    logRouterEvent(taskType, model, attempts, totalLatencyMs, true);
    return { data: parsed, modelUsed: model, attempts, totalLatencyMs };
  }

  const totalLatencyMs = Date.now() - overallStart;
  logRouterEvent(taskType, model, attempts, totalLatencyMs, false);
  throw new Error(lastError || "AI request failed after exhausting all model tiers.");
}
