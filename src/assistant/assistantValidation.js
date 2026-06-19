import {
  ASSISTANT_PATCH_KEYS,
  ASSISTANT_RESPONSE_KEYS,
  ASSISTANT_RESPONSE_VERSION,
  BUILDER_ASSISTANT_PAYLOAD_VERSION,
  BUILDER_PAYLOAD_KEYS,
} from "./assistantContracts.js";

const isPlainObject = value =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isStringOrNull = value =>
  value === null || typeof value === "string";

const hasOnlyKnownKeys = (value, allowedKeys) =>
  Object.keys(value).filter(key => !allowedKeys.includes(key));

function addError(errors, path, message) {
  errors.push({ path, message });
}

function validateOptionalString(value, path, errors) {
  if (value !== undefined && value !== null && typeof value !== "string") {
    addError(errors, path, "Expected a string when provided.");
  }
}

function validateOptionalBoolean(value, path, errors) {
  if (value !== undefined && value !== null && typeof value !== "boolean") {
    addError(errors, path, "Expected a boolean when provided.");
  }
}

function validateOptionalNumber(value, path, errors) {
  if (value !== undefined && value !== null && typeof value !== "number") {
    addError(errors, path, "Expected a number when provided.");
  }
}

function validateConfidenceNumber(value, path, errors) {
  if (value === undefined || value === null) return;
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1) {
    addError(errors, path, "Expected confidence to be a number from 0 to 1.");
  }
}

function validateConfidence(confidence, path, errors) {
  if (!isPlainObject(confidence)) {
    addError(errors, path, "Expected confidence to be an object.");
    return;
  }

  validateConfidenceNumber(confidence.overall, `${path}.overall`, errors);
  validateOptionalString(confidence.rationale, `${path}.rationale`, errors);
}

function validateMetadata(metadata, path, errors) {
  if (metadata === undefined) return;
  if (!isPlainObject(metadata)) {
    addError(errors, path, "Expected metadata to be an object when provided.");
    return;
  }

  ["reason", "source"].forEach(key =>
    validateOptionalString(metadata[key], `${path}.${key}`, errors)
  );
  validateConfidenceNumber(metadata.confidence, `${path}.confidence`, errors);
  validateOptionalBoolean(metadata.safe_to_apply, `${path}.safe_to_apply`, errors);

  if (metadata.evidence !== undefined) {
    if (!Array.isArray(metadata.evidence)) {
      addError(errors, `${path}.evidence`, "Expected evidence to be an array when provided.");
    } else {
      metadata.evidence.forEach((item, index) => {
        if (typeof item !== "string") {
          addError(errors, `${path}.evidence[${index}]`, "Expected evidence entries to be strings.");
        }
      });
    }
  }
}

function validateHeader(header, path, errors) {
  if (!isPlainObject(header)) {
    addError(errors, path, "Expected header to be an object.");
    return;
  }

  [
    "name",
    "headline",
    "email",
    "phone",
    "location",
    "linkedin",
    "website",
    "github",
    "custom_contact_line",
    "header_layout",
  ].forEach(key => validateOptionalString(header[key], `${path}.${key}`, errors));

  [
    "show_headline",
    "show_email",
    "show_phone",
    "show_location",
    "show_linkedin",
    "show_website",
    "show_github",
    "show_custom",
  ].forEach(key => validateOptionalBoolean(header[key], `${path}.${key}`, errors));
}

function validateSection(section, path, errors) {
  if (!isPlainObject(section)) {
    addError(errors, path, "Expected section to be an object.");
    return;
  }

  if (typeof section.section_type !== "string" || !section.section_type.trim()) {
    addError(errors, `${path}.section_type`, "Expected a non-empty section_type string.");
  }

  ["id", "resume_id", "user_id", "label"].forEach(key =>
    validateOptionalString(section[key], `${path}.${key}`, errors)
  );
  validateOptionalNumber(section.display_order, `${path}.display_order`, errors);
  validateOptionalBoolean(section.is_visible, `${path}.is_visible`, errors);
  validateOptionalBoolean(section.is_required, `${path}.is_required`, errors);

  if (section.content !== undefined && !isPlainObject(section.content)) {
    addError(errors, `${path}.content`, "Expected content to be an object when provided.");
  }
  if (section.layout_config_json !== undefined && !isPlainObject(section.layout_config_json)) {
    addError(errors, `${path}.layout_config_json`, "Expected layout_config_json to be an object when provided.");
  }
}

function validateJob(job, path, errors) {
  if (!isPlainObject(job)) {
    addError(errors, path, "Expected job to be an object.");
    return;
  }

  [
    "id",
    "user_id",
    "resume_id",
    "job_title",
    "company",
    "location",
    "start_date",
    "end_date",
    "description",
    "source",
  ].forEach(key => validateOptionalString(job[key], `${path}.${key}`, errors));

  ["bullet_points", "skills_used", "achievements"].forEach(key => {
    if (job[key] !== undefined && !Array.isArray(job[key])) {
      addError(errors, `${path}.${key}`, "Expected an array when provided.");
    }
  });

  validateOptionalBoolean(job.is_current, `${path}.is_current`, errors);
  validateOptionalBoolean(job.is_visible, `${path}.is_visible`, errors);
  validateOptionalNumber(job.display_order, `${path}.display_order`, errors);
}

function validateTemplate(template, path, errors) {
  if (!isPlainObject(template)) {
    addError(errors, path, "Expected template to be an object.");
    return;
  }

  [
    "id",
    "slug",
    "name",
    "font_family",
    "accent_color",
    "heading_style",
    "header_style",
    "tier",
  ].forEach(key => validateOptionalString(template[key], `${path}.${key}`, errors));
}

function validateProfileContext(profileContext, path, errors) {
  if (!isPlainObject(profileContext)) {
    addError(errors, path, "Expected profile_context to be an object.");
    return;
  }

  ["name", "email", "phone", "location", "summary"].forEach(key =>
    validateOptionalString(profileContext[key], `${path}.${key}`, errors)
  );

  ["desired_titles", "industries", "skills", "work", "education", "certifications"].forEach(key => {
    if (profileContext[key] !== undefined && !Array.isArray(profileContext[key])) {
      addError(errors, `${path}.${key}`, "Expected an array when provided.");
    }
  });
}

/**
 * Validate the canonical Resume Builder assistant payload shape.
 *
 * @param {unknown} payload
 * @returns {{ valid: boolean, errors: Array<{path: string, message: string}>, warnings: Array<{path: string, message: string}> }}
 */
export function validateBuilderAssistantPayload(payload) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(payload)) {
    addError(errors, "$", "Expected builder assistant payload to be an object.");
    return { valid: false, errors, warnings };
  }

  hasOnlyKnownKeys(payload, BUILDER_PAYLOAD_KEYS).forEach(key => {
    warnings.push({ path: `$.${key}`, message: "Unknown top-level key will be ignored by the assistant contract." });
  });

  if (payload.version !== BUILDER_ASSISTANT_PAYLOAD_VERSION) {
    addError(errors, "$.version", `Expected version to be ${BUILDER_ASSISTANT_PAYLOAD_VERSION}.`);
  }
  if (!isStringOrNull(payload.resume_id)) {
    addError(errors, "$.resume_id", "Expected resume_id to be a string or null.");
  }
  if (!isStringOrNull(payload.user_id)) {
    addError(errors, "$.user_id", "Expected user_id to be a string or null.");
  }
  if (typeof payload.resume_name !== "string") {
    addError(errors, "$.resume_name", "Expected resume_name to be a string.");
  }

  validateHeader(payload.header, "$.header", errors);

  if (!Array.isArray(payload.sections)) {
    addError(errors, "$.sections", "Expected sections to be an array.");
  } else {
    payload.sections.forEach((section, index) => validateSection(section, `$.sections[${index}]`, errors));
  }

  if (!Array.isArray(payload.jobs)) {
    addError(errors, "$.jobs", "Expected jobs to be an array.");
  } else {
    payload.jobs.forEach((job, index) => validateJob(job, `$.jobs[${index}]`, errors));
  }

  validateTemplate(payload.template, "$.template", errors);
  validateProfileContext(payload.profile_context, "$.profile_context", errors);

  return { valid: errors.length === 0, errors, warnings };
}

function validatePatchHeader(header, path, errors) {
  if (!isPlainObject(header)) {
    addError(errors, path, "Expected header patch to be an object.");
    return;
  }

  if ("value" in header || "metadata" in header) {
    validateHeader(header.value, `${path}.value`, errors);
    validateMetadata(header.metadata, `${path}.metadata`, errors);
    return;
  }

  validateHeader(header, path, errors);
}

function validateSectionPatch(section, path, errors) {
  validateSection(section, path, errors);
  if (!isPlainObject(section)) return;
  ["operation", "section_id"].forEach(key =>
    validateOptionalString(section[key], `${path}.${key}`, errors)
  );
  validateMetadata(section.metadata, `${path}.metadata`, errors);
}

function validateJobPatch(job, path, errors) {
  validateJob(job, path, errors);
  if (!isPlainObject(job)) return;
  ["operation", "job_id"].forEach(key =>
    validateOptionalString(job[key], `${path}.${key}`, errors)
  );
  validateMetadata(job.metadata, `${path}.metadata`, errors);
}

function validatePatchOperation(operation, path, errors) {
  if (!isPlainObject(operation)) {
    addError(errors, path, "Expected patch operation to be an object.");
    return;
  }

  if (typeof operation.op !== "string" || !operation.op.trim()) {
    addError(errors, `${path}.op`, "Expected a non-empty op string.");
  }
  if (typeof operation.target !== "string" || !operation.target.trim()) {
    addError(errors, `${path}.target`, "Expected a non-empty target string.");
  }
  if (!("value" in operation)) {
    addError(errors, `${path}.value`, "Expected patch operation to include a value.");
  }
  validateMetadata(operation.metadata, `${path}.metadata`, errors);
}

function validatePatch(patch, path, errors, warnings) {
  if (!isPlainObject(patch)) {
    addError(errors, path, "Expected patch to be an object.");
    return;
  }

  hasOnlyKnownKeys(patch, ASSISTANT_PATCH_KEYS).forEach(key => {
    warnings.push({ path: `${path}.${key}`, message: "Unknown patch key will be ignored by the assistant response contract." });
  });

  if (patch.header !== undefined) validatePatchHeader(patch.header, `${path}.header`, errors);

  if (patch.sections !== undefined) {
    if (!Array.isArray(patch.sections)) {
      addError(errors, `${path}.sections`, "Expected sections patch to be an array.");
    } else {
      patch.sections.forEach((section, index) => validateSectionPatch(section, `${path}.sections[${index}]`, errors));
    }
  }

  if (patch.jobs !== undefined) {
    if (!Array.isArray(patch.jobs)) {
      addError(errors, `${path}.jobs`, "Expected jobs patch to be an array.");
    } else {
      patch.jobs.forEach((job, index) => validateJobPatch(job, `${path}.jobs[${index}]`, errors));
    }
  }

  if (patch.operations !== undefined) {
    if (!Array.isArray(patch.operations)) {
      addError(errors, `${path}.operations`, "Expected operations patch to be an array.");
    } else {
      patch.operations.forEach((operation, index) =>
        validatePatchOperation(operation, `${path}.operations[${index}]`, errors)
      );
    }
  }
}

function validateSuggestions(value, path, errors) {
  if (!Array.isArray(value)) {
    addError(errors, path, "Expected an array.");
    return;
  }

  value.forEach((item, index) => {
    if (!isPlainObject(item)) {
      addError(errors, `${path}[${index}]`, "Expected a typed suggestion object.");
      return;
    }
    if (typeof item.type !== "string" || !item.type.trim()) {
      addError(errors, `${path}[${index}].type`, "Expected a non-empty type string.");
    }
    if (typeof item.message !== "string" || !item.message.trim()) {
      addError(errors, `${path}[${index}].message`, "Expected a non-empty message string.");
    }
    ["id", "target", "severity", "action"].forEach(key =>
      validateOptionalString(item[key], `${path}[${index}].${key}`, errors)
    );
    validateConfidenceNumber(item.confidence, `${path}[${index}].confidence`, errors);
    validateMetadata(item.metadata, `${path}[${index}].metadata`, errors);
  });
}

function validateWarnings(value, path, errors) {
  if (!Array.isArray(value)) {
    addError(errors, path, "Expected an array.");
    return;
  }

  value.forEach((item, index) => {
    if (!isPlainObject(item)) {
      addError(errors, `${path}[${index}]`, "Expected a warning object.");
      return;
    }
    if (typeof item.message !== "string" || !item.message.trim()) {
      addError(errors, `${path}[${index}].message`, "Expected a non-empty message string.");
    }
    ["code", "target", "severity"].forEach(key =>
      validateOptionalString(item[key], `${path}[${index}].${key}`, errors)
    );
    validateMetadata(item.metadata, `${path}[${index}].metadata`, errors);
  });
}

/**
 * Validate the canonical assistant response shape.
 *
 * @param {unknown} response
 * @returns {{ valid: boolean, errors: Array<{path: string, message: string}>, warnings: Array<{path: string, message: string}> }}
 */
export function validateAssistantResponse(response) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(response)) {
    addError(errors, "$", "Expected assistant response to be an object.");
    return { valid: false, errors, warnings };
  }

  hasOnlyKnownKeys(response, ASSISTANT_RESPONSE_KEYS).forEach(key => {
    warnings.push({ path: `$.${key}`, message: "Unknown top-level key will be ignored by the assistant response contract." });
  });

  if (response.version !== ASSISTANT_RESPONSE_VERSION) {
    addError(errors, "$.version", `Expected version to be ${ASSISTANT_RESPONSE_VERSION}.`);
  }
  if (typeof response.message !== "string") {
    addError(errors, "$.message", "Expected message to be a string.");
  }

  validateConfidence(response.confidence, "$.confidence", errors);
  validatePatch(response.patch, "$.patch", errors, warnings);
  validateSuggestions(response.suggestions, "$.suggestions", errors);
  validateWarnings(response.warnings, "$.warnings", errors);

  return { valid: errors.length === 0, errors, warnings };
}
