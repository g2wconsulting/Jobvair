// Shared "does this raw hit plausibly match the criteria" filter used by
// every mock provider. A real provider would do this server-side against
// its own index; here it's a simple keyword-overlap heuristic against the
// mock dataset so different prompts surface different (realistic-looking)
// subsets rather than the same fixed list every time.

function textOf(hit) {
  return [
    hit.name, hit.headline, hit.current_title, hit.current_company, hit.location,
    ...(hit.skills || []), ...(hit.industries || []), ...(hit.certifications || []),
  ].join(" ").toLowerCase();
}

export function isRelevant(hit, criteria) {
  const haystack = textOf(hit);
  const terms = [
    ...(criteria.required_skills || []),
    ...(criteria.target_titles || []),
    ...(criteria.industries || []),
    ...(criteria.certifications || []),
  ].map(t => t.toLowerCase());

  if (terms.length === 0) return true; // no criteria yet — don't filter anything out
  return terms.some(term => haystack.includes(term.split(" ")[0]) || haystack.includes(term));
}
