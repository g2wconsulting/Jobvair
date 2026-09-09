import { useEffect, useState } from "react";
import { Card, Button, Badge } from "../components/ui/index.js";
import { assessmentFetch } from "../lib/assessmentFetch.js";

function getToken() {
  return new URLSearchParams(window.location.search).get("t") || "";
}

function flattenQuestions(assessments) {
  const flat = [];
  for (const a of assessments) {
    for (const s of a.sections) {
      for (const q of s.questions) {
        flat.push({ assessmentSlug: a.slug, assessmentName: a.name, sectionName: s.name, question: q });
      }
    }
  }
  return flat;
}

// ── Question renderers ─────────────────────────────────────────────────────
function ChoiceQuestion({ question, value, onChange }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {question.options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange({ optionId: o.id })}
          style={{
            textAlign: "left", padding: "12px 16px", borderRadius: 10, fontSize: 14,
            border: value?.optionId === o.id ? "2px solid var(--jv-color-primary)" : "1px solid var(--jv-color-border)",
            background: value?.optionId === o.id ? "var(--jv-color-teal-50)" : "#fff", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TypingQuestion({ question, onReady }) {
  const [text, setText] = useState("");
  const [startTime, setStartTime] = useState(null);
  const passage = question.prompt;

  const handleChange = (val) => {
    if (!startTime) setStartTime(Date.now());
    setText(val);
    const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
    onReady({ text: val, elapsed_seconds: elapsed }, val.length >= passage.length);
  };

  let correct = 0;
  for (let i = 0; i < text.length; i++) if (text[i] === passage[i]) correct++;
  const liveAccuracy = text.length > 0 ? Math.round((correct / text.length) * 100) : 100;

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--jv-color-muted)", marginBottom: 10, fontWeight: 600 }}>TYPE THE FOLLOWING PASSAGE:</div>
      <div style={{ fontSize: 15, lineHeight: 1.8, padding: "16px 20px", background: "var(--jv-color-slate-50)", borderRadius: 10, fontFamily: "Georgia, serif", marginBottom: 16, userSelect: "none" }}>
        {passage.split("").map((char, i) => {
          let color = "var(--jv-color-muted)";
          if (i < text.length) color = text[i] === char ? "var(--jv-color-success-600, #059669)" : "var(--jv-color-danger-600)";
          return <span key={i} style={{ color, background: i === text.length ? "var(--jv-color-teal-50)" : "transparent" }}>{char}</span>;
        })}
      </div>
      <textarea
        autoFocus
        value={text}
        onChange={e => handleChange(e.target.value)}
        placeholder="Begin typing here…"
        style={{ width: "100%", minHeight: 120, padding: "12px 16px", border: "2px solid var(--jv-color-border)", borderRadius: 10, fontSize: 15, fontFamily: "Georgia, serif", lineHeight: 1.8, outline: "none", resize: "none", boxSizing: "border-box" }}
      />
      <div style={{ fontSize: 12, color: "var(--jv-color-muted)", marginTop: 8, textAlign: "center" }}>
        {text.length} / {passage.length} characters · Live accuracy: {liveAccuracy}%
      </div>
    </div>
  );
}

function DataEntryQuestion({ question, onReady }) {
  const [records, setRecords] = useState(question.records.map(() => ({})));

  const update = (i, field, val) => {
    const next = records.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    setRecords(next);
    onReady({ records: next }, true);
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ fontSize: 12, color: "var(--jv-color-muted)", marginBottom: 10, fontWeight: 600 }}>ENTER EACH RECORD EXACTLY AS SHOWN:</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {question.fields.map(f => <th key={f.key} style={{ textAlign: "left", padding: "6px 8px", color: "var(--jv-color-muted)", fontSize: 11, textTransform: "uppercase" }}>{f.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {question.records.map((rec, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--jv-color-border)" }}>
              {question.fields.map(f => (
                <td key={f.key} style={{ padding: "6px 8px" }}>
                  <div style={{ fontSize: 11, color: "var(--jv-color-muted)", marginBottom: 3 }}>{rec[f.key]}</div>
                  <input
                    value={records[i]?.[f.key] || ""}
                    onChange={e => update(i, f.key, e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--jv-color-border)", borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WrittenQuestion({ question, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", padding: "14px 16px", background: "var(--jv-color-slate-50)", borderRadius: 10, marginBottom: 14 }}>{question.prompt}</div>
      <textarea
        value={value?.text || ""}
        onChange={e => onChange({ text: e.target.value })}
        placeholder="Write your response here…"
        rows={10}
        style={{ width: "100%", padding: "12px 16px", border: "1px solid var(--jv-color-border)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box", resize: "vertical" }}
      />
    </div>
  );
}

function QuestionRenderer({ item, onAnswer }) {
  const { question } = item;
  const [value, setValue] = useState(null);

  if (["multiple_choice_single", "true_false", "scenario_judgment", "table_interpretation"].includes(question.type)) {
    return <ChoiceQuestion question={question} value={value} onChange={v => { setValue(v); onAnswer(v, true); }} />;
  }
  if (question.type === "typing_exercise") {
    return <TypingQuestion question={question} onReady={(v, isReady) => onAnswer(v, isReady)} />;
  }
  if (question.type === "data_entry_exercise") {
    return <DataEntryQuestion question={question} onReady={(v, isReady) => onAnswer(v, isReady)} />;
  }
  if (question.type === "long_form_written") {
    return <WrittenQuestion question={question} value={value} onChange={v => { setValue(v); onAnswer(v, v.text?.trim().length > 20); }} />;
  }
  return <div style={{ color: "var(--jv-color-muted)" }}>Unsupported question type.</div>;
}

// ── Main portal ─────────────────────────────────────────────────────────────
export default function CandidatePortal() {
  const [token] = useState(getToken);
  // loading | error | landing | taking | complete | already-done
  const [state, setState] = useState(() => token ? "loading" : "error");
  const [errorMsg, setErrorMsg] = useState(() => token ? "" : "This assessment link is missing its access token.");
  const [overview, setOverview] = useState(null);
  const [certified, setCertified] = useState(false);
  const [flatQuestions, setFlatQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [canAdvance, setCanAdvance] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    assessmentFetch("get-assessment-attempt", { token })
      .then(data => {
        if (data.completed) { setOverview(data); setState("already-done"); return; }
        setOverview(data);
        setFlatQuestions(flattenQuestions(data.assessments));
        setState("landing");
      })
      .catch(err => { setErrorMsg(err.message); setState("error"); });
  }, [token]);

  const startAssessment = async () => {
    setSubmitting(true);
    try {
      await assessmentFetch("get-assessment-attempt", { token, certify: true });
      setState("taking");
    } catch (err) {
      setErrorMsg(err.message);
      setState("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = (value, ready) => { setCurrentAnswer(value); setCanAdvance(ready); };

  const advance = async () => {
    const item = flatQuestions[index];
    setSubmitting(true);
    try {
      await assessmentFetch("submit-assessment-response", { token, question_id: item.question.id, response: currentAnswer });
      if (index + 1 >= flatQuestions.length) {
        await assessmentFetch("submit-assessment-attempt", { token });
        setState("complete");
      } else {
        setIndex(index + 1);
        setCurrentAnswer(null);
        setCanAdvance(false);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: "var(--jv-color-page, #F7F8FA)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--jv-font-sans, 'Inter', system-ui, sans-serif)" }}>
      <div style={{ width: "100%", maxWidth: 640 }}>{children}</div>
    </div>
  );

  if (state === "loading") return wrap(<div style={{ textAlign: "center", color: "var(--jv-color-muted)" }}>Loading…</div>);

  if (state === "error") return wrap(
    <Card><div style={{ textAlign: "center", padding: 12 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Can't load this assessment</h2>
      <p style={{ color: "var(--jv-color-muted)", fontSize: 14 }}>{errorMsg}</p>
    </div></Card>
  );

  if (state === "already-done") return wrap(
    <Card><div style={{ textAlign: "center", padding: 12 }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>This assessment has already been submitted</h2>
      <p style={{ color: "var(--jv-color-muted)", fontSize: 14 }}>{overview?.employer_name} has received your results.</p>
    </div></Card>
  );

  if (state === "landing") {
    const totalMinutes = overview.assessments.reduce((s, a) => s + (a.estimated_minutes || 0), 0);
    return wrap(
      <div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--jv-color-muted)", letterSpacing: "0.08em", marginBottom: 6 }}>CANDIDATE ASSESSMENT</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>{overview.employer_name}</h1>
          <p style={{ color: "var(--jv-color-muted)", margin: 0 }}>{overview.assessments.map(a => a.name).join(", ")}</p>
        </div>
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20, textAlign: "center" }}>
            <div><div style={{ fontSize: 18, fontWeight: 800 }}>~{totalMinutes} min</div><div style={{ fontSize: 11, color: "var(--jv-color-muted)" }}>Estimated Time</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 800 }}>{overview.assessments.length}</div><div style={{ fontSize: 11, color: "var(--jv-color-muted)" }}>Assessment{overview.assessments.length !== 1 ? "s" : ""}</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 800 }}>{flatQuestions.length}</div><div style={{ fontSize: 11, color: "var(--jv-color-muted)" }}>Tasks</div></div>
          </div>
          {overview.due_date && <Badge tone="neutral">Due {new Date(overview.due_date).toLocaleDateString()}</Badge>}
          <div style={{ padding: "12px 14px", background: "var(--jv-color-teal-50)", borderRadius: 8, fontSize: 13, margin: "16px 0" }}>
            Complete all sections in order. You may not go back once a section is submitted. Ensure a stable internet connection before starting.
          </div>
          <label style={{ display: "flex", gap: 10, cursor: "pointer", marginBottom: 20 }}>
            <input type="checkbox" checked={certified} onChange={e => setCertified(e.target.checked)} style={{ marginTop: 3 }} />
            <span style={{ fontSize: 13, lineHeight: 1.5 }}>
              I certify that I am the person completing this assessment and will complete it independently, without unauthorized assistance from any person or resource.
            </span>
          </label>
          <Button full disabled={!certified || submitting} onClick={startAssessment}>{submitting ? "Starting…" : "Start Assessment"}</Button>
        </Card>
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--jv-color-muted)", marginTop: 16 }}>Powered by Jobvair Assess · Secure · Confidential</p>
      </div>
    );
  }

  if (state === "taking") {
    const item = flatQuestions[index];
    return wrap(
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--jv-color-muted)", fontWeight: 600 }}>{item.assessmentName} · {item.sectionName}</div>
            <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>Question {index + 1} of {flatQuestions.length}</div>
          </div>
        </div>
        <Card style={{ marginBottom: 16 }}>
          {!["typing_exercise", "data_entry_exercise", "long_form_written"].includes(item.question.type) && (
            <div style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 16 }}>{item.question.prompt}</div>
          )}
          <QuestionRenderer key={item.question.id} item={item} onAnswer={handleAnswer} />
        </Card>
        {errorMsg && <div style={{ marginBottom: 14, fontSize: 13, color: "var(--jv-color-danger-600)" }}>{errorMsg}</div>}
        <Button full disabled={!canAdvance || submitting} onClick={advance}>
          {submitting ? "Saving…" : index + 1 >= flatQuestions.length ? "Submit Assessment" : "Next →"}
        </Button>
      </div>
    );
  }

  if (state === "complete") return wrap(
    <Card><div style={{ textAlign: "center", padding: 12 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>Assessment Complete</h2>
      <p style={{ color: "var(--jv-color-muted)", fontSize: 14 }}>Your responses have been submitted to {overview?.employer_name}. You may now close this window.</p>
    </div></Card>
  );

  return null;
}
