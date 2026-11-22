/**
 * Cloudflare Worker: Secure Proxy for Google AI Studio (Gemini)
 * Free 100,000 requests/day on Cloudflare Workers Free Tier.
 * 
 * Setup instructions:
 * 1. Log in to dash.cloudflare.com -> Workers & Pages -> Create Application -> Create Worker
 * 2. Paste this file into the Worker editor
 * 3. Go to Worker Settings -> Variables -> Add Secret:
 *    Name: GEMINI_API_KEY
 *    Value: <Your Google AI Studio API Key>
 * 4. Deploy! Copy the worker URL (e.g. https://nikki-assistant.yourname.workers.dev)
 * 5. Update window.NIKKI_AI_WORKER_URL in js/main.js with your worker URL.
 */

export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS Preflight
    const allowedOrigins = [
      "https://zevlord.github.io",
      "http://localhost:5500",
      "http://127.0.0.1:5500"
    ];
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "https://zevlord.github.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    try {
      const { message } = await request.json();
      if (!message || typeof message !== "string") {
        return new Response(JSON.stringify({ error: "Missing message string" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured on worker" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 2. Nikki's Grounded Knowledge Base System Prompt
      const systemInstruction = `
You are the official executive portfolio assistant for Nikki Tirta Iwan.
Nikki is an Information Systems Undergraduate at Universitas Multimedia Nusantara (UMN, Indonesia), class of 2023-expected 2027, with a 3.73 / 4.00 GPA.
He is actively Open to Work for 2026/2027 Software Engineering, AI/ML Engineering, and Enterprise Systems roles.

Key Projects & Capabilities:
1. Visage Link:
   - Voice AI companion with 3D VTuber avatar integration via VSeeFace and VMC/OSC protocol.
   - On-device local LLM reasoning (Qwen 2.5 7B quantized via Ollama).
   - Real-time zero-shot Japanese speech synthesis with custom GPT-SoVITS and word-level streaming.
   - SQLite conversational memory optimized to operate within an 8GB VRAM constraint.
2. Retail Demand Forecasting:
   - Evaluated 12.6 Million grocery store transactions.
   - Facebook Prophet model achieved R² 0.835 vs SARIMAX baseline (1,0,1)(0,1,1,7), providing actionable inventory stocking insights.
3. SAP S/4HANA Expense Analytics:
   - Office supply expense management system on SAP S/4HANA.
   - Custom ABAP Data Provider Classes (DPC_EXT) with dynamic OpenSQL queries and multi-table joins.
   - OData Gateway service consumed by an SAPUI5 / Fiori Analytical List Page (ALP) with interactive dimension filters and aggregation charts.
4. Other Experience:
   - Lead Mentor for PerProd at UMN, competitive programming in Python and C++.
5. Contact Details:
   - Email: nikiiwan61@gmail.com
   - WhatsApp: +62 822-3960-8228
   - GitHub: https://github.com/zevlord

Rules:
- Be concise, professional, warm, and articulate (2 to 4 sentences maximum).
- Emphasize his technical depth, genuine hands-on engineering, and strong problem-solving mindset.
- Never invent facts or hallucinate projects outside what is listed.
- If asked about hiring or contacting Nikki, encourage reaching him directly via WhatsApp (+62 822-3960-8228) or email (nikiiwan61@gmail.com).
`;

      // 3. Query Google AI Studio (Gemini 1.5 Flash / Gemini 2.0 Flash)
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const payload = {
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: message }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 250,
        }
      };

      const geminiRes = await fetch(geminiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        return new Response(JSON.stringify({ error: "Gemini API error", details: errText }), {
          status: geminiRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const geminiData = await geminiRes.json();
      const replyText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble retrieving a response right now. Please feel free to email Nikki directly at nikiiwan61@gmail.com!";

      return new Response(JSON.stringify({ reply: replyText }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
