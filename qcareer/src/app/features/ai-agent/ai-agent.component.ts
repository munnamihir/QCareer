import { Component, signal, ViewChild, ElementRef } from "@angular/core";
import { FormsModule } from "@angular/forms";

const MODEL = "claude-sonnet-4-6";
const SYS = "You are QCareer AI, an expert career coach. You have deep knowledge of resume writing, cover letters, interview preparation, and salary negotiation. Be specific, practical, and tailor everything to the exact job provided. Use markdown.";

@Component({
  selector: "app-ai-agent",
  standalone: true,
  imports: [FormsModule],
  template: `
<div style="min-height:100vh;display:flex;flex-direction:column;">

  <!-- Header -->
  <div style="padding:1.25rem 2rem;border-bottom:1px solid var(--border);background:var(--bg2);flex-shrink:0;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
      <div>
        <h1 style="font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;color:#e2e8f0;letter-spacing:1px;">⬡ AI Career Agent</h1>
        <div style="font-size:0.62rem;color:var(--muted);margin-top:2px;font-family:'JetBrains Mono',monospace;">Job-aware · Resume Tailor · Cover Letter · Mock Interview · Salary Coach</div>
      </div>
      <span class="api-badge" [class.connected]="apiConnected()" (click)="showApiModal.set(true)">
        {{ apiConnected() ? "✓ Claude connected" : "Connect Claude API" }}
      </span>
    </div>

    <!-- Tab bar -->
    <div style="display:flex;background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:3px;gap:2px;">
      @for (t of tabs; track t.id) {
        <button class="ai-tab" [class.active]="activeTab()===t.id" (click)="activeTab.set(t.id)" style="flex:1;">
          {{ t.icon }} {{ t.label }}
        </button>
      }
    </div>
  </div>

  <div style="flex:1;overflow-y:auto;padding:1.5rem 2rem;">

    <!-- ── JOB CONTEXT CARD (shown on all tabs) ── -->
    <div style="background:var(--bg2);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:1.25rem;margin-bottom:1.5rem;">
      <div style="font-size:0.65rem;letter-spacing:1.5px;text-transform:uppercase;color:#818cf8;font-family:'JetBrains Mono',monospace;margin-bottom:.85rem;display:flex;align-items:center;gap:.5rem;">
        <span>🎯</span> Target Job
        @if (jobLoaded()) { <span style="color:#10b981;margin-left:auto;">✓ Job loaded · {{ jobTitle() }}</span> }
      </div>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;">
        <input [(ngModel)]="jobUrl" placeholder="Paste job posting URL (LinkedIn, Indeed, company career page...)"
          style="flex:2;min-width:260px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.65rem 1rem;color:#e2e8f0;font-size:0.78rem;outline:none;transition:border-color .2s;"
          (focus)="$event.target.style.borderColor='#6366f1'" (blur)="$event.target.style.borderColor='rgba(99,102,241,0.15)'">
        <button (click)="loadJob()" [disabled]="!jobUrl||jobLoading()" class="btn btn-outline" style="flex-shrink:0;">
          {{ jobLoading() ? "Loading..." : "Load job" }}
        </button>
        <button (click)="showJdPaste.set(!showJdPaste())" class="btn btn-ghost" style="flex-shrink:0;font-size:0.72rem;">
          {{ showJdPaste() ? "Hide" : "Paste JD instead" }}
        </button>
      </div>
      @if (showJdPaste()) {
        <textarea [(ngModel)]="jobDescription" rows="5" placeholder="Paste the full job description here..."
          style="width:100%;margin-top:.75rem;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem;color:#e2e8f0;font-size:0.72rem;outline:none;resize:vertical;font-family:'JetBrains Mono',monospace;line-height:1.7;"
          (focus)="$event.target.style.borderColor='#6366f1'" (blur)="$event.target.style.borderColor='rgba(99,102,241,0.15)'">
        </textarea>
        <div style="display:flex;gap:.5rem;margin-top:.5rem;">
          <input [(ngModel)]="jobTitle" placeholder="Job title" style="flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.5rem .9rem;color:#e2e8f0;font-size:0.75rem;outline:none;">
          <input [(ngModel)]="jobCompany" placeholder="Company" style="flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.5rem .9rem;color:#e2e8f0;font-size:0.75rem;outline:none;">
          <button (click)="confirmJd()" class="btn btn-primary btn-sm">Use this JD</button>
        </div>
      }
      @if (jobLoaded() && jobDescription) {
        <div style="margin-top:.75rem;background:var(--bg3);border:1px solid rgba(99,102,241,0.1);border-radius:8px;padding:.75rem 1rem;font-size:0.68rem;color:var(--muted);line-height:1.7;max-height:100px;overflow-y:auto;font-family:'JetBrains Mono',monospace;">
          {{ jobDescription | slice:0:400 }}...
        </div>
      }
    </div>

    <!-- ── RESUME TAILOR ── -->
    @if (activeTab()==="resume") {
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">

        <!-- Left: Resume input -->
        <div class="ai-panel" style="display:flex;flex-direction:column;min-height:500px;">
          <div class="ai-panel-header">
            <span class="ai-panel-title">Your Resume</span>
            <label style="margin-left:auto;font-size:0.6rem;color:#6366f1;cursor:pointer;font-family:'JetBrains Mono',monospace;">
              ↑ Upload PDF/TXT
              <input type="file" accept=".txt,.pdf,.doc,.docx" style="display:none" (change)="uploadResume($event)">
            </label>
          </div>
          <textarea class="ai-textarea" [(ngModel)]="resumeText"
            placeholder="Paste your resume here, or upload a file above.&#10;&#10;Include:&#10;• Work experience with achievements&#10;• Skills&#10;• Education&#10;• Projects&#10;&#10;The more detail you provide, the better Claude can tailor it.">
          </textarea>
          <div class="ai-actions-bar" style="gap:.5rem;flex-wrap:wrap;">
            <select [(ngModel)]="tailorMode" class="form-input" style="flex:1;font-size:0.68rem;padding:.4rem .75rem;">
              <option value="bullets">Rewrite bullet points only</option>
              <option value="full">Full resume rewrite</option>
              <option value="skills">Skills section only</option>
              <option value="summary">Professional summary</option>
              <option value="ats">ATS optimization</option>
            </select>
            <button (click)="tailorResume()" [disabled]="aiLoading()||!resumeText||!jobDescription" class="btn btn-primary btn-sm">
              {{ aiLoading() ? "Tailoring..." : "⬡ Tailor to this job" }}
            </button>
          </div>
          @if (!jobLoaded()) { <div style="padding:.5rem 1rem;font-size:.62rem;color:#f59e0b;font-family:'JetBrains Mono',monospace;">⚠ Load a job first using the Target Job card above</div> }
        </div>

        <!-- Right: Tailored output -->
        <div class="ai-panel" style="display:flex;flex-direction:column;min-height:500px;">
          <div class="ai-panel-header">
            <span class="ai-panel-title">Tailored Resume</span>
            @if (resumeOutput()) {
              <div style="margin-left:auto;display:flex;gap:.4rem;">
                <button (click)="copyHtml(resumeOutput())" class="btn btn-ghost btn-sm" style="font-size:.6rem;">Copy</button>
                <button (click)="downloadTxt(resumeOutput(),'tailored-resume.txt')" class="btn btn-ghost btn-sm" style="font-size:.6rem;">Download</button>
              </div>
            }
          </div>
          @if (!resumeOutput()) {
            <div class="empty"><div class="empty-icon">📝</div><div class="empty-title">Ready to tailor</div><div class="empty-hint">Load a job, paste your resume, and click "Tailor to this job".</div></div>
          } @else {
            <div class="ai-output" [innerHTML]="resumeOutput()"></div>
          }
        </div>
      </div>

      <!-- ATS Score -->
      @if (atsScore()) {
        <div style="margin-top:1rem;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:1.25rem;">
          <div style="font-size:0.72rem;font-weight:600;color:#e2e8f0;margin-bottom:.75rem;">ATS Analysis</div>
          <div [innerHTML]="atsScore()" style="font-size:0.73rem;line-height:1.8;color:var(--muted);"></div>
        </div>
      }
    }

    <!-- ── COVER LETTER ── -->
    @if (activeTab()==="cover") {
      <div style="display:grid;grid-template-columns:300px 1fr;gap:1.25rem;">

        <!-- Left: Settings -->
        <div class="ai-panel">
          <div class="ai-panel-header"><span class="ai-panel-title">Cover Letter Settings</span></div>
          <div style="padding:1rem;display:flex;flex-direction:column;gap:.75rem;overflow-y:auto;">
            <div class="form-group" style="margin:0;"><label class="form-label">Hiring manager name</label><input [(ngModel)]="cl.manager" class="form-input" placeholder="Leave blank if unknown"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Tone</label>
              <select [(ngModel)]="cl.tone" class="form-input">
                <option value="professional">Professional & formal</option>
                <option value="enthusiastic">Enthusiastic & passionate</option>
                <option value="concise">Concise & direct</option>
                <option value="creative">Creative & bold</option>
                <option value="conversational">Conversational & warm</option>
              </select>
            </div>
            <div class="form-group" style="margin:0;"><label class="form-label">Your top achievement</label>
              <textarea [(ngModel)]="cl.achievement" class="form-input" rows="3" placeholder="e.g. Led migration to microservices, reducing latency by 40%..."></textarea>
            </div>
            <div class="form-group" style="margin:0;"><label class="form-label">Why this company specifically?</label>
              <textarea [(ngModel)]="cl.whyCompany" class="form-input" rows="3" placeholder="What excites you about this company's mission, product, or culture?"></textarea>
            </div>
            <div class="form-group" style="margin:0;"><label class="form-label">Your resume (for context)</label>
              <textarea [(ngModel)]="resumeText" class="form-input" rows="4" placeholder="Paste resume for more personalized letter..."></textarea>
            </div>
            <div class="form-group" style="margin:0;"><label class="form-label">Length</label>
              <select [(ngModel)]="cl.length" class="form-input">
                <option value="short">Short (3 paragraphs)</option>
                <option value="standard">Standard (4 paragraphs)</option>
                <option value="detailed">Detailed (5 paragraphs)</option>
              </select>
            </div>
            @if (!jobLoaded()) { <div style="font-size:.62rem;color:#f59e0b;font-family:'JetBrains Mono',monospace;">⚠ Load a job first</div> }
            <button (click)="generateCoverLetter()" [disabled]="aiLoading()||!jobDescription" class="btn btn-primary" style="justify-content:center;">
              {{ aiLoading() ? "Writing..." : "⬡ Generate cover letter" }}
            </button>
            @if (clOutput()) {
              <button (click)="generateCoverLetter()" [disabled]="aiLoading()" class="btn btn-ghost btn-sm" style="justify-content:center;">↺ Regenerate</button>
            }
          </div>
        </div>

        <!-- Right: Letter output -->
        <div class="ai-panel" style="display:flex;flex-direction:column;min-height:600px;">
          <div class="ai-panel-header">
            <span class="ai-panel-title">Cover Letter — {{ jobTitle() || "Your next role" }}</span>
            @if (clOutput()) {
              <div style="margin-left:auto;display:flex;gap:.4rem;">
                <button (click)="copyHtml(clOutput())" class="btn btn-ghost btn-sm" style="font-size:.6rem;">Copy</button>
                <button (click)="downloadTxt(clOutput(),'cover-letter.txt')" class="btn btn-ghost btn-sm" style="font-size:.6rem;">Download</button>
              </div>
            }
          </div>
          @if (!clOutput()) {
            <div class="empty"><div class="empty-icon">✉️</div><div class="empty-title">Ready to write</div><div class="empty-hint">Load a job, fill in the settings, and click Generate.</div></div>
          } @else {
            <div class="ai-output" [innerHTML]="clOutput()"></div>
          }
        </div>
      </div>
    }

    <!-- ── MOCK INTERVIEW ── -->
    @if (activeTab()==="interview") {
      <div style="display:grid;grid-template-columns:240px 1fr;gap:1.25rem;min-height:600px;">

        <!-- Left: Setup -->
        <div class="ai-panel">
          <div class="ai-panel-header"><span class="ai-panel-title">Interview Setup</span></div>
          <div style="padding:1rem;display:flex;flex-direction:column;gap:.75rem;">
            <div class="form-group" style="margin:0;"><label class="form-label">Interview type</label>
              <select [(ngModel)]="iv.type" class="form-input">
                <option value="behavioral">Behavioral (STAR)</option>
                <option value="technical">Technical</option>
                <option value="system design">System Design</option>
                <option value="culture fit">Culture Fit</option>
                <option value="case">Case Study</option>
                <option value="final">Final Round</option>
              </select>
            </div>
            <div class="form-group" style="margin:0;"><label class="form-label">Difficulty</label>
              <select [(ngModel)]="iv.difficulty" class="form-input">
                <option value="easy">Easy (warm-up)</option>
                <option value="medium">Medium (standard)</option>
                <option value="hard">Hard (FAANG-level)</option>
              </select>
            </div>
            <div class="form-group" style="margin:0;"><label class="form-label">Your experience (yrs)</label>
              <input type="number" [(ngModel)]="iv.yoe" class="form-input" placeholder="5"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Focus area (optional)</label>
              <input [(ngModel)]="iv.focus" class="form-input" placeholder="e.g. leadership, React, scaling"></div>
            @if (!jobLoaded()) { <div style="font-size:.62rem;color:#f59e0b;font-family:'JetBrains Mono',monospace;">⚠ Load a job for role-specific questions</div> }
            <button (click)="startInterview()" [disabled]="aiLoading()" class="btn btn-primary" style="justify-content:center;">
              {{ ivMessages().length ? "Next question →" : "⬡ Start interview" }}
            </button>
            @if (ivMessages().length) {
              <button (click)="resetInterview()" class="btn btn-ghost btn-sm" style="justify-content:center;">Reset</button>
              <button (click)="getFeedback()" [disabled]="aiLoading()" class="btn btn-outline btn-sm" style="justify-content:center;font-size:.65rem;">Get overall feedback</button>
            }
          </div>
        </div>

        <!-- Right: Chat -->
        <div class="ai-panel" style="display:flex;flex-direction:column;">
          <div class="ai-panel-header">
            <span class="ai-panel-title">Mock Interview · {{ jobTitle() || "General" }}</span>
            <span style="margin-left:auto;font-size:0.6rem;color:var(--muted);font-family:'JetBrains Mono',monospace;">{{ ivMessages().length }} messages</span>
          </div>
          <div #ivScroll style="flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.75rem;">
            @if (!ivMessages().length) {
              <div class="empty"><div class="empty-icon">🎤</div><div class="empty-title">Ready for your interview</div>
                <div class="empty-hint">{{ jobLoaded() ? "Claude will ask you questions specific to the " + jobTitle() + " role at " + jobCompany : "Load a job for role-specific questions, or start a general interview." }}</div>
              </div>
            }
            @for (m of ivMessages(); track $index) {
              <div class="chat-msg" [class]="m.role" [innerHTML]="m.html"></div>
            }
          </div>
          <div class="chat-input-row">
            <textarea #ivInput [(ngModel)]="ivText" placeholder="Type your answer... (Shift+Enter for new line)"
              style="flex:1;background:rgba(0,0,0,.3);border:1px solid var(--ai-border);border-radius:8px;padding:.6rem .9rem;color:#e2e8f0;font-family:'JetBrains Mono',monospace;font-size:0.72rem;outline:none;resize:none;min-height:48px;max-height:120px;overflow-y:auto;"
              (keydown)="onIvKey($event)">
            </textarea>
            <button (click)="sendAnswer()" [disabled]="aiLoading()||!ivText.trim()" class="btn btn-primary btn-sm">Send</button>
          </div>
        </div>
      </div>
    }

    <!-- ── SALARY COACH ── -->
    @if (activeTab()==="salary") {
      <div style="display:grid;grid-template-columns:320px 1fr;gap:1.25rem;">

        <!-- Left: Your situation -->
        <div class="ai-panel">
          <div class="ai-panel-header"><span class="ai-panel-title">Your Situation</span></div>
          <div style="padding:1rem;display:flex;flex-direction:column;gap:.75rem;overflow-y:auto;">
            <div class="form-group" style="margin:0;"><label class="form-label">Years of experience</label><input type="number" [(ngModel)]="sal.yoe" class="form-input" placeholder="5"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Current / last salary ($)</label><input type="number" [(ngModel)]="sal.current" class="form-input" placeholder="120000"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Offer received ($)</label><input type="number" [(ngModel)]="sal.offer" class="form-input" placeholder="150000"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Your target ($)</label><input type="number" [(ngModel)]="sal.target" class="form-input" placeholder="175000"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Location</label><input [(ngModel)]="sal.location" class="form-input" placeholder="San Francisco, CA"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Competing offers</label><input [(ngModel)]="sal.competing" class="form-input" placeholder="$160k from Stripe (optional)"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Your key strengths</label><textarea [(ngModel)]="sal.strengths" class="form-input" rows="3" placeholder="Led migration to microservices, 40% latency reduction..."></textarea></div>
            @if (!jobLoaded()) { <div style="font-size:.62rem;color:#f59e0b;font-family:'JetBrains Mono',monospace;">⚠ Load a job for accurate market analysis</div> }
            <div class="quick-pills">
              <button class="quick-pill" (click)="salAction('analyze')" [disabled]="aiLoading()">Market analysis</button>
              <button class="quick-pill" (click)="salAction('script')" [disabled]="aiLoading()">Negotiation script</button>
              <button class="quick-pill" (click)="salAction('email')" [disabled]="aiLoading()">Counter-offer email</button>
              <button class="quick-pill" (click)="salAction('equity')" [disabled]="aiLoading()">Equity breakdown</button>
              <button class="quick-pill" (click)="salAction('benefits')" [disabled]="aiLoading()">Benefits to ask for</button>
            </div>
            <button (click)="salAction('full')" [disabled]="aiLoading()||!sal.yoe" class="btn btn-primary" style="justify-content:center;">
              {{ aiLoading() ? "Analyzing..." : "⬡ Full negotiation plan" }}
            </button>
          </div>
        </div>

        <!-- Right: Output -->
        <div class="ai-panel" style="display:flex;flex-direction:column;min-height:600px;">
          <div class="ai-panel-header">
            <span class="ai-panel-title">Salary Coach · {{ jobTitle() || "Your offer" }}</span>
            @if (salOutput()) { <button (click)="copyHtml(salOutput())" class="btn btn-ghost btn-sm" style="margin-left:auto;font-size:.6rem;">Copy</button> }
          </div>
          @if (!salOutput()) {
            <div class="empty"><div class="empty-icon">💰</div><div class="empty-title">Know your worth</div>
              <div class="empty-hint">{{ jobLoaded() ? "Claude will analyze the " + jobTitle() + " salary at " + jobCompany + " specifically." : "Load a job for role-specific market rates and negotiation tactics." }}</div>
            </div>
          } @else {
            <div class="ai-output" [innerHTML]="salOutput()"></div>
          }
        </div>
      </div>
    }
  </div>
</div>

<!-- API Key Modal -->
@if (showApiModal()) {
  <div class="modal-overlay" (click)="showApiModal.set(false)">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-title">Connect Claude AI</div>
      <div class="modal-sub">Enter your Anthropic API key to enable all AI features. Your key stays in your browser — never sent to QCareer servers.</div>
      <input class="api-modal-input" type="password" [(ngModel)]="apiKeyInput" placeholder="sk-ant-api03-..." autocomplete="off">
      <div style="font-size:.62rem;color:var(--muted);margin-bottom:1.25rem;">Get a key at <a href="https://console.anthropic.com" target="_blank" style="color:#6366f1;">console.anthropic.com</a></div>
      <div style="display:flex;gap:.75rem;">
        <button class="btn btn-ghost" style="flex:1;justify-content:center;" (click)="showApiModal.set(false)">Cancel</button>
        <button class="btn btn-primary" style="flex:1;justify-content:center;" (click)="connectApi()">Connect</button>
      </div>
    </div>
  </div>
}
  `
})
export class AiAgentComponent {
  @ViewChild("ivScroll") ivScrollEl!: ElementRef<HTMLDivElement>;

  tabs = [
    { id:"resume",    label:"Resume Tailor",   icon:"📝" },
    { id:"cover",     label:"Cover Letter",    icon:"✉️"  },
    { id:"interview", label:"Mock Interview",  icon:"🎤" },
    { id:"salary",    label:"Salary Coach",    icon:"💰" },
  ];

  activeTab    = signal("resume");
  aiLoading    = signal(false);
  apiConnected = signal(false);
  apiKey       = signal("");
  apiKeyInput  = "";
  showApiModal = signal(false);

  // Job context
  jobUrl         = "";
  jobDescription = "";
  jobTitle       = signal("");
  jobCompany     = signal("");
  jobLoaded      = signal(false);
  jobLoading     = signal(false);
  showJdPaste    = signal(false);

  // Resume
  resumeText   = "";
  tailorMode   = "bullets";
  resumeOutput = signal("");
  atsScore     = signal("");

  // Cover letter
  cl: any = { manager:"", tone:"professional", achievement:"", whyCompany:"", length:"standard" };
  clOutput = signal("");

  // Interview
  iv: any = { type:"behavioral", difficulty:"medium", yoe:5, focus:"" };
  ivText = ""; ivMessages = signal<{role:string;html:string}[]>([]);

  // Salary
  sal: any = { yoe:null, current:null, offer:null, target:null, location:"", competing:"", strengths:"" };
  salOutput = signal("");

  connectApi() {
    const k = this.apiKeyInput.trim();
    if (!k.startsWith("sk-")) { alert("Key must start with sk-"); return; }
    this.apiKey.set(k); this.apiConnected.set(true); this.showApiModal.set(false);
  }

  // ── Load job from URL via Claude ──────────────────────────────────────────
  async loadJob() {
    if (!this.jobUrl) return;
    if (!this.apiConnected()) { this.showApiModal.set(true); return; }
    this.jobLoading.set(true);
    try {
      // Use Claude to extract job details from URL content
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json","x-api-key":this.apiKey(),"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({
          model: MODEL, max_tokens: 2000,
          system: "Extract job posting information and return ONLY valid JSON. No markdown, no explanation.",
          messages: [{ role:"user", content:
            `Extract the job details from this URL: ${this.jobUrl}

If you cannot access the URL directly, generate a realistic job description based on what the URL suggests.

Return ONLY this JSON:
{
  "title": "exact job title",
  "company": "company name",
  "location": "location",
  "description": "full job description with responsibilities and requirements (minimum 300 words)",
  "skills": ["skill1", "skill2"],
  "salary": "salary range if mentioned or null",
  "type": "full-time / contract etc"
}`
          }]
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data.content?.[0]?.text || "";
        const clean = text.replace(/```json|```/g,"").trim();
        const job = JSON.parse(clean);
        this.jobTitle.set(job.title || "");
        this.jobCompany.set(job.company || "");
        this.jobDescription = job.description || "";
        this.jobLoaded.set(true);
        this.showJdPaste.set(false);
      }
    } catch(e) {
      // Fallback: show paste area
      this.showJdPaste.set(true);
      alert("Could not load URL automatically. Please paste the job description instead.");
    }
    this.jobLoading.set(false);
  }

  confirmJd() {
    if (!this.jobDescription) return;
    this.jobLoaded.set(true);
    this.showJdPaste.set(false);
  }

  // ── Claude call ───────────────────────────────────────────────────────────
  private fmt(text: string): string {
    return text
      .replace(/```([\w]*)\n?([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:6px;padding:.75rem;overflow-x:auto;white-space:pre-wrap;font-size:.68rem;margin:.5rem 0;">$2</pre>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#e2e8f0;">$1</strong>')
      .replace(/^### (.+)$/gm, '<h4 style="color:#818cf8;font-size:.8rem;margin:.75rem 0 .25rem;font-weight:600;">$1</h4>')
      .replace(/^## (.+)$/gm,  '<h3 style="color:#a78bfa;font-size:.88rem;margin:.85rem 0 .3rem;font-weight:700;">$1</h3>')
      .replace(/^# (.+)$/gm,   '<h2 style="color:#e2e8f0;font-size:.95rem;margin:1rem 0 .4rem;font-weight:700;">$1</h2>')
      .replace(/^- (.+)$/gm, '<div style="display:flex;gap:.5rem;margin-bottom:.2rem;"><span style="color:#6366f1;flex-shrink:0;">•</span><span>$1</span></div>')
      .replace(/^\d+\. (.+)$/gm, '<div style="display:flex;gap:.5rem;margin-bottom:.2rem;"><span style="color:#6366f1;flex-shrink:0;">→</span><span>$1</span></div>')
      .replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
  }

  private async claude(system: string, prompt: string, onChunk: (t:string)=>void): Promise<void> {
    if (!this.apiConnected()) { this.showApiModal.set(true); return; }
    this.aiLoading.set(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json","x-api-key":this.apiKey(),"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:MODEL, max_tokens:4096, stream:true, system, messages:[{role:"user",content:prompt}] })
      });
      if (!resp.ok) { const e=await resp.json(); throw new Error(e.error?.message||"API error"); }
      const reader=resp.body!.getReader(); const dec=new TextDecoder(); let buf="";
      while(true) {
        const {done,value}=await reader.read(); if(done)break;
        buf+=dec.decode(value,{stream:true});
        const parts=buf.split("\n"); buf=parts.pop()!;
        for(const line of parts){ if(!line.startsWith("data: "))continue; const d=line.slice(6).trim(); if(d==="[DONE]")continue; try{const p=JSON.parse(d);if(p.type==="content_block_delta"&&p.delta?.text)onChunk(p.delta.text);}catch{} }
      }
    } catch(e:any){ alert("Error: "+e.message); }
    finally{ this.aiLoading.set(false); }
  }

  private jobContext(): string {
    if (!this.jobLoaded()) return "";
    return `\n\nTARGET JOB:\nTitle: ${this.jobTitle()}\nCompany: ${this.jobCompany()}\n\nJob Description:\n${this.jobDescription}`;
  }

  // ── Resume Tailor ─────────────────────────────────────────────────────────
  async tailorResume() {
    if (!this.resumeText || !this.jobDescription) return;
    let out = ""; this.resumeOutput.set('<span class="ai-stream-dot"></span> Analyzing job requirements and tailoring your resume...');
    const modeInstructions: Record<string,string> = {
      bullets: "Rewrite ONLY the bullet points in the work experience section to match the job. Keep everything else the same. Use strong action verbs and quantify achievements where possible.",
      full: "Completely rewrite the entire resume optimized for this specific job. Reorganize sections if needed. Add keywords from the JD naturally.",
      skills: "Rewrite ONLY the skills section to perfectly match the job requirements. Add missing relevant skills the candidate likely has based on their experience. Remove irrelevant ones.",
      summary: "Write a compelling professional summary/objective (3-4 sentences) tailored specifically to this role and company.",
      ats: "Optimize the resume for ATS systems. Identify missing keywords from the JD, suggest where to add them, and flag any formatting issues.",
    };
    await this.claude(
      SYS + this.jobContext(),
      `${modeInstructions[this.tailorMode]}\n\nMY RESUME:\n${this.resumeText}\n\nAfter the tailored content, add a section called "## ATS Match Analysis" with:\n- Match score estimate (X/100)\n- Top 5 keywords from JD that are present\n- Top 5 missing keywords to add\n- 3 specific improvement suggestions`,
      chunk => { out+=chunk; this.resumeOutput.set(this.fmt(out)); }
    );
  }

  async uploadResume(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { this.resumeText = e.target?.result as string; };
    reader.readAsText(file);
  }

  // ── Cover Letter ──────────────────────────────────────────────────────────
  async generateCoverLetter() {
    if (!this.jobDescription) return;
    let out = ""; this.clOutput.set('<span class="ai-stream-dot"></span> Writing your cover letter...');
    const lengths: Record<string,string> = { short:"3 paragraphs", standard:"4 paragraphs", detailed:"5 paragraphs" };
    await this.claude(
      SYS + this.jobContext(),
      `Write a ${this.cl.tone} cover letter (${lengths[this.cl.length]}) for this exact position.

${this.cl.manager ? `Address it to: ${this.cl.manager}` : "Use 'Dear Hiring Manager' or the team name if mentioned in the JD."}

${this.cl.achievement ? `My top achievement to highlight: ${this.cl.achievement}` : ""}
${this.cl.whyCompany ? `Why I want THIS company specifically: ${this.cl.whyCompany}` : ""}
${this.resumeText ? `My background:\n${this.resumeText.slice(0,1500)}` : ""}

Requirements:
- Open with a strong, specific hook referencing the role and company
- Reference 2-3 specific requirements from the JD and show how I meet them
- Include concrete achievement with numbers if provided
- Show genuine knowledge of the company/role
- End with confident CTA
- Do NOT use generic phrases like "I am writing to apply" or "Please find enclosed"
- Format as a proper letter with date, greeting, body, closing`,
      chunk => { out+=chunk; this.clOutput.set(this.fmt(out)); }
    );
  }

  // ── Mock Interview ────────────────────────────────────────────────────────
  addIvMsg(role: string, text: string) {
    this.ivMessages.update(m=>[...m,{role,html:this.fmt(text)}]);
    setTimeout(()=>{ if(this.ivScrollEl) this.ivScrollEl.nativeElement.scrollTop=99999; },50);
  }
  updateLastIvMsg(text: string) {
    this.ivMessages.update(m=>{ const c=[...m]; c[c.length-1]={...c[c.length-1],html:this.fmt(text)}; return c; });
    setTimeout(()=>{ if(this.ivScrollEl) this.ivScrollEl.nativeElement.scrollTop=99999; },0);
  }

  async startInterview() {
    const jobCtx = this.jobLoaded()
      ? `You are interviewing for a ${this.iv.type} interview for the ${this.jobTitle()} role at ${this.jobCompany()}.`
      : `You are conducting a ${this.iv.type} interview.`;
    const focusCtx = this.iv.focus ? `Focus area: ${this.iv.focus}.` : "";
    this.addIvMsg("system", `Starting ${this.iv.difficulty} ${this.iv.type} interview${this.jobLoaded()?" for "+this.jobTitle()+" at "+this.jobCompany():""}.`);
    this.addIvMsg("ai","<span class='ai-stream-dot'></span>");
    let out="";
    await this.claude(
      `You are a senior ${this.jobLoaded()?this.jobTitle():"tech"} interviewer at ${this.jobLoaded()?this.jobCompany():"a top company"}. ${jobCtx} Ask ONE clear, specific ${this.iv.difficulty} ${this.iv.type} interview question. ${focusCtx} Make it relevant to the specific job requirements if provided. Be direct — just ask the question, no preamble.` + this.jobContext(),
      `Ask the first ${this.iv.type} interview question. Candidate has ${this.iv.yoe} years of experience.`,
      chunk=>{ out+=chunk; this.updateLastIvMsg(out); }
    );
  }

  async sendAnswer() {
    const ans = this.ivText.trim(); if (!ans||this.aiLoading()) return;
    this.ivText = "";
    this.addIvMsg("user", ans);
    this.addIvMsg("ai","<span class='ai-stream-dot'></span>");
    let out="";
    await this.claude(
      `You are interviewing for ${this.jobLoaded()?this.jobTitle()+" at "+this.jobCompany():"a role"}. ${this.iv.difficulty} ${this.iv.type} interview. Give structured feedback then ask the next question.` + this.jobContext(),
      `Candidate answered: "${ans}"\n\nGive:\n1. Brief feedback (2-3 sentences): what was strong, what was missing, score /10\n2. Then ask the NEXT interview question specific to this role.`,
      chunk=>{ out+=chunk; this.updateLastIvMsg(out); }
    );
  }

  onIvKey(e: KeyboardEvent) { if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); this.sendAnswer(); } }
  resetInterview() { this.ivMessages.set([]); }

  async getFeedback() {
    const transcript = this.ivMessages().filter(m=>m.role!=="system").map(m=>m.role.toUpperCase()+": "+m.html.replace(/<[^>]*>/g,"")).join("\n\n");
    this.addIvMsg("ai","<span class='ai-stream-dot'></span> Generating overall feedback...");
    let out="";
    await this.claude(
      SYS + this.jobContext(),
      `Based on this interview transcript, give comprehensive feedback:\n\n${transcript}\n\nInclude:\n1. Overall score /10\n2. Top 3 strengths demonstrated\n3. Top 3 areas to improve\n4. Specific tips for ${this.jobLoaded()?this.jobTitle()+" at "+this.jobCompany():"this type of role"}\n5. Sample strong answer for the weakest response`,
      chunk=>{ out+=chunk; this.updateLastIvMsg(out); }
    );
  }

  // ── Salary Coach ──────────────────────────────────────────────────────────
  async salAction(mode: string) {
    if (!this.apiConnected()) { this.showApiModal.set(true); return; }
    const jobCtx = this.jobLoaded() ? `Role: ${this.jobTitle()} at ${this.jobCompany()}\nJob Description excerpt:\n${this.jobDescription.slice(0,500)}` : "General tech role";
    const salCtx = `Years experience: ${this.sal.yoe||"unknown"}\nLocation: ${this.sal.location||"unknown"}\nOffer: ${this.sal.offer?"$"+this.sal.offer:"not yet received"}\nTarget: ${this.sal.target?"$"+this.sal.target:"unknown"}\nCurrent salary: ${this.sal.current?"$"+this.sal.current:"not shared"}\nCompeting offers: ${this.sal.competing||"none"}\nStrengths: ${this.sal.strengths||"not provided"}`;

    const prompts: Record<string,string> = {
      analyze: `Analyze the market rate for this specific role and offer:\n${jobCtx}\n\n${salCtx}\n\nProvide: 1) P25/P50/P75/P90 salary ranges for this exact role and location, 2) Whether the offer is below/at/above market, 3) Total compensation breakdown typical for this role (base/bonus/equity), 4) Specific data points or sources to cite in negotiation.`,
      script: `Write a complete negotiation script for:\n${jobCtx}\n\n${salCtx}\n\nInclude: exact opening statement, how to present the counter, responses to common pushbacks ("budget is fixed", "this is our best offer", "we need to check"), and closing. Make it natural and confident, not aggressive.`,
      email: `Write a professional counter-offer email for:\n${jobCtx}\n\n${salCtx}\n\nThe email should be: confident but collegial, brief (under 200 words), reference market data, include specific ask, leave door open. Include subject line.`,
      equity: `Explain the equity component for:\n${jobCtx}\n\n${salCtx}\n\nCover: how to evaluate equity value, questions to ask (vesting, cliff, strike price, preference stack, 409A), red flags vs green flags, and how to negotiate equity vs cash.`,
      benefits: `List the benefits and perks to negotiate for:\n${jobCtx}\n\n${salCtx}\n\nBeyond salary, what should I ask for? Rank by value. Include: signing bonus, remote flexibility, PTO, professional development, equity refresh, performance review timeline, title.`,
      full: `Complete salary negotiation plan for:\n${jobCtx}\n\n${salCtx}\n\nStructure:\n## Market Analysis\n## Your Negotiating Position\n## The Ask (exact number and framing)\n## Negotiation Script (word-for-word)\n## Counter-Offer Email\n## If They Say No\n## Benefits to Request\n## Red Lines (walk-away point)`,
    };

    let out=""; this.salOutput.set('<span class="ai-stream-dot"></span> Analyzing...');
    await this.claude(SYS, prompts[mode], chunk=>{ out+=chunk; this.salOutput.set(this.fmt(out)); });
  }

  // ── Utils ─────────────────────────────────────────────────────────────────
  copyHtml(html: string) { navigator.clipboard.writeText(html.replace(/<[^>]*>/g,"")); }
  downloadTxt(html: string, filename: string) {
    const text = html.replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">");
    const blob = new Blob([text],{type:"text/plain"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
  }
}
