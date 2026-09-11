import { Badge } from "../../components/ui/index.js";
import { PROVIDERS } from "../providers/providerRegistry.js";

// Read-only capability-detection display — the same registry the
// orchestrator uses to decide which providers to call. A disabled provider
// always shows its reason instead of silently disappearing, so a recruiter
// understands why a source isn't contributing results.
export default function ProviderStatusBar({ providerStatus }) {
  const statusByKey = Object.fromEntries((providerStatus || []).map(s => [s.provider, s]));

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
      {PROVIDERS.map(p => {
        const status = statusByKey[p.provider];
        const tone = !p.enabled ? "neutral" : status && !status.ok ? "danger" : "success";
        return (
          <div
            key={p.provider}
            title={p.enabled ? undefined : p.reason}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999,
              border: "1px solid var(--jv-color-border)", background: "var(--jv-color-surface)", fontSize: 12,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.enabled ? "var(--jv-color-success-600, #16a34a)" : "var(--jv-color-slate-300, #cbd5e1)", display: "inline-block" }} />
            <span style={{ fontWeight: 600, color: "var(--jv-color-heading)" }}>{p.label}</span>
            {p.enabled ? (
              status ? <Badge tone={tone}>{status.count} found</Badge> : <Badge tone="neutral">Ready</Badge>
            ) : (
              <Badge tone="neutral">Not configured</Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
