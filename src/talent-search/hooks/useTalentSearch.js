// Central state/orchestration hook for the Talent Search page. Phase 1:
// shortlist/reject/notes/projects live only in this hook's React state —
// nothing persists to Supabase yet (that's a later phase, once the schema
// work is scoped and approved).

import { useState, useCallback } from "react";
import { planFromPrompt, runSearch } from "../services/searchOrchestrator.js";
import { createEmptyCriteria } from "../types/candidateShape.js";

export function useTalentSearch() {
  const [prompt, setPrompt] = useState("");
  const [criteria, setCriteria] = useState(createEmptyCriteria());
  const [results, setResults] = useState([]);
  const [providerStatus, setProviderStatus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCandidateKey, setSelectedCandidateKey] = useState(null);
  const [compareKeys, setCompareKeys] = useState(new Set());
  const [candidateStatus, setCandidateStatus] = useState({}); // { [candidate_key]: "shortlisted" | "rejected" | "saved" }
  const [notes, setNotes] = useState({}); // { [candidate_key]: string[] }
  const [projects, setProjects] = useState([]); // in-memory only for Phase 1

  const runWithCriteria = useCallback(async (nextCriteria) => {
    setLoading(true);
    try {
      const { results: r, providerStatus: ps } = await runSearch(nextCriteria);
      setResults(r);
      setProviderStatus(ps);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (rawPrompt) => {
    setPrompt(rawPrompt);
    const planned = planFromPrompt(rawPrompt);
    setCriteria(planned);
    await runWithCriteria(planned);
  }, [runWithCriteria]);

  const updateCriteria = useCallback((patch) => {
    setCriteria(c => ({ ...c, ...patch }));
  }, []);

  const rerunSearch = useCallback(() => runWithCriteria(criteria), [criteria, runWithCriteria]);

  const applyExpansion = useCallback((patch) => {
    const next = { ...criteria, ...patch };
    setCriteria(next);
    runWithCriteria(next);
  }, [criteria, runWithCriteria]);

  const findSimilar = useCallback((candidate) => {
    const next = {
      ...createEmptyCriteria(),
      current_title: candidate.current_title,
      target_titles: [candidate.current_title],
      required_skills: candidate.skills.slice(0, 4),
      locations: candidate.location ? [candidate.location.split(",")[0].trim()] : [],
      industries: candidate.industries || [],
    };
    setPrompt(`Find candidates similar to ${candidate.name}`);
    setCriteria(next);
    // Recruiter reviews the criteria before running — don't auto-search.
  }, []);

  const setCandidateAction = useCallback((candidateKey, status) => {
    setCandidateStatus(s => ({ ...s, [candidateKey]: s[candidateKey] === status ? undefined : status }));
  }, []);

  const addNote = useCallback((candidateKey, text) => {
    if (!text.trim()) return;
    setNotes(n => ({ ...n, [candidateKey]: [...(n[candidateKey] || []), text.trim()] }));
  }, []);

  const toggleCompare = useCallback((candidateKey) => {
    setCompareKeys(prev => {
      const next = new Set(prev);
      if (next.has(candidateKey)) next.delete(candidateKey); else next.add(candidateKey);
      return next;
    });
  }, []);

  const saveProject = useCallback((name) => {
    setProjects(p => [...p, {
      id: `project-${Date.now()}`,
      name,
      prompt,
      criteria,
      saved_candidates: Object.entries(candidateStatus).filter(([, v]) => v === "shortlisted" || v === "saved").map(([k]) => k),
      created_at: new Date().toISOString(),
    }]);
  }, [prompt, criteria, candidateStatus]);

  return {
    prompt, criteria, results, providerStatus, loading, hasSearched,
    selectedCandidateKey, compareKeys, candidateStatus, notes, projects,
    search, updateCriteria, rerunSearch, applyExpansion, findSimilar,
    setSelectedCandidateKey, setCandidateAction, addNote, toggleCompare, saveProject,
  };
}
