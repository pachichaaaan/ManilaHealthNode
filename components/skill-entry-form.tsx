"use client";

import { useRef, useState, useTransition, useEffect, useCallback } from "react";
import { X, Plus, Loader2 } from "lucide-react";

const KNOWN_NAMES = [
  "Adrianne Tan-gatue",
  "Aristotle Castro",
  "Bien Jonas Caluyo",
  "Brian Matthew P. Belen",
  "Chelsea Patricia L. Lopez",
  "Earl Zyrus Abeleda",
  "Jon Eric Cuevas",
  "Kacelyn Palma",
  "Kyle Darren Gerente",
  "Mar Alfie Mendoza",
  "Patricia Mamaril",
  "Sai Meghana Paidi",
];

const SEGMENTS = ["Industry Consulting", "Industry Strategy"];
const LEVELS = ["Analyst", "Consultant", "Manager", "Senior Manager", "Associate Director", "Director"];

const FUNCTIONAL_SKILLS = [
  "Agentic AI Solutions", "AI in Healthcare", "AI Product Management", "Appeals & Grievances",
  "Benefit Plan Configuration", "Benefits Administration", "Care Coordination", "Care Management",
  "Care Model Design", "Claims Adjudication", "Claims Management", "Clinical Analytics",
  "Clinical Data Integration", "Clinical Decision Support", "Clinical Informatics", "Clinical Operations",
  "Contact Center Operations", "Data Migration", "Digital Front Door", "Digital Health",
  "Disease Management", "EDI Transactions", "EHR / EMR Systems", "Enrollment & Billing",
  "Epic", "Facets", "Generative AI (GenAI) in Healthcare", "Health Information Exchange (HIE)",
  "Health Interoperability (FHIR)", "Health Interoperability (HL7)", "Health Policy & Regulatory Programs",
  "Healthcare Analytics", "Healthcare Compliance", "Healthcare Workforce Management", "HealthEdge",
  "HEDIS & Quality Reporting", "HIPAA Compliance", "Medicaid", "Medical Coding", "Medicare",
  "Member Engagement", "Member Services", "Oracle Health (Cerner)", "Patient Access", "Patient Engagement",
  "Payer Operations", "Pharmaceutical / Life Sciences Commercial", "Pharmacy Benefits Management (PBM)",
  "Population Health Management", "Prior Authorization", "Provider Contracting", "Provider Credentialing",
  "Provider Data Management", "Provider Enrollment", "Provider Network Management", "Provider Operations",
  "Provider Services", "Public Health", "QNXT", "Quality Management", "Rating, Quoting & Underwriting",
  "Referral Management", "Revenue Cycle Management (RCM)", "Risk Adjustment", "Salesforce Health Cloud",
  "Salesforce Service Cloud", "Social Determinants of Health (SDOH)", "Specialty Pharmacy", "symplr Payer",
  "Utilization Management (UM)", "Utilization Review", "Value-Based Care", "Virtual Health",
];

const BUSINESS_SKILLS = [
  "Agile Delivery", "AI Strategy", "Business Analysis", "Business Case Development",
  "Business Development", "Capability Model Design", "Change Management", "Client Relationship Management",
  "Commercial Due Diligence", "Communications Planning", "Competitive Benchmarking", "Cost Transformation",
  "Cost-Benefit Analysis", "Cross-functional Collaboration", "Current & Future State Assessment",
  "Data Analysis", "Data Strategy & Governance", "Data Visualization", "Decision Support",
  "Delivery Management", "Design Thinking", "Digital Transformation", "Enterprise Transformation",
  "Executive Communication", "Executive Presentation Development", "Financial Modeling",
  "Functional & UAT Testing", "Gap Analysis", "Go-to-Market (GTM) Strategy", "Growth Strategy",
  "Journey Mapping & Service Design", "Knowledge Management", "KPI Development",
  "Leadership & Team Management", "Market Research", "Market Sizing & Opportunity Assessment",
  "Mergers & Acquisitions (M&A) Advisory", "Operating Model Design", "Operational Excellence",
  "Organizational Design", "Performance Management", "PMO & Governance", "Process Automation",
  "Process Improvement", "Process Mapping", "Process Re-engineering", "Product Management",
  "Program Management", "Project Management", "Proposal & RFP Development", "Requirements Gathering",
  "Research & Insights", "Risk Management", "Roadmap Development", "Sales Enablement",
  "Solution Design", "Stakeholder Management", "Strategic Planning", "Strategic Storylining",
  "Technology Assessment", "Technology Strategy", "Training & Adoption", "User Story & Backlog Management",
  "Value Realization", "Vendor Assessment", "Workforce Planning", "Workshop Facilitation",
];

interface FormState {
  name: string;
  segment: string;
  level: string;
  functionalSkills: string[];
  businessSkills: string[];
  internalAssignment: string;
}

const empty: FormState = {
  name: "",
  segment: "Industry Consulting",
  level: "Consultant",
  functionalSkills: ["", "", "", "", "", ""],
  businessSkills: ["", "", "", ""],
  internalAssignment: "",
};

function NameAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [allNames, setAllNames] = useState<string[]>(KNOWN_NAMES);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch any extra submitted names from the DB on mount
  useEffect(() => {
    fetch("/api/skill-entries")
      .then((r) => r.json())
      .then((entries: { name: string }[]) => {
        if (!Array.isArray(entries)) return;
        const extra = entries.map((e) => e.name).filter(
          (n) => !KNOWN_NAMES.some((k) => k.toLowerCase() === n.toLowerCase()),
        );
        if (extra.length > 0) setAllNames([...KNOWN_NAMES, ...extra]);
      })
      .catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSuggestions([]);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      onChange(v);
      setActiveIndex(-1);
      if (v.trim().length === 0) {
        setSuggestions([]);
        return;
      }
      const lower = v.trim().toLowerCase();
      const matches = allNames.filter((n) => n.toLowerCase().startsWith(lower));
      setSuggestions(matches);
    },
    [allNames, onChange],
  );

  function select(name: string) {
    onChange(name);
    setSuggestions([]);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      select(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        required
        placeholder="Full name"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className="h-9 w-full rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-ink placeholder:text-ink-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-surface shadow-[var(--shadow-lg)]">
          {suggestions.map((name, i) => (
            <li key={name}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(name); }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  i === activeIndex
                    ? "bg-gold/15 text-ink"
                    : "text-ink-soft hover:bg-surface-2"
                }`}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SkillEntryForm({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openDialog() {
    setForm(empty);
    setError(null);
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setOpen(false);
  }

  function setFunctional(i: number, val: string) {
    const next = [...form.functionalSkills];
    next[i] = val;
    setForm((f) => ({ ...f, functionalSkills: next }));
  }

  function setBusiness(i: number, val: string) {
    const next = [...form.businessSkills];
    next[i] = val;
    setForm((f) => ({ ...f, businessSkills: next }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const functionalSkills = form.functionalSkills.filter((s) => s.trim());
    const businessSkills = form.businessSkills.filter((s) => s.trim());

    if (!form.name.trim()) { setError("Name is required."); return; }
    if (functionalSkills.length === 0) { setError("At least one functional skill is required."); return; }

    startTransition(async () => {
      try {
        const res = await fetch("/api/skill-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            segment: form.segment,
            level: form.level,
            functionalSkills,
            businessSkills,
            internalAssignment: form.internalAssignment.trim() || null,
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? "Submission failed. Please try again.");
          return;
        }
        closeDialog();
        onSuccess();
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <>
      <button
        onClick={openDialog}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-surface transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <Plus size={15} />
        Add / Update Entry
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-xl rounded-2xl border border-border bg-surface p-0 shadow-[var(--shadow-lg)] backdrop:bg-black/50 backdrop:backdrop-blur-sm open:flex open:flex-col"
        onClose={() => setOpen(false)}
      >
        {open && (
          <form onSubmit={handleSubmit} noValidate>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="font-display text-base font-semibold text-ink">GN Health Skills Entry Form</h2>
                <p className="text-xs text-ink-faint">Fill in all required fields and submit</p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-2 hover:text-ink focus-visible:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5" style={{ maxHeight: "70vh" }}>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink-soft">
                  Name <span className="text-rose-500">*</span>
                </label>
                <NameAutocomplete
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                />
              </div>

              {/* Segment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink-soft">
                  Segment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.segment}
                  onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-ink focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  {SEGMENTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Level */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink-soft">
                  Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-ink focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  {LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>

              {/* Functional Skills */}
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-xs font-semibold text-ink-soft">
                    Functional Skills <span className="text-rose-500">*</span>
                  </p>
                  <p className="text-[11px] text-ink-faint">Select up to 6 key skills (platforms, certifications, domain expertise)</p>
                </div>
                <datalist id="functional-list">
                  {FUNCTIONAL_SKILLS.map((s) => <option key={s} value={s} />)}
                </datalist>
                {form.functionalSkills.map((val, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 text-right text-[11px] text-ink-faint">{i + 1}.</span>
                    <input
                      type="text"
                      list="functional-list"
                      placeholder={`Skill ${i + 1}`}
                      value={val}
                      onChange={(e) => setFunctional(i, e.target.value)}
                      className="h-9 flex-1 rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-ink placeholder:text-ink-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>
                ))}
              </div>

              {/* Business Skills */}
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-xs font-semibold text-ink-soft">Business Skills</p>
                  <p className="text-[11px] text-ink-faint">Select 3–4 key skills (soft skills, management capabilities)</p>
                </div>
                <datalist id="business-list">
                  {BUSINESS_SKILLS.map((s) => <option key={s} value={s} />)}
                </datalist>
                {form.businessSkills.map((val, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 text-right text-[11px] text-ink-faint">{i + 1}.</span>
                    <input
                      type="text"
                      list="business-list"
                      placeholder={`Skill ${i + 1}`}
                      value={val}
                      onChange={(e) => setBusiness(i, e.target.value)}
                      className="h-9 flex-1 rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-ink placeholder:text-ink-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>
                ))}
              </div>

              {/* Internal Assignment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink-soft">Internal Assignment D&S</label>
                <input
                  type="text"
                  placeholder="Optional — e.g. Engagement POC, Market Outreach"
                  value={form.internalAssignment}
                  onChange={(e) => setForm((f) => ({ ...f, internalAssignment: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-ink placeholder:text-ink-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={closeDialog}
                className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-ink-soft hover:bg-surface-2 focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-surface disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {pending && <Loader2 size={14} className="animate-spin" />}
                Submit
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
