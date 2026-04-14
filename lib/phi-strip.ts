// ─── Lightweight PHI pre-strip ────────────────────────────────────────────
// Regex-based removal of obvious identifiers BEFORE a clinical note hits
// the upstream Claude API. This is defense-in-depth, not a HIPAA-certified
// PHI filter. It catches the most common leak vectors (phone numbers,
// emails, SSNs, MRNs, DOBs, addresses, explicit patient names). Downstream
// prompts also instruct the model to PHI-strip — this is the first pass.
//
// If you need a real PHI filter later, swap this out for a named-entity
// recognizer (e.g., Presidio, MedSpacy, or a dedicated HIPAA redactor).

interface PhiStripResult {
  clean: string;
  redactions: string[];
}

// Patterns ordered from most specific → least specific
const PATTERNS: Array<{ label: string; regex: RegExp; replacement: string }> = [
  // SSN (XXX-XX-XXXX)
  { label: "SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN]" },
  // Phone numbers (US formats)
  {
    label: "PHONE",
    regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: "[PHONE]",
  },
  // Emails
  {
    label: "EMAIL",
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: "[EMAIL]",
  },
  // MRN (explicit label)
  {
    label: "MRN",
    regex: /\b(MRN|Medical Record Number|med rec|chart number)[:\s#]*[\w-]{3,}/gi,
    replacement: "[MRN]",
  },
  // Full dates with year (MM/DD/YYYY, MM-DD-YYYY, Mon DD YYYY)
  {
    label: "DATE",
    regex: /\b(?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b/g,
    replacement: "[DATE]",
  },
  // Month + day + year written out
  {
    label: "DATE",
    regex:
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/gi,
    replacement: "[DATE]",
  },
  // Street addresses (number + street name + common suffix)
  {
    label: "ADDRESS",
    regex:
      /\b\d+\s+[A-Z][a-zA-Z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Way|Court|Ct|Circle|Cir|Place|Pl)\b\.?/gi,
    replacement: "[ADDRESS]",
  },
  // ZIP codes (5 or 9 digit)
  {
    label: "ZIP",
    regex: /\b\d{5}(?:-\d{4})?\b/g,
    replacement: "[ZIP]",
  },
  // Explicit patient name labels: "Patient: John Doe", "PT NAME: Jane Smith"
  {
    label: "PATIENT_NAME",
    regex: /\b(?:patient name|pt name|patient|pt)[:\s]+[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+/gi,
    replacement: "[PATIENT NAME]",
  },
  // Explicit "DOB: ..." lines
  {
    label: "DOB",
    regex: /\b(?:DOB|date of birth|birth date)[:\s]*[\w\s,\-\/]{3,15}/gi,
    replacement: "[DOB]",
  },
  // Insurance member IDs (labeled)
  {
    label: "INSURANCE_ID",
    regex: /\b(?:member\s*id|policy\s*(?:number|#)|subscriber\s*id|insurance\s*id)[:\s#]*[\w-]{4,}/gi,
    replacement: "[INSURANCE ID]",
  },
];

/**
 * Strip obvious identifiers from a clinical note. Returns the cleaned text
 * and a list of redaction labels that were applied.
 */
export function stripPhi(text: string): PhiStripResult {
  if (!text || typeof text !== "string") return { clean: "", redactions: [] };
  let clean = text;
  const redactions = new Set<string>();
  for (const { label, regex, replacement } of PATTERNS) {
    if (regex.test(clean)) {
      clean = clean.replace(regex, replacement);
      redactions.add(label);
    }
  }
  return { clean, redactions: Array.from(redactions) };
}

/**
 * Quick check: does a string LOOK like it contains obvious PHI?
 * Useful for warning a user on the client before they submit.
 */
export function looksLikePhi(text: string): boolean {
  for (const { regex } of PATTERNS) {
    if (regex.test(text)) return true;
  }
  return false;
}
