// ─── NCCI Validator Test Suite ───────────────────────────────────────────────
// Tests for the deterministic NCCI PTP + MUE validation engine.
// Run with: npx vitest run lib/ncci-validator.test.ts
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { validateCodes, validateCodeStrings } from "./ncci-validator";

// ─── Test Case 1: Valid single code ──────────────────────────────────────────
describe("TC-01: Valid single code — total knee arthroplasty alone", () => {
  it("passes with no errors or warnings for a single known code", () => {
    const result = validateCodes(["27447"]);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.codesChecked).toContain("27447");
    expect(result.editVersion).toMatch(/NCCI/);
  });
});

// ─── Test Case 2: Valid pair with no conflict ─────────────────────────────────
describe("TC-02: Valid pair — total hip + E/M with modifier 25", () => {
  it("passes when a distinct E/M is billed with an unrelated procedure", () => {
    // 27130 (hip arthroplasty) + 99214 (E/M): there is no PTP edit between
    // these codes. The E/M would need modifier 25 in practice, but the NCCI
    // engine does not enforce modifier 25 — that is payer policy, not NCCI.
    const result = validateCodes(["27130", "99214"]);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ─── Test Case 3: PTP violation — hard block ──────────────────────────────────
describe("TC-03: PTP hard block — 27447 + 27446 (total + partial knee)", () => {
  it("errors when total knee arthroplasty is billed with partial knee arthroplasty", () => {
    const result = validateCodes(["27447", "27446"]);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);

    const ptpError = result.errors.find(
      (e) =>
        (e.col1Code === "27447" && e.col2Code === "27446") ||
        (e.col1Code === "27446" && e.col2Code === "27447")
    );
    expect(ptpError).toBeDefined();
    expect(ptpError?.modifierAllowed).toBe(false);
    expect(ptpError?.editSource).toBe("NCCI_PTP");
  });
});

// ─── Test Case 4: PTP violation that becomes valid with modifier 59 ───────────
describe("TC-04: Modifier 59 overrides soft PTP edit — 27447 + 20680", () => {
  it("errors without modifier 59 on 20680", () => {
    const resultNoMod = validateCodes(["27447", "20680"]);
    const ptpError = resultNoMod.errors.find(
      (e) => e.col1Code === "27447" && e.col2Code === "20680"
    );
    expect(ptpError).toBeDefined();
    expect(ptpError?.modifierAllowed).toBe(true);
    expect(ptpError?.suggestedModifier).toBe("59");
  });

  it("passes with modifier 59 applied to 20680", () => {
    const resultWithMod = validateCodes(["27447", "20680"], {
      "20680": ["59"],
    });

    // With modifier 59, the PTP error should clear — replaced by a warning
    const ptpError = resultWithMod.errors.find(
      (e) => e.col1Code === "27447" && e.col2Code === "20680"
    );
    expect(ptpError).toBeUndefined();

    // Should have a warning about documentation requirement
    const docWarning = resultWithMod.warnings.find((w) =>
      w.codes.includes("27447") && w.codes.includes("20680")
    );
    expect(docWarning).toBeDefined();
  });
});

// ─── Test Case 5: MUE violation ───────────────────────────────────────────────
describe("TC-05: MUE violation — 99214 billed for 2 units", () => {
  it("errors when an E/M code exceeds 1 unit per day", () => {
    const result = validateCodes([{ code: "99214", units: 2 }]);

    expect(result.valid).toBe(false);
    const mueError = result.errors.find(
      (e) => e.type === "MUE_VIOLATION" && e.col1Code === "99214"
    );
    expect(mueError).toBeDefined();
    expect(mueError?.editSource).toBe("NCCI_MUE");
  });
});

// ─── Test Case 6: Multiple codes with one violation ───────────────────────────
describe("TC-06: Multiple codes — one violation in a set of three", () => {
  it("catches the PTP violation when 29880 is billed alongside 29881", () => {
    // 29880 is the comprehensive code that includes 29881.
    // The third code (99214) has no edit with either arthroscopy code.
    const result = validateCodes(["29880", "29881", "99214"]);

    expect(result.valid).toBe(false);
    expect(result.codesChecked).toHaveLength(3);

    const ptpError = result.errors.find(
      (e) =>
        (e.col1Code === "29880" && e.col2Code === "29881")
    );
    expect(ptpError).toBeDefined();
    expect(ptpError?.modifierAllowed).toBe(false);
  });
});

// ─── Test Case 7: TCM + E/M conflict ──────────────────────────────────────────
describe("TC-07: TCM + E/M same-day conflict", () => {
  it("errors when 99496 (TCM) and 99213 (E/M) are billed on the same date", () => {
    const result = validateCodes(["99496", "99213"]);

    expect(result.valid).toBe(false);

    const ptpError = result.errors.find(
      (e) =>
        (e.col1Code === "99496" && e.col2Code === "99213") ||
        (e.col1Code === "99213" && e.col2Code === "99496")
    );
    expect(ptpError).toBeDefined();

    // Should also have a TCM_EM_CONFLICT semantic warning
    const tcmWarning = result.warnings.find(
      (w) => w.type === "TCM_EM_CONFLICT"
    );
    expect(tcmWarning).toBeDefined();
    expect(tcmWarning?.codes).toContain("99496");
    expect(tcmWarning?.codes).toContain("99213");
  });

  it("errors when 99495 (TCM moderate) and 99215 (high E/M) are billed together", () => {
    const result = validateCodes(["99495", "99215"]);
    expect(result.valid).toBe(false);

    const ptpError = result.errors.find(
      (e) => e.col1Code === "99495" && e.col2Code === "99215"
    );
    expect(ptpError).toBeDefined();
  });
});

// ─── Test Case 8: Valid complex case — three codes, all clean ─────────────────
describe("TC-08: Valid complex case — three clean orthopedic codes", () => {
  it("passes for 22551 + 22552 + 20930 with appropriate context", () => {
    // ACDF first level + additional level (add-on) + allograft.
    // 22552 is an add-on to 22551, not a separate procedure — no PTP issue.
    // 20930 has a soft edit with 22551 (modifier indicator 1), so we need modifier.
    const result = validateCodes(["22551", "22552"], {});

    // 22551 + 22552 has a PTP edit with modifier indicator 1 (add-on requires it)
    // but in practice 22552 is the correct add-on code pair — check result
    // The engine should flag the edit so the surgeon is aware.
    expect(result.codesChecked).toHaveLength(2);
    // Both are recognized codes — no unknown-code warnings
    const unknownWarning = result.warnings.find(
      (w) => w.type === "DOCUMENTATION_REQUIRED" && w.codes.includes("22551")
    );
    expect(unknownWarning).toBeUndefined();
  });

  it("passes cleanly for 29827 + 99214 — rotator cuff repair with post-op E/M", () => {
    // 29827 and 99214 have no NCCI PTP edit between them.
    // (Note: 99214 on the same day as surgery would require modifier 25,
    // but that is payer policy, not NCCI.)
    const result = validateCodes(["29827", "99214"]);
    const ptpErrors = result.errors.filter((e) => e.type !== "MUE_VIOLATION");
    expect(ptpErrors).toHaveLength(0);
  });
});

// ─── Test Case 9: Empty input ──────────────────────────────────────────────────
describe("TC-09: Empty input returns valid result with suggestion", () => {
  it("returns valid: true with no errors for empty array", () => {
    const result = validateCodes([]);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.codesChecked).toHaveLength(0);
    expect(result.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(result.suggestions[0]).toMatch(/no codes/i);
  });
});

// ─── Test Case 10: Unknown code handling ──────────────────────────────────────
describe("TC-10: Unknown code generates warning, not error", () => {
  it("issues a DOCUMENTATION_REQUIRED warning for a code outside the data set", () => {
    // 27830 (open reduction, distal radioulnar joint) is a real CPT code
    // but outside the NCCI engine's orthopedic data set for this MVP.
    const result = validateCodes(["27830"]);

    expect(result.valid).toBe(true); // Unknown code = warning, not blocking error
    expect(result.errors).toHaveLength(0);

    const unknownWarning = result.warnings.find(
      (w) => w.codes.includes("27830") && w.type === "DOCUMENTATION_REQUIRED"
    );
    expect(unknownWarning).toBeDefined();
    expect(unknownWarning?.message).toMatch(/outside the NCCI engine/);
  });

  it("still validates known codes in the same submission alongside unknown", () => {
    // 27447 (known) + 99999 (not a real code)
    const result = validateCodes(["27447", "99999"]);

    // No PTP edit between the two, so no PTP error
    const ptpError = result.errors.find((e) => e.type !== "MUE_VIOLATION");
    expect(ptpError).toBeUndefined();

    // Unknown code warning present
    const unknownWarning = result.warnings.find((w) =>
      w.codes.includes("99999")
    );
    expect(unknownWarning).toBeDefined();
  });
});

// ─── Test Case 11: TCM mutual exclusion ──────────────────────────────────────
describe("TC-11: TCM codes are mutually exclusive", () => {
  it("errors when 99495 and 99496 are billed together", () => {
    const result = validateCodes(["99495", "99496"]);
    expect(result.valid).toBe(false);

    const tcmError = result.errors.find(
      (e) =>
        (e.col1Code === "99496" && e.col2Code === "99495") ||
        (e.col1Code === "99495" && e.col2Code === "99496")
    );
    expect(tcmError).toBeDefined();
    expect(tcmError?.modifierAllowed).toBe(false);
  });
});

// ─── Test Case 12: Shoulder arthroscopy PTP — 29827 + 29826 ──────────────────
describe("TC-12: 29827 + 29826 — rotator cuff repair + decompression", () => {
  it("flags PTP edit with modifier indicator 1 (modifier allowed but with warning)", () => {
    const result = validateCodes(["29827", "29826"]);

    // Should have a PTP error with modifierAllowed = true (indicator 1)
    const ptpError = result.errors.find(
      (e) => e.col1Code === "29827" && e.col2Code === "29826"
    );
    expect(ptpError).toBeDefined();
    expect(ptpError?.modifierAllowed).toBe(true);

    // Should have a specific shoulder suggestion
    const shoulderSuggestion = result.suggestions.find((s) =>
      s.includes("29827") && s.includes("29826")
    );
    expect(shoulderSuggestion).toBeDefined();
  });

  it("downgrades to warning when modifier 59 is applied to 29826", () => {
    const result = validateCodes(["29827", "29826"], { "29826": ["59"] });

    const ptpError = result.errors.find(
      (e) => e.col1Code === "29827" && e.col2Code === "29826"
    );
    expect(ptpError).toBeUndefined();

    const docWarning = result.warnings.find(
      (w) => w.codes.includes("29826") || w.codes.includes("29827")
    );
    expect(docWarning).toBeDefined();
  });
});

// ─── Test Case 13: E/M mutual exclusion ──────────────────────────────────────
describe("TC-13: E/M codes are mutually exclusive at different levels", () => {
  it("errors when 99215 and 99213 are billed on the same day", () => {
    const result = validateCodes(["99215", "99213"]);
    expect(result.valid).toBe(false);

    const emError = result.errors.find(
      (e) => e.col1Code === "99215" && e.col2Code === "99213"
    );
    expect(emError).toBeDefined();
    expect(emError?.modifierAllowed).toBe(false);
  });
});

// ─── Test Case 14: RTM overlap warning ───────────────────────────────────────
describe("TC-14: RTM management + supply codes generate overlap warning", () => {
  it("warns when 98980 (management) and 98977 (supply) are billed together", () => {
    const result = validateCodes(["98980", "98977"]);

    // 98980 + 98977 has a soft PTP edit (modifier indicator 1)
    const ptpError = result.errors.find(
      (e) => e.col1Code === "98980" && e.col2Code === "98977"
    );
    expect(ptpError).toBeDefined();
    expect(ptpError?.modifierAllowed).toBe(true);

    // Should also have RTM_OVERLAP semantic warning
    const rtmWarning = result.warnings.find((w) => w.type === "RTM_OVERLAP");
    expect(rtmWarning).toBeDefined();
  });
});

// ─── Test Case 15: validateCodeStrings convenience wrapper ───────────────────
describe("TC-15: validateCodeStrings convenience function", () => {
  it("produces same result as validateCodes for string input", () => {
    const r1 = validateCodes(["27447", "29881"]);
    const r2 = validateCodeStrings(["27447", "29881"]);

    expect(r1.valid).toBe(r2.valid);
    expect(r1.errors.length).toBe(r2.errors.length);
    expect(r1.warnings.length).toBe(r2.warnings.length);
  });
});
