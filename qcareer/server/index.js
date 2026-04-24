const express = require("express");
const cors    = require("cors");
const fetch   = require("node-fetch");
const Anthropic = require("@anthropic-ai/sdk");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ── MAIN JOB SEARCH ENDPOINT ──────────────────────────────────────────────────
// POST /api/jobs/search
// Body: { query, location?, type?, level?, apiKey }
app.post("/api/jobs/search", async (req, res) => {
  const { query, location, type, level, apiKey } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });

  const results = [];
  const errors  = [];

  // ── Run all sources in parallel ───────────────────────────────────────────
  await Promise.allSettled([

    // 1. Remotive — remote jobs (CORS-friendly)
    (async () => {
      try {
        const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=15`;
        const r = await fetch(url, { timeout: 8000 });
        if (!r.ok) return;
        const d = await r.json();
        const jobs = (d.jobs || []).map(j => ({
          id:          "rem_" + j.id,
          title:       j.title,
          company_name:j.company_name,
          location:    j.candidate_required_location || "Remote",
          remote_type: "remote",
          job_type:    (j.job_type || "full_time").replace("-","_"),
          experience_level: "mid",
          salary_min:  null, salary_max: null, currency: "USD",
          description: (j.description || "").replace(/<[^>]*>/g,"").slice(0,400),
          skills:      (j.tags || []).slice(0,8),
          apply_url:   j.url,
          source:      "Remotive",
          created_at:  j.publication_date || new Date().toISOString(),
          featured:    false, views: 0, applications_count: 0,
        }));
        results.push(...jobs);
      } catch(e) { errors.push("Remotive: " + e.message); }
    })(),

    // 2. The Muse — curated tech companies
    (async () => {
      try {
        const url = `https://www.themuse.com/api/public/jobs?category=${encodeURIComponent(query)}&page=0&descending=true`;
        const r = await fetch(url, { timeout: 8000 });
        if (!r.ok) return;
        const d = await r.json();
        const jobs = (d.results || []).slice(0,12).map(j => ({
          id:          "muse_" + j.id,
          title:       j.name,
          company_name:j.company?.name || "Unknown",
          location:    (j.locations || []).map(l=>l.name).join(", ") || "Remote",
          remote_type: "hybrid",
          job_type:    "full_time",
          experience_level: (j.levels?.[0]?.short_name || "mid").toLowerCase(),
          salary_min:  null, salary_max: null, currency: "USD",
          description: (j.contents || "").replace(/<[^>]*>/g,"").slice(0,400),
          skills:      [...(j.categories||[]).map(c=>c.name), ...(j.levels||[]).map(l=>l.name)].slice(0,6),
          apply_url:   j.refs?.landing_page || "",
          source:      "The Muse",
          created_at:  j.publication_date || new Date().toISOString(),
          featured:    false, views: 0, applications_count: 0,
        }));
        results.push(...jobs);
      } catch(e) { errors.push("TheMuse: " + e.message); }
    })(),

    // 3. Adzuna — 10M+ global listings (free tier)
    (async () => {
      try {
        // Adzuna has a free API — no key needed for basic search
        const country = "us";
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=test&app_key=test&results_per_page=10&what=${encodeURIComponent(query)}${location?"&where="+encodeURIComponent(location):""}`;
        const r = await fetch(url, { timeout: 8000 });
        if (!r.ok) return;
        const d = await r.json();
        const jobs = (d.results || []).slice(0,10).map((j,i) => ({
          id:          "adz_" + i + "_" + Date.now(),
          title:       j.title,
          company_name:j.company?.display_name || "Company",
          location:    j.location?.display_name || location || "USA",
          remote_type: "onsite",
          job_type:    "full_time",
          experience_level: "mid",
          salary_min:  j.salary_min ? Math.round(j.salary_min) : null,
          salary_max:  j.salary_max ? Math.round(j.salary_max) : null,
          currency:    "USD",
          description: (j.description || "").replace(/<[^>]*>/g,"").slice(0,400),
          skills:      [],
          apply_url:   j.redirect_url || "",
          source:      "Adzuna",
          created_at:  j.created || new Date().toISOString(),
          featured:    false, views: 0, applications_count: 0,
        }));
        results.push(...jobs);
      } catch(e) { errors.push("Adzuna: " + e.message); }
    })(),

    // 4. GitHub Jobs via Remotive category filter
    (async () => {
      try {
        const url = `https://remotive.com/api/remote-jobs?category=software-dev&limit=8`;
        const r = await fetch(url, { timeout: 8000 });
        if (!r.ok) return;
        const d = await r.json();
        const filtered = (d.jobs || [])
          .filter(j => j.title.toLowerCase().includes(query.toLowerCase()) ||
                       (j.tags||[]).some(t => t.toLowerCase().includes(query.toLowerCase())))
          .slice(0,6)
          .map(j => ({
            id:          "gh_" + j.id,
            title:       j.title,
            company_name:j.company_name,
            location:    "Remote",
            remote_type: "remote",
            job_type:    "full_time",
            experience_level: "mid",
            salary_min:  null, salary_max: null, currency: "USD",
            description: (j.description||"").replace(/<[^>]*>/g,"").slice(0,400),
            skills:      (j.tags||[]).slice(0,6),
            apply_url:   j.url,
            source:      "Remotive Dev",
            created_at:  j.publication_date || new Date().toISOString(),
            featured:    false, views: 0, applications_count: 0,
          }));
        results.push(...filtered);
      } catch(e) { /* silent */ }
    })(),

    // 5. Claude web_search — mines the web for fresh listings
    (async () => {
      if (!apiKey) return;
      try {
        const client = new Anthropic({ apiKey });
        const message = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 3000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: `You are a job search engine. Search the web for real, current job listings and return ONLY a valid JSON array. No markdown, no explanation. Just the raw JSON array starting with [`,
          messages: [{
            role: "user",
            content: `Search for "${query}" jobs${location ? " in " + location : ""}${level ? " at " + level + " level" : ""}${type ? " " + type : ""}. 

Find 10 real, active job postings from LinkedIn, Indeed, Glassdoor, company career pages, or job boards.

Return ONLY this JSON array (no markdown fences, no text before or after):
[
  {
    "id": "web_1",
    "title": "exact job title",
    "company_name": "real company name",
    "location": "City, State or Remote",
    "remote_type": "remote|hybrid|onsite",
    "job_type": "full_time|contract|part_time",
    "experience_level": "junior|mid|senior|lead",
    "salary_min": 120000,
    "salary_max": 160000,
    "currency": "USD",
    "description": "3-4 sentence summary of the role and requirements",
    "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "apply_url": "https://real-application-url.com",
    "source": "Web",
    "created_at": "2025-04-20",
    "featured": false,
    "views": 0,
    "applications_count": 0
  }
]`
          }]
        });

        // Extract text from response
        const textBlocks = message.content.filter(b => b.type === "text").map(b => b.text).join("");
        if (!textBlocks) return;

        const clean = textBlocks.replace(/```json|```/g,"").trim();
        const start = clean.indexOf("[");
        const end   = clean.lastIndexOf("]");
        if (start === -1 || end === -1) return;

        const webJobs = JSON.parse(clean.slice(start, end + 1));
        results.push(...webJobs.map((j,i) => ({ ...j, id: "web_" + i + "_" + Date.now() })));
      } catch(e) { errors.push("Claude web search: " + e.message); }
    })(),

  ]);

  // ── Deduplicate by title+company ──────────────────────────────────────────
  const seen  = new Set();
  const deduped = results.filter(j => {
    const key = (j.title + j.company_name).toLowerCase().replace(/\s/g,"");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ── Filter by optional params ─────────────────────────────────────────────
  const filtered = deduped.filter(j => {
    if (type  && j.job_type !== type) return false;
    if (level && j.experience_level !== level) return false;
    if (location && !j.location.toLowerCase().includes(location.toLowerCase()) && j.remote_type !== "remote") return false;
    return true;
  });

  // ── Sort: web results first (freshest), then by source ───────────────────
  filtered.sort((a,b) => {
    const order = { "Web":0, "Remotive":1, "The Muse":2, "Adzuna":3, "Remotive Dev":4 };
    return (order[a.source]||9) - (order[b.source]||9);
  });

  res.json({
    results: filtered,
    total: filtered.length,
    sources: [...new Set(filtered.map(j=>j.source))],
    errors: errors.length ? errors : undefined,
  });
});

app.listen(PORT, () => console.log(`QCareer API running on port ${PORT}`));
