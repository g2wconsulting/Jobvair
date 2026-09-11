const STAGES = [
  { key: "describe", label: "Describe" },
  { key: "review", label: "Review Profile" },
  { key: "results", label: "Results" },
];

// step: 1 = describe, 3 = review, 5 = results (matches useIdealCandidateProfile's
// step numbers, which map to the product spec's 7-step flow — steps 2/4/6/7
// are transitions or actions within the "review"/"results" stages rather
// than separate screens).
export default function StepIndicator({ step }) {
  const activeStage = step <= 1 ? "describe" : step <= 3 ? "review" : "results";
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
      {STAGES.map((s, i) => {
        const isActive = s.key === activeStage;
        const isPast = STAGES.findIndex(x => x.key === activeStage) > i;
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999,
              background: isActive ? "var(--jv-color-primary)" : isPast ? "var(--jv-color-teal-50)" : "var(--jv-color-slate-50)",
              color: isActive ? "#fff" : isPast ? "var(--jv-color-primary)" : "var(--jv-color-muted)",
              fontSize: 12.5, fontWeight: 600,
            }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: isActive || isPast ? "rgba(255,255,255,0.25)" : "var(--jv-color-slate-200)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{i + 1}</span>
              {s.label}
            </div>
            {i < STAGES.length - 1 && <div style={{ width: 24, height: 1, background: "var(--jv-color-border)" }} />}
          </div>
        );
      })}
    </div>
  );
}
