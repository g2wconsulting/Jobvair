/**
 * Patch helpers for Resume Assistant preview flows.
 *
 * These helpers are intentionally pure. They clone the builder payload, apply a
 * proposed assistant patch to the clone, and return preview metadata. They do
 * not save to Supabase or mutate Resume Builder state.
 */

const isPlainObject = value =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const cloneValue = value => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const parsePath = path =>
  String(path)
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);

const getAtPath = (target, path) =>
  parsePath(path).reduce((current, key) => {
    if (current === undefined || current === null) return undefined;
    return current[key];
  }, target);

const setAtPath = (target, path, value) => {
  const keys = parsePath(path);
  if (!keys.length) return false;

  let current = target;
  keys.slice(0, -1).forEach((key, index) => {
    const nextKey = keys[index + 1];
    if (!isPlainObject(current[key]) && !Array.isArray(current[key])) {
      current[key] = Number.isInteger(Number(nextKey)) ? [] : {};
    }
    current = current[key];
  });

  current[keys[keys.length - 1]] = value;
  return true;
};

const removeAtPath = (target, path) => {
  const keys = parsePath(path);
  if (!keys.length) return false;

  const parent = keys.slice(0, -1).reduce((current, key) => {
    if (current === undefined || current === null) return undefined;
    return current[key];
  }, target);

  if (parent === undefined || parent === null) return false;

  const finalKey = keys[keys.length - 1];
  if (Array.isArray(parent)) {
    const index = Number(finalKey);
    if (!Number.isInteger(index) || index < 0 || index >= parent.length) return false;
    parent.splice(index, 1);
    return true;
  }

  if (!(finalKey in parent)) return false;
  delete parent[finalKey];
  return true;
};

const mergeAtPath = (target, path, value) => {
  const existing = getAtPath(target, path);
  if (!isPlainObject(existing) || !isPlainObject(value)) {
    return setAtPath(target, path, value);
  }
  return setAtPath(target, path, { ...existing, ...value });
};

const appendAtPath = (target, path, value) => {
  const existing = getAtPath(target, path);
  if (!Array.isArray(existing)) return false;
  existing.push(value);
  return true;
};

const findCollectionIndex = (collection, patchItem, fallbackKey) => {
  if (!Array.isArray(collection) || !isPlainObject(patchItem)) return -1;
  const id = patchItem.id || patchItem[fallbackKey];
  if (!id) return -1;
  return collection.findIndex(item => item?.id === id || item?.[fallbackKey] === id);
};

const PATCH_METADATA_KEYS = ["metadata", "operation", "section_id", "job_id"];

const stripPatchMetadata = item => {
  if (!isPlainObject(item)) return item;
  const value = { ...item };
  PATCH_METADATA_KEYS.forEach(key => delete value[key]);
  return value;
};

function applyHeaderPatch(draft, headerPatch) {
  if (!isPlainObject(headerPatch)) return false;
  const value = isPlainObject(headerPatch.value) ? headerPatch.value : headerPatch;
  draft.header = {
    ...(draft.header || {}),
    ...value,
  };
  return true;
}

function applyCollectionPatch(draft, collectionKey, itemPatch, fallbackKey) {
  if (!Array.isArray(draft[collectionKey])) draft[collectionKey] = [];

  const operation = itemPatch.operation || "update";
  const value = stripPatchMetadata(itemPatch);
  const index = findCollectionIndex(draft[collectionKey], itemPatch, fallbackKey);

  if (operation === "remove") {
    if (index === -1) return false;
    draft[collectionKey].splice(index, 1);
    return true;
  }

  if (operation === "insert" || index === -1) {
    draft[collectionKey].push(value);
    return true;
  }

  draft[collectionKey][index] = {
    ...draft[collectionKey][index],
    ...value,
  };
  return true;
}

function applyOperation(draft, operation) {
  if (!isPlainObject(operation)) return false;

  switch (operation.op) {
    case "append":
    case "insert":
      return appendAtPath(draft, operation.target, operation.value);
    case "merge":
      return mergeAtPath(draft, operation.target, operation.value);
    case "remove":
      return removeAtPath(draft, operation.target);
    case "set":
    case "update":
    default:
      return setAtPath(draft, operation.target, operation.value);
  }
}

/**
 * Apply an assistant patch to a cloned builder payload for preview.
 *
 * @param {import("./assistantContracts.js").BuilderAssistantPayload} payload
 * @param {import("./assistantContracts.js").AssistantPatch} patch
 * @returns {{ payload: import("./assistantContracts.js").BuilderAssistantPayload, appliedOperations: Array<Object>, skippedOperations: Array<Object> }}
 */
export function applyAssistantPatch(payload, patch = {}) {
  const draft = cloneValue(payload);
  const appliedOperations = [];
  const skippedOperations = [];

  if (patch.header !== undefined) {
    const applied = applyHeaderPatch(draft, patch.header);
    (applied ? appliedOperations : skippedOperations).push({
      type: "header",
      patch: patch.header,
    });
  }

  if (Array.isArray(patch.sections)) {
    patch.sections.forEach(sectionPatch => {
      const applied = applyCollectionPatch(draft, "sections", sectionPatch, "section_id");
      (applied ? appliedOperations : skippedOperations).push({
        type: "section",
        patch: sectionPatch,
      });
    });
  }

  if (Array.isArray(patch.jobs)) {
    patch.jobs.forEach(jobPatch => {
      const applied = applyCollectionPatch(draft, "jobs", jobPatch, "job_id");
      (applied ? appliedOperations : skippedOperations).push({
        type: "job",
        patch: jobPatch,
      });
    });
  }

  if (Array.isArray(patch.operations)) {
    patch.operations.forEach(operation => {
      const applied = applyOperation(draft, operation);
      (applied ? appliedOperations : skippedOperations).push({
        type: "operation",
        patch: operation,
      });
    });
  }

  return {
    payload: draft,
    appliedOperations,
    skippedOperations,
  };
}

/**
 * Apply an assistant response patch to a cloned builder payload for preview.
 *
 * @param {import("./assistantContracts.js").BuilderAssistantPayload} payload
 * @param {import("./assistantContracts.js").AssistantResponse} response
 */
export function applyPatchPreview(payload, response) {
  return applyAssistantPatch(payload, response?.patch || {});
}

