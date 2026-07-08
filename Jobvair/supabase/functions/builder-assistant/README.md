# builder-assistant Edge Function

Mock-only Supabase Edge Function skeleton for Resume Assistant Phase 3.

This function:

- accepts a `BuilderAssistantPayload`
- validates the Phase 1 payload version and required shape
- returns a mock `AssistantResponse`
- performs no OpenAI calls
- performs no database reads or writes
- does not change Resume Builder behavior

## Contract Versions

- Request: `builder_assistant_payload_v1`
- Response: `builder_assistant_response_v1`

The response mirrors the frontend assistant contracts in
`src/assistant/assistantContracts.js` and the mock behavior in
`src/assistant/builderAssistantClient.js`.

## Local Testing

Start Supabase locally:

```bash
supabase start
```

Serve the function:

```bash
supabase functions serve builder-assistant --no-verify-jwt
```

Invoke with a minimal payload:

```bash
curl -i --location --request POST "http://127.0.0.1:54321/functions/v1/builder-assistant" \
  --header "Content-Type: application/json" \
  --data '{
    "version": "builder_assistant_payload_v1",
    "resume_id": null,
    "user_id": null,
    "resume_name": "Mock Resume",
    "header": {},
    "sections": [
      {
        "section_type": "summary",
        "content": {}
      }
    ],
    "jobs": [
      {
        "job_title": "Software Engineer",
        "company": "Example Co"
      }
    ],
    "template": {},
    "profile_context": {}
  }'
```

Expected result:

- HTTP `200`
- `version: "builder_assistant_response_v1"`
- mock `confidence`
- mock `patch.operations`
- typed `suggestions`
- `mock_response` warning

Invalid payloads return HTTP `400` with a validation object.

## Deployment Notes

When this moves beyond the mock phase:

- keep the public response contract stable
- validate authenticated user ownership before using resume data
- call AI providers only from the Edge Function, never directly from the browser
- avoid database writes until the user explicitly applies an assistant patch
- keep secrets in Supabase function secrets, not in GitHub

