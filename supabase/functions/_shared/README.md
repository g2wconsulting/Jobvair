# AI Model Router

Shared code used by every Supabase Edge Function that needs an AI response
(`parse-resume`, `analyze-resume`, `builder-assistant`). This is the **only**
place in the codebase that should call OpenAI's API directly.

## Files

- **`aiRouterConfig.ts`** — the single configuration file. Add a model, change
  which model handles a task, or retune retry/confidence thresholds here.
  Nothing else needs to change.
- **`modelRouter.ts`** — the router itself: `selectModel(taskType)` and
  `generateAIResponse(taskType, prompt, options)`. Calling code never
  references a model name directly.

## How it works

1. Every AI call goes through `generateAIResponse(taskType, { system, user }, options)`.
2. `taskType` (e.g. `"resume_parsing"`, `"resume_rewriting"`) is looked up in
   `TASK_MODEL_MAP` to pick a starting model. Unmapped task types default to
   the cheapest tier rather than silently escalating.
3. If the response is invalid JSON, looks like a refusal (matched against a
   configurable phrase list), or carries a `confidence`/`confidence.overall`
   value below `ROUTER_CONFIG.confidenceThreshold`, the router automatically
   retries with the next tier up: `gpt-5-nano` → `gpt-5-mini` → `gpt-5`.
4. Every attempt (model, latency, estimated input/output tokens, estimated
   cost) is logged as one structured JSON line (`event: "ai_model_router"`),
   plus a final summary — easy to grep from Supabase function logs.

## Adding a new task type

Add one line to `TASK_MODEL_MAP` in `aiRouterConfig.ts`:

```ts
my_new_task: "gpt-5-mini",
```

Then call it from any function:

```ts
import { generateAIResponse } from "../_shared/modelRouter.ts";

const { data, modelUsed } = await generateAIResponse(
  "my_new_task",
  { system: MY_SYSTEM_PROMPT, user: userContent },
  { maxOutputTokens: 2000 },
);
```

## Adding a new model tier

Add it to both `MODEL_TIER_ORDER` (in the order the router should escalate
through) and `MODEL_INFO` (for cost estimation) in `aiRouterConfig.ts`. No
changes needed in `modelRouter.ts` or any calling function.

## Known limitations / things to verify

- **Model name verification**: `gpt-5-nano`, `gpt-5-mini`, and `gpt-5` were
  specified based on very recent OpenAI naming — if any of these aren't the
  exact string your OpenAI account expects, the first real request to that
  tier will fail with a clear "model not found"-style error from OpenAI
  itself, and escalate/fail accordingly. Fix is a one-line edit to
  `MODEL_TIER_ORDER`/`TASK_MODEL_MAP` in `aiRouterConfig.ts`.
- **Pricing accuracy**: only `gpt-5-nano`'s input price was provided
  directly; the rest of `MODEL_INFO` are reasonable placeholders. This only
  affects the *estimated cost* written to logs, never which model is called
  — but update it from your OpenAI billing dashboard for accurate cost logs.
- **Refusal detection** is a simple phrase-match heuristic, not a guarantee
  — a model could decline a task in wording that isn't in the list.
