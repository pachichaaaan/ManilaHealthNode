// Quick smoke-test for the Resend email notification
// Run with: node scripts/test-email.mjs

import { Resend } from "resend";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local manually
const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../.env.local");
const envVars = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.split("=").map((p, i) => (i === 0 ? p.trim() : l.slice(l.indexOf("=") + 1).trim())))
);

const apiKey = envVars["RESEND_API_KEY"];
const appUrl = envVars["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

if (!apiKey || apiKey.includes("xxx")) {
  console.error("❌  RESEND_API_KEY is not set in .env.local");
  process.exit(1);
}

const resend = new Resend(apiKey);

const payload = {
  submittedBy: "Patricia Mamaril",
  memberName: "Patricia Mamaril",
  action: "updated",
  segment: "Industry Consulting",
  level: "Consultant",
  functionalSkills: ["Claims Adjudication", "EHR / EMR Systems", "AI in Healthcare"],
  businessSkills: ["Data Analysis", "Process Mapping"],
  internalAssignment: null,
};

const subject = `[Manila Health Node] ${payload.memberName} ${payload.action === "created" ? "submitted a new entry" : "updated their entry"}`;

const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0b1120;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(11,17,32,0.07);">
        <tr>
          <td style="background:#a100ff;padding:24px 32px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.75);letter-spacing:0.06em;text-transform:uppercase;">Manila Health Node</p>
            <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Skills Entry Updated — TEST</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#48516b;">
              <strong style="color:#0b1120;">${payload.memberName}</strong> updated their entry. (This is a test email.)
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td width="50%" style="padding:12px 16px;background:#f4f6fb;border-radius:10px 0 0 10px;border-right:1px solid #e5e9f2;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;">Segment</p>
                  <p style="margin:0;font-size:14px;font-weight:500;color:#0b1120;">${payload.segment}</p>
                </td>
                <td width="50%" style="padding:12px 16px;background:#f4f6fb;border-radius:0 10px 10px 0;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;">Level</p>
                  <p style="margin:0;font-size:14px;font-weight:500;color:#0b1120;">${payload.level}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;">Functional Skills</p>
            <div style="margin-bottom:16px;">
              ${payload.functionalSkills.map((s) => `<span style="display:inline-block;background:#eef1f8;border:1px solid #e5e9f2;border-radius:6px;padding:3px 10px;font-size:12px;color:#48516b;margin:2px;">${s}</span>`).join("")}
            </div>
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#858ea6;text-transform:uppercase;">Business Skills</p>
            <div>
              ${payload.businessSkills.map((s) => `<span style="display:inline-block;background:#f3e8ff;border:1px solid #e9d5ff;border-radius:6px;padding:3px 10px;font-size:12px;color:#7a00c4;margin:2px;">${s}</span>`).join("")}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px;">
            <a href="${appUrl}/health-skills" style="display:inline-block;background:#a100ff;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">View Skills Alignment →</a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e5e9f2;background:#f4f6fb;">
            <p style="margin:0;font-size:11px;color:#858ea6;">Manila Health Node · GN Health Industry Consulting · Test notification</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const TEST_TO = "Patricia.e.mamaril@accenture.com";
console.log(`Sending test email to ${TEST_TO} ...`);

const { data, error } = await resend.emails.send({
  from: "ManilaHealthNode <notifications@manilahealthnode.fun>",
  to: TEST_TO,
  subject: `${subject} — TEST`,
  html,
});

if (error) {
  console.error("❌  Failed:", error);
  process.exit(1);
}

console.log("✅  Email sent! ID:", data?.id);
