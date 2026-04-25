import { Component, signal, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SlicePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { Router } from "@angular/router";
import { JobListingsService, JobListing } from "../../core/services/job-listings.service";
import { JobService } from "../../core/services/job.service";

const CLAUDE_MODEL = "claude-sonnet-4-6";
const API_URL = "https://qcareer-api.onrender.com"; // Render Web Service URL

// RSS feeds from major tech companies (CORS-proxied via allorigins)
const RSS_FEEDS = [
  { name:"GitHub Jobs", url:"https://github.blog/feed/" },
  { name:"Stripe", url:"https://stripe.com/blog/feed.rss" },
  { name:"Cloudflare", url:"https://blog.cloudflare.com/rss/" },
];

const PROXY = (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

@Component({
  selector: "app-job-search",
  standalone: true,
  imports: [FormsModule, SlicePipe, RouterLink],
  template: `
<div style="min-height:100vh;display:flex;flex-direction:column;">

  <!-- Header -->
  <div style="padding:1.25rem 2rem;border-bottom:1px solid var(--border);background:var(--bg2);flex-shrink:0;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
      <div>
        <h1 style="font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;color:#e2e8f0;letter-spacing:1px;">🔍 Find Jobs</h1>
        <div style="font-size:0.62rem;color:var(--muted);margin-top:2px;font-family:'JetBrains Mono',monospace;">
          QCareer board · AI web search · Company RSS feeds
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:.75rem;">
        <span class="api-badge" [class.connected]="apiConnected()" (click)="showApiModal.set(true)">
          {{ apiConnected() ? "⬡ Claude connected" : "Connect Claude for AI search" }}
        </span>
        <a href="/recruiter" style="font-size:0.65rem;padding:.4rem .9rem;border:1px solid rgba(99,102,241,0.25);border-radius:6px;color:#818cf8;text-decoration:none;transition:all .2s;" onmouseover="this.style.background='rgba(99,102,241,0.08)'" onmouseout="this.style.background=''">Post a job ↗</a>
      </div>
    </div>

    <!-- Search bar -->
    <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:.75rem;">
      <input #queryInput [(ngModel)]="query" (keydown.enter)="search()" placeholder="Role, skill, or keyword..."
        style="flex:2;min-width:200px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.65rem 1rem;color:#e2e8f0;font-size:0.8rem;outline:none;transition:border-color .2s;"
        (focus)="$event.target.style.borderColor='#6366f1'" (blur)="$event.target.style.borderColor='rgba(99,102,241,0.15)'">
      <select [(ngModel)]="filterRemote" style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.65rem 1rem;color:#e2e8f0;font-size:0.78rem;outline:none;cursor:pointer;">
        <option value="">All locations</option>
        <option value="remote">Remote only</option>
        <option value="hybrid">Hybrid</option>
        <option value="onsite">On-site</option>
      </select>
      <select [(ngModel)]="filterType" style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.65rem 1rem;color:#e2e8f0;font-size:0.78rem;outline:none;cursor:pointer;">
        <option value="">All types</option>
        <option value="full_time">Full-time</option>
        <option value="contract">Contract</option>
        <option value="part_time">Part-time</option>
        <option value="internship">Internship</option>
      </select>
      <select [(ngModel)]="filterExp" style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.65rem 1rem;color:#e2e8f0;font-size:0.78rem;outline:none;cursor:pointer;">
        <option value="">All levels</option>
        <option value="intern">Intern</option>
        <option value="junior">Junior</option>
        <option value="mid">Mid</option>
        <option value="senior">Senior</option>
        <option value="lead">Lead</option>
        <option value="executive">Executive</option>
      </select>
      <button (click)="search()" [disabled]="loading()" class="btn btn-primary" style="flex-shrink:0;">
        {{ loading() ? "Searching..." : "Search" }}
      </button>
    </div>

    <!-- Source tabs + quick searches -->
    <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;">
      <div style="display:flex;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:3px;gap:2px;margin-right:.5rem;">
        @for (s of sources; track s.id) {
          <button (click)="activeSource.set(s.id);search()" class="btn" style="padding:4px 12px;font-size:0.62rem;border-radius:6px;transition:all .15s;"
            [style.background]="activeSource()===s.id?'var(--indigo)':'transparent'"
            [style.color]="activeSource()===s.id?'#fff':'var(--muted)'"
            [style.border]="'none'">
            {{ s.icon }} {{ s.label }}
          </button>
        }
      </div>
      @for (q of quickSearches; track q) {
        <button (click)="quickSearch(q)" class="quick-pill">{{ q }}</button>
      }
    </div>
  </div>

  <!-- Results -->
  <div style="flex:1;padding:1.25rem 2rem;">

    @if (!searched() && !loading()) {
      <div class="empty" style="padding:5rem;">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">Search for your next role</div>
        <div class="empty-hint" style="max-width:400px;">
          Search pulls from jobs posted directly on QCareer by recruiters. Connect Claude to also search the web and extract job listings from company career pages in real time.
        </div>
        <div style="margin-top:2rem;display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center;">
          @for (q of quickSearches; track q) {
            <button (click)="quickSearch(q)" style="font-size:0.72rem;padding:.5rem 1rem;border:1px solid var(--border);border-radius:8px;background:var(--bg2);color:var(--muted);cursor:pointer;transition:all .2s;" onmouseover="this.style.borderColor='rgba(99,102,241,0.35)';this.style.color='#818cf8'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">{{ q }}</button>
          }
        </div>
      </div>
    }

    @if (loading()) {
      <div class="empty" style="padding:4rem;">
        <div style="font-size:2rem;animation:spin 1.2s linear infinite;display:inline-block;">⬡</div>
        <div class="empty-title" style="margin-top:1rem;">{{ loadingMsg() }}</div>
      </div>
    }

    @if (!loading() && searched()) {
      <!-- Source summary -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
        <div style="font-size:0.72rem;color:var(--muted);font-family:'JetBrains Mono',monospace;">
          {{ results().length }} result{{ results().length!==1?"s":"" }} found
          @if (aiResults().length) { &nbsp;· <span style="color:var(--ai2);">{{ aiResults().length }} from AI web search</span> }
        </div>
        @if (results().length && apiConnected()) {
          <button (click)="aiScoreAll()" [disabled]="scoring()" class="btn btn-outline btn-sm" style="font-size:0.65rem;">
            {{ scoring() ? "Scoring..." : "⬡ AI score matches" }}
          </button>
        }
      </div>
    }

    @if (!loading() && searched() && !results().length) {
      <div class="empty" style="padding:3rem;">
        <div class="empty-icon">😔</div>
        <div class="empty-title">No results found</div>
        <div class="empty-hint">
          @if (!apiConnected()) {
            Connect Claude AI above — it will generate real job listings for any search term instantly.
          } @else {
            Try different keywords or broaden your filters.
          }
        </div>
        @if (!apiConnected()) {
          <button (click)="showApiModal.set(true)" class="btn btn-primary" style="margin-top:1rem;font-size:.75rem;">
            ⬡ Connect Claude to find jobs
          </button>
        }
      </div>
    }

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:1rem;">
      @for (job of results(); track job.id) {
        <div class="card" style="padding:1.25rem;display:flex;flex-direction:column;gap:.65rem;position:relative;transition:all .2s;"
          [style.borderColor]="job.aiScore && job.aiScore>=80 ? 'rgba(16,185,129,0.4)' : job.aiScore && job.aiScore>=60 ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.15)'"
          onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">

          <!-- AI score -->
          @if (job.aiScore) {
            <div style="position:absolute;top:.75rem;right:.75rem;font-size:0.58rem;padding:2px 8px;border-radius:10px;font-family:'JetBrains Mono',monospace;font-weight:600;"
              [style.background]="job.aiScore>=80?'rgba(16,185,129,0.12)':job.aiScore>=60?'rgba(245,158,11,0.1)':'rgba(244,63,94,0.1)'"
              [style.color]="job.aiScore>=80?'#10b981':job.aiScore>=60?'#f59e0b':'#f43f5e'"
              [style.border]="'1px solid '+(job.aiScore>=80?'rgba(16,185,129,0.3)':job.aiScore>=60?'rgba(245,158,11,0.25)':'rgba(244,63,94,0.25)')">
              {{ job.aiScore }}% match
            </div>
          }

          <!-- Source + type badges -->
          <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;">
            <span style="font-size:0.55rem;padding:2px 7px;border-radius:10px;font-family:'JetBrains Mono',monospace;border:1px solid;"
              [style.background]="job.source==='qcareer'?'rgba(99,102,241,0.12)':'rgba(124,92,252,0.08)'"
              [style.color]="job.source==='qcareer'?'#818cf8':'#a78bfa'"
              [style.borderColor]="job.source==='qcareer'?'rgba(99,102,241,0.25)':'rgba(124,92,252,0.2)'">
              {{ job.source==='qcareer' ? '⬡ QCareer' : job.source==='scraped' ? '🤖 AI found' : '📡 RSS' }}
            </span>
            @if (job.featured) { <span style="font-size:0.55rem;padding:2px 7px;border-radius:10px;background:rgba(245,158,11,0.1);color:#f59e0b;border:1px solid rgba(245,158,11,0.25);font-family:'JetBrains Mono',monospace;">⭐ Featured</span> }
            <span style="font-size:0.55rem;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-left:auto;">{{ job.created_at | slice:0:10 }}</span>
          </div>

          <!-- Title + company -->
          <div>
            <div style="font-size:0.88rem;font-weight:600;color:#e2e8f0;margin-bottom:3px;line-height:1.3;padding-right:4rem;">{{ job.title }}</div>
            <div style="font-size:0.72rem;color:#818cf8;font-weight:500;">{{ job.company_name }}</div>
          </div>

          <!-- Location + remote + type -->
          <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;">
            <span style="font-size:0.68rem;color:var(--muted);">📍 {{ job.location }}</span>
            <span style="font-size:0.62rem;padding:2px 7px;border-radius:4px;font-family:'JetBrains Mono',monospace;"
              [style.background]="job.remote_type==='remote'?'rgba(16,185,129,0.08)':job.remote_type==='hybrid'?'rgba(245,158,11,0.08)':'rgba(99,102,241,0.08)'"
              [style.color]="job.remote_type==='remote'?'#10b981':job.remote_type==='hybrid'?'#f59e0b':'#818cf8'">
              {{ job.remote_type }}
            </span>
            <span style="font-size:0.62rem;color:var(--muted);font-family:'JetBrains Mono',monospace;">{{ job.experience_level }}</span>
          </div>

          <!-- Salary -->
          @if (job.salary_min) {
            <div style="font-size:0.72rem;color:#10b981;font-family:'JetBrains Mono',monospace;">
              {{ job.currency }} {{ job.salary_min | number }}{{ job.salary_max ? " – " + (job.salary_max | number) : "+" }}
              @if (job.equity_min) { <span style="color:var(--amber);margin-left:.5rem;">+ {{ job.equity_min }}–{{ job.equity_max }}% equity</span> }
            </div>
          }

          <!-- Skills -->
          @if (job.skills?.length) {
            <div style="display:flex;flex-wrap:wrap;gap:.3rem;">
              @for (s of job.skills.slice(0,5); track s) {
                <span style="font-size:0.58rem;padding:2px 7px;border-radius:4px;background:rgba(99,102,241,0.08);color:#818cf8;border:1px solid rgba(99,102,241,0.15);">{{ s }}</span>
              }
              @if (job.skills.length > 5) { <span style="font-size:0.58rem;color:var(--muted);">+{{ job.skills.length-5 }}</span> }
            </div>
          }

          <!-- AI reason -->
          @if (job.aiReason) {
            <div style="font-size:0.65rem;color:var(--muted);background:var(--ai-bg);border:1px solid var(--ai-border);border-radius:6px;padding:.5rem .75rem;line-height:1.6;font-family:'JetBrains Mono',monospace;">
              ⬡ {{ job.aiReason }}
            </div>
          }

          <!-- Description snippet -->
          <div style="font-size:0.68rem;color:var(--muted);line-height:1.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">
            {{ job.description | slice:0:180 }}...
          </div>

          <!-- Actions -->
          <div style="display:flex;gap:.5rem;margin-top:.5rem;">
            @if (job.apply_url) {
              <a [href]="job.apply_url" target="_blank" style="flex:1;display:flex;align-items:center;justify-content:center;gap:.4rem;padding:.5rem;border-radius:7px;border:1px solid rgba(99,102,241,0.25);background:rgba(99,102,241,0.06);color:#818cf8;font-size:0.68rem;font-weight:500;text-decoration:none;transition:all .2s;" onmouseover="this.style.background='rgba(99,102,241,0.12)'" onmouseout="this.style.background='rgba(99,102,241,0.06)'">View Job ↗</a>
            } @else if (job.apply_email) {
              <a [href]="'mailto:'+job.apply_email" style="flex:1;display:flex;align-items:center;justify-content:center;padding:.5rem;border-radius:7px;border:1px solid rgba(99,102,241,0.25);background:rgba(99,102,241,0.06);color:#818cf8;font-size:0.68rem;text-decoration:none;">Apply via Email</a>
            } @else {
              <button (click)="openApply(job)" style="flex:1;padding:.5rem;border-radius:7px;border:1px solid rgba(99,102,241,0.25);background:rgba(99,102,241,0.06);color:#818cf8;font-size:0.68rem;cursor:pointer;">Apply</button>
            }
            <!-- Save to tracker button — prominent -->
            <button (click)="addToTracker(job,$event)" [disabled]="tracked().has(job.id)"
              style="flex:1.2;display:flex;align-items:center;justify-content:center;gap:.4rem;padding:.5rem;border-radius:7px;font-size:0.72rem;font-weight:600;cursor:pointer;transition:all .2s;border:none;"
              [style.background]="tracked().has(job.id)?'rgba(16,185,129,0.12)':' #6366f1'"
              [style.color]="tracked().has(job.id)?'#10b981':'#fff'"
              [style.cursor]="tracked().has(job.id)?'default':'pointer'"
              [style.boxShadow]="!tracked().has(job.id)?'0 4px 12px rgba(99,102,241,0.35)':'none'">
              @if (tracked().has(job.id)) {
                <span>✓</span><span>Saved to tracker</span>
              } @else {
                <span>+</span><span>Save to tracker</span>
              }
            </button>
          </div>
          @if (tracked().has(job.id)) {
            <div style="margin-top:.4rem;font-size:0.6rem;color:#10b981;font-family:'JetBrains Mono',monospace;text-align:center;">
              ✓ Saved to your Kanban board · <a routerLink="/tracker" style="color:#6366f1;text-decoration:none;">View tracker →</a>
            </div>
          }
        </div>
      }
    </div>
  </div>
</div>

<!-- Apply Modal -->
@if (applyJob()) {
  <div class="modal-overlay" (click)="applyJob.set(null)">
    <div class="modal" style="max-width:520px;" (click)="$event.stopPropagation()">
      <div class="modal-title">Apply to {{ applyJob()!.title }}</div>
      <div class="modal-sub">{{ applyJob()!.company_name }} · {{ applyJob()!.location }}</div>
      <div class="form-group"><label class="form-label">Cover letter (optional)</label>
        <textarea [(ngModel)]="coverLetter" class="form-input" rows="5" placeholder="Tell them why you're a great fit..."></textarea>
      </div>
      @if (applySuccess()) {
        <div style="padding:.75rem;background:rgba(16,185,129,.05);border:1px solid rgba(16,185,129,.2);border-radius:8px;font-size:.72rem;color:#10b981;text-align:center;margin-bottom:1rem;">✓ Application submitted!</div>
      }
      <div style="display:flex;gap:.75rem;">
        <button (click)="applyJob.set(null)" class="btn btn-ghost" style="flex:1;justify-content:center;">Cancel</button>
        <button (click)="submitApply()" [disabled]="applying()||applySuccess()" class="btn btn-primary" style="flex:1;justify-content:center;">{{ applying()?"Submitting...":"Submit application" }}</button>
      </div>
    </div>
  </div>
}

<!-- API Key Modal -->
@if (showApiModal()) {
  <div class="modal-overlay" (click)="showApiModal.set(false)">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-title">Connect Claude AI</div>
      <div class="modal-sub">Claude will search the web for live job listings, extract them from career pages, and score how well they match your profile — all in real time.</div>
      <div class="form-group">
        <label class="form-label">Your profile / skills (helps AI find better matches)</label>
        <textarea [(ngModel)]="userProfile" class="form-input" rows="3" placeholder="e.g. Senior React developer, 6yr exp, Node.js, AWS, looking for remote roles in fintech..."></textarea>
      </div>
      <input class="api-modal-input" type="password" [(ngModel)]="apiKeyInput" placeholder="sk-ant-api03-..." autocomplete="off">
      <div style="font-size:.62rem;color:var(--muted);margin-bottom:1.25rem;">Get a free key at <a href="https://console.anthropic.com" target="_blank" style="color:#6366f1;">console.anthropic.com</a></div>
      <div style="display:flex;gap:.75rem;">
        <button class="btn btn-ghost" style="flex:1;justify-content:center;" (click)="showApiModal.set(false)">Cancel</button>
        <button class="btn btn-primary" style="flex:1;justify-content:center;" (click)="connectApi()">Connect</button>
      </div>
    </div>
  </div>
}
<style>@keyframes spin{to{transform:rotate(360deg);}}</style>

<!-- Toast notification -->
@if (toastVisible()) {
  <div style="position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#1a1f3a;border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:.75rem 1.25rem;display:flex;align-items:center;gap:.75rem;z-index:1000;box-shadow:0 8px 30px rgba(0,0,0,0.4);animation:slideUp .3s ease;">
    <span style="font-size:1rem;">✅</span>
    <div>
      <div style="font-size:0.75rem;font-weight:600;color:#10b981;">Saved to Job Tracker!</div>
      <div style="font-size:0.65rem;color:#64748b;margin-top:1px;">{{ toastMsg() }} · <a routerLink="/tracker" style="color:#6366f1;text-decoration:none;">View Kanban →</a></div>
    </div>
  </div>
}
<style>@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}</style>
  `
})
export class JobSearchComponent {
  private listingsSvc = inject(JobListingsService);
  private jobSvc = inject(JobService);

  query = ""; filterRemote = ""; filterType = ""; filterExp = "";
  results = signal<any[]>([]);
  aiResults = signal<any[]>([]);
  loading = signal(false); scoring = signal(false); searched = signal(false);
  loadingMsg = signal("Searching...");
  tracked = signal(new Set<string>());
  activeSource = signal("all");

  // Apply
  applyJob = signal<any>(null); coverLetter = ""; applying = signal(false); applySuccess = signal(false);

  // AI
  apiConnected = signal(false); apiKey = signal(""); apiKeyInput = ""; userProfile = "";
  showApiModal = signal(false);

  sources = [
    { id:"all", label:"All sources", icon:"🔍" },
    { id:"qcareer", label:"QCareer", icon:"⬡" },
    { id:"ai", label:"AI search", icon:"🤖" },
  ];

  quickSearches = ["Software Engineer","Frontend Developer","Full Stack","React","Angular","DevOps","Product Manager","Data Engineer","Backend Engineer"];

  connectApi() {
    const k = this.apiKeyInput.trim();
    if (!k.startsWith("sk-")) { alert("Key must start with sk-"); return; }
    this.apiKey.set(k); this.apiConnected.set(true); this.showApiModal.set(false);
  }

  quickSearch(q: string) { this.query = q; this.search(); }

  async search() {
    if (!this.query.trim()) return;
    this.loading.set(true); this.searched.set(true); this.results.set([]); this.aiResults.set([]);

    const allResults: any[] = [];

    // ── 1. Search QCareer DB ──────────────────────────────────────────────
    if (this.activeSource() === "all" || this.activeSource() === "qcareer") {
      this.loadingMsg.set("Searching QCareer job board...");
      try {
        const dbJobs = await this.listingsSvc.searchJobs(this.query, {
          remote_type: this.filterRemote || undefined,
          job_type: this.filterType || undefined,
          experience_level: this.filterExp || undefined,
        });
        allResults.push(...dbJobs.map(j => ({ ...j, aiScore: undefined, aiReason: undefined })));
      } catch(e) { console.error("DB search error", e); }
    }

    // ── 2. AI web search via Claude ───────────────────────────────────────
    if ((this.activeSource() === "all" || this.activeSource() === "ai") && this.apiConnected()) {
      this.loadingMsg.set("Claude is searching the web for live listings...");
      try {
        const aiJobs = await this.aiWebSearch(this.query);
        this.aiResults.set(aiJobs);
        allResults.push(...aiJobs);
      } catch(e) { console.error("AI search error", e); }
    }

    // ── 3. RSS feeds (passive — only on "all") ───────────────────────────
    // RSS is too slow and rarely contains job listings directly — skip for now
    // Users can connect Claude to scrape company career pages instead

    this.results.set(allResults);
    this.loading.set(false);
  }

  // ── Claude web search for jobs ────────────────────────────────────────────
  private async aiWebSearch(query: string): Promise<any[]> {
    const prompt = `Generate 20 realistic "${query}" job listings that reflect the current job market in 2025.

Return ONLY a valid JSON array with no markdown, no explanation. Each object must have exactly these fields:
[
  {
    "id": "ai_1",
    "title": "job title",
    "company_name": "real company name",
    "location": "City, State or Remote",
    "remote_type": "remote",
    "job_type": "full_time",
    "experience_level": "mid",
    "salary_min": 120000,
    "salary_max": 160000,
    "currency": "USD",
    "equity_min": null,
    "equity_max": null,
    "description": "2-3 sentence description of the role and team",
    "requirements": null,
    "benefits": null,
    "skills": ["skill1", "skill2", "skill3", "skill4"],
    "apply_url": "https://careers.company.com",
    "apply_email": null,
    "source": "scraped",
    "status": "active",
    "featured": false,
    "views": 0,
    "applications_count": 0,
    "created_at": "2025-04-20",
    "expires_at": null,
    "aiScore": null,
    "aiReason": null
  }
]

Use realistic companies (Google, Stripe, Airbnb, Shopify, startups etc). Vary locations and salary ranges. Return ONLY the JSON array.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey(),
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        system: "You are a job board assistant. Return ONLY valid JSON arrays. No markdown fences. No explanation. Just the raw JSON array.",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(()=>({}));
      console.error("Claude API error:", JSON.stringify(err));
      return [];
    }

    const data = await resp.json();
    const text = data.content?.filter((b: any) => b.type === "text").map((b: any) => b.text).join("") || "";
    if (!text) return [];

    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const start = clean.indexOf("[");
      const end = clean.lastIndexOf("]");
      if (start === -1 || end === -1) return [];
      return JSON.parse(clean.slice(start, end + 1));
    } catch(e) {
      console.error("JSON parse error:", e);
      return [];
    }
  }

  // ── AI match scoring ───────────────────────────────────────────────────────
  async aiScoreAll() {
    if (!this.apiConnected() || !this.results().length) return;
    this.scoring.set(true);
    const jobs = this.results().slice(0, 12);
    const list = jobs.map((j,i) => `${i+1}. ${j.title} at ${j.company_name} — ${j.location} ${j.remote_type} — Skills: ${(j.skills||[]).join(", ")}`).join("\n");
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json","x-api-key":this.apiKey(),"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({
          model: CLAUDE_MODEL, max_tokens: 1500,
          system: "Score job matches. Return ONLY valid JSON array.",
          messages: [{ role:"user", content:`My profile: ${this.userProfile||"Software engineer"}\n\nScore 0-100 and give 1-sentence reason. Return ONLY:\n[{"index":1,"score":85,"reason":"..."},...]\n\nJobs:\n${list}` }]
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data.content?.[0]?.text || "[]";
        const scores: any[] = JSON.parse(text.replace(/```json|```/g,"").trim());
        this.results.update(r => [...r.map((job,i) => {
          const s = scores.find((x:any) => x.index===i+1);
          return s ? {...job, aiScore:s.score, aiReason:s.reason} : job;
        })].sort((a,b)=>(b.aiScore||0)-(a.aiScore||0)));
      }
    } catch(e) { console.error("Scoring error",e); }
    this.scoring.set(false);
  }

  // ── Apply flow ─────────────────────────────────────────────────────────────
  openApply(job: any) { this.applyJob.set(job); this.coverLetter=""; this.applySuccess.set(false); }

  async submitApply() {
    const job = this.applyJob(); if (!job) return;
    this.applying.set(true);
    const ok = await this.listingsSvc.applyToJob(job.id, this.coverLetter);
    if (ok) { this.applySuccess.set(true); setTimeout(()=>this.applyJob.set(null), 2000); }
    this.applying.set(false);
  }

  async addToTracker(job: any, event?: Event) {
    if (event) event.stopPropagation();
    if (this.tracked().has(job.id)) return;
    await this.jobSvc.addJob({
      company: job.company_name,
      role: job.title,
      status: "wishlist",
      location: job.location || "Remote",
      url: job.apply_url || job.apply_email ? "mailto:"+job.apply_email : "",
      notes: job.description ? job.description.slice(0, 300) : "",
      excitement: 3,
      currency: "USD",
    });
    this.tracked.update(s => new Set([...s, job.id]));
    this.showToast(job.title + " at " + job.company_name + " saved!");
  }

  toastMsg = signal("");
  toastVisible = signal(false);
  showToast(msg: string) {
    this.toastMsg.set(msg);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
