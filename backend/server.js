require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are Nightlamp, an expert diagnostic engine for AI-built and no-code applications.
You specialize in identifying these exact failure patterns:

1. BROKEN_WEBHOOK — webhook endpoints returning errors, wrong payload format, missing auth headers
2. EXPIRED_TOKEN — OAuth tokens, API keys, JWT tokens that have expired or will expire soon  
3. DEPRECATED_DEPENDENCY — npm/pip packages with breaking version changes, sunset API versions
4. SCHEMA_DRIFT — database schema changes that break existing queries or integrations
5. RATE_LIMIT_FAILURE — API calls hitting rate limits, silent 429 errors, quota exhaustion
6. SILENT_API_FAILURE — integrations that return 200 but with error payloads or empty responses

Analyze the provided app information and return ONLY valid JSON — no markdown, no explanation outside the JSON.

Return this exact schema:
{
  "app_name": "string — infer from URL or use 'Unknown App'",
  "overall_status": "healthy | warning | critical",
  "modules": [
    {
      "name": "string",
      "status": "green | yellow | red",
      "issue_type": "BROKEN_WEBHOOK | EXPIRED_TOKEN | DEPRECATED_DEPENDENCY | SCHEMA_DRIFT | RATE_LIMIT_FAILURE | SILENT_API_FAILURE | null",
      "headline": "string — max 10 words, plain English",
      "explanation": "string — 2-3 sentences, non-technical",
      "fix_steps": ["step 1", "step 2", "step 3"],
      "code_patch": "string or null",
      "estimated_fix_time": "string or null",
      "severity": "critical | warning | info"
    }
  ],
  "summary": "string — 1 sentence for the founder"
}

Always return 4-7 modules. Include both healthy and broken modules.
Be specific and actionable. Write like you're talking to a non-technical founder.`;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", gemini: !!process.env.GEMINI_API_KEY });
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { url, repo, logs, apiKey, model: requestedModel } = req.body;

    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) return res.status(400).json({ error: "NO_KEY" });

    if (!url && !repo && !logs) {
      return res.status(400).json({ error: "Provide at least one input." });
    }

    const safeLogs = (logs || "").slice(0, 8000);

    // 1. Ping the URL
    let urlStatus = "";
    if (url) {
      try {
        let fetchUrl = url;
        if (!fetchUrl.startsWith("http")) fetchUrl = "https://" + fetchUrl;
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        const start = Date.now();
        const ping = await fetch(fetchUrl, { signal: controller.signal });
        urlStatus = `URL responded with HTTP ${ping.status} in ~${Date.now() - start}ms`;
      } catch (e) {
        urlStatus = `URL is unreachable: ${e.message}`;
      }
    }

    // 2. Read GitHub package.json
    let packageJsonData = "";
    if (repo) {
      try {
        let rawUrl = repo;
        if (!rawUrl.startsWith("http")) rawUrl = "https://" + rawUrl;
        const raw = rawUrl
          .replace("github.com", "raw.githubusercontent.com")
          .replace(/\/$/, "") + "/main/package.json";
        const pkgRes = await fetch(raw);
        if (pkgRes.ok) packageJsonData = (await pkgRes.text()).slice(0, 3000);
      } catch (e) {}
    }

    const userMessage = `ANALYZE THIS APP:

URL: ${url || "not provided"}
URL STATUS: ${urlStatus || "not checked"}
GITHUB REPO: ${repo || "not provided"}
${packageJsonData ? `PACKAGE_JSON:\n${packageJsonData}\n` : ""}
ERROR LOGS:
${safeLogs || "not provided"}

Return only a valid JSON health report. No markdown fences, no explanation.`;

    // 3. Try models in order — fallback if quota hit
    const MODELS = [
      requestedModel,
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash-lite",
    ].filter(Boolean);

    let geminiRes, data;
    for (const model of MODELS) {
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: userMessage }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2048,
              thinkingConfig: { thinkingBudget: 0 }, // disable thinking preamble
            },
          }),
        }
      );
      data = await geminiRes.json();
      if (geminiRes.ok) {
        console.log(`Used model: ${model}`);
        break;
      }
      console.log(`Model ${model} failed: ${data.error?.message}`);
    }

    if (!geminiRes.ok) {
      throw new Error(data.error?.message || "All models failed");
    }

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 4. Aggressive JSON extraction — handles thinking text, fences, preamble
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new SyntaxError("No JSON object found in response");
    text = jsonMatch[0];

    const parsed = JSON.parse(text);
    // Strip markdown links from app_name (e.g., [httpstat.us](...) -> httpstat.us)
    if (parsed.app_name) {
      parsed.app_name = parsed.app_name.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    }
    res.json(parsed);

  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error("JSON parse failed:", err.message);
      return res.status(502).json({ error: "Gemini returned invalid JSON", raw: err.message });
    }
    console.error("Server Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Nightlamp backend running on http://localhost:${PORT}`);
  console.log(`Gemini key loaded: ${!!process.env.GEMINI_API_KEY}`);
});
