import { useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "./ui/index.js";
import { Upload, Search, CheckCircle2, Paperclip, AlertTriangle } from "lucide-react";
import { edgeFetch } from "../lib/edgeFetch.js";
import { persistResumeEnrichment } from "../lib/profileEnrichment.js";

export default function ResumeUploadZone({ user, onParsed }) {
  const [active, setActive]     = useState(false);
  const [file, setFile]         = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing]   = useState(false);
  const [error, setError]       = useState(null);
  const [done, setDone]         = useState(false);
  const fileRef                 = useRef(null);

  const accept = ".pdf,.doc,.docx,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const processFile = async (f) => {
    if (!f) return;
    if (!f.name.match(/\.(pdf|docx|doc|txt)$/i)) {
      setError("Please upload a PDF, DOCX, or plain text file.");
      return;
    }
    setFile(f);
    setError(null);
    setDone(false);

    const userId     = user?.id;
    const safeFile   = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploadName = `${userId}/${Date.now()}_${safeFile}`;
    const storagePath = `resumes/${uploadName}`;

    try {
      // Step 1 — Upload to Supabase Storage using the authenticated client
      setUploading(true);
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(uploadName, f, {
          contentType: f.type || "application/octet-stream",
          upsert: false,
        });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      setUploading(false);

      // Step 2 — Create a pending parsed_resumes row using the authenticated client
      const { data: rowData, error: rowError } = await supabase
        .from("parsed_resumes")
        .insert({
          user_id: userId,
          storage_path: storagePath,
          original_filename: f.name,
          parse_status: "processing",
        })
        .select()
        .single();
      if (rowError) throw new Error(`DB row creation failed: ${rowError.message}`);
      const row = rowData;

      // Step 3 — Trigger parse-resume Edge Function
      setParsing(true);
      const parsed = await edgeFetch("parse-resume", {
        user_id:           userId,
        storage_path:      storagePath,
        original_filename: f.name,
        parsed_resume_id:  row.id,
      });
      setParsing(false);

      // Step 4 — Create a resume record so it appears on the Resumes page
      const resumeName = f.name.replace(/\.(pdf|docx|doc|txt)$/i, "").replace(/_/g, " ");
      const hasResumes = await supabase.from("resumes").select("id").eq("user_id", userId).limit(1);
      const isPrimary  = !hasResumes.data?.length; // first resume becomes primary
      const { data: resumeRow, error: resumeError } = await supabase.from("resumes").insert({
        user_id:        userId,
        name:           resumeName,
        template:       "modern",
        is_primary:     isPrimary,
        storage_path:   storagePath,
        parsed_resume_id: row.id,
        sections:       [],
        contact_fields: {
          name:     parsed.full_name  || "",
          email:    parsed.email      || "",
          phone:    parsed.phone      || "",
          location: parsed.location   || "",
        },
      }).select("id").single();
      if (resumeError) throw new Error(`Resume creation failed: ${resumeError.message}`);

      // Step 5 - Persist Candidate Intelligence enrichment so parsed profile
      // data survives refreshes and powers future matching/search.
      await persistResumeEnrichment({
        userId,
        parsed,
        parsedResumeId: row.id,
        sourceResumeId: resumeRow?.id,
      });

      setDone(true);

      // Pass results up to parent to refresh profile state from Supabase.
      if (onParsed) await onParsed(parsed);
    } catch (err) {
      setUploading(false);
      setParsing(false);
      setError(err.message || "Upload failed. Please try again.");
    }
  };

  const busy = uploading || parsing;

  return (
    <div>
      <input ref={fileRef} type="file" accept={accept} style={{ display:"none" }} onChange={e => processFile(e.target.files[0])} />
      <div
        onClick={() => !busy && fileRef.current?.click()}
        onDragEnter={e => { e.preventDefault(); setActive(true); }}
        onDragOver={e => { e.preventDefault(); setActive(true); }}
        onDragLeave={e => { e.preventDefault(); setActive(false); }}
        onDrop={e => { e.preventDefault(); setActive(false); processFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${active ? "var(--jv-color-primary)" : done ? "var(--jv-color-success-600)" : error ? "var(--jv-color-danger-600)" : "var(--jv-color-border)"}`,
          borderRadius: "var(--jv-radius-md)", padding: "28px 20px", textAlign: "center",
          background: active ? "var(--jv-color-teal-50)" : done ? "#dcfce7" : "var(--jv-color-slate-50)",
          cursor: busy ? "not-allowed" : "pointer", transition: "all 0.15s",
        }}
      >
        {uploading && <>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><Upload size={28} color="var(--jv-color-primary)" /></div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--jv-color-heading)" }}>Uploading to secure storage…</div>
        </>}
        {parsing && <>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><Search size={28} color="var(--jv-color-primary)" /></div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--jv-color-heading)" }}>Parsing resume with AI…</div>
          <div style={{ fontSize: 12, color: "var(--jv-color-muted)", marginTop: 4 }}>Extracting your skills, experience, and education</div>
        </>}
        {done && !busy && <>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><CheckCircle2 size={28} color="var(--jv-color-success-600)" /></div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--jv-color-success-600)" }}>{file?.name}</div>
          <div style={{ fontSize: 12, color: "var(--jv-color-muted)", marginTop: 4 }}>Parsed successfully — sections updated below. Click to replace.</div>
        </>}
        {!busy && !done && <>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><Paperclip size={30} color="var(--jv-color-muted)" /></div>
          <div style={{ fontSize: 14, color: active ? "var(--jv-color-teal-700)" : "var(--jv-color-muted)", marginBottom: 10, fontWeight: active ? 600 : 400 }}>
            {active ? "Drop to upload" : "Drag & drop PDF or DOCX"}
          </div>
          <Button variant="secondary" size="sm">Browse Files</Button>
          <div style={{ fontSize: 12, color: "var(--jv-color-slate-300)", marginTop: 10 }}>PDF, DOCX, DOC, TXT · max 10 MB</div>
        </>}
      </div>
      {error && (
        <div style={{ marginTop: 8, padding: "8px 12px", background: "#fef2f2", borderRadius: "var(--jv-radius-sm)", fontSize: 13, color: "var(--jv-color-danger-600)", display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}
    </div>
  );
}

