import { applyPatchPreview } from "./patchHelpers.js";

const isPlainObject = value =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const toStableJson = value => JSON.stringify(value ?? null);

const getItemKey = (item, index, fallbackPrefix) =>
  item?.id || item?.section_id || item?.job_id || item?.section_type || `${fallbackPrefix}_${index}`;

function diffObject(before = {}, after = {}, basePath = "$") {
  const changes = [];
  const keys = new Set([
    ...Object.keys(isPlainObject(before) ? before : {}),
    ...Object.keys(isPlainObject(after) ? after : {}),
  ]);

  keys.forEach(key => {
    const beforeValue = before?.[key];
    const afterValue = after?.[key];
    const path = `${basePath}.${key}`;

    if (isPlainObject(beforeValue) && isPlainObject(afterValue)) {
      changes.push(...diffObject(beforeValue, afterValue, path));
      return;
    }

    if (toStableJson(beforeValue) !== toStableJson(afterValue)) {
      changes.push({
        path,
        before: beforeValue,
        after: afterValue,
      });
    }
  });

  return changes;
}

function diffCollection(before = [], after = [], basePath, fallbackPrefix) {
  const changes = [];
  const beforeMap = new Map();
  const afterMap = new Map();

  before.forEach((item, index) => {
    beforeMap.set(getItemKey(item, index, fallbackPrefix), item);
  });
  after.forEach((item, index) => {
    afterMap.set(getItemKey(item, index, fallbackPrefix), item);
  });

  beforeMap.forEach((beforeItem, key) => {
    if (!afterMap.has(key)) {
      changes.push({
        path: `${basePath}.${key}`,
        before: beforeItem,
        after: undefined,
        change_type: "removed",
      });
    }
  });

  afterMap.forEach((afterItem, key) => {
    if (!beforeMap.has(key)) {
      changes.push({
        path: `${basePath}.${key}`,
        before: undefined,
        after: afterItem,
        change_type: "added",
      });
      return;
    }

    diffObject(beforeMap.get(key), afterItem, `${basePath}.${key}`).forEach(change => {
      changes.push({
        ...change,
        change_type: "updated",
      });
    });
  });

  return changes;
}

/**
 * Create a diff between two builder assistant payloads.
 *
 * @param {import("./assistantContracts.js").BuilderAssistantPayload} before
 * @param {import("./assistantContracts.js").BuilderAssistantPayload} after
 * @returns {Array<{path: string, before: *, after: *, change_type?: string}>}
 */
export function createAssistantDiff(before, after) {
  return [
    ...diffObject(before?.header || {}, after?.header || {}, "$.header"),
    ...diffCollection(before?.sections || [], after?.sections || [], "$.sections", "section"),
    ...diffCollection(before?.jobs || [], after?.jobs || [], "$.jobs", "job"),
    ...diffObject(before?.template || {}, after?.template || {}, "$.template"),
  ];
}

/**
 * Apply a response patch to a preview payload and return the resulting diff.
 *
 * @param {import("./assistantContracts.js").BuilderAssistantPayload} payload
 * @param {import("./assistantContracts.js").AssistantResponse} response
 */
export function createPatchPreviewDiff(payload, response) {
  const preview = applyPatchPreview(payload, response);

  return {
    ...preview,
    changes: createAssistantDiff(payload, preview.payload),
  };
}

