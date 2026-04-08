import { type NextRequest } from "next/server";
import {
  routeToAgent,
  buildAgentPrompt,
  AGENTS,
  type AgentType,
} from "@/lib/agents";

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

interface AgentRequest {
  message: string;
  agent?: AgentType; // optional override — skip routing
  context?: Record<string, unknown>;
}

interface AgentResponse {
  agent: AgentType;
  agentName: string;
  response: string;
  routing: {
    confidence: number;
    reasoning: string;
  };
  tools_invoked: string[];
  guardrails_applied: string[];
}

// ---------------------------------------------------------------------------
// Placeholder agent execution
// ---------------------------------------------------------------------------

function executePlaceholder(
  agentType: AgentType,
  _message: string
): { response: string; tools_invoked: string[]; guardrails_applied: string[] } {
  const agent = AGENTS[agentType];

  const placeholders: Record<AgentType, string> = {
    orchestrator:
      "I've analyzed your request and determined the best specialist agent to help. Let me route this for you.",
    prior_auth:
      "I'll generate a peer-to-peer-ready prior authorization letter from your clinical note. Paste the note and I'll extract codes, cite guidelines, and address common denial patterns — all in under 60 seconds.",
    billing:
      "I'll scan your encounter documentation for missed billing codes and revenue opportunities. I check for under-coded visits, stackable codes (RTM, CCM, TCM), and missing modifiers.",
    wonder_bill:
      "I'll run your operative note through the 5-stage Wonder Bill pipeline: optimize the note for unbundled codes, translate to CPT, fight any biller pushback, compare against what was actually submitted, and suggest E/M level upgrades.",
    acquisition:
      "I'll optimize your virtual front door — your surgeon-owned profile that drives patient acquisition.",
    referral:
      "I'll map your referral network and identify patterns. Clinical updates for referring PCPs, volume trends, and new referral opportunities.",
    documentation:
      "I'll help you create billing-optimized clinical notes. I ensure all required elements are present for your target billing code.",
    scheduling:
      "I'll optimize your OR schedule and clinic flow. Patient safety always comes first.",
    rtm_ccm:
      "I'll scan your patient panel for RTM and CCM eligibility. 96% of CCM-eligible patients are not enrolled — that's $20-60/patient/month in recurring revenue.",
    peer_review:
      "I'll submit your case to the ClinicalSwipe marketplace for peer review. Cases are fully de-identified before submission.",
    market_intel:
      "I'll provide competitive intelligence for your service area — market share, competitor activity, payer mix shifts.",
    analytics:
      "I'll generate your practice dashboard with actionable insights. Revenue trends, denial analysis, per-encounter value, and A/R aging.",
    desktop_organizer:
      "I'll organize your practice files — op notes, billing documents, research papers. I sort into structured folders by type and date. I never delete anything.",
    financial_dashboard:
      "I'll build a revenue dashboard with payer mix, expense analysis, and a presentation-ready summary for your partner meeting.",
    day_prep:
      "Here's your morning briefing: today's OR cases with billing opportunities, clinic patients with E/M suggestions, pending prior auths, and yesterday's Wonder Bill discrepancies.",
    prototype_builder:
      "Tell me what you need — a calculator, patient handout, intake form, or workflow automation — and I'll build it for you in minutes.",
    claim_submission:
      "I'll validate your claims against payer rules, format them as CMS-1500 or UB-04, submit to the clearinghouse, and track until acceptance. No claim leaves here unless it's clean.",
    payment_posting:
      "I'll process your ERA/835 files, match payments to claims, reconcile against contracted rates, and flag any underpayments. Every dollar owed gets tracked.",
    ar_management:
      "I'll generate your A/R aging report and prioritize follow-ups by dollar amount and filing deadline. No valid claim goes unpaid on my watch.",
    denials_management:
      "I'll categorize the denial, determine if it's appealable, draft the appeal letter citing your operative note and CPT guidelines, and track it through all levels. Many denials are wrong — I fight them.",
    patient_billing:
      "I'll calculate patient responsibility, generate a clear statement, offer payment plans, and check HSA/FSA eligibility via ComfortCard. Clear billing = paid bills.",
  };

  return {
    response: placeholders[agentType],
    tools_invoked: agent.tools.slice(0, 2).map((t) => t.name),
    guardrails_applied: agent.guardrails.map((g) => g.id),
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AgentRequest;

    if (!body.message || typeof body.message !== "string") {
      return Response.json(
        { error: "Missing or invalid 'message' field." },
        { status: 400 }
      );
    }

    // Route to agent (or use explicit override)
    const routing = body.agent
      ? {
          agent: body.agent,
          confidence: 1.0,
          reasoning: `Explicit agent override: ${body.agent}`,
        }
      : routeToAgent(body.message);

    // Validate agent type
    if (!AGENTS[routing.agent]) {
      return Response.json(
        { error: `Unknown agent type: ${routing.agent}` },
        { status: 400 }
      );
    }

    // Build the system prompt (would be sent to LLM in production)
    const _systemPrompt = buildAgentPrompt(routing.agent, body.message);

    // Execute placeholder logic
    const result = executePlaceholder(routing.agent, body.message);

    const response: AgentResponse = {
      agent: routing.agent,
      agentName: AGENTS[routing.agent].name,
      response: result.response,
      routing: {
        confidence: routing.confidence,
        reasoning: routing.reasoning,
      },
      tools_invoked: result.tools_invoked,
      guardrails_applied: result.guardrails_applied,
    };

    return Response.json(response);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
