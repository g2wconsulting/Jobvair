// Entity resolution across providers. Per the compliance requirement, this
// never silently merges an uncertain match — it only auto-merges when
// multiple independent sources agree closely enough (same name, same city,
// overlapping title language), and otherwise surfaces the ambiguity to the
// recruiter as "possible_match" rather than guessing.

const STOPWORDS = new Set(["a", "an", "the", "of", "and", "or", "for", "at", "in", "on", "senior", "lead", "sr", "jr"]);
const PROVIDER_PRIORITY = ["jobvair", "linkedin", "external_resume", "github", "social_web", "web_search"];

function titleWords(title) {
  return new Set((title || "").toLowerCase().split(/[\s/&-]+/).filter(w => w && !STOPWORDS.has(w)));
}

function titlesOverlap(a, b) {
  const wordsA = titleWords(a);
  const wordsB = titleWords(b);
  for (const w of wordsA) if (wordsB.has(w)) return true;
  return false;
}

function groupKey(candidate) {
  const city = (candidate.location || "").split(",")[0].trim().toLowerCase();
  return `${candidate.name.toLowerCase().trim()}|${city}`;
}

function mergeGroup(group) {
  const sorted = [...group].sort((a, b) => PROVIDER_PRIORITY.indexOf(a.source_records[0].provider) - PROVIDER_PRIORITY.indexOf(b.source_records[0].provider));
  const primary = sorted[0];
  const merged = { ...primary };
  merged.skills = Array.from(new Set(group.flatMap(c => c.skills)));
  merged.industries = Array.from(new Set(group.flatMap(c => c.industries)));
  merged.certifications = Array.from(new Set(group.flatMap(c => c.certifications)));
  merged.experience = group.flatMap(c => c.experience).filter((v, i, arr) => arr.findIndex(x => x.title === v.title && x.company === v.company) === i);
  merged.education = group.flatMap(c => c.education);
  merged.public_profiles = group.flatMap(c => c.public_profiles);
  merged.source_records = group.flatMap(c => c.source_records);
  merged.evidence = group.flatMap(c => c.evidence);
  merged.confidence = Math.max(...group.map(c => c.confidence));
  merged.years_experience = group.reduce((max, c) => (c.years_experience != null && c.years_experience > (max ?? -1) ? c.years_experience : max), null);
  merged.dedup_status = "probable_match";
  merged.merged_from = group.map(c => c.source_records[0].provider);
  return merged;
}

/**
 * @param {import("../types/candidateShape.js").Candidate[]} candidates
 * @returns {import("../types/candidateShape.js").Candidate[]}
 */
export function dedupeCandidates(candidates) {
  const groups = new Map();
  for (const c of candidates) {
    const key = groupKey(c);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }

  const result = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      result.push({ ...group[0], dedup_status: "distinct" });
      continue;
    }
    // Split the group into title-overlapping subsets (probable matches)
    // vs. divergent ones (possible matches, kept separate).
    const merged = [];
    const remaining = [...group];
    while (remaining.length > 0) {
      const seed = remaining.shift();
      const cluster = [seed];
      for (let i = remaining.length - 1; i >= 0; i--) {
        if (titlesOverlap(seed.current_title, remaining[i].current_title)) {
          cluster.push(remaining[i]);
          remaining.splice(i, 1);
        }
      }
      merged.push(cluster);
    }

    if (merged.length === 1) {
      result.push(mergeGroup(merged[0]));
    } else {
      // Divergent titles for the same name/city — don't guess. Flag each
      // as a possible match and cross-reference the others.
      const flagged = merged.map(cluster => mergeGroup(cluster));
      for (const c of flagged) {
        c.dedup_status = "possible_match";
        c.possible_duplicates = flagged.filter(o => o !== c).map(o => o.candidate_key);
      }
      result.push(...flagged);
    }
  }
  return result;
}
