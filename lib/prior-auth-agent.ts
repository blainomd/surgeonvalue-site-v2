"use strict";

// ─── Prior Auth Agent ───────────────────────────────────────────────────────
// Generates peer-to-peer-ready prior authorization medical necessity letters
// from clinical notes in 60 seconds. Part of the SurgeonValue 9-agent suite.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExtractedCodes {
  icd10: { code: string; description: string }[];
  cpt: { code: string; description: string }[];
  procedure: string;
  bodyRegion: string;
  specialty: string;
}

export interface ClinicalGuideline {
  organization: string; // e.g. "AAOS", "ACS", "ACR", "NCCN"
  title: string;
  year: number;
  recommendation: string;
  strengthOfEvidence: "Strong" | "Moderate" | "Limited" | "Consensus";
  url: string | null;
  verified: boolean; // GUARDRAIL: must be true before citing
}

export interface DenialPattern {
  reason: string;
  frequency: "Very Common" | "Common" | "Occasional";
  rebuttalStrategy: string;
  supportingEvidence: string;
}

export interface PayerDenialProfile {
  payerName: string;
  payerId: string | null;
  denialPatterns: DenialPattern[];
  averageTurnaroundDays: number;
  peerToPeerAvailability: boolean;
  preferredFormat: "fax" | "portal" | "edi";
  knownPolicies: {
    cptCode: string;
    policyNumber: string | null;
    requiresPriorAuth: boolean;
    commonDenialReasons: string[];
  }[];
}

export interface PriorAuthLetterOutput {
  letter: string;
  extractedCodes: ExtractedCodes;
  guidelinesUsed: ClinicalGuideline[];
  denialPatternsAddressed: DenialPattern[];
  confidence: "High" | "Medium" | "Low";
  warnings: string[];
  peerToPeerTalkingPoints: string[];
  generatedAt: string;
}

export interface PriorAuthRequest {
  clinicalNote: string;
  procedure?: string;
  payerName?: string;
  patientAge?: number;
  patientSex?: "M" | "F";
  priorTreatments?: string[];
}

// ─── Guardrails ─────────────────────────────────────────────────────────────

export const GUARDRAILS = {
  NEVER_FABRICATE_CITATIONS:
    "Never invent or hallucinate clinical practice guideline citations. " +
    "If a guideline cannot be verified, mark it as unverified and flag a warning. " +
    "Use only well-known, published guidelines from recognized medical societies.",

  NEVER_INVENT_CLINICAL_HISTORY:
    "Never add clinical details not present in the provided clinical note. " +
    "If critical information is missing, flag it as a warning and indicate " +
    "what the physician should add before submitting.",

  FLAG_AMBIGUOUS_GUIDELINES:
    "When clinical practice guidelines are ambiguous, conflicting, or the " +
    "patient does not clearly meet criteria, explicitly state this in the " +
    "letter and in the warnings array. Never overstate guideline support.",

  REQUIRE_PHYSICIAN_REVIEW:
    "Every generated letter MUST be reviewed and signed by the treating " +
    "physician before submission. The agent drafts; the physician attests.",

  NO_GUARANTEES:
    "Never guarantee approval. Frame all statements as clinical justification " +
    "supporting medical necessity, not as demands or entitlements.",
} as const;

// ─── System Prompt ──────────────────────────────────────────────────────────

export const PRIOR_AUTH_SYSTEM_PROMPT = `You are the SurgeonValue Prior Authorization Agent. Your role is to generate
peer-to-peer-ready prior authorization medical necessity letters from clinical notes.

## Your Process

1. EXTRACT: Parse the clinical note to identify the requested procedure, relevant
   ICD-10 diagnosis codes, and CPT procedure codes. Identify the body region and
   relevant surgical specialty.

2. SUMMARIZE: Distill the relevant clinical history — chief complaint, duration of
   symptoms, failed conservative treatments, imaging findings, functional limitations,
   and any relevant comorbidities that support medical necessity.

3. CITE GUIDELINES: Reference specific, published clinical practice guidelines from
   recognized medical societies (AAOS, ACS, ACR, NCCN, AHA, etc.) that support the
   requested procedure for this clinical scenario. Include the guideline title, year,
   and strength of recommendation. NEVER fabricate a citation. If you are unsure
   whether a guideline exists, say so explicitly.

4. ADDRESS DENIALS: For the specific CPT code and payer (if known), identify the
   most common denial reasons and preemptively rebut each one with clinical evidence
   from the patient's record and supporting guidelines.

5. FORMAT: Produce a formal letter addressed to the insurance company medical
   director. Include:
   - Patient demographics placeholder (physician fills in)
   - Member ID / authorization request number placeholders
   - Clear statement of the procedure requested with CPT and ICD-10 codes
   - Clinical history summary
   - Failed conservative treatments with dates and durations
   - Guideline citations supporting medical necessity
   - Preemptive rebuttal of common denial reasons
   - Closing paragraph requesting authorization
   - Explicit offer for peer-to-peer review with the treating physician
   - Physician signature block

## Guardrails

${GUARDRAILS.NEVER_FABRICATE_CITATIONS}

${GUARDRAILS.NEVER_INVENT_CLINICAL_HISTORY}

${GUARDRAILS.FLAG_AMBIGUOUS_GUIDELINES}

${GUARDRAILS.REQUIRE_PHYSICIAN_REVIEW}

${GUARDRAILS.NO_GUARANTEES}

## Tone

Professional, evidence-based, and assertive without being adversarial. Write as if
a board-certified physician authored the letter — because one will review and sign it.`;

// ─── Tool Definitions ───────────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required: boolean;
    enum?: string[];
  }>;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "extract_codes",
    description:
      "Parses a clinical note to extract the requested procedure, ICD-10 diagnosis " +
      "codes, and CPT procedure codes. Identifies body region and specialty.",
    parameters: {
      clinical_note: {
        type: "string",
        description: "The full text of the clinical note",
        required: true,
      },
      procedure_hint: {
        type: "string",
        description:
          "Optional hint about the procedure if not clearly stated in the note",
        required: false,
      },
    },
  },
  {
    name: "lookup_guidelines",
    description:
      "Looks up published clinical practice guidelines relevant to the procedure " +
      "and diagnosis. Returns only verified, published guidelines from recognized " +
      "medical societies. Flags any guideline it cannot verify.",
    parameters: {
      procedure: {
        type: "string",
        description: "The procedure name (e.g., 'Total Knee Arthroplasty')",
        required: true,
      },
      icd10_codes: {
        type: "string",
        description: "Comma-separated ICD-10 codes",
        required: true,
      },
      specialty: {
        type: "string",
        description: "Medical specialty for guideline lookup",
        required: true,
        enum: [
          "Orthopedics",
          "General Surgery",
          "Neurosurgery",
          "Cardiology",
          "Oncology",
          "Radiology",
          "Pain Management",
          "Gastroenterology",
          "Urology",
          "OB/GYN",
          "ENT",
          "Ophthalmology",
          "Other",
        ],
      },
    },
  },
  {
    name: "get_denial_patterns",
    description:
      "Retrieves common denial reasons for a specific CPT code and payer. " +
      "Returns denial frequency, rebuttal strategies, and supporting evidence.",
    parameters: {
      cpt_code: {
        type: "string",
        description: "The CPT code to check denial patterns for",
        required: true,
      },
      payer_name: {
        type: "string",
        description:
          "Insurance company name (e.g., 'UnitedHealthcare', 'Aetna', 'Blue Cross')",
        required: false,
      },
      procedure: {
        type: "string",
        description: "Procedure name for additional context",
        required: true,
      },
    },
  },
  {
    name: "generate_letter",
    description:
      "Generates the formal prior authorization medical necessity letter using " +
      "extracted codes, clinical history, guidelines, and denial rebuttals. " +
      "Outputs a complete, physician-ready letter.",
    parameters: {
      extracted_codes: {
        type: "object",
        description: "Output from extract_codes tool",
        required: true,
      },
      clinical_summary: {
        type: "string",
        description: "Summarized clinical history from the note",
        required: true,
      },
      guidelines: {
        type: "object",
        description: "Output from lookup_guidelines tool",
        required: true,
      },
      denial_patterns: {
        type: "object",
        description: "Output from get_denial_patterns tool",
        required: true,
      },
      payer_name: {
        type: "string",
        description: "Name of the insurance company",
        required: false,
      },
    },
  },
  {
    name: "format_peer_to_peer",
    description:
      "Generates a concise peer-to-peer talking points sheet for the physician " +
      "to use during a phone call with the insurance company medical director. " +
      "Includes key clinical facts, guideline references, and anticipated objections.",
    parameters: {
      letter_output: {
        type: "object",
        description: "The full PriorAuthLetterOutput from generate_letter",
        required: true,
      },
      time_limit_minutes: {
        type: "string",
        description:
          "Expected call duration (default 10). Adjusts detail level.",
        required: false,
      },
    },
  },
];

// ─── Payer Denial Pattern Database Structure ────────────────────────────────
// This is the schema for the denial pattern database. In production, this would
// be backed by a database. For now, it provides the seed structure and common
// patterns that the AI agent uses as reference data.

export const PAYER_DENIAL_DATABASE: PayerDenialProfile[] = [
  {
    payerName: "UnitedHealthcare",
    payerId: "87726",
    denialPatterns: [
      {
        reason: "Conservative treatment not adequately documented",
        frequency: "Very Common",
        rebuttalStrategy:
          "Document specific dates, durations, and outcomes of each conservative treatment " +
          "attempt. Include physical therapy visit counts, medication names with dosages, " +
          "and injection dates with type and response.",
        supportingEvidence:
          "InterQual and MCG criteria require minimum 6 weeks PT for most MSK procedures.",
      },
      {
        reason: "Imaging does not support surgical intervention",
        frequency: "Common",
        rebuttalStrategy:
          "Cite specific imaging findings with radiologist interpretation. Reference " +
          "guideline criteria for imaging thresholds (e.g., Kellgren-Lawrence grade for OA). " +
          "Note that clinical presentation may warrant intervention even with moderate imaging.",
        supportingEvidence:
          "AAOS guidelines note that clinical symptoms and functional limitation, not imaging " +
          "alone, should drive surgical decision-making.",
      },
      {
        reason: "Procedure not medically necessary",
        frequency: "Common",
        rebuttalStrategy:
          "Provide comprehensive documentation of functional limitation using validated " +
          "outcome measures (KOOS, HOOS, VAS, ODI). Cite specific guideline recommendations " +
          "for surgical intervention at the documented severity level.",
        supportingEvidence:
          "Reference appropriate specialty society guidelines with strength of recommendation.",
      },
    ],
    averageTurnaroundDays: 15,
    peerToPeerAvailability: true,
    preferredFormat: "portal",
    knownPolicies: [
      {
        cptCode: "27447",
        policyNumber: "2023T0544O",
        requiresPriorAuth: true,
        commonDenialReasons: [
          "BMI > 40 without optimization documentation",
          "Less than 3 months conservative treatment",
          "No validated outcome score documented",
        ],
      },
      {
        cptCode: "29881",
        policyNumber: "2023T0544O",
        requiresPriorAuth: true,
        commonDenialReasons: [
          "Degenerative meniscal tear in patient over 40",
          "No mechanical symptoms documented",
          "MRI does not correlate with exam findings",
        ],
      },
    ],
  },
  {
    payerName: "Aetna",
    payerId: "60054",
    denialPatterns: [
      {
        reason: "Does not meet Aetna Clinical Policy Bulletin criteria",
        frequency: "Very Common",
        rebuttalStrategy:
          "Reference the specific Aetna CPB number and demonstrate point-by-point how " +
          "the patient meets each criterion. If the CPB is outdated relative to current " +
          "guidelines, cite the newer guideline and note the discrepancy.",
        supportingEvidence:
          "Aetna CPBs are publicly available. Cross-reference with current specialty " +
          "society guidelines when CPBs lag behind evidence.",
      },
      {
        reason: "Alternative less invasive treatment available",
        frequency: "Common",
        rebuttalStrategy:
          "Document all prior treatment attempts chronologically. Explain why the " +
          "alternative treatment is not appropriate for this specific patient given " +
          "their clinical presentation, failed treatments, and comorbidities.",
        supportingEvidence:
          "Cite step-therapy guidelines from relevant specialty society showing the " +
          "patient has progressed through appropriate treatment ladder.",
      },
    ],
    averageTurnaroundDays: 14,
    peerToPeerAvailability: true,
    preferredFormat: "portal",
    knownPolicies: [
      {
        cptCode: "27447",
        policyNumber: "CPB 0650",
        requiresPriorAuth: true,
        commonDenialReasons: [
          "Insufficient conservative treatment documentation",
          "BMI threshold not addressed",
          "No functional outcome measures",
        ],
      },
    ],
  },
  {
    payerName: "Blue Cross Blue Shield",
    payerId: null,
    denialPatterns: [
      {
        reason: "Not meeting medical policy criteria",
        frequency: "Very Common",
        rebuttalStrategy:
          "BCBS policies vary by state. Identify the specific state plan and policy " +
          "number. Demonstrate compliance with each listed criterion. Note that BCBS " +
          "plans often defer to InterQual or MCG criteria.",
        supportingEvidence:
          "Reference both the local BCBS policy and national specialty guidelines.",
      },
      {
        reason: "Experimental or investigational",
        frequency: "Occasional",
        rebuttalStrategy:
          "Cite FDA clearance/approval date, CPT code establishment date, and volume " +
          "of peer-reviewed literature supporting the procedure. Reference specialty " +
          "society position statements.",
        supportingEvidence:
          "Procedures with established CPT codes and specialty society support are by " +
          "definition not experimental.",
      },
    ],
    averageTurnaroundDays: 21,
    peerToPeerAvailability: true,
    preferredFormat: "fax",
    knownPolicies: [],
  },
  {
    payerName: "Cigna",
    payerId: "62308",
    denialPatterns: [
      {
        reason: "Does not meet Cigna coverage policy criteria",
        frequency: "Very Common",
        rebuttalStrategy:
          "Cigna publishes coverage policies online. Reference the specific policy " +
          "and demonstrate compliance criterion by criterion.",
        supportingEvidence:
          "Cross-reference Cigna policy with current evidence-based guidelines.",
      },
    ],
    averageTurnaroundDays: 15,
    peerToPeerAvailability: true,
    preferredFormat: "portal",
    knownPolicies: [],
  },
  {
    payerName: "Humana",
    payerId: "61101",
    denialPatterns: [
      {
        reason: "Insufficient documentation of medical necessity",
        frequency: "Very Common",
        rebuttalStrategy:
          "Humana often requires detailed documentation of functional impact on " +
          "activities of daily living. Include specific ADL limitations, validated " +
          "outcome scores, and objective exam findings.",
        supportingEvidence:
          "Reference CMS LCD/NCD criteria when applicable, as Humana Medicare " +
          "Advantage plans must follow CMS coverage determinations.",
      },
    ],
    averageTurnaroundDays: 14,
    peerToPeerAvailability: true,
    preferredFormat: "portal",
    knownPolicies: [],
  },
];

// ─── CPT Code to Common Denial Reason Mapping ──────────────────────────────

export interface CptDenialMapping {
  cptCode: string;
  procedureName: string;
  specialty: string;
  commonDenialReasons: string[];
  requiredDocumentation: string[];
  typicalConservativeTreatmentExpectation: string;
  guidelineOrganizations: string[];
}

export const CPT_DENIAL_MAP: CptDenialMapping[] = [
  // Orthopedic — Joint Replacement
  {
    cptCode: "27447",
    procedureName: "Total Knee Arthroplasty",
    specialty: "Orthopedics",
    commonDenialReasons: [
      "Conservative treatment duration insufficient (< 3-6 months)",
      "BMI > 40 without documented optimization program",
      "No validated outcome score (KOOS-JR, KSS, or equivalent)",
      "Imaging does not show advanced degenerative changes (KL grade 3-4)",
      "Age under 50 without compelling clinical rationale",
    ],
    requiredDocumentation: [
      "Physical therapy dates, duration, and response",
      "Medication trials with names, doses, and duration",
      "Injection history (corticosteroid, viscosupplementation) with dates and response",
      "Weight-bearing radiographs with Kellgren-Lawrence grade",
      "Validated patient-reported outcome measure score",
      "Functional limitation description with ADL impact",
    ],
    typicalConservativeTreatmentExpectation:
      "Minimum 3-6 months including PT, NSAIDs, and at least one injection series",
    guidelineOrganizations: ["AAOS", "ACR"],
  },
  {
    cptCode: "27130",
    procedureName: "Total Hip Arthroplasty",
    specialty: "Orthopedics",
    commonDenialReasons: [
      "Insufficient conservative treatment",
      "Avascular necrosis staging does not warrant replacement",
      "No documented functional limitation",
      "BMI threshold concerns",
    ],
    requiredDocumentation: [
      "AP pelvis and lateral hip radiographs",
      "Harris Hip Score or HOOS-JR",
      "Failed conservative treatment documentation",
      "Functional impact on gait, ADLs, and employment",
    ],
    typicalConservativeTreatmentExpectation:
      "3-6 months PT, activity modification, analgesics, possible injection",
    guidelineOrganizations: ["AAOS"],
  },
  // Orthopedic — Arthroscopy
  {
    cptCode: "29881",
    procedureName: "Knee Arthroscopy with Meniscectomy",
    specialty: "Orthopedics",
    commonDenialReasons: [
      "Degenerative meniscal tear in patient over 40 (high denial rate)",
      "No mechanical symptoms (locking, catching, giving way)",
      "MRI findings do not correlate with clinical exam",
      "Conservative treatment not attempted or insufficient",
    ],
    requiredDocumentation: [
      "MRI report with specific meniscal tear description",
      "Physical exam documenting mechanical symptoms",
      "Failed PT documentation (minimum 6 weeks)",
      "Distinction between traumatic vs degenerative tear",
    ],
    typicalConservativeTreatmentExpectation:
      "Minimum 6-12 weeks PT; longer for degenerative tears",
    guidelineOrganizations: ["AAOS"],
  },
  // Spine
  {
    cptCode: "22630",
    procedureName: "Posterior Lumbar Interbody Fusion",
    specialty: "Orthopedics",
    commonDenialReasons: [
      "Conservative treatment less than 6 months",
      "No documented neurological deficit",
      "Psychological clearance not obtained",
      "Smoking status not addressed",
      "Adjacent segment disease not adequately documented",
    ],
    requiredDocumentation: [
      "Advanced imaging (MRI or CT myelogram)",
      "6+ months conservative treatment with dates",
      "Neurological exam findings",
      "Validated outcome measures (ODI, VAS)",
      "PT records with functional progress/plateau",
      "Psychological clearance if chronic pain > 6 months",
    ],
    typicalConservativeTreatmentExpectation:
      "Minimum 6 months including PT, medications, ESI series, and possible psychological evaluation",
    guidelineOrganizations: ["NASS"],
  },
  // Shoulder
  {
    cptCode: "29827",
    procedureName: "Arthroscopic Rotator Cuff Repair",
    specialty: "Orthopedics",
    commonDenialReasons: [
      "Conservative treatment insufficient (< 6 weeks)",
      "Tear size not documented or partial tear without failed conservative care",
      "No functional limitation documented",
      "Chronic tear without acute component",
    ],
    requiredDocumentation: [
      "MRI with tear size and location",
      "Failed PT documentation with dates",
      "Physical exam with strength testing",
      "Functional impact on work and ADLs",
    ],
    typicalConservativeTreatmentExpectation:
      "6-12 weeks PT, NSAIDs, possible corticosteroid injection",
    guidelineOrganizations: ["AAOS"],
  },
  // General Surgery
  {
    cptCode: "47562",
    procedureName: "Laparoscopic Cholecystectomy",
    specialty: "General Surgery",
    commonDenialReasons: [
      "Asymptomatic gallstones (incidental finding)",
      "No imaging confirmation of gallbladder pathology",
      "Symptoms attributed to non-biliary cause",
    ],
    requiredDocumentation: [
      "Ultrasound or HIDA scan results",
      "Documentation of biliary-type symptoms",
      "Failed medical management if applicable",
    ],
    typicalConservativeTreatmentExpectation:
      "Dietary modification trial; urgent if acute cholecystitis",
    guidelineOrganizations: ["ACS", "SAGES"],
  },
  // Cardiology
  {
    cptCode: "33361",
    procedureName: "Transcatheter Aortic Valve Replacement (TAVR)",
    specialty: "Cardiology",
    commonDenialReasons: [
      "STS score does not meet threshold for TAVR over SAVR",
      "Heart team evaluation not documented",
      "Echocardiographic criteria not met",
      "Frailty assessment not performed",
    ],
    requiredDocumentation: [
      "Echocardiogram with valve area and gradient",
      "STS risk score calculation",
      "Heart team multidisciplinary evaluation note",
      "CT angiography for access planning",
      "Frailty assessment if applicable",
    ],
    typicalConservativeTreatmentExpectation:
      "Medical optimization; TAVR indicated when symptomatic severe AS confirmed",
    guidelineOrganizations: ["AHA", "ACC"],
  },
  // Oncology
  {
    cptCode: "38571",
    procedureName: "Laparoscopic Lymphadenectomy",
    specialty: "Oncology",
    commonDenialReasons: [
      "Staging studies do not support nodal dissection",
      "Alternative staging modality not attempted (PET/CT)",
      "Not part of NCCN-recommended treatment pathway",
    ],
    requiredDocumentation: [
      "Pathology confirming malignancy",
      "Staging workup results",
      "NCCN guideline reference for treatment pathway",
      "Multidisciplinary tumor board recommendation if applicable",
    ],
    typicalConservativeTreatmentExpectation:
      "N/A — surgical staging for cancer; focus on guideline concordance",
    guidelineOrganizations: ["NCCN", "ACS"],
  },
];

// ─── Agent Configuration ────────────────────────────────────────────────────

export interface PriorAuthAgentConfig {
  agentName: string;
  agentId: string;
  version: string;
  systemPrompt: string;
  tools: ToolDefinition[];
  guardrails: typeof GUARDRAILS;
  denialDatabase: PayerDenialProfile[];
  cptDenialMap: CptDenialMapping[];
  maxProcessingTimeMs: number;
  requirePhysicianAttestation: boolean;
}

export function getPriorAuthAgentConfig(): PriorAuthAgentConfig {
  return {
    agentName: "Prior Auth Agent",
    agentId: "sv-prior-auth-v1",
    version: "1.0.0",
    systemPrompt: PRIOR_AUTH_SYSTEM_PROMPT,
    tools: TOOL_DEFINITIONS,
    guardrails: GUARDRAILS,
    denialDatabase: PAYER_DENIAL_DATABASE,
    cptDenialMap: CPT_DENIAL_MAP,
    maxProcessingTimeMs: 60_000, // 60 seconds target
    requirePhysicianAttestation: true,
  };
}

// ─── Helper: Find denial patterns for a CPT + payer combo ───────────────────

export function findDenialPatterns(
  cptCode: string,
  payerName?: string
): { cptPatterns: CptDenialMapping | null; payerPatterns: PayerDenialProfile | null } {
  const cptPatterns =
    CPT_DENIAL_MAP.find((m) => m.cptCode === cptCode) ?? null;

  const payerPatterns = payerName
    ? PAYER_DENIAL_DATABASE.find(
        (p) => p.payerName.toLowerCase() === payerName.toLowerCase()
      ) ?? null
    : null;

  return { cptPatterns, payerPatterns };
}

// ─── Helper: Get required documentation for a CPT code ──────────────────────

export function getRequiredDocumentation(cptCode: string): string[] {
  const mapping = CPT_DENIAL_MAP.find((m) => m.cptCode === cptCode);
  return mapping?.requiredDocumentation ?? [];
}

// ─── Helper: Build warnings from missing documentation ──────────────────────

export function checkDocumentationCompleteness(
  clinicalNote: string,
  cptCode: string
): string[] {
  const required = getRequiredDocumentation(cptCode);
  const warnings: string[] = [];
  const noteLower = clinicalNote.toLowerCase();

  // Simple keyword-based checks — the AI agent does deeper analysis
  const keywordChecks: Record<string, string[]> = {
    "Physical therapy dates, duration, and response": [
      "physical therapy",
      "pt sessions",
      "pt visits",
      "physiotherapy",
    ],
    "Validated patient-reported outcome measure score": [
      "koos",
      "hoos",
      "vas ",
      "odi ",
      "sf-36",
      "promis",
      "harris hip",
      "outcome score",
    ],
    "MRI": ["mri", "magnetic resonance"],
    "Radiograph": ["x-ray", "radiograph", "xray", "weight-bearing"],
  };

  for (const req of required) {
    const keywords = keywordChecks[req];
    if (keywords) {
      const found = keywords.some((kw) => noteLower.includes(kw));
      if (!found) {
        warnings.push(
          `MISSING: "${req}" not found in clinical note. Add before submitting.`
        );
      }
    }
  }

  return warnings;
}
