/**
 * Canonical Resume Builder Assistant contracts.
 *
 * This module intentionally contains shape definitions and defaults only.
 * It does not call AI providers, Supabase, Edge Functions, or mutate builder
 * state. UI code can import these contracts later when the assistant feature is
 * wired into the Resume Builder.
 */

/**
 * @typedef {"builder_assistant_payload_v1"|"builder_assistant_response_v1"} AssistantContractVersion
 */

/**
 * @typedef {Object} AssistantConfidence
 * @property {number|null} overall Confidence from 0 to 1, or null when unknown.
 * @property {string=} rationale Short explanation of what drives the score.
 */

/**
 * @typedef {Object} AssistantPatchMetadata
 * @property {string=} reason Why this change is suggested.
 * @property {string=} source Source used for the suggestion, such as profile, resume, or job description.
 * @property {string[]=} evidence Evidence snippets that support the suggestion.
 * @property {number=} confidence Confidence from 0 to 1 for this specific change.
 * @property {boolean=} safe_to_apply Whether the UI may offer this as low-risk to apply.
 */

/**
 * @typedef {Object} AssistantHeaderPayload
 * @property {string=} name
 * @property {string=} headline
 * @property {string=} email
 * @property {string=} phone
 * @property {string=} location
 * @property {string=} linkedin
 * @property {string=} website
 * @property {string=} github
 * @property {string=} custom_contact_line
 * @property {boolean=} show_headline
 * @property {boolean=} show_email
 * @property {boolean=} show_phone
 * @property {boolean=} show_location
 * @property {boolean=} show_linkedin
 * @property {boolean=} show_website
 * @property {boolean=} show_github
 * @property {boolean=} show_custom
 * @property {string=} header_layout
 */

/**
 * @typedef {Object} AssistantSectionPayload
 * @property {string=} id
 * @property {string=} resume_id
 * @property {string=} user_id
 * @property {string} section_type
 * @property {string=} label
 * @property {Object=} content
 * @property {number=} display_order
 * @property {boolean=} is_visible
 * @property {boolean=} is_required
 * @property {Object=} layout_config_json
 */

/**
 * @typedef {Object} AssistantJobPayload
 * @property {string=} id
 * @property {string=} user_id
 * @property {string=} resume_id
 * @property {string=} job_title
 * @property {string=} company
 * @property {string=} location
 * @property {string=} start_date
 * @property {string=} end_date
 * @property {boolean=} is_current
 * @property {string=} description
 * @property {string[]=} bullet_points
 * @property {string[]=} skills_used
 * @property {string[]=} achievements
 * @property {number=} display_order
 * @property {boolean=} is_visible
 * @property {string=} source
 */

/**
 * @typedef {Object} AssistantTemplatePayload
 * @property {string=} id
 * @property {string=} slug
 * @property {string=} name
 * @property {string=} font_family
 * @property {string=} accent_color
 * @property {string=} heading_style
 * @property {string=} header_style
 * @property {string=} tier
 */

/**
 * @typedef {Object} AssistantProfileContext
 * @property {string=} name
 * @property {string=} email
 * @property {string=} phone
 * @property {string=} location
 * @property {string=} summary
 * @property {string[]=} desired_titles
 * @property {string[]=} industries
 * @property {Array<Object>=} skills
 * @property {Array<Object>=} work
 * @property {Array<Object>=} education
 * @property {Array<Object>=} certifications
 */

/**
 * Canonical payload sent from Resume Builder state to a future assistant.
 *
 * @typedef {Object} BuilderAssistantPayload
 * @property {AssistantContractVersion} version
 * @property {string|null} resume_id
 * @property {string|null} user_id
 * @property {string} resume_name
 * @property {AssistantHeaderPayload} header
 * @property {AssistantSectionPayload[]} sections
 * @property {AssistantJobPayload[]} jobs
 * @property {AssistantTemplatePayload} template
 * @property {AssistantProfileContext} profile_context
 * @property {string=} instruction Free-text instruction from the user, e.g. "tailor to this job".
 * @property {string=} job_description Optional pasted job description used for tailoring.
 * @property {string=} action_preset Optional machine-readable preset id, such as rewrite_summary.
 */

/**
 * @typedef {Object} AssistantSuggestion
 * @property {string=} id
 * @property {string} type Machine-readable suggestion type, such as missing_metric or rewrite_summary.
 * @property {string} message
 * @property {string=} target
 * @property {string=} severity
 * @property {number=} confidence Confidence from 0 to 1 for this suggestion.
 * @property {string=} action Machine-readable action hint, such as rewrite_bullet.
 * @property {AssistantPatchMetadata=} metadata
 */

/**
 * @typedef {Object} AssistantWarning
 * @property {string=} code
 * @property {string} message
 * @property {string=} target
 * @property {string=} severity
 * @property {AssistantPatchMetadata=} metadata
 */

/**
 * @typedef {Object} AssistantPatchHeaderChange
 * @property {Partial<AssistantHeaderPayload>} value
 * @property {AssistantPatchMetadata=} metadata
 */

/**
 * @typedef {AssistantSectionPayload & {operation?: string, section_id?: string, metadata?: AssistantPatchMetadata}} AssistantSectionPatch
 */

/**
 * @typedef {AssistantJobPayload & {operation?: string, job_id?: string, metadata?: AssistantPatchMetadata}} AssistantJobPatch
 */

/**
 * @typedef {Object} AssistantPatchOperation
 * @property {string} op Machine-readable operation, such as update, insert, remove, or reorder.
 * @property {string} target Dot/bracket path to the target field or collection.
 * @property {*} value Proposed value for the operation.
 * @property {AssistantPatchMetadata=} metadata
 */

/**
 * Patch returned by a future assistant. The UI must preview and explicitly
 * apply this patch before saving through the existing Resume Builder flow.
 *
 * @typedef {Object} AssistantPatch
 * @property {Partial<AssistantHeaderPayload>|AssistantPatchHeaderChange=} header
 * @property {AssistantSectionPatch[]=} sections
 * @property {AssistantJobPatch[]=} jobs
 * @property {AssistantPatchOperation[]=} operations
 */

/**
 * Canonical response returned by a future assistant endpoint.
 *
 * @typedef {Object} AssistantResponse
 * @property {AssistantContractVersion} version
 * @property {string} message
 * @property {AssistantConfidence} confidence
 * @property {AssistantPatch} patch
 * @property {AssistantSuggestion[]} suggestions
 * @property {AssistantWarning[]} warnings
 */

export const BUILDER_ASSISTANT_PAYLOAD_VERSION = "builder_assistant_payload_v1";
export const ASSISTANT_RESPONSE_VERSION = "builder_assistant_response_v1";

export const BUILDER_PAYLOAD_KEYS = Object.freeze([
  "version",
  "resume_id",
  "user_id",
  "resume_name",
  "header",
  "sections",
  "jobs",
  "template",
  "profile_context",
]);

export const ASSISTANT_RESPONSE_KEYS = Object.freeze([
  "version",
  "message",
  "confidence",
  "patch",
  "suggestions",
  "warnings",
]);

export const ASSISTANT_PATCH_KEYS = Object.freeze([
  "header",
  "sections",
  "jobs",
  "operations",
]);

/**
 * @returns {BuilderAssistantPayload}
 */
export function createEmptyBuilderAssistantPayload() {
  return {
    version: BUILDER_ASSISTANT_PAYLOAD_VERSION,
    resume_id: null,
    user_id: null,
    resume_name: "",
    header: {},
    sections: [],
    jobs: [],
    template: {},
    profile_context: {},
    instruction: "",
    job_description: "",
    action_preset: null,
  };
}

/**
 * @returns {AssistantResponse}
 */
export function createEmptyAssistantResponse() {
  return {
    version: ASSISTANT_RESPONSE_VERSION,
    message: "",
    confidence: {
      overall: null,
      rationale: "",
    },
    patch: {
      header: {},
      sections: [],
      jobs: [],
      operations: [],
    },
    suggestions: [],
    warnings: [],
  };
}
