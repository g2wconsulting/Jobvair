// Candidate-facing: records and (for objective types) immediately scores
// one question's response. Called on each "Next" within a section.
//
// Never returns whether an objective answer was correct — only that it
// saved — so a candidate can't guess-and-check via retries. Typing and
// data-entry return their computed metrics because live feedback (WPM,
// accuracy) is part of those exercises' UX, not a hint toward a "right
// answer".

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  scoreSingleSelect, scoreMultiSelect, scoreShortAnswer, scoreNumeric, scoreTyping, scoreDataEntry,
} from "../_shared/scoring.ts";
import { scoreWrittenResponse } from "../_shared/aiScoring.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed. Use POST." }, { status: 405, headers: corsHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request body." }, { status: 400, headers: corsHeaders });
  }

  const { token, question_id, response } = body || {};
  if (!token || !question_id) {
    return Response.json({ error: "Missing token or question_id." }, { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: invitation } = await supabase
    .from("assessment_invitations")
    .select("id, company_id")
    .eq("invite_token", token)
    .maybeSingle();
  if (!invitation) return Response.json({ error: "Invalid assessment link." }, { status: 404, headers: corsHeaders });

  const { data: attempt } = await supabase
    .from("assessment_attempts")
    .select("id, status, question_selection, assessment_version_ids, certification_accepted_at, time_limit_expires_at")
    .eq("invitation_id", invitation.id)
    .maybeSingle();
  if (!attempt) return Response.json({ error: "Assessment not started yet." }, { status: 404, headers: corsHeaders });
  if (!attempt.certification_accepted_at) {
    return Response.json({ error: "Certification is required before answering questions." }, { status: 403, headers: corsHeaders });
  }
  if (attempt.status !== "in_progress") {
    return Response.json({ error: "This assessment has already been submitted." }, { status: 409, headers: corsHeaders });
  }
  if (attempt.time_limit_expires_at && new Date(attempt.time_limit_expires_at) < new Date()) {
    return Response.json({ error: "The time limit for this assessment has been reached.", expired: true }, { status: 403, headers: corsHeaders });
  }

  // Derive which section this question was drawn into for THIS attempt —
  // never trust a client-supplied section id.
  const selection = (attempt.question_selection || {}) as Record<string, string[]>;
  const sectionId = Object.keys(selection).find(sid => selection[sid]?.includes(question_id));
  if (!sectionId) {
    return Response.json({ error: "This question is not part of your assessment." }, { status: 403, headers: corsHeaders });
  }

  const { data: section } = await supabase
    .from("assessment_sections")
    .select("id, assessment_id, assessments(slug)")
    .eq("id", sectionId)
    .single();
  const assessmentSlug = (section as { assessments?: { slug?: string } })?.assessments?.slug || "";

  // If this attempt pinned a published version of the assessment, score
  // against that exact snapshot — never the live (possibly since-edited)
  // question bank.
  const versionIds = (attempt.assessment_version_ids || {}) as Record<string, string>;
  const pinnedVersionId = versionIds[assessmentSlug];

  let question: { id: string; type: string; points: number; correct_answer: unknown; rubric: unknown; prompt: string; question_options: { id: string; is_correct: boolean }[] } | null = null;

  if (pinnedVersionId) {
    const { data: version } = await supabase.from("assessment_versions").select("snapshot").eq("id", pinnedVersionId).single();
    const snapshot = (version?.snapshot || { sections: [] }) as { sections: { id: string; questions: { id: string; type: string; points: number; correct_answer: unknown; rubric: unknown; prompt: string; options: { id: string; is_correct: boolean }[] }[] }[] };
    const snapshotSection = snapshot.sections.find(s => s.id === sectionId);
    const snapshotQuestion = snapshotSection?.questions.find(q => q.id === question_id);
    if (snapshotQuestion) {
      question = { ...snapshotQuestion, question_options: snapshotQuestion.options || [] };
    }
  } else {
    const { data: liveQuestion } = await supabase
      .from("questions")
      .select("id, type, points, correct_answer, rubric, prompt, question_options(id, is_correct)")
      .eq("id", question_id)
      .single();
    question = liveQuestion;
  }
  if (!question) return Response.json({ error: "Question not found." }, { status: 404, headers: corsHeaders });

  let result;
  let aiResult = null;

  switch (question.type) {
    case "multiple_choice_single":
    case "true_false":
    case "scenario_judgment":
    case "table_interpretation": {
      const correctOption = (question.question_options || []).find((o: { is_correct: boolean }) => o.is_correct);
      result = scoreSingleSelect(correctOption?.id ?? null, response?.optionId ?? null, question.points);
      break;
    }
    case "multiple_choice_multiple": {
      const correctIds = (question.question_options || []).filter((o: { is_correct: boolean }) => o.is_correct).map((o: { id: string }) => o.id);
      result = scoreMultiSelect(correctIds, response?.optionIds || [], question.points);
      break;
    }
    case "short_answer": {
      const accepted = (question.correct_answer as { accepted?: string[] })?.accepted || [];
      result = scoreShortAnswer(accepted, response?.text || "", question.points);
      break;
    }
    case "numeric": {
      const expected = (question.correct_answer as { value?: number })?.value ?? NaN;
      const tolerance = (question.correct_answer as { tolerance?: number })?.tolerance ?? 0;
      result = scoreNumeric(expected, tolerance, Number(response?.value), question.points);
      break;
    }
    case "typing_exercise": {
      result = scoreTyping(question.prompt, response?.text || "", Number(response?.elapsed_seconds) || 0, question.points);
      break;
    }
    case "data_entry_exercise": {
      const expectedRecords = (question.correct_answer as { records?: Record<string, string>[] })?.records || [];
      result = scoreDataEntry(expectedRecords, response?.records || [], question.points);
      break;
    }
    case "long_form_written": {
      try {
        const rubric = (question.rubric as { criteria: string[]; scale?: number }) || { criteria: ["quality"] };
        const scored = await scoreWrittenResponse(question.prompt, response?.text || "", rubric);
        aiResult = scored;
        const scale = rubric.scale || 100;
        result = { isCorrect: null, pointsAwarded: Math.round(question.points * (scored.overall_score / scale)), pointsPossible: question.points };
        await supabase.from("ai_usage").insert({
          company_id: invitation.company_id,
          assessment_slug: assessmentSlug,
          action: "score_written_response",
          model: scored.model,
          input_tokens: scored.usage.input_tokens,
          output_tokens: scored.usage.output_tokens,
          estimated_cost: scored.usage.estimated_cost,
        });
      } catch (err) {
        console.error("[submit-assessment-response] AI scoring failed:", err instanceof Error ? err.message : err);
        return Response.json({ error: "Could not score this response right now. Please try again." }, { status: 502, headers: corsHeaders });
      }
      break;
    }
    default:
      return Response.json({ error: `Unsupported question type: ${question.type}` }, { status: 400, headers: corsHeaders });
  }

  const { error: upsertError } = await supabase.from("assessment_responses").upsert({
    attempt_id: attempt.id,
    assessment_slug: assessmentSlug,
    section_id: sectionId,
    question_id,
    question_type: question.type,
    response: response || {},
    is_correct: result.isCorrect,
    points_awarded: result.pointsAwarded,
    points_possible: result.pointsPossible,
    ai_result: aiResult,
  }, { onConflict: "attempt_id,question_id" });

  if (upsertError) {
    console.error("[submit-assessment-response] failed to save response:", upsertError.message);
    return Response.json({ error: "Could not save your response. Please try again." }, { status: 500, headers: corsHeaders });
  }

  // Live feedback is appropriate for typing/data-entry (it's inherent to
  // the exercise) but never reveals MCQ correctness.
  const metrics = result.metrics || null;
  return Response.json({ saved: true, metrics }, { headers: corsHeaders });
});
