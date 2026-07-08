import { useState } from "react";
import { supabase } from "../supabaseClient";
import { C } from "../constants/appConstants.js";
import { Btn, Card, Input, Badge } from "../components/ui.jsx";
import { buildPayload, requestSuggestions, applyPatchPreview } from "./builderAssistantClient.js";

const ACTION_PRESETS = [
  { id: "rewrite_summary", label: "Rewrite summary", instruction: "Rewrite my professional summary to be more compelling and concise." },
  { id: "tailor_to_job", label: "Tailor to job description", instruction: "Tailor my resume to the job description I've pasted below." },
  { id: "improve_bullets", label: "Improve bullet points", instruction: "Improve my work experience bullet points with stronger, measurable language." },
  { id: "find_gaps", label: "Find weak or missing sections", instruction: "Identify weak, empty, or missing sections in my resume." },
];

const SEVERITY_COLOR = { low: "gray", medium: "gold", high: "danger" };

/**
 * Resume Assistant panel (Phase 3).
 *
 * Renders inside the Resume Builder. Takes the current builder state, lets the
 * user describe what they want, calls the assistant, and previews the
 * resulting patch before the user explicitly applies or discards it.
 *
 * Nothing here writes to Supabase directly — applying a patch only updates
 * local builder state via the provided setters. The existing `saveResume()`
 * flow still owns persistence.
 */
export default function AssistantPanel({
  onClose,
  builderState,
  onApply, // (previewPayload) => void — caller maps this back into builder state
}) {
  const [instruction, setInstruction] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [actionPreset, setActionPreset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [preview, setPreview] = useState(null);
  const [applied, setApplied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const loadHistory = async () => {
    if (!builderState?.user_id) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("resume_assistant_runs")
        .select("id, instruction, status, message:response_json->>message, created_at")
        .eq("user_id", builderState.user_id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (fetchError) throw fetchError;
      setHistory(data || []);
    } catch (err) {
      setHistoryError(err.message || "Couldn't load assistant history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleHistory = () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next && history === null) loadHistory();
  };

  const runAssistant = async (overrideInstruction) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setPreview(null);
    setApplied(false);
    try {
      const payload = buildPayload({
        ...builderState,
        instruction: overrideInstruction ?? instruction,
        job_description: jobDescription,
        action_preset: actionPreset,
      });
      const res = await requestSuggestions(payload);
      const prev = applyPatchPreview(payload, res);
      setResponse(res);
      setPreview(prev);
    } catch (err) {
      setError(err.message || "The assistant couldn't process that request.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (preset) => {
    setActionPreset(preset.id);
    setInstruction(preset.instruction);
    runAssistant(preset.instruction);
  };

  const handleApply = () => {
    if (!preview?.payload) return;
    onApply(preview.payload);
    setApplied(true);
  };

  const isMock = response?.warnings?.some(w => w.code === "mock_response");
  const changes = preview?.diff || [];

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 420, maxWidth: "100vw",
      background: C.bgCard, borderLeft: `1px solid ${C.border}`, boxShadow: "-8px 0 24px rgba(0,0,0,0.08)",
      zIndex: 60, display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.navy }}>Resume Assistant</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>Suggestions only — nothing saves until you apply and save.</p>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Btn variant="ghost" small onClick={toggleHistory}>{historyOpen ? "Assistant" : "History"}</Btn>
          <Btn variant="ghost" small onClick={onClose}>✕</Btn>
        </div>
      </div>

      {historyOpen ? (
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {historyLoading && <p style={{ fontSize: 13, color: C.textMuted }}>Loading history…</p>}
          {historyError && (
            <div style={{ background: C.dangerBg, color: C.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
              {historyError}
            </div>
          )}
          {!historyLoading && !historyError && history?.length === 0 && (
            <p style={{ fontSize: 13, color: C.textMuted }}>No assistant runs yet for this account.</p>
          )}
          {!historyLoading && history?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map(run => (
                <Card key={run.id} style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <Badge color={run.status === "completed" ? "success" : run.status === "error" ? "danger" : "gray"} small>
                      {run.status}
                    </Badge>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{new Date(run.created_at).toLocaleString()}</span>
                  </div>
                  {run.instruction && <div style={{ fontSize: 12.5, color: C.text, marginBottom: 2 }}>{run.instruction}</div>}
                  {run.message && <div style={{ fontSize: 12, color: C.textMuted }}>{run.message}</div>}
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div style={{ padding: 20, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ACTION_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handlePreset(preset)}
              disabled={loading}
              style={{
                border: `1.5px solid ${actionPreset === preset.id ? C.teal : C.border}`,
                background: actionPreset === preset.id ? C.tealLight : "transparent",
                color: actionPreset === preset.id ? C.tealDark : C.slate,
                borderRadius: 20, padding: "6px 12px", fontSize: 12.5, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <Input
          label="What would you like help with?"
          textarea
          rows={3}
          value={instruction}
          onChange={setInstruction}
          placeholder="e.g. Make my summary sound more senior and results-driven"
        />

        <Input
          label="Job description (optional)"
          textarea
          rows={4}
          value={jobDescription}
          onChange={setJobDescription}
          placeholder="Paste a job description to tailor suggestions to it"
        />

        <Btn full disabled={loading || !instruction.trim()} onClick={() => runAssistant()}>
          {loading ? "Thinking..." : "Get suggestions"}
        </Btn>

        {error && (
          <div style={{ background: C.dangerBg, color: C.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
            {error}
          </div>
        )}

        {response && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {isMock && <Badge color="gray" small>Preview mode (mock)</Badge>}
              {typeof response.confidence?.overall === "number" && (
                <Badge color="teal" small>{Math.round(response.confidence.overall * 100)}% confidence</Badge>
              )}
            </div>

            <p style={{ margin: 0, fontSize: 13.5, color: C.text, lineHeight: 1.5 }}>{response.message}</p>

            {changes.length > 0 && (
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Proposed changes ({changes.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                  {changes.map((c, i) => (
                    <div key={i} style={{ fontSize: 12, borderBottom: i < changes.length - 1 ? `1px solid ${C.border}` : "none", paddingBottom: 8 }}>
                      <div style={{ color: C.textMuted, marginBottom: 2 }}>{c.path}</div>
                      {c.before !== undefined && (
                        <div style={{ color: C.danger, textDecoration: "line-through", wordBreak: "break-word" }}>
                          {typeof c.before === "string" ? c.before : JSON.stringify(c.before)}
                        </div>
                      )}
                      {c.after !== undefined && (
                        <div style={{ color: C.success, wordBreak: "break-word" }}>
                          {typeof c.after === "string" ? c.after : JSON.stringify(c.after)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {response.suggestions?.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.navy }}>Suggestions</div>
                {response.suggestions.map((s, i) => (
                  <Card key={s.id || i} style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <Badge color={SEVERITY_COLOR[s.severity] || "gray"} small>{s.type}</Badge>
                      {typeof s.confidence === "number" && <span style={{ fontSize: 11, color: C.textMuted }}>{Math.round(s.confidence * 100)}%</span>}
                    </div>
                    <div style={{ fontSize: 13, color: C.text }}>{s.message}</div>
                  </Card>
                ))}
              </div>
            )}

            {response.warnings?.filter(w => w.code !== "mock_response").map((w, i) => (
              <div key={i} style={{ fontSize: 12, color: C.warning, background: C.warningBg, borderRadius: 8, padding: "8px 12px" }}>
                {w.message}
              </div>
            ))}

            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" onClick={() => { setResponse(null); setPreview(null); }} full>Discard</Btn>
              <Btn
                onClick={handleApply}
                disabled={applied || !changes.length}
                full
              >
                {applied ? "Applied ✓" : "Apply changes"}
              </Btn>
            </div>
            {applied && (
              <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
                Changes are applied in the builder. Click Save in the toolbar to persist them.
              </p>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
