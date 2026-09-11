import { useEffect, useState } from "react";
import { MapPin, Briefcase } from "lucide-react";
import { Badge, Input, Select, EmptyState, Spinner } from "../components/ui/index.js";
import { listPublicJobs } from "../lib/publicJobsApi.js";
import { setPageMeta, clearJsonLd } from "../lib/seo.js";

function formatSalary(job) {
  if (!job.salary_min && !job.salary_max) return null;
  const fmt = (n) => `$${Number(n).toLocaleString()}`;
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
  return fmt(job.salary_min || job.salary_max);
}

export default function PublicJobsPage({ onOpenJob }) {
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [arrangement, setArrangement] = useState("all");

  useEffect(() => {
    listPublicJobs().then(setJobs).catch(err => { setError(err.message); setJobs([]); });
  }, []);

  useEffect(() => {
    clearJsonLd("job-detail-jsonld");
    setPageMeta({
      title: "Jobs at Jobvair-Powered Employers | Jobvair",
      description: "Browse open roles from employers hiring on Jobvair — search by title, location, and work arrangement.",
      url: `${window.location.origin}/jobs`,
    });
  }, []);

  const locations = jobs ? ["all", ...new Set(jobs.map(j => j.location).filter(Boolean))] : ["all"];

  const filtered = (jobs || []).filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.companies?.name?.toLowerCase().includes(search.toLowerCase());
    const matchLocation = location === "all" || j.location === location;
    const matchArrangement = arrangement === "all" || j.work_arrangement === arrangement;
    return matchSearch && matchLocation && matchArrangement;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--jv-color-page)", fontFamily: "var(--jv-font-sans, 'DM Sans', sans-serif)" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <header style={{ background: "var(--jv-color-surface)", borderBottom: "1px solid var(--jv-color-border)", padding: "18px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--jv-color-heading)", fontWeight: 800, fontSize: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--jv-color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            Jobvair
          </a>
          <a href="/" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--jv-color-primary)", textDecoration: "none" }}>Sign in</a>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--jv-color-heading)", margin: "0 0 8px" }}>Find your next role</h1>
        <p style={{ fontSize: 14.5, color: "var(--jv-color-muted)", margin: "0 0 28px" }}>Open positions from employers hiring on Jobvair.</p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Input placeholder="Search job title or company…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={location} onChange={e => setLocation(e.target.value)}
            options={locations.map(l => ({ value: l, label: l === "all" ? "All locations" : l }))} />
          <Select value={arrangement} onChange={e => setArrangement(e.target.value)}
            options={[{ value: "all", label: "Any arrangement" }, { value: "remote", label: "Remote" }, { value: "hybrid", label: "Hybrid" }, { value: "onsite", label: "Onsite" }]} />
        </div>

        {error && <div style={{ color: "var(--jv-color-danger-600)", fontSize: 13.5, marginBottom: 16 }}>{error}</div>}

        {jobs === null ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Briefcase} title="No open roles right now" description="Check back soon — new positions are posted regularly." />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filtered.map(job => (
              <button
                key={job.id}
                onClick={() => onOpenJob(job.slug)}
                style={{
                  textAlign: "left", background: "var(--jv-color-surface)", border: "1px solid var(--jv-color-border)",
                  borderRadius: "var(--jv-radius-md, 10px)", padding: "18px 20px", cursor: "pointer", font: "inherit", color: "inherit",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--jv-color-heading)", marginBottom: 4 }}>{job.title}</div>
                    <div style={{ fontSize: 13.5, color: "var(--jv-color-muted)" }}>{job.companies?.name || "Confidential employer"}</div>
                  </div>
                  {job.employment_type && <Badge tone="neutral">{job.employment_type}</Badge>}
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, fontSize: 13, color: "var(--jv-color-muted)" }}>
                  {job.location && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={13} /> {job.location}</span>}
                  {job.work_arrangement && <span style={{ textTransform: "capitalize" }}>{job.work_arrangement}</span>}
                  {formatSalary(job) && <span>{formatSalary(job)}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
