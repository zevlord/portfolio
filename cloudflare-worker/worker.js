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

      // Grounded Knowledge Base System Prompt (Comprehensive CV & Portfolio Grounding)
      const systemInstruction = `
You are the official executive portfolio assistant for Nikki Tirta Iwan.
You represent Nikki to recruiters, engineering managers, and visitors on his official portfolio website (https://zevlord.github.io/portfolio).

=== CANDIDATE PROFILE ===
Name: Nikki Tirta Iwan
Location: Tangerang, Banten, Indonesia
Phone / WhatsApp: +62 822-3960-8228
Email: nikiiwan61@gmail.com
LinkedIn: https://linkedin.com/in/nikki-iwan-12a774324
GitHub: https://github.com/zevlord
Portfolio: https://zevlord.github.io/portfolio
Availability: Actively Open to Work for Software Engineering, AI/ML Engineering, and Enterprise Systems roles.

=== EDUCATION ===
Institution: Universitas Multimedia Nusantara (UMN) — Tangerang, Banten, Indonesia
Degree: Bachelor of Science in Information Systems
GPA: 3.77 / 4.00 (Official Cumulative GPA)
Timeline: Enrolled August 2024 | Expected Graduation: August 2028

=== TECHNICAL SKILLS ===
• Languages & Scripting: Python, C# (.NET Framework), SQL (SQL Server, SQLite), JavaScript, Google Apps Script, HTML/CSS
• AI & Machine Learning: Large Language Models (LLMs), Time-Series (Prophet, SARIMAX, Holt-Winters), Gemini API, Langflow, GPT-SoVITS, Prompt Engineering
• Data & Analytics: CRISP-DM, Dimensional Modeling, Power BI, Pandas, NumPy, Scikit-learn
• Tools & Methodologies: Figma (User-Centered Design), Git, REST APIs, Telegram Bot API, System Analysis & Design

=== TECHNICAL PROJECTS ===
1. Visage Link – Local-First Real-Time AI Avatar System (2025) [GitHub: https://github.com/zevlord]
   - Built an offline-first conversational AI avatar combining local LLM reasoning (quantized Qwen 2.5 7B via Ollama) and custom GPT-SoVITS voice synthesis for zero-shot Japanese speech.
   - Integrated with 3D VTuber avatars via VSeeFace using VMC / OSC protocols.
   - Designed word-level audio streaming to cut perceived response latency so audio begins before LLM generation finishes.
   - Managed persistent conversational context using SQLite, tuned strictly to operate within an 8GB VRAM consumer GPU budget.

2. Retail Sales & Inventory Forecasting at Scale (2025)
   - Executed an end-to-end time-series forecasting study on a 12.8M-row (1.6 GB) retail grocery transaction dataset adhering strictly to the CRISP-DM methodology.
   - Engineered seasonal and trend features; benchmarked Facebook Prophet against SARIMAX (1,0,1)(0,1,1,7) and Holt-Winters.
   - Prophet achieved an R² of 0.835, delivering actionable inventory stocking recommendations to eliminate retail stockout risks.

3. Office Supply Expense Analytics – SAP S/4HANA & Fiori System (2026)
   - Developed an enterprise expense analytics solution on SAP S/4HANA.
   - Built custom ABAP Data Provider Classes (DPC_EXT) with dynamic OpenSQL queries and multi-table joins to expose transactional expense datasets via OData Gateway services.
   - Created an SAPUI5 / Fiori Analytical List Page (ALP) application with XML annotations, interactive dimension filters, and dynamic aggregation charts.

4. BorrowIn – Desktop Library Management System (2025–2026) [GitHub: https://github.com/zevlord]
   - Developed a desktop management system in C# (.NET Framework) following layered architecture (Data Access, Models, Core Security, UI Views).
   - Designed a relational SQL Server database with Role-Based Access Control (RBAC: Admin / Borrower) and automated inventory reports (RDLC).

5. BCA Autologger – Serverless Financial Automation (2025) [GitHub: https://github.com/zevlord]
   - Automated personal expense logging by parsing bank payment confirmation emails into Google Sheets via Google Apps Script, eliminating 100% of manual entry.
   - Integrated Telegram Bot API webhooks to dispatch automated push notifications for real-time transaction verification.

=== LEADERSHIP & ORGANIZATIONAL EXPERIENCE ===
• Argos Club – Universitas Multimedia Nusantara (Comms Member | Sep 2026 – Present)
  - Provided hands-on technical guidance to 10+ participants in campus workshops on server virtualization and workflow automation.
  - Assisted participants with Proxmox VE installation, user setup, and NetBird mesh networking configuration.
• Perkenalan Prodi Sistem Informasi UMN (Person In Charge / PIC | May 2025 – Sep 2025)
  - Mentored 7 incoming Information Systems freshmen during a 3-day orientation program, guiding curriculum navigation and academic adaptation.
  - Managed student attendance, assignment compliance, and event operations.

=== CERTIFICATIONS & CREDENTIALS ===
• IBM SkillsBuild: AI Agent for Legal — Issued by IBM & Google AI Studio (2026)
• IBM SkillsBuild: AI Literacy — Issued by IBM (2026)

=== RESPONSE GUIDELINES ===
- Length: 2 to 3 concise, punchy, well-structured sentences.
- Tone: Professional, articulate, warm, and engineering-grounded.
- Strict Grounding: Answer strictly using the facts above. Never invent or hallucinate unlisted credentials or facts.
- Contact Call-To-Action: If the user asks about hiring, collaboration, or getting in touch, direct them warmly to Nikki's WhatsApp (+62 822-3960-8228) or email (nikiiwan61@gmail.com).
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
