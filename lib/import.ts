import ExcelJS from "exceljs";
import type { AssignmentInput } from "./repo";
import type { Classification, Priority, Status, WbsState } from "./types";

/** A parsed row carries the member's NAME; the import route resolves it to a user. */
export type ParsedAssignment = Omit<AssignmentInput, "ownerId"> & { member: string };

const SHEET = "Master Tracker";
const HEADER_ROWS = 4; // real data starts on row 5
const PLACEHOLDER = /^consultant\s*\d+\s*name$/i;

/** Coerce any ExcelJS cell value into trimmed text. */
function text(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    const o = v as unknown as Record<string, unknown>;
    if (typeof o.text === "string") return o.text.trim(); // hyperlink
    if (typeof o.result === "string" || typeof o.result === "number") return String(o.result).trim(); // formula
    if (Array.isArray(o.richText)) return o.richText.map((r) => (r as { text?: string }).text ?? "").join("").trim();
  }
  return String(v).trim();
}

function toIsoDate(v: ExcelJS.CellValue): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) {
    return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate())).toISOString();
  }
  const s = text(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function normClassification(s: string): Classification {
  const t = s.toLowerCase();
  if (t.includes("plus") || t.includes("+1") || t.includes("+ 1")) return "plus_one";
  if (t.includes("project")) return "project";
  return "bd";
}

function normWbs(s: string): WbsState {
  const t = s.trim().toLowerCase();
  if (t === "" || t === "n/a" || t === "na") return "na";
  if (t.startsWith("y")) return "yes";
  if (t.startsWith("p")) return "pending";
  if (t.startsWith("n")) return "no";
  return "na";
}

function normPriority(s: string): Priority {
  const t = s.toLowerCase();
  if (t.startsWith("h")) return "high";
  if (t.startsWith("l")) return "low";
  return "medium";
}

function normStatus(s: string): Status {
  const t = s.toLowerCase();
  if (t.startsWith("clos")) return "closed";
  if (t.includes("hold")) return "on_hold";
  if (t.startsWith("pend")) return "pending";
  return "active";
}

function cleanCode(s: string): string | null {
  const t = s.trim();
  if (!t || t.toLowerCase() === "n/a" || t.toLowerCase() === "na") return null;
  return t;
}

/** Parse the Master Tracker sheet into assignment inputs. Skips template rows. */
type LoadArg = Parameters<ExcelJS.Workbook["xlsx"]["load"]>[0];

export async function parseWorkbook(buffer: Buffer): Promise<ParsedAssignment[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as LoadArg);

  const ws = wb.getWorksheet(SHEET);
  if (!ws) {
    throw new Error(`Sheet "${SHEET}" not found. Use the BD_Plus1_Tracker workbook.`);
  }

  const out: ParsedAssignment[] = [];
  let seq = 0;

  ws.eachRow((row, rowNumber) => {
    if (rowNumber <= HEADER_ROWS) return;
    const c = (col: number) => text(row.getCell(col).value);
    const raw = (col: number) => row.getCell(col).value;

    const client = c(5);
    const member = c(2);
    // Real rows have a client/organisation; template rows are blank or "Consultant N name".
    if (!client || PLACEHOLDER.test(member) || PLACEHOLDER.test(client)) return;
    if (!member) return;

    const classification = normClassification(c(6));
    const wbsProvided =
      classification === "bd"
        ? normWbs(c(13))
        : classification === "plus_one"
          ? normWbs(c(15))
          : "na";
    const wbsCode = classification === "bd" ? cleanCode(c(14)) : classification === "plus_one" ? cleanCode(c(16)) : null;

    const endRaw = raw(12);
    const endDate = text(endRaw).toUpperCase() === "TBD" ? "TBD" : toIsoDate(endRaw);

    seq += 1;
    const parsedSeq = Number(c(1));

    out.push({
      seq: Number.isFinite(parsedSeq) && parsedSeq > 0 ? parsedSeq : seq,
      member,
      role: c(3) || null,
      title: c(4) || null,
      client,
      classification,
      gnPocName: c(7) || null,
      gnPocEmail: c(8) || null,
      keyPriority: c(9) || null,
      offering: c(10) || null,
      startDate: toIsoDate(raw(11)),
      endDate,
      wbsProvided,
      wbsCode,
      estimatedHours: Number(c(17)) || 0,
      actualHours: Number(c(18)) || 0,
      priority: normPriority(c(19)),
      status: normStatus(c(20)),
      notes: c(22) || null,
      lastUpdated: toIsoDate(raw(21)),
    });
  });

  return out;
}
