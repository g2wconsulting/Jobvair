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

async function sendEmail(params: { to: string; subject: string; html: string; text: string }): Promise<{ sent: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { sent: false, error: "Email is not configured yet (missing RESEND_API_KEY)." };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[email] Resend API error:", res.status, body);
    return { sent: false, error: `Email provider error (${res.status}).` };
  }
  return { sent: true };
}

export async function sendAssessmentInvitationEmail(params: AssessmentInviteEmailParams): Promise<{ sent: boolean; error?: string }> {
  const { html, text } = buildAssessmentInviteEmail(params);
  return sendEmail({ to: params.to, subject: `Assessment Invitation — ${params.employerName}`, html, text });
}

export interface CandidateMessageEmailParams {
  to: string;
  candidateName: string;
  employerName: string;
  senderName: string;
  subject: string;
  body: string;
}

export async function sendCandidateMessageEmail(params: CandidateMessageEmailParams): Promise<{ sent: boolean; error?: string }> {
  const firstName = (params.candidateName || "there").split(" ")[0];
  const bodyHtml = escapeHtml(params.body).replace(/\n/g, "<br>");
  const html = `
<div style="font-family: -apple-system, 'Inter', system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
  <div style="text-align:center; margin-bottom:28px;">
    <div style="display:inline-block; width:40px; height:40px; border-radius:10px; background:#1D4ED8; line-height:40px; color:#fff; font-weight:700; font-size:18px;">J</div>
    <div style="font-size:13px; color:#6B7280; margin-top:8px;">Jobvair</div>
  </div>
  <p style="font-size:14px; line-height:1.6; margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
  <p style="font-size:14px; line-height:1.6; margin:0 0 16px; white-space:pre-wrap;">${bodyHtml}</p>
  <p style="font-size:14px; line-height:1.6; margin:24px 0 0;">— ${escapeHtml(params.senderName)}, ${escapeHtml(params.employerName)}</p>
  <p style="font-size:12px; color:#9CA3AF; margin-top:28px; text-align:center;">Sent via Jobvair on behalf of ${escapeHtml(params.employerName)}.</p>
</div>`.trim();
  const text = `Hi ${firstName},\n\n${params.body}\n\n— ${params.senderName}, ${params.employerName}`;
  return sendEmail({ to: params.to, subject: params.subject, html, text });
}

export interface NewApplicantEmailParams {
  to: string;
  jobTitle: string;
  candidateName: string;
  candidateHeadline: string | null;
  applicationUrl: string;
}

export async function sendNewApplicantEmail(params: NewApplicantEmailParams): Promise<{ sent: boolean; error?: string }> {
  const html = `
<div style="font-family: -apple-system, 'Inter', system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
  <div style="text-align:center; margin-bottom:28px;">
    <div style="display:inline-block; width:40px; height:40px; border-radius:10px; background:#1D4ED8; line-height:40px; color:#fff; font-weight:700; font-size:18px;">J</div>
    <div style="font-size:13px; color:#6B7280; margin-top:8px;">Jobvair</div>
  </div>
  <h1 style="font-size:20px; margin:0 0 12px;">New applicant for ${escapeHtml(params.jobTitle)}</h1>
  <p style="font-size:14px; line-height:1.6; margin:0 0 8px;"><strong>${escapeHtml(params.candidateName || "A candidate")}</strong> just applied.</p>
  ${params.candidateHeadline ? `<p style="font-size:14px; line-height:1.6; color:#6B7280; margin:0 0 16px;">${escapeHtml(params.candidateHeadline)}</p>` : ""}
  <div style="text-align:center; margin:28px 0;">
    <a href="${params.applicationUrl}" style="display:inline-block; background:#1D4ED8; color:#fff; text-decoration:none; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:600;">View Application</a>
  </div>
  <p style="font-size:12px; color:#9CA3AF; margin-top:28px; text-align:center;">You're getting this because notifications are on for this job — change that anytime from the job's settings in Jobvair.</p>
</div>`.trim();

  const text = `${params.candidateName || "A candidate"} just applied to ${params.jobTitle}.${params.candidateHeadline ? `\n${params.candidateHeadline}` : ""}\n\nView: ${params.applicationUrl}`;

  return sendEmail({ to: params.to, subject: `New applicant: ${params.jobTitle}`, html, text });
}

export interface InterviewInviteEmailParams {
  to: string;
  candidateName: string;
  employerName: string;
  jobTitle: string;
  scheduledAt: string;
  durationMinutes: number | null;
  location: string | null;
  meetingLink: string | null;
}

export interface AdminOtpEmailParams {
  to: string;
  code: string;
}

export async function sendAdminOtpEmail(params: AdminOtpEmailParams): Promise<{ sent: boolean; error?: string }> {
  const html = `
<div style="font-family: -apple-system, 'Inter', system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #111827;">
  <div style="text-align:center; margin-bottom:28px;">
    <div style="display:inline-block; width:40px; height:40px; border-radius:10px; background:#1D4ED8; line-height:40px; color:#fff; font-weight:700; font-size:18px;">J</div>
    <div style="font-size:13px; color:#6B7280; margin-top:8px;">Jobvair Admin Console</div>
  </div>
  <h1 style="font-size:18px; margin:0 0 12px; text-align:center;">Your sign-in code</h1>
  <div style="text-align:center; margin:24px 0; font-size:32px; font-weight:800; letter-spacing:0.15em; color:#111827;">${escapeHtml(params.code)}</div>
  <p style="font-size:13px; line-height:1.6; color:#6B7280; margin:0 0 8px; text-align:center;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
</div>`.trim();
  const text = `Your Jobvair admin sign-in code: ${params.code}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email.`;
  return sendEmail({ to: params.to, subject: `${params.code} is your Jobvair admin sign-in code`, html, text });
}

export async function sendInterviewInviteEmail(params: InterviewInviteEmailParams): Promise<{ sent: boolean; error?: string }> {
  const firstName = (params.candidateName || "there").split(" ")[0];
  const when = new Date(params.scheduledAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
  const details = [
    params.durationMinutes ? `<strong>Duration:</strong> ${params.durationMinutes} minutes` : null,
    params.location ? `<strong>Location:</strong> ${escapeHtml(params.location)}` : null,
    params.meetingLink ? `<strong>Meeting link:</strong> <a href="${escapeHtml(params.meetingLink)}">${escapeHtml(params.meetingLink)}</a>` : null,
  ].filter(Boolean).map(line => `<p style="font-size:14px; line-height:1.6; margin:0 0 8px;">${line}</p>`).join("");

  const html = `
<div style="font-family: -apple-system, 'Inter', system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
  <div style="text-align:center; margin-bottom:28px;">
    <div style="display:inline-block; width:40px; height:40px; border-radius:10px; background:#1D4ED8; line-height:40px; color:#fff; font-weight:700; font-size:18px;">J</div>
    <div style="font-size:13px; color:#6B7280; margin-top:8px;">Jobvair</div>
  </div>
  <h1 style="font-size:20px; margin:0 0 12px;">You're invited to interview</h1>
  <p style="font-size:14px; line-height:1.6; margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
  <p style="font-size:14px; line-height:1.6; margin:0 0 16px;"><strong>${escapeHtml(params.employerName)}</strong> would like to invite you to interview for <strong>${escapeHtml(params.jobTitle)}</strong>.</p>
  <p style="font-size:14px; line-height:1.6; margin:0 0 8px;"><strong>When:</strong> ${when}</p>
  ${details}
  <p style="font-size:13px; line-height:1.6; color:#6B7280; margin:24px 0 0;">Reply directly to this email if you need to reschedule.</p>
</div>`.trim();

  const text = `Hi ${firstName},

${params.employerName} would like to invite you to interview for ${params.jobTitle}.

When: ${when}
${params.durationMinutes ? `Duration: ${params.durationMinutes} minutes\n` : ""}${params.location ? `Location: ${params.location}\n` : ""}${params.meetingLink ? `Meeting link: ${params.meetingLink}\n` : ""}
Reply directly to this email if you need to reschedule.`;

  return sendEmail({ to: params.to, subject: `Interview Invitation — ${params.employerName}`, html, text });
}
