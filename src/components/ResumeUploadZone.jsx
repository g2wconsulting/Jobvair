import { useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { C } from "../constants/appConstants.js";
import { Btn } from "./ui.jsx";
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

  const SUPABASE_URL_CLIENT = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY   = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
          border: `2px dashed ${active ? C.teal : done ? C.success : error ? C.danger : C.border}`,
          borderRadius:10, padding:"28px 20px", textAlign:"center",
          background: active ? C.tealLight : done ? C.successBg : C.bg,
          cursor: busy ? "not-allowed" : "pointer", transition:"all 0.15s",
        }}
      >
        {uploading && <>
          <div style={{ fontSize:28, marginBottom:8 }}>⬆️</div>
          <div style={{ fontSize:14, fontWeight:600, color:C.navy }}>Uploading to secure storage…</div>
        </>}
        {parsing && <>
          <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
          <div style={{ fontSize:14, fontWeight:600, color:C.navy }}>Parsing resume with AI…</div>
          <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>Extracting your skills, experience, and education</div>
        </>}
        {done && !busy && <>
          <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
          <div style={{ fontSize:14, fontWeight:600, color:C.success }}>{file?.name}</div>
          <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>Parsed successfully — sections updated below. Click to replace.</div>
        </>}
        {!busy && !done && <>
          <div style={{ fontSize:32, marginBottom:8 }}>📎</div>
          <div style={{ fontSize:14, color:active ? C.tealDark : C.textMuted, marginBottom:10, fontWeight:active?600:400 }}>
            {active ? "Drop to upload" : "Drag & drop PDF or DOCX"}
          </div>
          <Btn variant="secondary" small>Browse Files</Btn>
          <div style={{ fontSize:12, color:C.textLight, marginTop:10 }}>PDF, DOCX, DOC, TXT · max 10 MB</div>
        </>}
      </div>
      {error && (
        <div style={{ marginTop:8, padding:"8px 12px", background:C.dangerBg, borderRadius:8, fontSize:13, color:C.danger }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

