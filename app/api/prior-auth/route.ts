import { NextResponse } from "next/server";
import {
  getPriorAuthAgentConfig,
  findDenialPatterns,
  checkDocumentationCompleteness,
  type PriorAuthRequest,
} from "@/lib/prior-auth-agent";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PriorAuthRequest;
    const { clinicalNote, procedure, payerName } = body;

    if (!clinicalNote || clinicalNote.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Clinical note is required and must be at least 50 characters.",
        },
        { status: 400 }
      );
    }

    // Load agent configuration
    const agentConfig = getPriorAuthAgentConfig();

    // Look up denial patterns if a procedure hint is provided
    // In production, extract_codes tool runs first via Claude API to get the CPT
    const denialContext = procedure
      ? findDenialPatterns(
          // Simple CPT lookup by procedure name from the denial map
          agentConfig.cptDenialMap.find((m) =>
            m.procedureName.toLowerCase().includes(procedure.toLowerCase())
          )?.cptCode ?? "",
          payerName
        )
      : { cptPatterns: null, payerPatterns: null };

    // Check documentation completeness if we can identify the CPT
    const matchedCpt = procedure
      ? agentConfig.cptDenialMap.find((m) =>
          m.procedureName.toLowerCase().includes(procedure.toLowerCase())
        )
      : null;

    const documentationWarnings = matchedCpt
      ? checkDocumentationCompleteness(clinicalNote, matchedCpt.cptCode)
      : [];

    // Placeholder response — returns agent config and routing context
    // until Claude API is connected for actual letter generation
    return NextResponse.json({
      status: "ready",
      message:
        "Prior Auth Agent configured. Connect Claude API to generate letters.",
      agent: {
        id: agentConfig.agentId,
        name: agentConfig.agentName,
        version: agentConfig.version,
        maxProcessingTimeMs: agentConfig.maxProcessingTimeMs,
        requirePhysicianAttestation: agentConfig.requirePhysicianAttestation,
        toolCount: agentConfig.tools.length,
        tools: agentConfig.tools.map((t) => t.name),
      },
      routing: {
        procedure: procedure ?? "Not specified — will extract from note",
        payerName: payerName ?? "Not specified — generic letter",
        matchedCptCode: matchedCpt?.cptCode ?? null,
        matchedProcedure: matchedCpt?.procedureName ?? null,
        payerProfileAvailable: !!denialContext.payerPatterns,
        denialPatternsAvailable: !!denialContext.cptPatterns,
        commonDenialReasons:
          denialContext.cptPatterns?.commonDenialReasons ?? [],
        requiredDocumentation:
          matchedCpt?.requiredDocumentation ?? [],
        guidelineOrganizations:
          matchedCpt?.guidelineOrganizations ?? [],
      },
      documentationWarnings,
      guardrails: Object.keys(agentConfig.guardrails),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process prior auth request" },
      { status: 500 }
    );
  }
}
