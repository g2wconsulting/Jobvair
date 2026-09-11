// State/orchestration for the Phase 2 guided flow: describe → AI-generated
// profile → employer review/edit → search → ranked results → inspect →
// shortlist/compare/reject. Session-only state, same as Phase 1's hook —
// nothing persists to Supabase yet.

import { useState, useCallback } from "react";
import { planIdealProfile } from "../services/mockProfilePlanner.js";
import { MOCK_ICP_CANDIDATES } from "../services/mockIcpCandidates.js";
import { scoreCandidateFit } from "../scoring/scoreCandidateFit.js";
import { createEmptyIdealProfile } from "../types/idealCandidateProfile.js";

function isRelevant(candidate, profile) {
  const terms = [...(profile.required_skills || []), ...(profile.industries || []), ...(profile.target_titles || [])].map(t => t.toLowerCase());
  if (terms.length === 0) return true;
  const haystack = [candidate.current_title, ...candidate.skills, ...candidate.industries].join(" ").toLowerCase();
  return terms.some(t => haystack.includes(t) || haystack.includes(t.split(" ")[0]));
}

export function useIdealCandidateProfile() {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [profile, setProfile] = useState(createEmptyIdealProfile());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedCandidateKey, setSelectedCandidateKey] = useState(null);
  const [compareKeys, setCompareKeys] = useState(new Set());
  const [candidateStatus, setCandidateStatus] = useState({});
  const [notes, setNotes] = useState({});

  const describeCandidate = useCallback(async (text) => {
    setLoading(true);
    setPrompt(text);
    await new Promise(r => setTimeout(r, 500)); // simulate the AI planning call
    setProfile(planIdealProfile(text));
    setLoading(false);
    setStep(3); // profile generated — go straight to review (step 2 and 3 are one screen here)
  }, []);

  const updateProfile = useCallback((patch) => {
    setProfile(p => ({ ...p, ...patch }));
  }, []);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setStep(4);
    await new Promise(r => setTimeout(r, 700)); // simulate multi-source search
    const scored = MOCK_ICP_CANDIDATES
      .filter(c => isRelevant(c, profile))
      .map(c => ({ ...c, ...scoreCandidateFit(c, profile) }))
      .sort((a, b) => b.fit_scores.overall - a.fit_scores.overall);
    setResults(scored);
    setLoading(false);
    setStep(5);
  }, [profile]);

  const startOver = useCallback(() => {
    setStep(1);
    setPrompt("");
    setProfile(createEmptyIdealProfile());
    setResults([]);
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

  return {
    step, setStep, prompt, profile, loading, results,
    selectedCandidateKey, compareKeys, candidateStatus, notes,
    describeCandidate, updateProfile, runSearch, startOver,
    setSelectedCandidateKey, setCandidateAction, addNote, toggleCompare,
  };
}
