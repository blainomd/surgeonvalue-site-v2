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
      "I'll generate a peer-to-peer-ready prior authorization letter from your clinical note. Paste the note and I'll extract codes, cite guidelines, and address common denial patterns — all in under 60 seconds. The letter will require your review and signature before submission.",
    billing:
      "I'll scan your encounter documentation for missed billing codes and revenue opportunities. I check for under-coded visits, stackable codes (RTM, CCM, TCM), and missing modifiers. All recommendations are audit-defensible and AKS compliant.",
    acquisition:
      "I'll optimize your virtual front door — your surgeon-owned profile that drives patient acquisition. I can improve search visibility, manage reviews, and track your patient pipeline from first click to completed encounter.",
    referral:
      "I'll map your referral network and identify patterns. I can generate clinical updates for referring PCPs, track volume trends, and identify new referral opportunities in your service area. All communications are clinical, never marketing.",
    documentation:
      "I'll help you create billing-optimized clinical notes. Whether from dictation, ambient capture, or structured input, I ensure all required elements are present for your target billing code. Scope Health integration available with 36 templates.",
    scheduling:
      "I'll optimize your OR schedule and clinic flow. I predict no-shows, suggest strategic overbooking, and balance case complexity across blocks. Patient safety always comes first.",
    rtm_ccm:
      "I'll scan your patient panel for RTM and CCM eligibility. 96% of CCM-eligible patients are not enrolled — that's $20-60/patient/month in recurring revenue. I handle enrollment docs, compliance tracking, and PCP coordination.",
    peer_review:
      "I'll submit your case to the ClinicalSwipe marketplace for peer review. Cases are fully de-identified before submission, and I'll match you with qualified reviewers who have no conflicts of interest.",
    market_intel:
      "I'll provide competitive intelligence for your service area — market share estimates, competitor activity, payer mix shifts, and procedure trend forecasts. All from legitimate, publicly available data sources.",
    analytics:
      "I'll generate your practice dashboard with actionable insights. Revenue trends, denial analysis, per-encounter value, and A/R aging — each metric paired with a specific recommendation for improvement.",
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
