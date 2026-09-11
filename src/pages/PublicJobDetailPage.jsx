import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Briefcase, DollarSign } from "lucide-react";
import { Badge, Button, Spinner, EmptyState } from "../components/ui/index.js";
import { getPublicJobBySlug } from "../lib/publicJobsApi.js";
import { setPageMeta, setJsonLd, clearJsonLd } from "../lib/seo.js";
import ShareButtons from "../components/ShareButtons.jsx";

function formatSalary(job) {
  if (!job.salary_min && !job.salary_max) return null;
  const fmt = (n) => `$${Number(n).toLocaleString()}`;
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)} ${job.salary_currency || "USD"}`;
  return `${fmt(job.salary_min || job.salary_max)} ${job.salary_currency || "USD"}`;
}

export default function PublicJobDetailPage({ slug, onBack }) {
  const [job, setJob] = useState(undefined); // undefined = loading, null = not found
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicJobBySlug(slug).then(setJob).catch(err => { setError(err.message); setJob(null); });
  }, [slug]);

  useEffect(() => {
    if (!job) return;
    const url = `${window.location.origin}/jobs/${job.slug}`;
    setPageMeta({
      title: `${job.title} at ${job.companies?.name || "Jobvair Employer"} | Jobvair`,
      description: (job.description || `${job.title} — ${job.location || "location varies"}. Apply on Jobvair.`).slice(0, 300),
      url,
      image: job.companies?.logo_url,
    });
    setJsonLd("job-detail-jsonld", {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      title: job.title,
      description: job.description || job.title,
      datePosted: job.published_at,
      employmentType: job.employment_type ? job.employment_type.toUpperCase().replace(/[\s-]+/g, "_") : undefined,
      hiringOrganization: {
        "@type": "Organization",
        name: job.companies?.name,
        sameAs: job.companies?.website,
        logo: job.companies?.logo_url,
      },
      jobLocation: job.location ? {
        "@type": "Place",
        address: { "@type": "PostalAddress", addressLocality: job.location },
      } : undefined,
      jobLocationType: job.work_arrangement === "remote" ? "TELECOMMUTE" : undefined,
      baseSalary: (job.salary_min || job.salary_max) ? {
        "@type": "MonetaryAmount",
        currency: job.salary_currency || "USD",
        value: { "@type": "QuantitativeValue", minValue: job.salary_min, maxValue: job.salary_max, unitText: "YEAR" },
      } : undefined,
    });
    return () => clearJsonLd("job-detail-jsonld");
  }, [job]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--jv-color-page)", fontFamily: "var(--jv-font-sans, 'DM Sans', sans-serif)" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <header style={{ background: "var(--jv-color-surface)", borderBottom: "1px solid var(--jv-color-border)", padding: "18px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--jv-color-heading)", fontWeight: 800, fontSize: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--jv-color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            Jobvair
          </a>
          <a href="/" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--jv-color-primary)", textDecoration: "none" }}>Sign in</a>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 80px" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--jv-color-muted)", fontSize: 13.5, cursor: "pointer", padding: 0, marginBottom: 20 }}>
          <ArrowLeft size={15} /> All jobs
        </button>

        {job === undefined ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>
        ) : job === null ? (
          <EmptyState icon={Briefcase} title="Job not found" description={error || "This job may have been filled or removed."} />
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              {job.companies?.logo_url && <img src={job.companies.logo_url} alt="" width={44} height={44} style={{ borderRadius: 10, objectFit: "cover" }} />}
              <div style={{ fontSize: 14, color: "var(--jv-color-muted)", fontWeight: 600 }}>{job.companies?.name || "Confidential employer"}</div>
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--jv-color-heading)", margin: "0 0 14px", textWrap: "balance" }}>{job.title}</h1>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24, fontSize: 13.5, color: "var(--jv-color-muted)" }}>
              {job.location && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={14} /> {job.location}</span>}
              {job.work_arrangement && <span style={{ textTransform: "capitalize" }}>{job.work_arrangement}</span>}
              {job.employment_type && <Badge tone="neutral">{job.employment_type}</Badge>}
              {formatSalary(job) && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><DollarSign size={14} /> {formatSalary(job)}</span>}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginBottom: 32 }}>
              <Button onClick={() => { window.location.href = "/"; }}>Apply Now</Button>
              <ShareButtons url={`${window.location.origin}/jobs/${job.slug}`} title={`${job.title} at ${job.companies?.name || "this employer"}`} />
            </div>

            {job.description && <Section title="About the role" body={job.description} />}
            {job.responsibilities && <Section title="Responsibilities" body={job.responsibilities} />}
            {job.min_qualifications && <Section title="Minimum qualifications" body={job.min_qualifications} />}
            {job.preferred_qualifications && <Section title="Preferred qualifications" body={job.preferred_qualifications} />}
            {job.benefits && <Section title="Benefits" body={job.benefits} />}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, body }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--jv-color-heading)", margin: "0 0 8px" }}>{title}</h2>
      <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--jv-color-text)", margin: 0, whiteSpace: "pre-wrap" }}>{body}</p>
    </div>
  );
}
