/**
 * Cloudflare Worker: Ultra-Fast Secure Proxy for Google AI Studio (Gemini)
 * Free 100,000 requests/day on Cloudflare Workers Free Tier.
 */

export default {
  async fetch(request, env, ctx) {
    const allowedOrigins = [
      "https://zevlord.github.io",
      "http://localhost:5500",
      "http://127.0.0.1:5500"
    ];
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "https://zevlord.github.io",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured on Cloudflare Worker secret variables." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Health check endpoint
    if (request.method === "GET") {
      return new Response(JSON.stringify({ status: "ok", message: "Cloudflare Worker running fast v3.1" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    try {
      const body = await request.json();
      const message = body.message;
      if (!message || typeof message !== "string") {
        return new Response(JSON.stringify({ error: "Missing message string" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Grounded Knowledge Base System Prompt
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
- Be concise, professional, warm, and articulate (2 to 3 sentences maximum).
- Emphasize his technical depth, genuine hands-on engineering, and strong problem-solving mindset.
- Never invent facts or hallucinate projects outside what is listed.
- If asked about hiring or contacting Nikki, encourage reaching him directly via WhatsApp (+62 822-3960-8228) or email (nikiiwan61@gmail.com).
`;

      // Direct primary model: gemini-3-flash-preview (fastest and verified active on key)
      const candidateModels = [
        "gemini-3-flash-preview",
        "gemini-3.1-pro-preview"
      ];

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
          temperature: 0.2,
          maxOutputTokens: 600
        }
      };

      let lastError = null;

      for (const rawModel of candidateModels) {
        const model = rawModel.replace(/^models\//, "");
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        try {
          // 4-second timeout per attempt to guarantee fast user experience
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4500);

          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          clearTimeout(timer);

          if (res.ok) {
            const data = await res.json();
            const candidate = data?.candidates?.[0];
            const parts = candidate?.content?.parts || [];
            
            let replyText = "";
            for (const p of parts) {
              if (p.text && !p.thought) {
                replyText += p.text;
              }
            }
            replyText = replyText.trim();

            if (!replyText && parts.length > 0) {
              replyText = (parts[parts.length - 1].text || "").trim();
            }

            if (replyText) {
              return new Response(JSON.stringify({ 
                reply: replyText, 
                model_used: model,
                speed: "ultra-fast"
              }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              });
            }
          } else {
            lastError = await res.text();
          }
        } catch (fetchErr) {
          lastError = fetchErr.message;
        }
      }

      return new Response(JSON.stringify({ error: "Gemini generation timed out", details: lastError }), {
        status: 504,
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
