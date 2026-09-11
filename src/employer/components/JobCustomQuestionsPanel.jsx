import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, Badge, Button, Input, Select, TextArea } from "../../components/ui/index.js";
import { getOrCreateJobAssessment, listSectionQuestions, addSectionQuestion, deleteSectionQuestion } from "../lib/employerApi.js";

const QUESTION_TYPES = [
  { value: "multiple_choice_single", label: "Multiple Choice (single answer)" },
  { value: "true_false", label: "True / False" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_form_written", label: "Long-form Written (AI-scored)" },
];

const TYPE_LABEL = Object.fromEntries(QUESTION_TYPES.map(t => [t.value, t.label]));

function emptyForm() {
  return { type: "multiple_choice_single", prompt: "", points: 10, options: [{ label: "", is_correct: true }, { label: "", is_correct: false }], acceptedAnswers: "", rubricCriteria: "" };
}

// Lightweight, manager-friendly question authoring for a single job — a
// deliberately smaller surface than the full Assessment Builder (4 common
// question types instead of the full list), scoped to "questions for this
// specific role" rather than building a whole assessment from scratch.
export default function JobCustomQuestionsPanel({ job, company, user, onJobUpdated }) {
  const [sectionId, setSectionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(Boolean(job.linked_assessment_id));
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!job.linked_assessment_id) return;
    getOrCreateJobAssessment(job, company.id, user.id).then(({ sectionId: sid }) => {
      setSectionId(sid);
      return listSectionQuestions(sid);
    }).then(setQuestions).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setOption = (i, key, value) => setForm(f => ({
    ...f,
    options: f.options.map((o, idx) => idx === i ? { ...o, [key]: value } : (key === "is_correct" && value ? { ...o, is_correct: false } : o)),
  }));
  const addOption = () => setForm(f => ({ ...f, options: [...f.options, { label: "", is_correct: false }] }));
  const removeOption = (i) => setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));

  const submit = async () => {
    if (!form.prompt.trim()) { setError("Enter the question text."); return; }
    setSaving(true);
    setError("");
    try {
      let sid = sectionId;
      if (!sid) {
        const { sectionId: newSectionId } = await getOrCreateJobAssessment(job, company.id, user.id);
        sid = newSectionId;
        setSectionId(newSectionId);
        onJobUpdated?.();
      }

      const payload = { type: form.type, prompt: form.prompt.trim(), points: Number(form.points) || 10, correct_answer: null, rubric: null, options: null };
      if (form.type === "multiple_choice_single") {
        const opts = form.options.filter(o => o.label.trim());
        if (opts.length < 2) { setError("Add at least two answer options."); setSaving(false); return; }
        if (!opts.some(o => o.is_correct)) { setError("Mark one option as correct."); setSaving(false); return; }
        payload.options = opts;
      } else if (form.type === "true_false") {
        payload.options = [{ label: "True", is_correct: form.correctBoolean !== false }, { label: "False", is_correct: form.correctBoolean === false }];
      } else if (form.type === "short_answer") {
        const accepted = form.acceptedAnswers.split(",").map(a => a.trim()).filter(Boolean);
        if (accepted.length === 0) { setError("Enter at least one accepted answer."); setSaving(false); return; }
        payload.correct_answer = { accepted };
      } else if (form.type === "long_form_written") {
        const criteria = form.rubricCriteria.split(",").map(c => c.trim()).filter(Boolean);
        payload.rubric = { criteria: criteria.length ? criteria : ["quality"], scale: 100 };
      }

      await addSectionQuestion(sid, company.id, payload, questions.length);
      const fresh = await listSectionQuestions(sid);
      setQuestions(fresh);
      setForm(emptyForm());
      setAdding(false);
    } catch (err) {
      setError(err.message || "Failed to save question.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (questionId) => {
    if (!confirm("Delete this question?")) return;
    await deleteSectionQuestion(questionId);
    setQuestions(qs => qs.filter(q => q.id !== questionId));
  };

  if (!job.id) {
    return (
      <Card>
        <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>Save this job first to add custom questions for it.</div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--jv-color-heading)" }}>Custom Questions for This Job</div>
        {!adding && <Button size="sm" variant="secondary" icon={Plus} onClick={() => setAdding(true)}>Add Question</Button>}
      </div>
      <p style={{ fontSize: 12.5, color: "var(--jv-color-muted)", marginTop: 4, marginBottom: 14 }}>
        These become part of a dedicated assessment for this job — send it to candidates from the Assessments Library once you've added the questions you want.
      </p>

      {loading ? (
        <div style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gap: 8, marginBottom: adding ? 16 : 0 }}>
          {questions.length === 0 && !adding && <div style={{ fontSize: 13, color: "var(--jv-color-muted)", fontStyle: "italic" }}>No custom questions yet.</div>}
          {questions.map(q => (
            <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 12px", background: "var(--jv-color-slate-50)", borderRadius: 8 }}>
              <div>
                <Badge tone="neutral">{TYPE_LABEL[q.type] || q.type}</Badge>
                <div style={{ fontSize: 13.5, marginTop: 6 }}>{q.prompt}</div>
              </div>
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remove(q.id)}>Delete</Button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div style={{ display: "grid", gap: 12, paddingTop: 14, borderTop: "1px solid var(--jv-color-border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <Select label="Question type" value={form.type} onChange={e => set("type", e.target.value)} options={QUESTION_TYPES} />
            <Input label="Points" type="number" value={form.points} onChange={e => set("points", e.target.value)} />
          </div>
          <TextArea label="Question text" rows={2} value={form.prompt} onChange={e => set("prompt", e.target.value)} />

          {form.type === "multiple_choice_single" && (
            <div>
              <div className="jv-field__label" style={{ marginBottom: 6 }}>Answer options</div>
              {form.options.map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <input type="radio" checked={o.is_correct} onChange={() => setOption(i, "is_correct", true)} />
                  <input className="jv-input" value={o.label} onChange={e => setOption(i, "label", e.target.value)} placeholder={`Option ${i + 1}`} style={{ flex: 1 }} />
                  {form.options.length > 2 && <button type="button" onClick={() => removeOption(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--jv-color-muted)" }}>✕</button>}
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={addOption}>Add option</Button>
            </div>
          )}

          {form.type === "true_false" && (
            <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="radio" checked={form.correctBoolean !== false} onChange={() => set("correctBoolean", true)} /> True is correct</label>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="radio" checked={form.correctBoolean === false} onChange={() => set("correctBoolean", false)} /> False is correct</label>
            </div>
          )}

          {form.type === "short_answer" && (
            <Input label="Accepted answers (comma-separated)" value={form.acceptedAnswers} onChange={e => set("acceptedAnswers", e.target.value)} placeholder="e.g. Yes, Correct, Approved" />
          )}

          {form.type === "long_form_written" && (
            <Input label="Rubric criteria (comma-separated, AI-scored against these)" value={form.rubricCriteria} onChange={e => set("rubricCriteria", e.target.value)} placeholder="e.g. Clarity, Judgment, Communication" />
          )}

          {error && <div style={{ fontSize: 12.5, color: "var(--jv-color-danger-600)" }}>{error}</div>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setForm(emptyForm()); setError(""); }}>Cancel</Button>
            <Button size="sm" disabled={saving} onClick={submit}>{saving ? "Saving…" : "Add Question"}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
