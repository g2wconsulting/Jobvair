// Deterministic (non-AI) scoring for objective question types. Runs
// entirely server-side so a candidate's browser never sees — or can
// forge — a score. This covers the large majority of question types;
// only `long_form_written` goes through aiScoring.ts.

export interface ScoreResult {
  isCorrect: boolean | null;
  pointsAwarded: number;
  pointsPossible: number;
  metrics?: Record<string, unknown>;
}

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

// multiple_choice_single, true_false, scenario_judgment, table_interpretation
// all share the same shape: candidate picks one option id, exactly one
// option is correct.
export function scoreSingleSelect(
  correctOptionId: string | null,
  submittedOptionId: string | null,
  points: number,
): ScoreResult {
  const isCorrect = Boolean(correctOptionId) && correctOptionId === submittedOptionId;
  return { isCorrect, pointsAwarded: isCorrect ? points : 0, pointsPossible: points };
}

// multiple_choice_multiple: full credit only if the submitted set exactly
// matches the correct set (no partial credit in V1 — simpler and harder
// to game).
export function scoreMultiSelect(
  correctOptionIds: string[],
  submittedOptionIds: string[],
  points: number,
): ScoreResult {
  const correct = new Set(correctOptionIds);
  const submitted = new Set(submittedOptionIds || []);
  const isCorrect = correct.size === submitted.size && [...correct].every(id => submitted.has(id));
  return { isCorrect, pointsAwarded: isCorrect ? points : 0, pointsPossible: points };
}

export function scoreShortAnswer(
  acceptedAnswers: string[],
  submittedText: string,
  points: number,
): ScoreResult {
  const isCorrect = acceptedAnswers.some(a => norm(a) === norm(submittedText));
  return { isCorrect, pointsAwarded: isCorrect ? points : 0, pointsPossible: points };
}

export function scoreNumeric(
  expected: number,
  tolerance: number,
  submitted: number,
  points: number,
): ScoreResult {
  const isCorrect = typeof submitted === "number" && Math.abs(submitted - expected) <= (tolerance || 0);
  return { isCorrect, pointsAwarded: isCorrect ? points : 0, pointsPossible: points };
}

// Typing: score is accuracy-driven (a fast but inaccurate typist should not
// outscore a slower, accurate one). WPM/net WPM are reported as metrics for
// the employer to see, not folded arithmetically into points.
export function scoreTyping(passage: string, submittedText: string, elapsedSeconds: number, points: number): ScoreResult {
  const text = submittedText || "";
  let correctChars = 0;
  const len = Math.min(text.length, passage.length);
  for (let i = 0; i < len; i++) {
    if (text[i] === passage[i]) correctChars++;
  }
  const charErrors = Math.max(text.length, passage.length) - correctChars;
  const accuracy = passage.length > 0 ? Math.round((correctChars / passage.length) * 100) : 0;

  const minutes = Math.max(elapsedSeconds, 1) / 60;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const grossWpm = Math.round(words / minutes);
  const netWpm = Math.round(grossWpm * (accuracy / 100));
  const wordErrors = Math.max(0, Math.round((charErrors / 5))); // rough industry approximation

  return {
    isCorrect: null,
    pointsAwarded: Math.round(points * (accuracy / 100)),
    pointsPossible: points,
    metrics: { gross_wpm: grossWpm, net_wpm: netWpm, accuracy, char_errors: charErrors, word_errors: wordErrors, elapsed_seconds: elapsedSeconds },
  };
}

// Data entry: percentage of fields, across all records, that exactly match
// (case-insensitive, trimmed).
export function scoreDataEntry(
  expectedRecords: Record<string, string>[],
  submittedRecords: Record<string, string>[],
  points: number,
): ScoreResult {
  let correctFields = 0;
  let totalFields = 0;
  expectedRecords.forEach((expectedRecord, i) => {
    const submittedRecord = submittedRecords?.[i] || {};
    Object.entries(expectedRecord).forEach(([field, expectedValue]) => {
      totalFields++;
      if (norm(submittedRecord[field]) === norm(expectedValue)) correctFields++;
    });
  });
  const accuracy = totalFields > 0 ? Math.round((correctFields / totalFields) * 100) : 0;
  return {
    isCorrect: null,
    pointsAwarded: Math.round(points * (accuracy / 100)),
    pointsPossible: points,
    metrics: { accuracy, correct_fields: correctFields, total_fields: totalFields },
  };
}
