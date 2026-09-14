import { Resend } from "resend";

const LEAD_EMAIL = "Patricia.e.mamaril@accenture.com";
const FROM_EMAIL = "ManilaHealthNode <notifications@manilahealthnode.fun>";

let _resend: Resend | null = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export interface SkillChangePayload {
  submittedBy: string;
  memberName: string;
  action: "created" | "updated";
  segment: string;
  level: string;
  functionalSkills: string[];
  businessSkills: string[];
  internalAssignment?: string | null;
}

export async function sendSkillChangeNotification(payload: SkillChangePayload) {
  const resend = getResend();
  if (!resend) return; // no API key configured — skip silently

  const { submittedBy, memberName, action, segment, level, functionalSkills, businessSkills, internalAssignment } = payload;

  const actionLabel = action === "created" ? "submitted a new entry" : "updated their entry";
  const subject = `[Manila Health Node] ${memberName} ${actionLabel}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0b1120;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(11,17,32,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:#a100ff;padding:24px 32px;">
              <p style="margin:0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.75);letter-spacing:0.06em;text-transform:uppercase;">Manila Health Node</p>
              <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Skills Entry ${action === "created" ? "Submitted" : "Updated"}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 20px;font-size:15px;color:#48516b;">
                <strong style="color:#0b1120;">${memberName}</strong> ${actionLabel}.
                ${submittedBy !== memberName ? ` Entry submitted by <strong>${submittedBy}</strong>.` : ""}
              </p>

              <!-- Detail row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="50%" style="padding:12px 16px;background:#f4f6fb;border-radius:10px 0 0 10px;border-right:1px solid #e5e9f2;">
                    <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;letter-spacing:0.06em;">Segment</p>
                    <p style="margin:0;font-size:14px;font-weight:500;color:#0b1120;">${segment}</p>
                  </td>
                  <td width="50%" style="padding:12px 16px;background:#f4f6fb;border-radius:0 10px 10px 0;">
                    <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;letter-spacing:0.06em;">Level</p>
                    <p style="margin:0;font-size:14px;font-weight:500;color:#0b1120;">${level}</p>
                  </td>
                </tr>
              </table>

              <!-- Functional Skills -->
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;letter-spacing:0.06em;">Functional Skills</p>
              <div style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:6px;">
                ${functionalSkills.map((s) => `<span style="display:inline-block;background:#eef1f8;border:1px solid #e5e9f2;border-radius:6px;padding:3px 10px;font-size:12px;color:#48516b;">${s}</span>`).join(" ")}
              </div>

              <!-- Business Skills -->
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;letter-spacing:0.06em;">Business Skills</p>
              <div style="margin-bottom:${internalAssignment ? "16px" : "0"};">
                ${businessSkills.map((s) => `<span style="display:inline-block;background:#f3e8ff;border:1px solid #e9d5ff;border-radius:6px;padding:3px 10px;font-size:12px;color:#7a00c4;">${s}</span>`).join(" ")}
              </div>

              ${internalAssignment ? `
              <!-- Internal Assignment -->
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;letter-spacing:0.06em;">Internal Assignment</p>
              <p style="margin:0;font-size:13px;color:#48516b;font-style:italic;">${internalAssignment}</p>
              ` : ""}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 28px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/health-skills"
                 style="display:inline-block;background:#a100ff;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">
                View Skills Alignment →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e5e9f2;background:#f4f6fb;">
              <p style="margin:0;font-size:11px;color:#858ea6;">Manila Health Node · GN Health Industry Consulting · Automated notification</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: LEAD_EMAIL,
    subject,
    html,
  }).catch((err) => {
    console.error("[email] Failed to send skill change notification:", err);
  });
}
