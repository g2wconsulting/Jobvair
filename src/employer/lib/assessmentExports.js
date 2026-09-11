// Client-side PDF/CSV/Excel export for Jobvair Assess results. Runs
// entirely in the browser against data the employer is already
// authorized to see (scores/responses already fetched under RLS) — no
// server round-trip needed.

// ExcelJS and jsPDF are both sizeable — dynamically imported inside the
// functions that need them so employer pages that never export don't pay
// for the extra bundle weight on every load.

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const RESULT_COLUMNS = [
  { key: "candidate_name", label: "Candidate" },
  { key: "candidate_email", label: "Email" },
  { key: "assessment_slug", label: "Assessment" },
  { key: "overall_score", label: "Score (%)" },
  { key: "passed", label: "Passed" },
  { key: "points_earned", label: "Points Earned" },
  { key: "points_possible", label: "Points Possible" },
  { key: "scored_at", label: "Completed" },
];

export function exportResultsCSV(scores, filename = "assessment-results.csv") {
  const rows = scores.map(s => RESULT_COLUMNS.map(c => csvEscape(s[c.key])).join(","));
  const csv = [RESULT_COLUMNS.map(c => csvEscape(c.label)).join(","), ...rows].join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
}

export async function exportResultsExcel(scores, filename = "assessment-results.xlsx") {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results");
  sheet.columns = RESULT_COLUMNS.map(c => ({ header: c.label, key: c.key, width: 22 }));
  sheet.getRow(1).font = { bold: true };
  scores.forEach(s => sheet.addRow(Object.fromEntries(RESULT_COLUMNS.map(c => [c.key, c.key === "passed" ? (s[c.key] ? "Yes" : "No") : s[c.key]]))));
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

// One candidate's full assessment report — used from the employer's
// results drawer ("Download PDF").
export async function exportCandidatePdf({ invitation, company, result }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt" });
  const marginX = 48;
  let y = 56;

  doc.setFontSize(18).setFont(undefined, "bold");
  doc.text("Jobvair Assess — Candidate Assessment Report", marginX, y);
  y += 28;

  doc.setFontSize(11).setFont(undefined, "normal");
  const meta = [
    ["Employer", company?.name || "—"],
    ["Candidate", invitation.candidate_name],
    ["Email", invitation.candidate_email],
    ["Position / Requisition", invitation.jobs?.title || "—"],
    ["Date Completed", result.attempt.submitted_at ? new Date(result.attempt.submitted_at).toLocaleDateString() : "—"],
  ];
  meta.forEach(([label, value]) => {
    doc.setFont(undefined, "bold").text(`${label}:`, marginX, y);
    doc.setFont(undefined, "normal").text(String(value), marginX + 150, y);
    y += 18;
  });
  y += 12;

  result.scores.forEach(score => {
    if (y > 700) { doc.addPage(); y = 56; }
    doc.setFontSize(13).setFont(undefined, "bold");
    doc.text(score.assessment_slug.replace(/-/g, " "), marginX, y);
    y += 18;
    doc.setFontSize(11).setFont(undefined, "normal");
    doc.text(`Overall score: ${Math.round(score.overall_score)}%  (${score.passed ? "Pass" : "Below Threshold"})`, marginX, y);
    y += 16;
    doc.text(`Points: ${score.points_earned} / ${score.points_possible}`, marginX, y);
    y += 16;

    (score.assessment_section_scores || []).forEach(s => {
      doc.text(`  • ${s.section_name}: ${s.points_earned}/${s.points_possible} (${Math.round(s.percentage)}%)`, marginX, y);
      y += 15;
    });

    const metricsEntries = Object.entries(score.metrics || {});
    if (metricsEntries.length) {
      doc.text(`  Metrics: ${metricsEntries.map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(", ")}`, marginX, y);
      y += 15;
    }

    const written = result.responses.find(r => r.assessment_slug === score.assessment_slug && r.question_type === "long_form_written");
    if (written) {
      y += 6;
      doc.setFont(undefined, "bold").text("Written response:", marginX, y);
      y += 15;
      doc.setFont(undefined, "normal");
      const lines = doc.splitTextToSize(written.response?.text || "", 500);
      lines.forEach(line => {
        if (y > 740) { doc.addPage(); y = 56; }
        doc.text(line, marginX, y);
        y += 14;
      });
      if (written.ai_result?.summary) {
        y += 6;
        doc.setFont(undefined, "italic");
        const summaryLines = doc.splitTextToSize(`AI assessment: ${written.ai_result.summary}`, 500);
        summaryLines.forEach(line => { doc.text(line, marginX, y); y += 14; });
        doc.setFont(undefined, "normal");
      }
    }
    y += 20;
  });

  if (y > 680) { doc.addPage(); y = 56; }
  doc.setFontSize(9).setFont(undefined, "italic");
  const disclaimer = doc.splitTextToSize(
    "Assessment results are intended to provide supplemental information regarding demonstrated skills and should be considered alongside other relevant hiring information.",
    500,
  );
  disclaimer.forEach(line => { doc.text(line, marginX, y); y += 12; });

  doc.save(`${invitation.candidate_name.replace(/\s+/g, "_")}_assessment_report.pdf`);
}
