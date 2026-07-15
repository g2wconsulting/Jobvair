// Shared OpenAI Chat Completions helper, used by parse-resume, analyze-resume,
// and builder-assistant.
//
// Model note: OPENAI_MODEL below is a single, easily-editable constant. GPT-5
// nano is a very recent OpenAI release relative to this code being written —
// if the API rejects the model string with a "model not found" style error,
// update this constant to whatever exact string your OpenAI dashboard shows
// and redeploy; nothing else needs to change.
export const OPENAI_MODEL = "gpt-5-nano";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

export function hasOpenAiKey() {
  return Boolean(OPENAI_API_KEY);
}

function stripJsonFences(raw) {
  return raw.replace(/^```json\s*|^```\s*|```$/g, "").trim();
}

/**
 * Call OpenAI's Chat Completions API with a system prompt + user content and
 * parse the response as JSON. Uses response_format: json_object so the model
 * is constrained to return valid JSON (falls back to fence-stripping if a
 * provider/model doesn't honor that option).
 *
 * @param {string} systemPrompt
 * @param {string} userContent
 * @param {number} maxOutputTokens
 * @returns {Promise<unknown>} parsed JSON response
 */
export async function callOpenAiJson(systemPrompt, userContent, maxOutputTokens = 2500) {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI is not configured (missing OPENAI_API_KEY).");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: maxOutputTokens,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content ?? "";
  if (!rawText) {
    throw new Error("OpenAI returned an empty response.");
  }

  return JSON.parse(stripJsonFences(rawText));
}
