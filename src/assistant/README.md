# Resume Assistant Phase 1

This folder defines the first stable frontend contract for a future Resume
Assistant. It is intentionally documentation and validation only.

Phase 1 does not:

- add UI
- call OpenAI or any other AI provider
- call Supabase Edge Functions
- change database schema
- change Resume Builder behavior

## Files

- `assistantContracts.js`
  - JSDoc typedefs for the canonical builder payload and assistant response.
  - Version constants for the payload and response contracts.
  - Empty factory helpers for tests or future UI initialization.
- `assistantValidation.js`
  - Runtime validation helpers for the request and response shape.
  - Returns structured `valid`, `errors`, and `warnings` results.

## Builder Payload Contract

The Resume Builder should eventually map its local state into this shape before
calling any assistant endpoint:

```js
{
  version: "builder_assistant_payload_v1",
  resume_id: "uuid-or-null",
  user_id: "uuid-or-null",
  resume_name: "My Resume",
  header: {},
  sections: [],
  jobs: [],
  template: {},
  profile_context: {}
}
```

Field intent:

- `version`: contract version for future migrations.
- `resume_id`: current persisted resume id, or `null` for an unsaved resume.
- `user_id`: authenticated user id, or `null` before auth-dependent mapping.
- `resume_name`: editable resume display name.
- `header`: resume-specific name, headline, contact fields, visibility flags,
  and header layout.
- `sections`: resume sections in display order.
- `jobs`: resume-specific work experience entries.
- `template`: selected template metadata needed for context.
- `profile_context`: candidate profile context used only to inform suggestions.

## Assistant Response Contract

Future assistant responses should use this shape:

```js
{
  version: "builder_assistant_response_v1",
  message: "Short human-readable explanation",
  confidence: {
    overall: 0.82,
    rationale: "Strong role alignment, but limited measurable impact in bullets."
  },
  patch: {
    header: {
      value: {},
      metadata: {
        reason: "Headline aligned to the target role.",
        source: "profile_and_job_description",
        confidence: 0.76,
        safe_to_apply: false
      }
    },
    sections: [],
    jobs: [],
    operations: [
      {
        op: "update",
        target: "sections.summary.content.text",
        value: "Updated summary text",
        metadata: {
          reason: "Summary emphasizes Java and Spring Boot experience.",
          evidence: ["8 years Java", "6 years Spring Boot"],
          confidence: 0.84,
          safe_to_apply: false
        }
      }
    ]
  },
  suggestions: [
    {
      id: "sug_1",
      type: "missing_metric",
      target: "jobs[0].description",
      message: "Add measurable impact to this bullet.",
      severity: "medium",
      confidence: 0.7,
      action: "rewrite_bullet"
    }
  ],
  warnings: [
    {
      code: "low_evidence",
      message: "Could not verify years of experience for AWS.",
      target: "skills.aws"
    }
  ]
}
```

Field intent:

- `version`: contract version for future migrations.
- `message`: a short explanation of what the assistant proposes.
- `confidence`: explainable response-level confidence, not an absolute truth
  score.
- `patch`: structured changes that the UI can preview before applying.
- `patch.operations`: canonical future-safe operation list. Existing
  `header`, `sections`, and `jobs` patch lanes remain available for easier
  builder integration.
- `patch.*.metadata`: why a change was suggested, what evidence supports it,
  and whether it is safe to offer as low-risk.
- `suggestions`: typed non-mutating recommendations or alternatives.
- `warnings`: typed caveats, validation concerns, or missing context.

Suggested suggestion types:

- `rewrite_summary`
- `improve_bullet`
- `missing_metric`
- `missing_skill`
- `ats_keyword`
- `tone_issue`
- `formatting_issue`
- `evidence_gap`
- `section_reorder`
- `add_section`

The assistant response must not be written directly to Supabase. Future UI
should preview the patch, let the user explicitly apply or discard it, and then
persist through the existing Resume Builder save flow.

## Validation Usage

```js
import {
  validateAssistantResponse,
  validateBuilderAssistantPayload,
} from "./assistantValidation.js";

const payloadResult = validateBuilderAssistantPayload(payload);
const responseResult = validateAssistantResponse(response);

if (!payloadResult.valid) {
  console.warn(payloadResult.errors);
}
```

Validation is deliberately lightweight and dependency-free. It confirms that the
top-level contracts and core nested collections have the expected shape.

Validation currently enforces:

- payload and response version constants
- required top-level response fields
- bounded confidence values from 0 to 1
- typed suggestion objects with `type` and `message`
- warning objects with `message`
- patch operation objects with `op`, `target`, `value`, and optional metadata
- metadata evidence arrays and confidence values

It does not validate business rules, ownership, authorization, rate limits, or
AI safety.

## Future Phases

Later phases can add:

- a builder-state mapper
- an assistant panel UI
- an authenticated `builder-assistant` Edge Function
- response preview and patch application controls
- assistant run persistence
- tests for payload mapping and patch application
