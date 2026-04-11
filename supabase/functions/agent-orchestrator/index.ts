import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Provider configurations
interface ProviderConfig {
  url: string;
  model: string;
  keyEnv: string;
  maxTokens: number;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  lovable: {
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    model: "google/gemini-2.5-flash-lite",
    keyEnv: "LOVABLE_API_KEY",
    maxTokens: 1024,
  },
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.1-8b-instant",
    keyEnv: "GROQ_API_KEY",
    maxTokens: 1024,
  },
  mistral: {
    url: "https://api.mistral.ai/v1/chat/completions",
    model: "mistral-small-latest",
    keyEnv: "MISTRAL_API_KEY",
    maxTokens: 1024,
  },
};

// Category-specialized system prompts (concise for token savings)
const CATEGORY_PROMPTS: Record<string, string> = {
  research: `Expert research analyst. Be specific: names, prices, ratings. Use markdown with bullet points.`,
  code: `Senior engineer. Write clean, working code with brief explanations.`,
  analysis: `Strategic analyst. Data-driven insights, ranked options, trade-offs.`,
  write: `Technical writer. Clear, structured, scannable content.`,
  plan: `Product strategist. Detailed plans with timelines and milestones.`,
  default: `Specialist agent. Complete tasks with specific, actionable output.`,
};

const BASE_SYSTEM = `You are Nexus Agent, an autonomous AI for task decomposition and execution. Be CONCISE but SPECIFIC — use real names, prices, locations. Respond in valid JSON only. Keep outputs focused and brief.`;

async function callAI(provider: string, systemPrompt: string, userPrompt: string) {
  const config = PROVIDERS[provider] || PROVIDERS.lovable;
  const apiKey = Deno.env.get(config.keyEnv);
  
  if (!apiKey) {
    throw new Error(`${config.keyEnv} not configured. Please add your API key.`);
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: config.maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw { status: 429, message: "Rate limited. Please try again in a moment." };
    if (response.status === 402) throw { status: 402, message: "AI credits exhausted. Please add funds." };
    const errText = await response.text();
    console.error(`AI error [${provider}]:`, response.status, errText);
    throw { status: 500, message: `AI error from ${provider}: ${response.status}` };
  }

  const aiResponse = await response.json();
  return aiResponse.choices?.[0]?.message?.content || "{}";
}

function parseJSON(content: string, action: string) {
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("JSON parse failed:", content.substring(0, 200));
    if (action === "report") return { report: content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim() };
    if (action === "debate_agent") return { argument: content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim() };
    if (action === "debate_synthesize") return { synthesis: content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim(), confidence: 75 };
    return { error: "Failed to parse response", raw: content };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, goal, subtasks, task, previousResult, allTasks, results, category, sharedContext, role, topic, optimistArgument, skepticArgument, provider = "lovable" } = body;

    let systemPrompt = BASE_SYSTEM;
    let userPrompt = "";

    switch (action) {
      case "decompose":
        userPrompt = `Decompose into 4-6 atomic subtasks for parallel execution. Be brief.

Goal: "${goal}"

Assign category: research|code|analysis|write|plan
Assign depends_on (0-indexed task indices).

JSON only:
{"subtasks":[{"title":"...","description":"Brief desc","category":"...","depends_on":[]}]}`;
        break;

      case "plan":
        userPrompt = `Validate execution plan. Goal: "${goal}"
Subtasks: ${JSON.stringify(subtasks)}

JSON only:
{"plan":"Brief strategy","executionLevels":[[0,1],[2]],"optimizedOrder":[0,1,2]}`;
        break;

      case "execute": {
        const catPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.default;
        systemPrompt = `${catPrompt} You are one of several parallel agents. Use shared context. Be specific but concise. JSON only.`;

        const sharedCtxStr = sharedContext?.length > 0
          ? `\nContext from other agents: ${JSON.stringify(sharedContext).slice(0, 500)}`
          : '';

        userPrompt = `Task: ${JSON.stringify(task)}
Goal: "${goal}"${sharedCtxStr}

Provide specific names, prices, ratings. Keep output focused.

JSON only:
{"result":"Concise markdown findings","toolCalls":[{"tool":"...","input":"...","output":"..."}],"confidence":0.85,"needsAdaptation":false}`;
        break;
      }

      case "adapt":
        userPrompt = `Task failed, adapt strategy. Goal: "${goal}"
Task: ${JSON.stringify(task)}
Previous: "${previousResult?.slice(0, 300)}"

JSON only:
{"analysis":"What went wrong","newStrategy":"New approach","adaptedResult":"Improved result","lessonsLearned":"Key insight"}`;
        break;

      case "report":
        userPrompt = `Generate final report. Goal: "${goal}"
Results: ${JSON.stringify(results)}

Include: Executive Summary, Key Findings, Top Recommendations, Next Steps. Use emoji headers. Be comprehensive but not verbose.

JSON only: {"report":"Markdown report"}`;
        break;

      case "debate_agent": {
        const isOptimist = role === 'optimist';
        systemPrompt = isOptimist
          ? `Optimistic analyst. Make the strongest case FOR the topic. 3 concrete points.`
          : `Skeptical analyst. Identify strongest risks AGAINST the topic. 3 concrete points.`;

        userPrompt = `Topic: "${topic}"
3 structured points with examples. Markdown format.
JSON only: {"argument":"Your argument"}`;
        break;
      }

      case "debate_synthesize":
        systemPrompt = `Balanced decision-maker. Weigh arguments objectively.`;
        userPrompt = `Topic: "${topic}"
FOR: ${optimistArgument?.slice(0, 500)}
AGAINST: ${skepticArgument?.slice(0, 500)}

JSON only: {"synthesis":"Balanced verdict in markdown","confidence":75}`;
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const content = await callAI(provider, systemPrompt, userPrompt);
    const parsed = parseJSON(content, action);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Agent orchestrator error:", e);
    const status = e?.status || 500;
    const message = e?.message || (e instanceof Error ? e.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
