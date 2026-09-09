// Shared transactional email sending via Resend. Used by
// create-assessment-invitations and resend-assessment-invitation. The API
// key never leaves the server — this module is only ever imported by
// Edge Functions.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Jobvair Assess <assess@notifications.jobvair.com>";

export interface AssessmentInviteEmailParams {
  to: string;
  candidateName: string;
  employerName: string;
  assessmentNames: string[];
  estimatedMinutes: number;
  dueDate: string | null;
  link: string;
}

function escapeHtml(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function buildAssessmentInviteEmail(params: AssessmentInviteEmailParams) {
  const { candidateName, employerName, assessmentNames, estimatedMinutes, dueDate, link } = params;
  const firstName = (candidateName || "there").split(" ")[0];
  const assessmentList = assessmentNames.map(n => `<li style="margin-bottom:4px;">${escapeHtml(n)}</li>`).join("");
  const dueLine = dueDate
    ? `<p style="margin:0 0 16px;font-size:14px;color:#DC2626;"><strong>Due:</strong> ${new Date(dueDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>`
    : "";

  const html = `
<div style="font-family: -apple-system, 'Inter', system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
  <div style="text-align:center; margin-bottom:28px;">
    <div style="display:inline-block; width:40px; height:40px; border-radius:10px; background:#1D4ED8; line-height:40px; color:#fff; font-weight:700; font-size:18px;">J</div>
    <div style="font-size:13px; color:#6B7280; margin-top:8px;">Jobvair Assess</div>
  </div>
  <h1 style="font-size:20px; margin:0 0 12px;">You've been invited to complete an assessment</h1>
  <p style="font-size:14px; line-height:1.6; margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
  <p style="font-size:14px; line-height:1.6; margin:0 0 16px;"><strong>${escapeHtml(employerName)}</strong> has invited you to complete the following assessment${assessmentNames.length !== 1 ? "s" : ""} as part of their hiring process:</p>
  <ul style="font-size:14px; line-height:1.6; padding-left:20px; margin:0 0 16px;">${assessmentList}</ul>
  <p style="font-size:14px; line-height:1.6; margin:0 0 16px;"><strong>Estimated time:</strong> ~${estimatedMinutes} minutes</p>
  ${dueLine}
  <div style="text-align:center; margin:28px 0;">
    <a href="${link}" style="display:inline-block; background:#1D4ED8; color:#fff; text-decoration:none; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600;">Begin Assessment</a>
  </div>
  <p style="font-size:13px; line-height:1.6; color:#6B7280; margin:0 0 8px;"><strong>Before you start:</strong> find a quiet space with a stable internet connection. You'll be asked to certify that you're completing the assessment yourself, without unauthorized assistance.</p>
  <p style="font-size:12px; color:#9CA3AF; margin-top:28px; text-align:center;">This link is unique to you — please don't forward this email. Powered by Jobvair Assess.</p>
</div>`.trim();

  const text = `Hi ${firstName},

${employerName} has invited you to complete the following assessment${assessmentNames.length !== 1 ? "s" : ""}:
${assessmentNames.map(n => `- ${n}`).join("\n")}

Estimated time: ~${estimatedMinutes} minutes
${dueDate ? `Due: ${new Date(dueDate).toLocaleDateString()}\n` : ""}
Begin here: ${link}

Find a quiet space with a stable internet connection before you start. You'll be asked to certify that you're completing the assessment yourself, without unauthorized assistance.`;

  return { html, text };
}

export async function sendAssessmentInvitationEmail(params: AssessmentInviteEmailParams): Promise<{ sent: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { sent: false, error: "Email is not configured yet (missing RESEND_API_KEY)." };
  }
  const { html, text } = buildAssessmentInviteEmail(params);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [params.to],
      subject: `Assessment Invitation — ${params.employerName}`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[email] Resend API error:", res.status, body);
    return { sent: false, error: `Email provider error (${res.status}).` };
  }
  return { sent: true };
}
