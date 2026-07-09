import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Button, Card, TextArea, Badge, IconButton } from "../components/ui/index.js";
import { X, History, Sparkles } from "lucide-react";
import { buildPayload, requestSuggestions, applyPatchPreview } from "./builderAssistantClient.js";

const ACTION_PRESETS = [
  { id: "rewrite_summary", label: "Rewrite summary", instruction: "Rewrite my professional summary to be more compelling and concise." },
  { id: "tailor_to_job", label: "Tailor to job description", instruction: "Tailor my resume to the job description I've pasted below." },
  { id: "improve_bullets", label: "Improve bullet points", instruction: "Improve my work experience bullet points with stronger, measurable language." },
  { id: "find_gaps", label: "Find weak or missing sections", instruction: "Identify weak, empty, or missing sections in my resume." },
];

const SEVERITY_TONE = { low: "neutral", medium: "warning", high: "danger" };

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
      background: "var(--jv-color-surface)", borderLeft: "1px solid var(--jv-color-border)", boxShadow: "var(--jv-shadow-lg)",
      zIndex: 60, display: "flex", flexDirection: "column", fontFamily: "var(--jv-font-sans)",
    }}>
      <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--jv-color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 750, color: "var(--jv-color-heading)", display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={16} color="var(--jv-color-primary)" /> Resume Assistant
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--jv-color-muted)" }}>Suggestions only — nothing saves until you apply and save.</p>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <IconButton icon={History} label={historyOpen ? "Assistant" : "History"} onClick={toggleHistory} />
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>
      </div>

      {historyOpen ? (
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {historyLoading && <p style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>Loading history…</p>}
          {historyError && (
            <div style={{ background: "#fef2f2", color: "var(--jv-color-danger-600)", borderRadius: "var(--jv-radius-sm)", padding: "10px 14px", fontSize: 13 }}>
              {historyError}
            </div>
          )}
          {!historyLoading && !historyError && history?.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--jv-color-muted)" }}>No assistant runs yet for this account.</p>
          )}
          {!historyLoading && history?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map(run => (
                <Card key={run.id} style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <Badge tone={run.status === "completed" ? "success" : run.status === "error" ? "danger" : "neutral"}>
                      {run.status}
                    </Badge>
                    <span style={{ fontSize: 11, color: "var(--jv-color-muted)" }}>{new Date(run.created_at).toLocaleString()}</span>
                  </div>
                  {run.instruction && <div style={{ fontSize: 12.5, color: "var(--jv-color-text)", marginBottom: 2 }}>{run.instruction}</div>}
                  {run.message && <div style={{ fontSize: 12, color: "var(--jv-color-muted)" }}>{run.message}</div>}
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div style={{ padding: 20, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ACTION_PRESETS.map(preset => {
            const isActive = actionPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePreset(preset)}
                disabled={loading}
                style={{
                  border: `1.5px solid ${isActive ? "var(--jv-color-primary)" : "var(--jv-color-border)"}`,
                  background: isActive ? "var(--jv-color-teal-50)" : "transparent",
                  color: isActive ? "var(--jv-color-teal-700)" : "var(--jv-color-slate-600)",
                  borderRadius: 20, padding: "6px 12px", fontSize: 12.5, fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <TextArea
          label="What would you like help with?"
          rows={3}
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          placeholder="e.g. Make my summary sound more senior and results-driven"
        />

        <TextArea
          label="Job description (optional)"
          rows={4}
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste a job description to tailor suggestions to it"
        />

        <Button full disabled={loading || !instruction.trim()} onClick={() => runAssistant()} icon={Sparkles}>
          {loading ? "Thinking..." : "Get suggestions"}
        </Button>

        {error && (
          <div style={{ background: "#fef2f2", color: "var(--jv-color-danger-600)", borderRadius: "var(--jv-radius-sm)", padding: "10px 14px", fontSize: 13 }}>
            {error}
          </div>
        )}

        {response && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, borderTop: "1px solid var(--jv-color-border)", paddingTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {isMock && <Badge tone="neutral">Preview mode (mock)</Badge>}
              {typeof response.confidence?.overall === "number" && (
                <Badge tone="info">{Math.round(response.confidence.overall * 100)}% confidence</Badge>
              )}
            </div>

            <p style={{ margin: 0, fontSize: 13.5, color: "var(--jv-color-text)", lineHeight: 1.5 }}>{response.message}</p>

            {changes.length > 0 && (
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 8 }}>Proposed changes ({changes.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                  {changes.map((c, i) => (
                    <div key={i} style={{ fontSize: 12, borderBottom: i < changes.length - 1 ? "1px solid var(--jv-color-border)" : "none", paddingBottom: 8 }}>
                      <div style={{ color: "var(--jv-color-muted)", marginBottom: 2 }}>{c.path}</div>
                      {c.before !== undefined && (
                        <div style={{ color: "var(--jv-color-danger-600)", textDecoration: "line-through", wordBreak: "break-word" }}>
                          {typeof c.before === "string" ? c.before : JSON.stringify(c.before)}
                        </div>
                      )}
                      {c.after !== undefined && (
                        <div style={{ color: "var(--jv-color-success-600)", wordBreak: "break-word" }}>
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
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--jv-color-heading)" }}>Suggestions</div>
                {response.suggestions.map((s, i) => (
                  <Card key={s.id || i} style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <Badge tone={SEVERITY_TONE[s.severity] || "neutral"}>{s.type}</Badge>
                      {typeof s.confidence === "number" && <span style={{ fontSize: 11, color: "var(--jv-color-muted)" }}>{Math.round(s.confidence * 100)}%</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--jv-color-text)" }}>{s.message}</div>
                  </Card>
                ))}
              </div>
            )}

            {response.warnings?.filter(w => w.code !== "mock_response").map((w, i) => (
              <div key={i} style={{ fontSize: 12, color: "var(--jv-color-warning-600)", background: "#fffbeb", borderRadius: "var(--jv-radius-sm)", padding: "8px 12px" }}>
                {w.message}
              </div>
            ))}

            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" onClick={() => { setResponse(null); setPreview(null); }} full>Discard</Button>
              <Button onClick={handleApply} disabled={applied || !changes.length} full>
                {applied ? "Applied ✓" : "Apply changes"}
              </Button>
            </div>
            {applied && (
              <p style={{ margin: 0, fontSize: 12, color: "var(--jv-color-muted)" }}>
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
