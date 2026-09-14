// Quick smoke-test for the enriched email notification
// Run with: node scripts/test-email.mjs

import { Resend } from "resend";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../.env.local");
const envVars = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => [l.split("=")[0].trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const apiKey = envVars["RESEND_API_KEY"];
const appUrl = envVars["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

if (!apiKey || apiKey.includes("xxx")) {
  console.error("❌  RESEND_API_KEY is not set in .env.local");
  process.exit(1);
}

const resend = new Resend(apiKey);

// Simulate an UPDATE where Patricia changed her skills
const payload = {
  submittedBy: "Patricia Mamaril",
  memberName: "Patricia Mamaril",
  action: "updated",
  submittedAt: new Date().toISOString(),
  segment: "Industry Consulting",
  level: "Consultant",
  functionalSkills: ["Claims Adjudication", "EHR / EMR Systems", "AI in Healthcare", "Facets"],
  businessSkills: ["Data Analysis", "Process Mapping", "Go-to-Market (GTM) Strategy"],
  internalAssignment: null,
  previous: {
    segment: "Industry Consulting",
    level: "Analyst",                          // level changed
    functionalSkills: ["EHR / EMR Systems", "AI in Healthcare", "Provider Data Management"],  // Claims + Facets added, Provider removed
    businessSkills: ["Data Analysis", "Business Analysis"],   // Process Mapping + GTM added, Business Analysis removed
    internalAssignment: null,
  },
};

// --- inline the email builder so the test doesn't need ts-node ---
function skillPill(s, style) {
  const styles = {
    default: "background:#eef1f8;border:1px solid #e5e9f2;color:#48516b;",
    added:   "background:#dcfce7;border:1px solid #86efac;color:#15803d;",
    removed: "background:#fee2e2;border:1px solid #fca5a5;color:#b91c1c;text-decoration:line-through;",
  };
  const prefix = style === "added" ? "+ " : style === "removed" ? "− " : "";
  return `<span style="display:inline-block;${styles[style]}border-radius:6px;padding:3px 10px;font-size:12px;margin:2px;">${prefix}${s}</span>`;
}
function bizPill(s, style) {
  const styles = {
    default: "background:#f3e8ff;border:1px solid #e9d5ff;color:#7a00c4;",
    added:   "background:#dcfce7;border:1px solid #86efac;color:#15803d;",
    removed: "background:#fee2e2;border:1px solid #fca5a5;color:#b91c1c;text-decoration:line-through;",
  };
  const prefix = style === "added" ? "+ " : style === "removed" ? "− " : "";
  return `<span style="display:inline-block;${styles[style]}border-radius:6px;padding:3px 10px;font-size:12px;margin:2px;">${prefix}${s}</span>`;
}
function diffArr(before, after) {
  return {
    added:   after.filter(s => !before.includes(s)),
    removed: before.filter(s => !after.includes(s)),
    kept:    after.filter(s =>  before.includes(s)),
  };
}

const fnDiff  = diffArr(payload.previous.functionalSkills, payload.functionalSkills);
const bizDiff = diffArr(payload.previous.businessSkills,   payload.businessSkills);

const fnSection  = [...fnDiff.removed.map(s => skillPill(s,"removed")), ...fnDiff.kept.map(s => skillPill(s,"default")), ...fnDiff.added.map(s => skillPill(s,"added"))].join("");
const bizSection = [...bizDiff.removed.map(s => bizPill(s,"removed")), ...bizDiff.kept.map(s => bizPill(s,"default")), ...bizDiff.added.map(s => bizPill(s,"added"))].join("");

const formattedTime = new Date(payload.submittedAt).toLocaleString("en-US", {
  weekday:"long", year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit", timeZoneName:"short",
});

const subject = `[Manila Health Node] ${payload.memberName} updated their skills entry — TEST`;

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0b1120;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(11,17,32,0.07);">
  <tr><td style="background:linear-gradient(135deg,#7a00c4,#a100ff);padding:28px 32px;">
    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:0.08em;text-transform:uppercase;">Manila Health Node · Skills Alignment</p>
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">✏️ Skills Entry Updated</h1>
    <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${formattedTime}</p>
  </td></tr>
  <tr><td style="padding:24px 32px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e5e9f2;">
      <tr style="background:#f4f6fb;"><td style="padding:10px 16px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;width:38%;">Field</td><td style="padding:10px 16px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;">Detail</td></tr>
      <tr style="border-top:1px solid #e5e9f2;"><td style="padding:10px 16px;font-size:13px;color:#858ea6;">Member</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0b1120;">${payload.memberName}</td></tr>
      <tr style="border-top:1px solid #e5e9f2;background:#fafbfd;"><td style="padding:10px 16px;font-size:13px;color:#858ea6;">Submitted by</td><td style="padding:10px 16px;font-size:13px;color:#0b1120;">${payload.submittedBy} <span style="color:#858ea6;font-size:11px;">(self)</span></td></tr>
      <tr style="border-top:1px solid #e5e9f2;"><td style="padding:10px 16px;font-size:13px;color:#858ea6;">Action</td><td style="padding:10px 16px;"><span style="display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;background:#fef9c3;color:#854d0e;border:1px solid #fde047;">Updated</span></td></tr>
      <tr style="border-top:1px solid #e5e9f2;background:#fafbfd;"><td style="padding:10px 16px;font-size:13px;color:#858ea6;">Segment</td><td style="padding:10px 16px;font-size:13px;color:#0b1120;">${payload.segment}</td></tr>
      <tr style="border-top:1px solid #e5e9f2;"><td style="padding:10px 16px;font-size:13px;color:#858ea6;">Level</td><td style="padding:10px 16px;font-size:13px;color:#0b1120;"><span style="color:#b91c1c;text-decoration:line-through;">${payload.previous.level}</span> <span style="color:#858ea6;margin:0 4px;">→</span> <strong style="color:#15803d;">${payload.level}</strong></td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 32px 0;">
    <div style="background:#f4f6fb;border-radius:10px;padding:12px 16px;font-size:13px;color:#48516b;line-height:1.6;">
      ${fnDiff.added.length   > 0 ? `<div>✅ <strong>${fnDiff.added.length}</strong> functional skill${fnDiff.added.length!==1?"s":""} added</div>` : ""}
      ${fnDiff.removed.length > 0 ? `<div>❌ <strong>${fnDiff.removed.length}</strong> functional skill${fnDiff.removed.length!==1?"s":""} removed</div>` : ""}
      ${bizDiff.added.length  > 0 ? `<div>✅ <strong>${bizDiff.added.length}</strong> business skill${bizDiff.added.length!==1?"s":""} added</div>` : ""}
      ${bizDiff.removed.length> 0 ? `<div>❌ <strong>${bizDiff.removed.length}</strong> business skill${bizDiff.removed.length!==1?"s":""} removed</div>` : ""}
    </div>
  </td></tr>
  <tr><td style="padding:20px 32px 0;">
    <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;">Functional Skills <span style="font-weight:400;text-transform:none;">(changed)</span></p>
    <div>${fnSection}</div>
  </td></tr>
  <tr><td style="padding:16px 32px 0;">
    <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;">Business Skills <span style="font-weight:400;text-transform:none;">(changed)</span></p>
    <div>${bizSection}</div>
  </td></tr>
  <tr><td style="padding:12px 32px 0;"><div style="font-size:11px;color:#858ea6;">Legend: <span style="color:#15803d;margin:0 8px;">+ Added</span><span style="color:#b91c1c;margin-right:8px;">− Removed</span><span>Unchanged</span></div></td></tr>
  <tr><td style="padding:24px 32px;"><a href="${appUrl}/health-skills" style="display:inline-block;background:#a100ff;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">View Skills Alignment →</a></td></tr>
  <tr><td style="padding:16px 32px;border-top:1px solid #e5e9f2;background:#f4f6fb;"><p style="margin:0;font-size:11px;color:#858ea6;">Manila Health Node · GN Health Industry Consulting · Automated notification from manilahealthnode.fun</p></td></tr>
</table></td></tr></table>
</body></html>`;

console.log("Sending enriched test email to Patricia.e.mamaril@accenture.com ...");
const { data, error } = await resend.emails.send({
  from: "ManilaHealthNode <notifications@manilahealthnode.fun>",
  to: "Patricia.e.mamaril@accenture.com",
  subject,
  html,
});

if (error) { console.error("❌  Failed:", error); process.exit(1); }
console.log("✅  Email sent! ID:", data?.id);
