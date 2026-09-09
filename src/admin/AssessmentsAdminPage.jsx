import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { A, font, sans } from "./theme.js";
import { Card, Badge, Btn, Input, TextArea, Select } from "./ui.jsx";

const QUESTION_TYPES = [
  { value: "multiple_choice_single",   label: "Multiple Choice (single answer)" },
  { value: "multiple_choice_multiple", label: "Multiple Choice (multiple answers)" },
  { value: "true_false",               label: "True / False" },
  { value: "scenario_judgment",        label: "Scenario / Situational Judgment" },
  { value: "table_interpretation",     label: "Table / Dataset Interpretation" },
  { value: "short_answer",             label: "Short Answer" },
  { value: "numeric",                  label: "Numeric Response" },
  { value: "long_form_written",        label: "Long-form Written (AI-scored)" },
  { value: "typing_exercise",          label: "Typing Exercise" },
  { value: "data_entry_exercise",      label: "Data Entry Exercise" },
];

const OPTION_BASED_TYPES = ["multiple_choice_single", "multiple_choice_multiple", "true_false", "scenario_judgment", "table_interpretation"];

const CATEGORIES = ["Core Skills", "Microsoft Office", "Communication", "Analytical", "Professional", "Technology", "Specialized"];

const STATUS_COLOR = { draft: "gray", published: "green", archived: "red" };

function uniqueSlugSuffix() {
  return Date.now();
}

const EMPTY_ASSESSMENT = {
  slug: "", name: "", category: CATEGORIES[0], description: "", status: "draft",
  estimated_minutes: 20, passing_score: 70, scoring_method: "deterministic",
  randomize_questions: true, randomize_options: true, instructions: "",
};

// ── Question editor ─────────────────────────────────────────────────────────
function QuestionEditor({ question, onSave, onCancel }) {
  const isOptionBased = OPTION_BASED_TYPES.includes(question.type);
  const [form, setForm] = useState(() => ({
    type: question.type || "multiple_choice_single",
    prompt: question.prompt || "",
    points: question.points ?? 1,
    options: question.question_options?.map(o => ({ label: o.label, is_correct: o.is_correct })) || [{ label: "", is_correct: true }, { label: "", is_correct: false }],
    accepted: (question.correct_answer?.accepted || []).join(", "),
    numeric_value: question.correct_answer?.value ?? "",
    numeric_tolerance: question.correct_answer?.tolerance ?? 0,
    rubric_criteria: (question.rubric?.criteria || ["grammar", "clarity", "professionalism", "completeness"]).join(", "),
    rubric_scale: question.rubric?.scale || 100,
    data_entry_fields: (question.correct_answer?.fields || []).map(f => `${f.key}:${f.label}`).join("\n"),
    data_entry_records: JSON.stringify(question.correct_answer?.records || [], null, 2),
  }));
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setOption = (i, key, val) => setForm(f => ({
    ...f,
    options: f.options.map((o, idx) => {
      if (idx !== i) return f.type === "multiple_choice_multiple" || key !== "is_correct" ? o : { ...o, is_correct: false };
      return { ...o, [key]: val };
    }),
  }));
  const addOption = () => setForm(f => ({ ...f, options: [...f.options, { label: "", is_correct: false }] }));
  const removeOption = (i) => setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));

  const build = () => {
    const base = { type: form.type, prompt: form.prompt.trim(), points: Number(form.points) || 1 };
    if (isOptionBased) {
      const options = form.options.filter(o => o.label.trim());
      if (options.length < 2) throw new Error("Add at least 2 options.");
      if (!options.some(o => o.is_correct)) throw new Error("Mark at least one option correct.");
      return { ...base, options, correct_answer: null, rubric: null };
    }
    if (form.type === "short_answer") {
      return { ...base, correct_answer: { accepted: form.accepted.split(",").map(s => s.trim()).filter(Boolean) }, rubric: null, options: [] };
    }
    if (form.type === "numeric") {
      return { ...base, correct_answer: { value: Number(form.numeric_value), tolerance: Number(form.numeric_tolerance) || 0 }, rubric: null, options: [] };
    }
    if (form.type === "long_form_written") {
      return { ...base, correct_answer: null, rubric: { criteria: form.rubric_criteria.split(",").map(s => s.trim()).filter(Boolean), scale: Number(form.rubric_scale) || 100 }, options: [] };
    }
    if (form.type === "typing_exercise") {
      return { ...base, correct_answer: null, rubric: null, options: [] };
    }
    if (form.type === "data_entry_exercise") {
      const fields = form.data_entry_fields.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
        const [key, ...rest] = l.split(":");
        return { key: key.trim(), label: (rest.join(":").trim() || key.trim()) };
      });
      let records;
      try { records = JSON.parse(form.data_entry_records || "[]"); } catch { throw new Error("Records must be valid JSON (an array of objects)."); }
      return { ...base, correct_answer: { fields, records }, rubric: null, options: [] };
    }
    return { ...base, correct_answer: null, rubric: null, options: [] };
  };

  const save = () => {
    try {
      onSave(build());
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "30px 16px" }}>
      <div style={{ width: 680, background: A.bgCard, border: `1px solid ${A.border}`, borderRadius: 16, padding: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: A.text, marginBottom: 18 }}>{question.id ? "Edit Question" : "New Question"}</div>
        <div style={{ display: "grid", gap: 14 }}>
          <Select label="Question Type" value={form.type} onChange={v => set("type", v)} options={QUESTION_TYPES} />
          <TextArea label={form.type === "typing_exercise" ? "Passage" : "Prompt"} value={form.prompt} onChange={v => set("prompt", v)} rows={form.type === "typing_exercise" ? 5 : 3} />
          <Input label="Points" type="number" value={form.points} onChange={v => set("points", v)} />

          {isOptionBased && (
            <div>
              <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 6, fontFamily: font, letterSpacing: "0.05em", textTransform: "uppercase" }}>Options</div>
              {form.options.map((o, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input
                    type={form.type === "multiple_choice_multiple" ? "checkbox" : "radio"}
                    name="correct-option"
                    checked={o.is_correct}
                    onChange={e => setOption(i, "is_correct", e.target.checked)}
                    style={{ accentColor: A.teal }}
                  />
                  <input value={o.label} onChange={e => setOption(i, "label", e.target.value)} placeholder={`Option ${i + 1}`}
                    style={{ flex: 1, padding: "8px 10px", background: A.bg, border: `1px solid ${A.border}`, borderRadius: 6, color: A.text, fontSize: 13, fontFamily: sans }} />
                  <Btn small variant="ghost" onClick={() => removeOption(i)}>✕</Btn>
                </div>
              ))}
              <Btn small variant="secondary" onClick={addOption}>+ Add Option</Btn>
            </div>
          )}

          {form.type === "short_answer" && (
            <Input label="Accepted Answers (comma-separated)" value={form.accepted} onChange={v => set("accepted", v)} placeholder="Paris, paris, PARIS" />
          )}

          {form.type === "numeric" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Correct Value" type="number" value={form.numeric_value} onChange={v => set("numeric_value", v)} />
              <Input label="Tolerance (+/-)" type="number" value={form.numeric_tolerance} onChange={v => set("numeric_tolerance", v)} />
            </div>
          )}

          {form.type === "long_form_written" && (
            <>
              <Input label="Rubric Criteria (comma-separated)" value={form.rubric_criteria} onChange={v => set("rubric_criteria", v)} />
              <Input label="Scale (max score per criterion)" type="number" value={form.rubric_scale} onChange={v => set("rubric_scale", v)} />
            </>
          )}

          {form.type === "data_entry_exercise" && (
            <>
              <TextArea label="Fields (one per line: key:Label)" value={form.data_entry_fields} onChange={v => set("data_entry_fields", v)} rows={4} placeholder={"first_name:First Name\nlast_name:Last Name"} />
              <TextArea label="Records (JSON array of objects, keys matching the fields above)" value={form.data_entry_records} onChange={v => set("data_entry_records", v)} rows={6} placeholder='[{"first_name":"Maria","last_name":"Gonzalez"}]' />
            </>
          )}
        </div>

        {error && <div style={{ marginTop: 14, padding: "10px 14px", background: `${A.red}22`, border: `1px solid ${A.red}44`, borderRadius: 8, fontSize: 13, color: A.red }}>{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          <Btn onClick={save} disabled={!form.prompt.trim()}>Save Question</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Section editor (list of questions) ──────────────────────────────────────
function SectionEditor({ section, onSave, onDelete }) {
  const [name, setName] = useState(section.name);
  const [weight, setWeight] = useState(section.weight ?? 1);
  const [questionsToDraw, setQuestionsToDraw] = useState(section.questions_to_draw ?? "");
  const [questions, setQuestions] = useState(section.questions || []);
  const [editingQ, setEditingQ] = useState(null); // null | "new" | question
  const [saving, setSaving] = useState(false);

  const reloadQuestions = async () => {
    const { data } = await supabase
      .from("assessment_questions")
      .select("display_order, questions(id, type, prompt, points, correct_answer, rubric, question_options(id, label, is_correct, display_order))")
      .eq("section_id", section.id)
      .order("display_order");
    setQuestions((data || []).map(r => r.questions));
  };

  const saveSectionMeta = async () => {
    setSaving(true);
    await supabase.from("assessment_sections").update({ name, weight: Number(weight) || 1, questions_to_draw: questionsToDraw === "" ? null : Number(questionsToDraw) }).eq("id", section.id);
    setSaving(false);
    onSave?.();
  };

  const saveQuestion = async (payload) => {
    if (editingQ === "new") {
      const { data: q, error } = await supabase.from("questions").insert({ type: payload.type, prompt: payload.prompt, points: payload.points, correct_answer: payload.correct_answer, rubric: payload.rubric }).select().single();
      if (error) { alert(error.message); return; }
      if (payload.options?.length) {
        await supabase.from("question_options").insert(payload.options.map((o, i) => ({ question_id: q.id, label: o.label, value: o.label, is_correct: o.is_correct, display_order: i })));
      }
      await supabase.from("assessment_questions").insert({ section_id: section.id, question_id: q.id, display_order: questions.length });
    } else {
      await supabase.from("questions").update({ type: payload.type, prompt: payload.prompt, points: payload.points, correct_answer: payload.correct_answer, rubric: payload.rubric }).eq("id", editingQ.id);
      await supabase.from("question_options").delete().eq("question_id", editingQ.id);
      if (payload.options?.length) {
        await supabase.from("question_options").insert(payload.options.map((o, i) => ({ question_id: editingQ.id, label: o.label, value: o.label, is_correct: o.is_correct, display_order: i })));
      }
    }
    setEditingQ(null);
    reloadQuestions();
  };

  const deleteQuestion = async (q) => {
    if (!confirm("Remove this question from the section? (The question itself stays in the bank.)")) return;
    await supabase.from("assessment_questions").delete().eq("section_id", section.id).eq("question_id", q.id);
    reloadQuestions();
  };

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
        <Input label="Section Name" value={name} onChange={setName} />
        <Input label="Weight" type="number" value={weight} onChange={setWeight} />
        <Input label="Draw N of pool (blank = all)" type="number" value={questionsToDraw} onChange={setQuestionsToDraw} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Btn small onClick={saveSectionMeta} disabled={saving}>{saving ? "Saving…" : "Save Section"}</Btn>
        <Btn small variant="danger" onClick={() => onDelete(section)}>Delete Section</Btn>
      </div>

      <div style={{ fontSize: 12, color: A.textMuted, fontFamily: font, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
        Questions ({questions.length})
      </div>
      <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
        {questions.map(q => (
          <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: A.bg, borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: A.text, flex: 1, marginRight: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <Badge color="gray">{q.type.replace(/_/g, " ")}</Badge> <span style={{ marginLeft: 8 }}>{q.prompt}</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <Btn small variant="secondary" onClick={() => setEditingQ(q)}>Edit</Btn>
              <Btn small variant="danger" onClick={() => deleteQuestion(q)}>Remove</Btn>
            </div>
          </div>
        ))}
      </div>
      <Btn small variant="secondary" onClick={() => setEditingQ("new")}>+ Add Question</Btn>

      {editingQ && (
        <QuestionEditor
          question={editingQ === "new" ? {} : editingQ}
          onSave={saveQuestion}
          onCancel={() => setEditingQ(null)}
        />
      )}
    </Card>
  );
}

// ── Assessment editor (metadata + sections) ─────────────────────────────────
function AssessmentEditor({ assessment, adminUser, onBack, onChanged }) {
  const [form, setForm] = useState({ ...assessment });
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const reload = () => {
    supabase.from("assessment_sections").select("*").eq("assessment_id", assessment.id).order("display_order")
      .then(({ data }) => { setSections(data || []); setLoading(false); });
  };
  useEffect(() => { reload(); }, [assessment.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMeta = async () => {
    setSaving(true);
    const { id, current_version_id, ...rest } = form; // eslint-disable-line no-unused-vars
    await supabase.from("assessments").update(rest).eq("id", id);
    setSaving(false);
    onChanged();
  };

  const addSection = async () => {
    const { data } = await supabase.from("assessment_sections").insert({ assessment_id: assessment.id, name: "New Section", display_order: sections.length }).select().single();
    setSections(s => [...s, data]);
  };

  const deleteSection = async (section) => {
    if (!confirm(`Delete section "${section.name}" and all its question assignments?`)) return;
    await supabase.from("assessment_sections").delete().eq("id", section.id);
    reload();
  };

  // Snapshots the full live structure (sections -> questions -> options,
  // including answer keys/rubric) into a new assessment_versions row, and
  // points assessments.current_version_id at it. In-progress attempts
  // already pinned to a prior version are unaffected.
  const publishVersion = async () => {
    setPublishing(true);
    try {
      const { data: liveSections } = await supabase
        .from("assessment_sections")
        .select("id, name, display_order, weight, questions_to_draw, assessment_questions(display_order, questions(id, type, prompt, media_url, points, correct_answer, rubric, question_options(id, label, is_correct, display_order)))")
        .eq("assessment_id", assessment.id)
        .order("display_order");

      const snapshot = {
        sections: (liveSections || []).map(s => ({
          id: s.id, name: s.name, display_order: s.display_order, weight: s.weight, questions_to_draw: s.questions_to_draw,
          questions: (s.assessment_questions || [])
            .sort((a, b) => a.display_order - b.display_order)
            .map(aq => aq.questions)
            .filter(Boolean)
            .map(q => ({
              id: q.id, type: q.type, prompt: q.prompt, media_url: q.media_url, points: q.points,
              correct_answer: q.correct_answer, rubric: q.rubric,
              options: (q.question_options || []).sort((a, b) => a.display_order - b.display_order).map(o => ({ id: o.id, label: o.label, is_correct: o.is_correct })),
            })),
        })),
      };

      const { data: existingVersions } = await supabase.from("assessment_versions").select("version_number").eq("assessment_id", assessment.id).order("version_number", { ascending: false }).limit(1);
      const nextVersion = (existingVersions?.[0]?.version_number || 0) + 1;

      const { data: version, error: versionError } = await supabase
        .from("assessment_versions")
        .insert({ assessment_id: assessment.id, version_number: nextVersion, snapshot, published_by: adminUser?.id })
        .select()
        .single();
      if (versionError) throw versionError;

      await supabase.from("assessments").update({ current_version_id: version.id, version: nextVersion }).eq("id", assessment.id);
      setForm(f => ({ ...f, current_version_id: version.id, version: nextVersion }));
      alert(`Published version ${nextVersion}. Candidates starting new attempts will now see this exact snapshot.`);
    } catch (err) {
      alert(err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: A.textMuted, fontFamily: sans, marginBottom: 16, padding: 0 }}>← Back to Assessments</button>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: A.text }}>{form.name || "New Assessment"}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {form.current_version_id && <Badge color="teal">v{form.version || 1} published</Badge>}
            <Badge color={STATUS_COLOR[form.status]}>{form.status}</Badge>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          <Input label="Name" value={form.name} onChange={v => set("name", v)} />
          <Input label="Slug (matches employer send-flow ids)" value={form.slug} onChange={v => set("slug", v.toLowerCase().replace(/\s+/g, "-"))} />
        </div>
        <div style={{ marginBottom: 14 }}><TextArea label="Description" value={form.description || ""} onChange={v => set("description", v)} rows={2} /></div>
        <div style={{ marginBottom: 14 }}><TextArea label="Instructions (shown to candidate)" value={form.instructions || ""} onChange={v => set("instructions", v)} rows={2} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Select label="Category" value={form.category} onChange={v => set("category", v)} options={CATEGORIES.map(c => ({ value: c, label: c }))} />
          <Select label="Status" value={form.status} onChange={v => set("status", v)} options={["draft", "published", "archived"].map(s => ({ value: s, label: s }))} />
          <Input label="Estimated Minutes" type="number" value={form.estimated_minutes || ""} onChange={v => set("estimated_minutes", Number(v))} />
          <Input label="Passing Score %" type="number" value={form.passing_score ?? 70} onChange={v => set("passing_score", Number(v))} />
        </div>
        <div style={{ display: "flex", gap: 20, marginBottom: 18 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: A.textLight, cursor: "pointer" }}>
            <input type="checkbox" checked={form.randomize_questions} onChange={e => set("randomize_questions", e.target.checked)} style={{ accentColor: A.teal }} /> Randomize question order
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: A.textLight, cursor: "pointer" }}>
            <input type="checkbox" checked={form.randomize_options} onChange={e => set("randomize_options", e.target.checked)} style={{ accentColor: A.teal }} /> Randomize option order
          </label>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={saveMeta} disabled={saving}>{saving ? "Saving…" : "Save Details"}</Btn>
          <Btn variant="secondary" onClick={publishVersion} disabled={publishing || form.status !== "published"}>
            {publishing ? "Publishing…" : "Publish New Version"}
          </Btn>
        </div>
        {form.status !== "published" && <div style={{ fontSize: 12, color: A.textMuted, marginTop: 8 }}>Set status to "published" before publishing a version — candidates only receive published assessments.</div>}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: A.text }}>Sections</div>
        <Btn small onClick={addSection}>+ Add Section</Btn>
      </div>
      {loading ? <div style={{ color: A.textMuted }}>Loading…</div> : sections.map(s => (
        <SectionEditorWrapper key={s.id} section={s} onDelete={deleteSection} />
      ))}
    </div>
  );
}

// Fetches a section's questions once, then hands off to SectionEditor —
// keeps AssessmentEditor from needing to know question shape.
function SectionEditorWrapper({ section, onDelete }) {
  const [questions, setQuestions] = useState(null);
  useEffect(() => {
    supabase
      .from("assessment_questions")
      .select("display_order, questions(id, type, prompt, points, correct_answer, rubric, question_options(id, label, is_correct, display_order))")
      .eq("section_id", section.id)
      .order("display_order")
      .then(({ data }) => setQuestions((data || []).map(r => r.questions)));
  }, [section.id]);

  if (questions === null) return <Card style={{ marginBottom: 14 }}>Loading section…</Card>;
  return <SectionEditor section={{ ...section, questions }} onDelete={onDelete} />;
}

// ── Bundles tab ──────────────────────────────────────────────────────────────
function BundleEditor({ bundle, assessments, onSave, onCancel }) {
  const [form, setForm] = useState({ ...bundle });
  const [selected, setSelected] = useState(new Set(bundle.assessment_ids || []));
  const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 200, overflowY: "auto", padding: "30px 16px" }}>
      <div style={{ width: 560, background: A.bgCard, border: `1px solid ${A.border}`, borderRadius: 16, padding: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: A.text, marginBottom: 18 }}>{bundle.id ? "Edit Bundle" : "New Bundle"}</div>
        <div style={{ display: "grid", gap: 14, marginBottom: 16 }}>
          <Input label="Name" value={form.name || ""} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <Input label="Slug" value={form.slug || ""} onChange={v => setForm(f => ({ ...f, slug: v.toLowerCase().replace(/\s+/g, "-") }))} />
          <TextArea label="Description" value={form.description || ""} onChange={v => setForm(f => ({ ...f, description: v }))} rows={2} />
          <Select label="Status" value={form.status || "draft"} onChange={v => setForm(f => ({ ...f, status: v }))} options={["draft", "published", "archived"].map(s => ({ value: s, label: s }))} />
        </div>
        <div style={{ fontSize: 12, color: A.textMuted, fontFamily: font, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>Included Assessments</div>
        <div style={{ display: "grid", gap: 6, maxHeight: 240, overflowY: "auto", marginBottom: 20 }}>
          {assessments.map(a => (
            <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: A.text, cursor: "pointer", padding: "4px 0" }}>
              <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)} style={{ accentColor: A.teal }} />
              {a.name} <Badge color="gray">{a.category}</Badge>
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          <Btn onClick={() => onSave(form, [...selected])} disabled={!form.name || !form.slug}>Save Bundle</Btn>
        </div>
      </div>
    </div>
  );
}

function BundlesTab({ adminUser }) {
  const [bundles, setBundles] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    Promise.all([
      supabase.from("assessment_bundles").select("*, assessment_bundle_items(assessment_id)").order("created_at", { ascending: false }),
      supabase.from("assessments").select("id, name, category").order("name"),
    ]).then(([bundlesRes, assessmentsRes]) => {
      setBundles((bundlesRes.data || []).map(b => ({ ...b, assessment_ids: (b.assessment_bundle_items || []).map(i => i.assessment_id) })));
      setAssessments(assessmentsRes.data || []);
      setLoading(false);
    });
  };
  useEffect(reload, []);

  const save = async (form, assessmentIds) => {
    const { id, assessment_ids, assessment_bundle_items, ...rest } = form; // eslint-disable-line no-unused-vars
    let bundleId = id;
    if (id) {
      await supabase.from("assessment_bundles").update(rest).eq("id", id);
    } else {
      const { data } = await supabase.from("assessment_bundles").insert({ ...rest, created_by: adminUser?.id }).select().single();
      bundleId = data.id;
    }
    await supabase.from("assessment_bundle_items").delete().eq("bundle_id", bundleId);
    if (assessmentIds.length) {
      await supabase.from("assessment_bundle_items").insert(assessmentIds.map((aid, i) => ({ bundle_id: bundleId, assessment_id: aid, display_order: i })));
    }
    setEditing(null);
    reload();
  };

  const archive = async (bundle) => {
    await supabase.from("assessment_bundles").update({ status: "archived" }).eq("id", bundle.id);
    reload();
  };

  if (loading) return <div style={{ color: A.textMuted }}>Loading bundles…</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: A.textMuted }}>{bundles.length} bundle{bundles.length !== 1 ? "s" : ""}</div>
        <Btn icon="＋" onClick={() => setEditing({ status: "draft" })}>New Bundle</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {bundles.map(b => (
          <Card key={b.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: A.text }}>{b.name}</div>
              <Badge color={STATUS_COLOR[b.status]}>{b.status}</Badge>
            </div>
            <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 10 }}>{b.assessment_ids.length} assessment{b.assessment_ids.length !== 1 ? "s" : ""}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn small variant="secondary" onClick={() => setEditing(b)}>Edit</Btn>
              {b.status !== "archived" && <Btn small variant="danger" onClick={() => archive(b)}>Archive</Btn>}
            </div>
          </Card>
        ))}
      </div>
      {editing && <BundleEditor bundle={editing} assessments={assessments} onSave={save} onCancel={() => setEditing(null)} />}
    </div>
  );
}

// ── Assessments tab ──────────────────────────────────────────────────────────
function AssessmentsTab({ adminUser }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | assessment

  const reload = () => {
    supabase.from("assessments").select("*").order("category").order("name").then(({ data }) => { setAssessments(data || []); setLoading(false); });
  };
  useEffect(reload, []);

  const createNew = async () => {
    const { data, error } = await supabase.from("assessments").insert({ ...EMPTY_ASSESSMENT, slug: `new-assessment-${uniqueSlugSuffix()}`, created_by: adminUser?.id }).select().single();
    if (error) { alert(error.message); return; }
    setEditing(data);
    reload();
  };

  const duplicate = async (assessment) => {
    const { data: newAssessment, error } = await supabase.from("assessments").insert({
      slug: `${assessment.slug}-copy-${uniqueSlugSuffix()}`, name: `${assessment.name} (Copy)`, category: assessment.category,
      description: assessment.description, status: "draft", estimated_minutes: assessment.estimated_minutes,
      passing_score: assessment.passing_score, scoring_method: assessment.scoring_method, instructions: assessment.instructions,
      randomize_questions: assessment.randomize_questions, randomize_options: assessment.randomize_options, created_by: adminUser?.id,
    }).select().single();
    if (error) { alert(error.message); return; }

    const { data: sections } = await supabase
      .from("assessment_sections")
      .select("*, assessment_questions(display_order, question_id)")
      .eq("assessment_id", assessment.id)
      .order("display_order");

    for (const section of sections || []) {
      const { data: newSection } = await supabase.from("assessment_sections").insert({
        assessment_id: newAssessment.id, name: section.name, description: section.description,
        display_order: section.display_order, time_limit_minutes: section.time_limit_minutes,
        weight: section.weight, questions_to_draw: section.questions_to_draw,
      }).select().single();
      const items = (section.assessment_questions || []).map(aq => ({ section_id: newSection.id, question_id: aq.question_id, display_order: aq.display_order }));
      if (items.length) await supabase.from("assessment_questions").insert(items);
    }
    reload();
  };

  const archive = async (assessment) => {
    await supabase.from("assessments").update({ status: "archived" }).eq("id", assessment.id);
    reload();
  };

  if (editing) {
    return <AssessmentEditor assessment={editing} adminUser={adminUser} onBack={() => { setEditing(null); reload(); }} onChanged={reload} />;
  }

  if (loading) return <div style={{ color: A.textMuted }}>Loading assessments…</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: A.textMuted }}>{assessments.length} assessment{assessments.length !== 1 ? "s" : ""}</div>
        <Btn icon="＋" onClick={createNew}>New Assessment</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {assessments.map(a => (
          <Card key={a.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: A.text }}>{a.name}</div>
              <Badge color={STATUS_COLOR[a.status]}>{a.status}</Badge>
            </div>
            <div style={{ fontSize: 11, color: A.textMuted, marginBottom: 10, fontFamily: font }}>/{a.slug} · {a.category}</div>
            {a.current_version_id && <Badge color="teal">v{a.version || 1} published</Badge>}
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <Btn small variant="secondary" onClick={() => setEditing(a)}>Edit</Btn>
              <Btn small variant="secondary" onClick={() => duplicate(a)}>Duplicate</Btn>
              {a.status !== "archived" && <Btn small variant="danger" onClick={() => archive(a)}>Archive</Btn>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function AssessmentsAdminPage({ adminUser }) {
  const [tab, setTab] = useState("assessments");
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: A.text, marginBottom: 4 }}>Assessment Library</div>
        <div style={{ fontSize: 14, color: A.textMuted }}>Manage Jobvair's prebuilt assessments, question banks, and bundles.</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Btn small variant={tab === "assessments" ? "primary" : "secondary"} onClick={() => setTab("assessments")}>Assessments</Btn>
        <Btn small variant={tab === "bundles" ? "primary" : "secondary"} onClick={() => setTab("bundles")}>Bundles</Btn>
      </div>
      {tab === "assessments" && <AssessmentsTab adminUser={adminUser} />}
      {tab === "bundles" && <BundlesTab adminUser={adminUser} />}
    </div>
  );
}
