import { Resend } from "resend";

const LEAD_EMAILS = [
  "Patricia.e.mamaril@accenture.com",
  "aristotle.castro@accenture.com",
  "kacelyn.palma@accenture.com",
];
const FROM_EMAIL = "ManilaHealthNode <notifications@manilahealthnode.fun>";

let _resend: Resend | null = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export interface SkillChangePayload {
  submittedBy: string;         // logged-in user who clicked Submit
  memberName: string;          // the name field on the form
  action: "created" | "updated";
  submittedAt: string;         // ISO timestamp
  // current values
  segment: string;
  level: string;
  functionalSkills: string[];
  businessSkills: string[];
  internalAssignment?: string | null;
  // previous values (only present on update)
  previous?: {
    segment: string;
    level: string;
    functionalSkills: string[];
    businessSkills: string[];
    internalAssignment?: string | null;
  } | null;
}

function diff(before: string[], after: string[]) {
  const added   = after.filter((s) => !before.includes(s));
  const removed = before.filter((s) => !after.includes(s));
  const kept    = after.filter((s) =>  before.includes(s));
  return { added, removed, kept };
}

function skillPill(s: string, style: "default" | "added" | "removed") {
  const styles = {
    default:  "background:#eef1f8;border:1px solid #e5e9f2;color:#48516b;",
    added:    "background:#dcfce7;border:1px solid #86efac;color:#15803d;",
    removed:  "background:#fee2e2;border:1px solid #fca5a5;color:#b91c1c;text-decoration:line-through;",
  };
  const prefix = style === "added" ? "+ " : style === "removed" ? "− " : "";
  return `<span style="display:inline-block;${styles[style]}border-radius:6px;padding:3px 10px;font-size:12px;margin:2px;">${prefix}${s}</span>`;
}

function bizPill(s: string, style: "default" | "added" | "removed") {
  const styles = {
    default:  "background:#f3e8ff;border:1px solid #e9d5ff;color:#7a00c4;",
    added:    "background:#dcfce7;border:1px solid #86efac;color:#15803d;",
    removed:  "background:#fee2e2;border:1px solid #fca5a5;color:#b91c1c;text-decoration:line-through;",
  };
  const prefix = style === "added" ? "+ " : style === "removed" ? "− " : "";
  return `<span style="display:inline-block;${styles[style]}border-radius:6px;padding:3px 10px;font-size:12px;margin:2px;">${prefix}${s}</span>`;
}

function fieldChange(label: string, before: string, after: string) {
  if (before === after) return "";
  return `
    <tr>
      <td style="padding:8px 12px;font-size:12px;color:#858ea6;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:8px 12px;font-size:12px;">
        <span style="color:#b91c1c;text-decoration:line-through;">${before}</span>
        <span style="color:#858ea6;margin:0 6px;">→</span>
        <span style="color:#15803d;font-weight:600;">${after}</span>
      </td>
    </tr>`;
}

export async function sendSkillChangeNotification(payload: SkillChangePayload) {
  const resend = getResend();
  if (!resend) return;

  const {
    submittedBy, memberName, action, submittedAt,
    segment, level, functionalSkills, businessSkills, internalAssignment,
    previous,
  } = payload;

  const isUpdate = action === "updated" && previous != null;
  const actionLabel = isUpdate ? "updated their skills entry" : "submitted a new skills entry";
  const subject = `[Manila Health Node] ${memberName} ${actionLabel}`;

  const formattedTime = new Date(submittedAt).toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });

  // Diffs for update
  const fnDiff  = isUpdate ? diff(previous!.functionalSkills, functionalSkills) : null;
  const bizDiff = isUpdate ? diff(previous!.businessSkills,   businessSkills)   : null;

  const hasFieldChanges = isUpdate && (
    previous!.segment !== segment ||
    previous!.level   !== level   ||
    (previous!.internalAssignment ?? "") !== (internalAssignment ?? "")
  );

  const hasSkillChanges = isUpdate && (
    (fnDiff!.added.length + fnDiff!.removed.length + bizDiff!.added.length + bizDiff!.removed.length) > 0
  );

  // Build functional skills section
  let fnSection = "";
  if (isUpdate && fnDiff) {
    const pills = [
      ...fnDiff.removed.map((s) => skillPill(s, "removed")),
      ...fnDiff.kept.map((s)    => skillPill(s, "default")),
      ...fnDiff.added.map((s)   => skillPill(s, "added")),
    ].join("");
    fnSection = pills || "<span style='font-size:12px;color:#858ea6;'>No functional skills listed</span>";
  } else {
    fnSection = functionalSkills.length
      ? functionalSkills.map((s) => skillPill(s, "default")).join("")
      : "<span style='font-size:12px;color:#858ea6;'>None listed</span>";
  }

  // Build business skills section
  let bizSection = "";
  if (isUpdate && bizDiff) {
    const pills = [
      ...bizDiff.removed.map((s) => bizPill(s, "removed")),
      ...bizDiff.kept.map((s)    => bizPill(s, "default")),
      ...bizDiff.added.map((s)   => bizPill(s, "added")),
    ].join("");
    bizSection = pills || "<span style='font-size:12px;color:#858ea6;'>No business skills listed</span>";
  } else {
    bizSection = businessSkills.length
      ? businessSkills.map((s) => bizPill(s, "default")).join("")
      : "<span style='font-size:12px;color:#858ea6;'>None listed</span>";
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0b1120;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(11,17,32,0.07);">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#7a00c4,#a100ff);padding:28px 32px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:0.08em;text-transform:uppercase;">Manila Health Node · Skills Alignment</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
        ${isUpdate ? "✏️ Skills Entry Updated" : "🆕 New Skills Entry Submitted"}
      </h1>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${formattedTime}</p>
    </td>
  </tr>

  <!-- Who / What summary -->
  <tr>
    <td style="padding:24px 32px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e5e9f2;">
        <tr style="background:#f4f6fb;">
          <td style="padding:10px 16px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;letter-spacing:0.06em;width:38%;">Field</td>
          <td style="padding:10px 16px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;letter-spacing:0.06em;">Detail</td>
        </tr>
        <tr style="border-top:1px solid #e5e9f2;">
          <td style="padding:10px 16px;font-size:13px;color:#858ea6;">Member</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0b1120;">${memberName}</td>
        </tr>
        <tr style="border-top:1px solid #e5e9f2;background:#fafbfd;">
          <td style="padding:10px 16px;font-size:13px;color:#858ea6;">Submitted by</td>
          <td style="padding:10px 16px;font-size:13px;color:#0b1120;">
            ${submittedBy === memberName
              ? `${submittedBy} <span style="color:#858ea6;font-size:11px;">(self)</span>`
              : `<strong>${submittedBy}</strong> <span style="color:#858ea6;font-size:11px;">on behalf of ${memberName}</span>`}
          </td>
        </tr>
        <tr style="border-top:1px solid #e5e9f2;">
          <td style="padding:10px 16px;font-size:13px;color:#858ea6;">Action</td>
          <td style="padding:10px 16px;">
            <span style="display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;${isUpdate ? "background:#fef9c3;color:#854d0e;border:1px solid #fde047;" : "background:#dcfce7;color:#15803d;border:1px solid #86efac;"}">
              ${isUpdate ? "Updated" : "New entry"}
            </span>
          </td>
        </tr>
        <tr style="border-top:1px solid #e5e9f2;background:#fafbfd;">
          <td style="padding:10px 16px;font-size:13px;color:#858ea6;">Segment</td>
          <td style="padding:10px 16px;font-size:13px;color:#0b1120;">
            ${isUpdate && previous!.segment !== segment
              ? `<span style="color:#b91c1c;text-decoration:line-through;">${previous!.segment}</span> <span style="color:#858ea6;margin:0 4px;">→</span> <strong style="color:#15803d;">${segment}</strong>`
              : segment}
          </td>
        </tr>
        <tr style="border-top:1px solid #e5e9f2;">
          <td style="padding:10px 16px;font-size:13px;color:#858ea6;">Level</td>
          <td style="padding:10px 16px;font-size:13px;color:#0b1120;">
            ${isUpdate && previous!.level !== level
              ? `<span style="color:#b91c1c;text-decoration:line-through;">${previous!.level}</span> <span style="color:#858ea6;margin:0 4px;">→</span> <strong style="color:#15803d;">${level}</strong>`
              : level}
          </td>
        </tr>
        ${internalAssignment || (isUpdate && previous!.internalAssignment) ? `
        <tr style="border-top:1px solid #e5e9f2;background:#fafbfd;">
          <td style="padding:10px 16px;font-size:13px;color:#858ea6;">Internal Role</td>
          <td style="padding:10px 16px;font-size:13px;color:#0b1120;font-style:italic;">
            ${isUpdate && (previous!.internalAssignment ?? "") !== (internalAssignment ?? "")
              ? `<span style="color:#b91c1c;text-decoration:line-through;">${previous!.internalAssignment || "—"}</span> <span style="color:#858ea6;margin:0 4px;">→</span> <strong style="color:#15803d;">${internalAssignment || "—"}</strong>`
              : (internalAssignment || "—")}
          </td>
        </tr>` : ""}
      </table>
    </td>
  </tr>

  ${isUpdate && !hasFieldChanges && !hasSkillChanges ? `
  <!-- No meaningful changes -->
  <tr>
    <td style="padding:20px 32px 0;">
      <div style="background:#f4f6fb;border-radius:10px;padding:12px 16px;font-size:13px;color:#858ea6;">
        ℹ️ No changes detected — entry was re-submitted with the same values.
      </div>
    </td>
  </tr>` : ""}

  ${isUpdate && hasSkillChanges ? `
  <!-- Change summary -->
  <tr>
    <td style="padding:20px 32px 0;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;letter-spacing:0.06em;">Change Summary</p>
      <div style="background:#f4f6fb;border-radius:10px;padding:12px 16px;font-size:13px;color:#48516b;line-height:1.6;">
        ${fnDiff!.added.length   > 0 ? `<div>✅ <strong>${fnDiff!.added.length}</strong> functional skill${fnDiff!.added.length !== 1 ? "s" : ""} added</div>` : ""}
        ${fnDiff!.removed.length > 0 ? `<div>❌ <strong>${fnDiff!.removed.length}</strong> functional skill${fnDiff!.removed.length !== 1 ? "s" : ""} removed</div>` : ""}
        ${bizDiff!.added.length  > 0 ? `<div>✅ <strong>${bizDiff!.added.length}</strong> business skill${bizDiff!.added.length !== 1 ? "s" : ""} added</div>` : ""}
        ${bizDiff!.removed.length> 0 ? `<div>❌ <strong>${bizDiff!.removed.length}</strong> business skill${bizDiff!.removed.length !== 1 ? "s" : ""} removed</div>` : ""}
      </div>
    </td>
  </tr>` : ""}

  <!-- Functional Skills -->
  <tr>
    <td style="padding:20px 32px 0;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;letter-spacing:0.06em;">
        Functional Skills ${isUpdate && fnDiff ? `<span style="font-weight:400;text-transform:none;letter-spacing:0;">(${fnDiff.added.length > 0 || fnDiff.removed.length > 0 ? "changed" : "unchanged"})</span>` : ""}
      </p>
      <div>${fnSection}</div>
    </td>
  </tr>

  <!-- Business Skills -->
  <tr>
    <td style="padding:16px 32px 0;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;letter-spacing:0.06em;">
        Business Skills ${isUpdate && bizDiff ? `<span style="font-weight:400;text-transform:none;letter-spacing:0;">(${bizDiff.added.length > 0 || bizDiff.removed.length > 0 ? "changed" : "unchanged"})</span>` : ""}
      </p>
      <div>${bizSection}</div>
    </td>
  </tr>

  ${isUpdate ? `
  <!-- Legend -->
  <tr>
    <td style="padding:12px 32px 0;">
      <div style="display:flex;gap:16px;font-size:11px;color:#858ea6;">
        <span style="margin-right:12px;">Legend:</span>
        <span style="color:#15803d;margin-right:10px;">+ Added</span>
        <span style="color:#b91c1c;margin-right:10px;">− Removed</span>
        <span style="color:#48516b;">Unchanged</span>
      </div>
    </td>
  </tr>` : ""}

  <!-- CTA -->
  <tr>
    <td style="padding:24px 32px;">
      <a href="${appUrl}/health-skills"
         style="display:inline-block;background:#a100ff;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">
        View Skills Alignment →
      </a>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:16px 32px;border-top:1px solid #e5e9f2;background:#f4f6fb;">
      <p style="margin:0;font-size:11px;color:#858ea6;">Manila Health Node · GN Health Industry Consulting · Automated notification from manilahealthnode.fun</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: LEAD_EMAILS,
    subject,
    html,
  }).catch((err) => {
    console.error("[email] Failed to send skill change notification:", err);
  });
}
