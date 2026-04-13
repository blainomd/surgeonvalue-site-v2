import { NextResponse } from "next/server";
import {
  validateCodes,
  getCodeDescription,
  type CodeUnit,
  type ValidationResult,
} from "@/lib/ncci-validator";

// ─── NCCI Validation API ─────────────────────────────────────────────────────
// POST /api/ncci/validate
//
// Validates a set of CPT codes against CMS NCCI PTP and MUE edits.
// This is the hard guardrail that runs BEFORE any code is surfaced to a surgeon.
// No LLM in the loop. Pure deterministic rules.
//
// Request body:
//   {
//     codes: string[]         // CPT codes as strings, e.g. ["27447", "29881"]
//     codeUnits?: CodeUnit[]  // Optional: include units per code for MUE checks
//     modifiers?: Record<string, string[]>  // e.g. { "29881": ["59"] }
//   }
//
// Response: ValidationResult
//   {
//     valid: boolean
//     errors: NCCIError[]
//     warnings: NCCIWarning[]
//     suggestions: string[]
//     codesChecked: string[]
//     editVersion: string
//   }
// ─────────────────────────────────────────────────────────────────────────────

interface ValidateRequest {
  codes?: string[];
  codeUnits?: CodeUnit[];
  modifiers?: Record<string, string[]>;
}

interface ValidateResponse extends ValidationResult {
  codeDescriptions?: Record<string, string>;
  timestamp: string;
}

export async function POST(request: Request): Promise<NextResponse<ValidateResponse | { error: string }>> {
  try {
    const body = (await request.json()) as ValidateRequest;

    const { codes, codeUnits, modifiers = {} } = body;

    // Require at least one of codes or codeUnits
    if (
      (!codes || !Array.isArray(codes)) &&
      (!codeUnits || !Array.isArray(codeUnits))
    ) {
      return NextResponse.json(
        {
          error:
            'Request must include either "codes" (string[]) or "codeUnits" (CodeUnit[]). ' +
            'Example: { "codes": ["27447", "29881"], "modifiers": { "29881": ["59"] } }',
        },
        { status: 400 }
      );
    }

    // Validate that code values look like CPT codes (5-digit strings)
    const inputCodes = codeUnits ?? codes!.map((c) => ({ code: c, units: 1 }));
    for (const cu of inputCodes) {
      const code = typeof cu === "string" ? cu : cu.code;
      if (!/^\d{5}$/.test(code.trim())) {
        return NextResponse.json(
          {
            error: `Invalid CPT code format: "${code}". CPT codes must be 5 digits.`,
          },
          { status: 400 }
        );
      }
    }

    // Enforce a reasonable per-request limit
    if (inputCodes.length > 50) {
      return NextResponse.json(
        {
          error:
            "Maximum 50 codes per request. Split large batches across multiple calls.",
        },
        { status: 400 }
      );
    }

    // Validate modifiers format
    if (modifiers) {
      for (const [code, mods] of Object.entries(modifiers)) {
        if (!Array.isArray(mods)) {
          return NextResponse.json(
            {
              error: `Modifiers for code ${code} must be an array of strings. Got: ${JSON.stringify(mods)}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Run the deterministic NCCI validation engine
    const result = validateCodes(inputCodes, modifiers);

    // Attach human-readable code descriptions for UI convenience
    const codeDescriptions: Record<string, string> = {};
    for (const cu of inputCodes) {
      const code = typeof cu === "string" ? cu : cu.code;
      codeDescriptions[code] = getCodeDescription(code);
    }

    const response: ValidateResponse = {
      ...result,
      codeDescriptions,
      timestamp: new Date().toISOString(),
    };

    // Set cache headers — NCCI edits change quarterly, not per-request
    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-store", // Don't cache — clinical data, always fresh
        "X-NCCI-Edit-Version": result.editVersion,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message =
      error instanceof SyntaxError
        ? "Invalid JSON in request body."
        : "Internal server error during NCCI validation.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — return engine metadata and supported codes
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    engine: "NCCI Validation Engine",
    version: "1.0.0",
    editVersion: "NCCI Q1 2025",
    description:
      "Deterministic CMS NCCI rules engine. Validates CPT code combinations against " +
      "PTP (Procedure-to-Procedure) edits and MUE (Medically Unlikely Edits) before " +
      "codes are surfaced to a surgeon. No LLM in the loop.",
    usage: {
      method: "POST",
      contentType: "application/json",
      body: {
        codes: ["string array of CPT codes, e.g. ['27447', '29881']"],
        codeUnits: [
          "optional: array of { code: string, units: number } for MUE checks",
        ],
        modifiers: {
          "CPT_CODE": ["array of modifier strings, e.g. ['59'] or ['XS']"],
        },
      },
    },
    supportedCategories: [
      "Knee arthroplasty (27447, 27446)",
      "Hip arthroplasty (27130, 27125)",
      "Knee arthroscopy (29880, 29881)",
      "Shoulder arthroscopy (29826, 29827)",
      "Spine (22551, 22552, 22612, 22614, 63030, 63035)",
      "E/M outpatient (99213, 99214, 99215)",
      "TCM (99495, 99496)",
      "RTM (98975-98977, 98980, 98981)",
    ],
    ncciModifierOverrides: ["59", "XE", "XS", "XP", "XU"],
    dataSource:
      "CMS NCCI Physician PTP and MUE files, Q1 2025. Update quarterly at: " +
      "https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-edits",
  });
}
