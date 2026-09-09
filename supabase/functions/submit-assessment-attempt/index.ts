// Candidate-facing: finalizes an attempt. Aggregates the already-scored
// assessment_responses into per-section and per-assessment scores
// (weighted by section weight), marks the attempt/invitation completed.
// Nothing here re-scores anything — it only totals what
// submit-assessment-response already computed server-side.

import { createClient } from "npm:@supabase/supabase-js@2";

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

  const token = body?.token;
  if (!token) return Response.json({ error: "Missing token." }, { status: 400, headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: invitation } = await supabase
    .from("assessment_invitations")
    .select("id, assessment_ids")
    .eq("invite_token", token)
    .maybeSingle();
  if (!invitation) return Response.json({ error: "Invalid assessment link." }, { status: 404, headers: corsHeaders });

  const { data: attempt } = await supabase
    .from("assessment_attempts")
    .select("id, status")
    .eq("invitation_id", invitation.id)
    .maybeSingle();
  if (!attempt) return Response.json({ error: "Assessment not started yet." }, { status: 404, headers: corsHeaders });
  if (attempt.status !== "in_progress") {
    return Response.json({ completed: true }, { headers: corsHeaders });
  }

  const { data: responses } = await supabase
    .from("assessment_responses")
    .select("assessment_slug, section_id, points_awarded, points_possible, response, question_type")
    .eq("attempt_id", attempt.id);

  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, slug, passing_score, assessment_sections(id, name, weight)")
    .in("slug", invitation.assessment_ids || []);

  for (const assessment of assessments || []) {
    const assessmentResponses = (responses || []).filter(r => r.assessment_slug === assessment.slug);
    if (assessmentResponses.length === 0) continue;

    const sectionTotals = new Map<string, { earned: number; possible: number; name: string; weight: number }>();
    for (const section of assessment.assessment_sections || []) {
      sectionTotals.set(section.id, { earned: 0, possible: 0, name: section.name, weight: Number(section.weight) || 1 });
    }
    const metrics: Record<string, unknown> = {};
    for (const r of assessmentResponses) {
      const bucket = sectionTotals.get(r.section_id);
      if (bucket) {
        bucket.earned += Number(r.points_awarded) || 0;
        bucket.possible += Number(r.points_possible) || 0;
      }
      if (r.question_type === "typing_exercise" || r.question_type === "data_entry_exercise") {
        Object.assign(metrics, r.response?.metrics || {});
      }
    }

    let weightedSum = 0;
    let weightTotal = 0;
    const sectionScoreRows = [];
    for (const [sectionId, bucket] of sectionTotals) {
      // A section with no possible points was never actually administered
      // to this candidate (e.g. an empty question pool) — exclude it from
      // the weighted average instead of counting it as a zero.
      if (bucket.possible === 0) continue;
      const percentage = (bucket.earned / bucket.possible) * 100;
      weightedSum += percentage * bucket.weight;
      weightTotal += bucket.weight;
      sectionScoreRows.push({
        section_id: sectionId,
        section_name: bucket.name,
        points_earned: bucket.earned,
        points_possible: bucket.possible,
        percentage: Math.round(percentage * 100) / 100,
      });
    }
    const overallScore = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) / 100 : 0;
    const totalEarned = [...sectionTotals.values()].reduce((s, b) => s + b.earned, 0);
    const totalPossible = [...sectionTotals.values()].reduce((s, b) => s + b.possible, 0);

    const { data: scoreRow, error: scoreError } = await supabase
      .from("assessment_scores")
      .upsert({
        attempt_id: attempt.id,
        assessment_id: assessment.id,
        assessment_slug: assessment.slug,
        points_earned: totalEarned,
        points_possible: totalPossible,
        overall_score: overallScore,
        passed: overallScore >= (assessment.passing_score ?? 70),
        metrics,
      }, { onConflict: "attempt_id,assessment_id" })
      .select()
      .single();

    if (scoreError || !scoreRow) {
      console.error("[submit-assessment-attempt] failed to write score:", scoreError?.message);
      continue;
    }

    await supabase.from("assessment_section_scores").delete().eq("score_id", scoreRow.id);
    await supabase.from("assessment_section_scores").insert(
      sectionScoreRows.map(row => ({ ...row, score_id: scoreRow.id })),
    );
  }

  await supabase.from("assessment_attempts").update({ status: "scored", submitted_at: new Date().toISOString() }).eq("id", attempt.id);
  await supabase.from("assessment_invitations").update({ status: "completed" }).eq("id", invitation.id);

  return Response.json({ completed: true }, { headers: corsHeaders });
});
