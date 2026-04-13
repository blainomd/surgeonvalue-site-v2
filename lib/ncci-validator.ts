"use strict";

// ─── NCCI Validation Engine ──────────────────────────────────────────────────
// Deterministic rules engine that validates CPT code combinations against
// CMS National Correct Coding Initiative (NCCI) edits BEFORE codes surface
// to a surgeon. No LLM in the loop. Pure rules.
//
// Data sources:
//   - NCCI PTP (Procedure-to-Procedure) edits: CMS quarterly release
//   - NCCI MUE (Medically Unlikely Edits): CMS quarterly release
//   - Modifier indicators per CMS NCCI Policy Manual (Chapter 3)
//
// NCCI edit effective date: Q1 2025 (January 1, 2025)
// Next scheduled update: Q2 2025 (April 1, 2025) — update data layer quarterly
//
// Modifier indicator values:
//   0 = Modifier NOT allowed — edit cannot be bypassed
//   1 = Modifier allowed — modifier 59/X{EPSU} may override
//   9 = Edit does not apply
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NCCIError {
  type: "PTP_VIOLATION" | "MUE_VIOLATION" | "UNBUNDLING" | "MUTUALLY_EXCLUSIVE";
  col1Code: string;
  col2Code: string;
  message: string;
  modifierAllowed: boolean;
  suggestedModifier?: string;
  editSource: "NCCI_PTP" | "NCCI_MUE" | "CCI_MEDICALLY_EXCLUSIVE";
}

export interface NCCIWarning {
  type:
    | "MODIFIER_REQUIRED"
    | "DOCUMENTATION_REQUIRED"
    | "SAME_SITE_RESTRICTION"
    | "TCM_EM_CONFLICT"
    | "RTM_OVERLAP";
  codes: string[];
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: NCCIError[];
  warnings: NCCIWarning[];
  suggestions: string[];
  codesChecked: string[];
  editVersion: string;
}

// ─── PTP Edit Record ─────────────────────────────────────────────────────────
// col1: Column 1 code (comprehensive — allowed when billed alone)
// col2: Column 2 code (component — bundled into col1, cannot bill separately)
// modifierIndicator:
//   0 = edit cannot be bypassed regardless of modifier
//   1 = modifier 59 or X{EPSU} may allow separate billing if distinct service
export interface PTPEdit {
  col1: string;
  col2: string;
  modifierIndicator: 0 | 1;
  description: string;
}

// ─── MUE Record ──────────────────────────────────────────────────────────────
// units: maximum units billable per date of service
// adjudicationIndicator:
//   1 = line item edit — per date of service
//   2 = date of service edit — absolute maximum
//   3 = date of service edit — clinical rationale
export interface MUEEdit {
  code: string;
  units: number;
  adjudicationIndicator: 1 | 2 | 3;
  description: string;
}

// ─── Code Unit Submission ────────────────────────────────────────────────────
export interface CodeUnit {
  code: string;
  units?: number; // defaults to 1 if not provided
}

// ─── NCCI PTP Data ───────────────────────────────────────────────────────────
// Source: CMS NCCI Physician PTP edits, Q1 2025
// Covers orthopedic surgical codes + E/M + TCM + RTM in scope for SurgeonValue
//
// Rules are DIRECTIONAL: col1 is comprehensive, col2 is component.
// If col1 is billed, col2 cannot also be billed (unless modifier indicator = 1
// AND a valid distinct-service modifier is appended to col2).

export const PTP_EDITS: PTPEdit[] = [
  // ── Knee Arthroplasty ────────────────────────────────────────────────────
  {
    col1: "27447",
    col2: "27446",
    modifierIndicator: 0,
    description:
      "Total knee arthroplasty (27447) includes partial knee arthroplasty (27446). " +
      "These are mutually exclusive — you cannot bill both for the same knee on the same day.",
  },
  {
    col1: "27447",
    col2: "27486",
    modifierIndicator: 0,
    description:
      "Total knee arthroplasty (27447) includes revision knee arthroplasty component (27486). " +
      "Cannot bill both on the same date for the same joint.",
  },
  {
    col1: "27447",
    col2: "27345",
    modifierIndicator: 1,
    description:
      "27447 includes excision of prepatellar bursa (27345) unless performed at a distinctly " +
      "separate anatomical site with independent documentation.",
  },
  {
    col1: "27447",
    col2: "20680",
    modifierIndicator: 1,
    description:
      "Hardware removal (20680) is bundled into 27447 when performed at the same operative site. " +
      "Modifier 59/XS may apply if a distinct separate implant removal is performed.",
  },
  {
    col1: "27447",
    col2: "27310",
    modifierIndicator: 0,
    description:
      "Arthrotomy for infection (27310) is bundled into total knee arthroplasty (27447).",
  },

  // ── Hip Arthroplasty ─────────────────────────────────────────────────────
  {
    col1: "27130",
    col2: "27125",
    modifierIndicator: 0,
    description:
      "Total hip arthroplasty (27130) includes partial hip replacement (27125). " +
      "Mutually exclusive — cannot bill both on the same day for the same hip.",
  },
  {
    col1: "27130",
    col2: "27236",
    modifierIndicator: 0,
    description:
      "Total hip arthroplasty (27130) includes open treatment of femoral fracture (27236). " +
      "These procedures cannot be billed together.",
  },
  {
    col1: "27130",
    col2: "20680",
    modifierIndicator: 1,
    description:
      "Hardware removal (20680) bundled into 27130 at the same operative site. " +
      "Modifier 59/XS may apply for distinct separate hardware removal.",
  },
  {
    col1: "27130",
    col2: "27093",
    modifierIndicator: 1,
    description:
      "Hip arthrography (27093) is included in total hip arthroplasty evaluation. " +
      "Modifier 59 required if performed at a distinctly separate encounter.",
  },

  // ── Knee Arthroscopy ─────────────────────────────────────────────────────
  {
    col1: "29880",
    col2: "29881",
    modifierIndicator: 0,
    description:
      "Knee arthroscopy with meniscectomy medial AND lateral (29880) includes " +
      "arthroscopy with meniscectomy single compartment (29881). " +
      "29880 is the more comprehensive code — bill 29880, not 29880 + 29881.",
  },
  {
    col1: "29880",
    col2: "29876",
    modifierIndicator: 1,
    description:
      "Synovectomy (29876) bundled into 29880 unless performed in a distinct " +
      "compartment with independent documentation.",
  },
  {
    col1: "29881",
    col2: "29871",
    modifierIndicator: 1,
    description:
      "Knee arthroscopy for treatment of infection (29871) bundled into 29881 " +
      "when performed in the same compartment at the same session.",
  },
  {
    col1: "29881",
    col2: "29874",
    modifierIndicator: 1,
    description:
      "Removal of loose body (29874) bundled into 29881 unless performed " +
      "in a distinctly separate compartment. Modifier 59/XS required.",
  },
  {
    col1: "29881",
    col2: "29876",
    modifierIndicator: 1,
    description:
      "Synovectomy (29876) bundled into 29881 unless performed independently " +
      "in a distinct compartment.",
  },
  {
    col1: "29881",
    col2: "29877",
    modifierIndicator: 1,
    description:
      "Debridement/shaving of articular cartilage (29877) bundled into 29881 " +
      "at the same compartment. Modifier 59/XS required for distinct site.",
  },

  // ── Shoulder Arthroscopy ─────────────────────────────────────────────────
  {
    col1: "29827",
    col2: "29826",
    modifierIndicator: 1,
    description:
      "Shoulder rotator cuff repair (29827) includes subacromial decompression (29826) " +
      "when performed at the same operative session on the same shoulder. " +
      "Per CMS NCCI, 29826 is bundled into 29827. Modifier 59 does NOT overcome this " +
      "edit when both are performed on the same shoulder in the same session — " +
      "document clearly if truly separate procedures at distinct sites.",
  },
  {
    col1: "29827",
    col2: "29819",
    modifierIndicator: 1,
    description:
      "Removal of loose body from shoulder (29819) bundled into rotator cuff repair (29827) " +
      "at the same operative session. Modifier 59/XS may apply for distinct anatomical site.",
  },
  {
    col1: "29827",
    col2: "29821",
    modifierIndicator: 1,
    description:
      "Shoulder arthroscopy synovectomy (29821) bundled into rotator cuff repair (29827).",
  },
  {
    col1: "29826",
    col2: "29819",
    modifierIndicator: 1,
    description:
      "Removal of loose body (29819) bundled into subacromial decompression (29826) " +
      "at the same shoulder session.",
  },

  // ── Spine ────────────────────────────────────────────────────────────────
  {
    col1: "22551",
    col2: "22552",
    modifierIndicator: 1,
    description:
      "ACDF at first level (22551) and additional level (22552): 22552 is an add-on code " +
      "that is appropriate per level but should be coded as 22551 + 22552 x N additional levels. " +
      "Do not bill 22551 twice — use 22552 for each additional level.",
  },
  {
    col1: "22551",
    col2: "20930",
    modifierIndicator: 1,
    description:
      "Allograft (20930) may be separately reported with ACDF when the graft is specifically " +
      "documented as a structural allograft. When autograft harvesting is bundled, " +
      "bill 20937 or 20938, not 20930.",
  },
  {
    col1: "22612",
    col2: "22614",
    modifierIndicator: 1,
    description:
      "Lumbar arthrodesis (22612) and additional level (22614): 22614 is an add-on. " +
      "Bill 22612 + 22614 per additional level. Do not bill 22612 twice.",
  },
  {
    col1: "63030",
    col2: "63035",
    modifierIndicator: 1,
    description:
      "Lumbar laminotomy (63030) and additional level (63035): 63035 is an add-on code. " +
      "Bill 63030 + 63035 per additional level. Do not bill 63030 twice.",
  },
  {
    col1: "22612",
    col2: "63030",
    modifierIndicator: 1,
    description:
      "Lumbar arthrodesis (22612) and lumbar laminotomy (63030) can be billed together " +
      "when performed at distinct levels or as distinct components — but require " +
      "modifier 51/59 and clear operative documentation distinguishing each procedure.",
  },

  // ── E/M bundling with procedures ─────────────────────────────────────────
  {
    col1: "99213",
    col2: "99212",
    modifierIndicator: 0,
    description:
      "E/M codes are mutually exclusive at the same level or lower level on the same date. " +
      "Bill only the highest level E/M code for a given encounter.",
  },
  {
    col1: "99214",
    col2: "99213",
    modifierIndicator: 0,
    description:
      "E/M codes are mutually exclusive. Bill only the highest level for the encounter.",
  },
  {
    col1: "99215",
    col2: "99214",
    modifierIndicator: 0,
    description:
      "E/M codes are mutually exclusive. Bill only the highest level for the encounter.",
  },
  {
    col1: "99215",
    col2: "99213",
    modifierIndicator: 0,
    description:
      "E/M codes are mutually exclusive. Bill only the highest level for the encounter.",
  },
  {
    col1: "99215",
    col2: "99212",
    modifierIndicator: 0,
    description:
      "E/M codes are mutually exclusive. Bill only the highest level for the encounter.",
  },
  {
    col1: "99214",
    col2: "99212",
    modifierIndicator: 0,
    description:
      "E/M codes are mutually exclusive. Bill only the highest level for the encounter.",
  },

  // ── TCM + E/M conflicts ───────────────────────────────────────────────────
  {
    col1: "99496",
    col2: "99495",
    modifierIndicator: 0,
    description:
      "TCM codes 99496 (high complexity, 7-day face-to-face) and 99495 (moderate complexity, " +
      "14-day face-to-face) are mutually exclusive — only one TCM code may be billed per " +
      "transitional care management episode.",
  },
  {
    col1: "99496",
    col2: "99213",
    modifierIndicator: 0,
    description:
      "TCM (99496) includes the E/M service on the date of the face-to-face visit. " +
      "Do not bill a separate E/M code (99213) on the same date as TCM face-to-face.",
  },
  {
    col1: "99496",
    col2: "99214",
    modifierIndicator: 0,
    description:
      "TCM (99496) includes the E/M service on the face-to-face date. " +
      "Cannot bill 99214 separately on the TCM face-to-face visit date.",
  },
  {
    col1: "99496",
    col2: "99215",
    modifierIndicator: 0,
    description:
      "TCM (99496) includes the E/M service on the face-to-face date. " +
      "Cannot bill 99215 separately on the TCM face-to-face visit date.",
  },
  {
    col1: "99495",
    col2: "99213",
    modifierIndicator: 0,
    description:
      "TCM (99495) includes the E/M service on the face-to-face date. " +
      "Cannot bill 99213 separately on the TCM face-to-face visit date.",
  },
  {
    col1: "99495",
    col2: "99214",
    modifierIndicator: 0,
    description:
      "TCM (99495) includes the E/M service on the face-to-face date. " +
      "Cannot bill 99214 separately on the TCM face-to-face visit date.",
  },
  {
    col1: "99495",
    col2: "99215",
    modifierIndicator: 0,
    description:
      "TCM (99495) includes the E/M service on the face-to-face date. " +
      "Cannot bill 99215 separately on the TCM face-to-face visit date.",
  },

  // ── RTM overlap edits ─────────────────────────────────────────────────────
  {
    col1: "98980",
    col2: "98975",
    modifierIndicator: 0,
    description:
      "RTM treatment management (98980) includes device supply (98975) when billed " +
      "for the same device/monitoring period. Do not double-bill supply and management.",
  },
  {
    col1: "98981",
    col2: "98975",
    modifierIndicator: 0,
    description:
      "RTM additional 20-minute management (98981) includes supply (98975). " +
      "Supply codes are not separately billable when bundled into management.",
  },
  {
    col1: "98980",
    col2: "98977",
    modifierIndicator: 1,
    description:
      "RTM management (98980) and musculoskeletal monitoring device supply (98977) " +
      "may be billed together only if device supply occurs in a distinct " +
      "monitoring period. Modifier 59 required.",
  },
];

// ─── MUE Data ─────────────────────────────────────────────────────────────────
// Source: CMS NCCI MUE for Practitioners, Q1 2025
// Units = maximum units billable per date of service per beneficiary
// Adjudication indicator 1 = line-item MUE; 2 = absolute DOS limit; 3 = clinical

export const MUE_EDITS: MUEEdit[] = [
  // Arthroplasty — bilateral uses modifier 50, not multiple units
  { code: "27447", units: 1, adjudicationIndicator: 2, description: "Total knee arthroplasty" },
  { code: "27130", units: 1, adjudicationIndicator: 2, description: "Total hip arthroplasty" },
  { code: "27446", units: 1, adjudicationIndicator: 2, description: "Partial knee arthroplasty" },
  { code: "27125", units: 1, adjudicationIndicator: 2, description: "Partial hip replacement" },

  // Knee arthroscopy — one procedure per knee per session
  { code: "29880", units: 1, adjudicationIndicator: 2, description: "Knee arthroscopy w/ meniscectomy, medial + lateral" },
  { code: "29881", units: 1, adjudicationIndicator: 2, description: "Knee arthroscopy w/ meniscectomy, single compartment" },
  { code: "29874", units: 1, adjudicationIndicator: 2, description: "Knee arthroscopy, removal of loose body" },
  { code: "29876", units: 1, adjudicationIndicator: 2, description: "Knee arthroscopy, synovectomy" },
  { code: "29877", units: 1, adjudicationIndicator: 2, description: "Knee arthroscopy, debridement" },

  // Shoulder arthroscopy
  { code: "29826", units: 1, adjudicationIndicator: 2, description: "Shoulder arthroscopy, decompression" },
  { code: "29827", units: 1, adjudicationIndicator: 2, description: "Shoulder arthroscopy, rotator cuff repair" },
  { code: "29819", units: 1, adjudicationIndicator: 2, description: "Shoulder arthroscopy, removal of loose body" },
  { code: "29821", units: 1, adjudicationIndicator: 2, description: "Shoulder arthroscopy, synovectomy" },

  // Spine — base procedures limited to 1 per level; add-ons stack
  { code: "22551", units: 1, adjudicationIndicator: 2, description: "ACDF, first level" },
  { code: "22552", units: 6, adjudicationIndicator: 3, description: "ACDF, additional level (add-on)" },
  { code: "22612", units: 1, adjudicationIndicator: 2, description: "Lumbar arthrodesis, posterior, first level" },
  { code: "22614", units: 5, adjudicationIndicator: 3, description: "Lumbar arthrodesis, additional level (add-on)" },
  { code: "63030", units: 1, adjudicationIndicator: 2, description: "Lumbar laminotomy" },
  { code: "63035", units: 5, adjudicationIndicator: 3, description: "Lumbar laminotomy, additional level (add-on)" },

  // E/M — one face-to-face visit per day per specialty
  { code: "99213", units: 1, adjudicationIndicator: 1, description: "Office visit, established patient, moderate MDM" },
  { code: "99214", units: 1, adjudicationIndicator: 1, description: "Office visit, established patient, moderate-high MDM" },
  { code: "99215", units: 1, adjudicationIndicator: 1, description: "Office visit, established patient, high MDM" },

  // TCM — one episode per discharge
  { code: "99495", units: 1, adjudicationIndicator: 2, description: "TCM, moderate complexity, 14-day face-to-face" },
  { code: "99496", units: 1, adjudicationIndicator: 2, description: "TCM, high complexity, 7-day face-to-face" },

  // RTM
  { code: "98975", units: 1, adjudicationIndicator: 1, description: "RTM, device supply with education, musculoskeletal" },
  { code: "98976", units: 1, adjudicationIndicator: 1, description: "RTM, device supply, respiratory" },
  { code: "98977", units: 1, adjudicationIndicator: 1, description: "RTM, device supply, musculoskeletal" },
  { code: "98980", units: 1, adjudicationIndicator: 1, description: "RTM, treatment management, first 20 minutes" },
  { code: "98981", units: 1, adjudicationIndicator: 1, description: "RTM, treatment management, each additional 20 minutes" },
];

// ─── Valid Modifier Set ───────────────────────────────────────────────────────
// Modifiers that can override a PTP edit with indicator = 1
export const NCCI_OVERRIDE_MODIFIERS = new Set([
  "59", // Distinct procedural service
  "XE", // Separate encounter (subset of 59)
  "XS", // Separate structure/anatomical site (subset of 59)
  "XP", // Separate practitioner (subset of 59)
  "XU", // Unusual non-overlapping service (subset of 59)
]);

// Modifiers that indicate bilateral or global situation (informational)
export const INFORMATIONAL_MODIFIERS = new Set([
  "50", // Bilateral procedure
  "51", // Multiple procedures
  "25", // Significant, separately identifiable E/M on day of procedure
  "57", // Decision for surgery at E/M on day of or day before major procedure
  "58", // Staged or related procedure by the same physician
  "78", // Unplanned return to OR
  "79", // Unrelated procedure by same physician during postop period
  "RT", "LT", "E1", "E2", "E3", "E4", "FA", "F1", "F2", "F3", "F4",
  "F5", "F6", "F7", "F8", "F9", "TA", "T1", "T2", "T3", "T4",
  "T5", "T6", "T7", "T8", "T9",
]);

// ─── Known Codes Registry ─────────────────────────────────────────────────────
// Codes that the engine explicitly recognizes. Unknown codes get a warning,
// not an error — they may be valid codes outside this engine's data set.
export const KNOWN_CODES = new Set([
  "27447", "27446", "27130", "27125", "27236", "27486", "27345",
  "27310", "27093", "20680", "27486",
  "29880", "29881", "29876", "29877", "29874", "29871",
  "29826", "29827", "29819", "29821",
  "22551", "22552", "22612", "22614", "63030", "63035",
  "20930", "20937", "20938",
  "99212", "99213", "99214", "99215",
  "99495", "99496",
  "98975", "98976", "98977", "98980", "98981",
]);

// ─── Lookup Maps ──────────────────────────────────────────────────────────────

// Build PTP lookup: key = "col1:col2" → PTPEdit
const PTP_MAP = new Map<string, PTPEdit>();
for (const edit of PTP_EDITS) {
  PTP_MAP.set(`${edit.col1}:${edit.col2}`, edit);
  // Also index the reverse for bidirectional lookup (col2 billed without col1)
  // Note: NCCI edits are directional — we add a reverse entry only to surface
  // the informational warning, not to block in reverse unless explicitly listed.
}

// Build MUE lookup: key = code → MUEEdit
const MUE_MAP = new Map<string, MUEEdit>();
for (const edit of MUE_EDITS) {
  MUE_MAP.set(edit.code, edit);
}

// ─── Core Validation Function ─────────────────────────────────────────────────

/**
 * validateCodes
 *
 * Validates a set of CPT codes (with optional per-code modifiers) against
 * CMS NCCI PTP edits and MUE limits. Returns a deterministic ValidationResult.
 *
 * @param codeUnits  Array of codes to validate. Can be plain strings
 *                   (e.g. ["27447", "29881"]) or CodeUnit objects
 *                   (e.g. [{ code: "27447", units: 1 }]).
 * @param modifiers  Optional map of code → modifier array.
 *                   e.g. { "29881": ["59"] } means modifier 59 is appended to 29881.
 *
 * @returns ValidationResult with errors, warnings, and suggestions.
 */
export function validateCodes(
  codeUnits: (string | CodeUnit)[],
  modifiers: Record<string, string[]> = {}
): ValidationResult {
  const errors: NCCIError[] = [];
  const warnings: NCCIWarning[] = [];
  const suggestions: string[] = [];

  // Normalize input to CodeUnit[]
  const normalized: CodeUnit[] = codeUnits.map((c) =>
    typeof c === "string" ? { code: c.trim(), units: 1 } : { code: c.code.trim(), units: c.units ?? 1 }
  );

  const codes = normalized.map((c) => c.code);

  // ── Guard: empty input ──────────────────────────────────────────────────
  if (normalized.length === 0) {
    return {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: ["No codes provided. Submit at least one CPT code to validate."],
      codesChecked: [],
      editVersion: "NCCI Q1 2025",
    };
  }

  // ── Check for unknown codes ─────────────────────────────────────────────
  for (const cu of normalized) {
    if (!KNOWN_CODES.has(cu.code)) {
      warnings.push({
        type: "DOCUMENTATION_REQUIRED",
        codes: [cu.code],
        message:
          `CPT ${cu.code} is outside the NCCI engine's current orthopedic/E&M/TCM/RTM data set. ` +
          "This code has not been validated against NCCI PTP or MUE edits. " +
          "Verify against the current CMS NCCI edit file before billing.",
      });
    }
  }

  // ── MUE Checks ──────────────────────────────────────────────────────────
  for (const cu of normalized) {
    const mue = MUE_MAP.get(cu.code);
    const submittedUnits = cu.units ?? 1;
    if (mue && submittedUnits > mue.units) {
      errors.push({
        type: "MUE_VIOLATION",
        col1Code: cu.code,
        col2Code: "",
        message:
          `MUE violation: ${cu.code} (${mue.description}) has a CMS Medically Unlikely Edit limit ` +
          `of ${mue.units} unit(s) per date of service. ` +
          `You submitted ${submittedUnits} unit(s). ` +
          (mue.adjudicationIndicator === 2
            ? "This is an absolute date-of-service limit that cannot be appealed."
            : "Clinical documentation may support an appeal for this limit."),
        modifierAllowed: false,
        editSource: "NCCI_MUE",
      });
    }
  }

  // ── PTP Checks ──────────────────────────────────────────────────────────
  // Check every ordered pair (col1, col2) for a PTP edit.
  // NCCI edits are directional: col1 is comprehensive, col2 is component.
  // We check both orderings because the submitted codes may come in any order.
  for (let i = 0; i < codes.length; i++) {
    for (let j = 0; j < codes.length; j++) {
      if (i === j) continue;

      const candidate1 = codes[i];
      const candidate2 = codes[j];
      const key = `${candidate1}:${candidate2}`;
      const edit = PTP_MAP.get(key);

      if (!edit) continue;

      // An edit exists. Check if a valid override modifier is present on col2.
      const col2Modifiers = modifiers[candidate2] ?? [];
      const hasOverrideModifier = col2Modifiers.some((m) =>
        NCCI_OVERRIDE_MODIFIERS.has(m.toUpperCase())
      );

      if (edit.modifierIndicator === 0) {
        // Hard block — modifier cannot override this edit
        errors.push({
          type: "MUTUALLY_EXCLUSIVE",
          col1Code: edit.col1,
          col2Code: edit.col2,
          message: edit.description,
          modifierAllowed: false,
          editSource: "NCCI_PTP",
        });
      } else if (edit.modifierIndicator === 1 && !hasOverrideModifier) {
        // Soft block — modifier would fix it
        errors.push({
          type: "PTP_VIOLATION",
          col1Code: edit.col1,
          col2Code: edit.col2,
          message:
            `${edit.description} ` +
            `To bill ${edit.col2} separately, append modifier 59 (or X-modifier: XE, XS, XP, XU) ` +
            `to ${edit.col2} and document that the service was distinct/separate.`,
          modifierAllowed: true,
          suggestedModifier: "59",
          editSource: "NCCI_PTP",
        });
      } else if (edit.modifierIndicator === 1 && hasOverrideModifier) {
        // Override present — downgrade to warning requiring documentation
        warnings.push({
          type: "MODIFIER_REQUIRED",
          codes: [edit.col1, edit.col2],
          message:
            `${edit.col1} and ${edit.col2} have an NCCI PTP edit (modifier indicator 1). ` +
            `Modifier ${col2Modifiers.join("/")} has been applied to ${edit.col2}. ` +
            "Ensure the operative note clearly documents that the services were performed " +
            "at distinct anatomical sites or distinct encounters to support separate billing.",
        });
      }
    }
  }

  // ── TCM + E/M same-day conflict ──────────────────────────────────────────
  const tcmCodes = codes.filter((c) => c === "99495" || c === "99496");
  const emCodes = codes.filter((c) =>
    ["99212", "99213", "99214", "99215"].includes(c)
  );
  if (tcmCodes.length > 0 && emCodes.length > 0) {
    // This is already covered by PTP edits above, but add a semantic warning
    // for additional clarity since TCM/E&M conflicts are a common audit trigger.
    warnings.push({
      type: "TCM_EM_CONFLICT",
      codes: [...tcmCodes, ...emCodes],
      message:
        `TCM codes (${tcmCodes.join(", ")}) include the E/M visit on the face-to-face date. ` +
        `Separate E/M codes (${emCodes.join(", ")}) cannot be billed on the same date ` +
        "as the TCM face-to-face visit. Remove the separate E/M or verify the date is different.",
    });
  }

  // ── RTM overlap warning ──────────────────────────────────────────────────
  const rtmManagement = codes.filter((c) => c === "98980" || c === "98981");
  const rtmSupply = codes.filter((c) =>
    ["98975", "98976", "98977"].includes(c)
  );
  if (rtmManagement.length > 0 && rtmSupply.length > 0) {
    warnings.push({
      type: "RTM_OVERLAP",
      codes: [...rtmManagement, ...rtmSupply],
      message:
        `RTM management codes (${rtmManagement.join(", ")}) and device supply codes ` +
        `(${rtmSupply.join(", ")}) are billed together. Verify that each code covers ` +
        "a distinct monitoring period and that supply codes are not double-billed " +
        "across management episodes.",
    });
  }

  // ── Duplicate code warning ───────────────────────────────────────────────
  const codeCounts = new Map<string, number>();
  for (const cu of normalized) {
    codeCounts.set(cu.code, (codeCounts.get(cu.code) ?? 0) + 1);
  }
  for (const [code, count] of codeCounts.entries()) {
    if (count > 1) {
      warnings.push({
        type: "DOCUMENTATION_REQUIRED",
        codes: [code],
        message:
          `CPT ${code} appears ${count} times in the submission. ` +
          "Duplicate codes are typically incorrect. Use units field or modifier 50 for bilateral.",
      });
    }
  }

  // ── Suggestions ──────────────────────────────────────────────────────────
  if (errors.length === 0 && warnings.length === 0) {
    suggestions.push(
      "All submitted codes passed NCCI PTP and MUE validation. " +
      "Proceed to documentation review before submission."
    );
  }

  if (errors.some((e) => e.modifierAllowed)) {
    suggestions.push(
      "One or more errors can be resolved by appending modifier 59 or an X-modifier (XE/XS/XP/XU) " +
      "to the Column 2 code. X-modifiers are preferred over 59 as they are more specific " +
      "and less likely to trigger an audit."
    );
  }

  // Warn about 29827 + 29826 specifically — this is one of the most commonly
  // miscoded shoulder pairs in orthopedics
  if (codes.includes("29827") && codes.includes("29826")) {
    const key = "29827:29826";
    const edit = PTP_MAP.get(key);
    if (edit) {
      suggestions.push(
        "29827 (rotator cuff repair) + 29826 (subacromial decompression): " +
        "This is one of the highest-audit shoulder code pairs. " +
        "Even with modifier 59, payers routinely deny 29826 when billed with 29827 " +
        "for the same shoulder in the same session. Document the independent clinical " +
        "indication for decompression separately."
      );
    }
  }

  // Suggest 29880 upgrade if both 29881 + meniscus work submitted
  if (codes.includes("29881") && !codes.includes("29880")) {
    suggestions.push(
      "If meniscectomy was performed in both medial AND lateral compartments, " +
      "bill 29880 instead of 29881. 29880 is the comprehensive code and pays higher."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    codesChecked: codes,
    editVersion: "NCCI Q1 2025",
  };
}

// ─── Convenience: validate plain string array ─────────────────────────────────
export function validateCodeStrings(
  codes: string[],
  modifiers: Record<string, string[]> = {}
): ValidationResult {
  return validateCodes(codes, modifiers);
}

// ─── Code description lookup ──────────────────────────────────────────────────
const CODE_DESCRIPTIONS: Record<string, string> = {
  "27447": "Total knee arthroplasty",
  "27446": "Arthroplasty, knee, condyle and plateau, medial or lateral compartment",
  "27130": "Arthroplasty, acetabular and proximal femoral prosthetic replacement (total hip arthroplasty)",
  "27125": "Hemiarthroplasty, hip, partial (femoral head prosthesis)",
  "29880": "Arthroscopy, knee, surgical; with meniscectomy (medial AND lateral, including any meniscal shaving)",
  "29881": "Arthroscopy, knee, surgical; with meniscectomy (medial OR lateral, including any meniscal shaving)",
  "29826": "Arthroscopy, shoulder, surgical; decompression of subacromial space with partial acromioplasty",
  "29827": "Arthroscopy, shoulder, surgical; with rotator cuff repair",
  "22551": "Arthrodesis, anterior interbody, including disc space preparation, discectomy, osteophytectomy and decompression of spinal cord and/or nerve roots; cervical below C2",
  "22612": "Arthrodesis, posterior or posterolateral technique, single level; lumbar (with or without lateral transverse technique)",
  "63030": "Laminotomy (hemilaminectomy), with decompression of nerve root(s), including partial facetectomy, foraminotomy and/or excision of herniated intervertebral disc; 1 interspace, lumbar",
  "99213": "Office or other outpatient visit, established patient, low medical decision making",
  "99214": "Office or other outpatient visit, established patient, moderate medical decision making",
  "99215": "Office or other outpatient visit, established patient, high medical decision making",
  "99495": "Transitional care management services with moderate medical decision making; face-to-face visit within 14 calendar days of discharge",
  "99496": "Transitional care management services with high medical decision making; face-to-face visit within 7 calendar days of discharge",
  "98975": "Remote therapeutic monitoring (e.g., respiratory system status, musculoskeletal system status, therapy adherence, therapy response); initial set-up and patient education",
  "98976": "Remote therapeutic monitoring; device(s) supply with scheduled (e.g., daily) recording(s) and/or programmed alert(s) transmission, each 30 days (respiratory system)",
  "98977": "Remote therapeutic monitoring; device(s) supply with scheduled (e.g., daily) recording(s) and/or programmed alert(s) transmission, each 30 days (musculoskeletal system)",
  "98980": "Remote therapeutic monitoring treatment management services, physician/other qualified health care professional time in a calendar month requiring at least one interactive communication with the patient/caregiver during the calendar month; first 20 minutes",
  "98981": "Remote therapeutic monitoring treatment management services; each additional 20 minutes",
};

export function getCodeDescription(code: string): string {
  return CODE_DESCRIPTIONS[code] ?? `CPT ${code} — description not in engine data set`;
}
