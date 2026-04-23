
import { Component, signal, ViewChild, ElementRef } from "@angular/core";
import { FormsModule } from "@angular/forms";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const CLAUDE_SYS = "You are QCareer AI, an expert career coach and recruiter. You help job seekers with resume tailoring, cover letters, interview prep, and salary negotiation. Be specific, practical, and encouraging. Use markdown formatting.";

@Component({ selector:"app-ai-agent", standalone:true, imports:[FormsModule], template:`
<div style="min-height:100vh;display:flex;flex-direction:column;">
  <!-- Header -->
  <div style="padding:1.25rem 2rem;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
    <div>
      <h1 style="font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;color:#e2e8f0;letter-spacing:1px;">⬡ AI Agent</h1>
      <div style="font-size:0.62rem;color:var(--muted);margin-top:2px;font-family:'JetBrains Mono',monospace;">6 career tools · powered by Claude {{ model }}</div>
    </div>
    <span class="api-badge" [class.connected]="apiConnected()" (click)="showApiModal.set(true)">
      {{ apiConnected() ? "✓ Claude connected" : "Connect Claude API" }}
    </span>
  </div>

  <!-- Tabs -->
  <div style="padding:1rem 2rem 0;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0;">
    <div class="ai-tabs">
      @for (t of tabs; track t.id) {
        <button class="ai-tab" [class.active]="activeTab()===t.id" (click)="activeTab.set(t.id)">{{ t.icon }} {{ t.label }}</button>
      }
    </div>
  </div>

  <div style="flex:1;padding:1.5rem 2rem;overflow-y:auto;">

    <!-- ── RESUME TAILOR ── -->
    @if (activeTab()==="resume") {
      <div class="ai-workspace">
        <div class="ai-panel">
          <div class="ai-panel-header"><span class="ai-panel-title">Your resume / bullet points</span></div>
          <textarea class="ai-textarea" [(ngModel)]="resumeText" placeholder="Paste your current resume or bullet points here...&#10;&#10;Example:&#10;• Led backend development for payment service&#10;• Built REST APIs with Node.js and PostgreSQL&#10;• Reduced latency by 30% through caching"></textarea>
          <div class="ai-actions-bar">
            <button class="btn btn-ghost btn-sm" (click)="resumeText=resumeExample">Load example</button>
          </div>
        </div>
        <div class="ai-panel">
          <div class="ai-panel-header">
            <span class="ai-panel-title">Job description</span>
            <div style="margin-left:auto;display:flex;gap:.5rem;">
              <input [(ngModel)]="resumeRole" placeholder="Role title" class="form-input" style="width:140px;font-size:0.65rem;padding:.3rem .6rem;">
              <input [(ngModel)]="resumeCompany" placeholder="Company" class="form-input" style="width:110px;font-size:0.65rem;padding:.3rem .6rem;">
            </div>
          </div>
          <textarea class="ai-textarea" [(ngModel)]="jdText" placeholder="Paste the job description here..."></textarea>
          <div class="ai-actions-bar">
            <button class="btn btn-primary btn-sm" (click)="tailorResume()" [disabled]="aiLoading()||!resumeText||!jdText">{{ aiLoading()?"Tailoring...":"⬡ Tailor my resume" }}</button>
          </div>
        </div>
      </div>
      @if (resumeOutput()) {
        <div class="ai-panel" style="margin-top:1rem;max-height:300px;">
          <div class="ai-panel-header"><span class="ai-panel-title">Tailored resume bullets</span><button class="btn btn-ghost btn-sm" style="margin-left:auto;" (click)="copyText(resumeOutput())">Copy</button></div>
          <div class="ai-output" [innerHTML]="resumeOutput()"></div>
        </div>
      }
    }

    <!-- ── COVER LETTER ── -->
    @if (activeTab()==="cover") {
      <div style="display:grid;grid-template-columns:320px 1fr;gap:1.25rem;height:calc(100vh - 320px);">
        <div class="ai-panel">
          <div class="ai-panel-header"><span class="ai-panel-title">Job details</span></div>
          <div style="padding:1rem;display:flex;flex-direction:column;gap:.75rem;overflow-y:auto;">
            <div class="form-group" style="margin:0;"><label class="form-label">Company</label><input [(ngModel)]="cl.company" class="form-input" placeholder="Google"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Role</label><input [(ngModel)]="cl.role" class="form-input" placeholder="Senior Software Engineer"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Hiring manager (optional)</label><input [(ngModel)]="cl.manager" class="form-input" placeholder="Jane Smith"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Tone</label>
              <select [(ngModel)]="cl.tone" class="form-input">
                <option value="professional">Professional</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="concise">Concise & direct</option>
                <option value="creative">Creative</option>
              </select>
            </div>
            <div class="form-group" style="margin:0;"><label class="form-label">Your top achievement</label><textarea [(ngModel)]="cl.achievement" class="form-input" rows="3" placeholder="Describe your most relevant achievement..."></textarea></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Job description (paste)</label><textarea [(ngModel)]="cl.jd" class="form-input" rows="4" placeholder="Paste the JD..."></textarea></div>
            <button class="btn btn-primary" (click)="generateCoverLetter()" [disabled]="aiLoading()||!cl.company||!cl.role">{{ aiLoading()?"Generating...":"⬡ Generate cover letter" }}</button>
          </div>
        </div>
        <div class="ai-panel">
          <div class="ai-panel-header"><span class="ai-panel-title">Cover letter</span>
            @if (clOutput()) { <button class="btn btn-ghost btn-sm" style="margin-left:auto;" (click)="copyText(clOutput())">Copy</button> }
          </div>
          @if (!clOutput()) {
            <div class="empty"><div class="empty-icon">✉️</div><div class="empty-title">Ready to write</div><div class="empty-hint">Fill in the details and click Generate.</div></div>
          } @else {
            <div class="ai-output" [innerHTML]="clOutput()"></div>
          }
        </div>
      </div>
    }

    <!-- ── MOCK INTERVIEW ── -->
    @if (activeTab()==="interview") {
      <div style="display:grid;grid-template-columns:260px 1fr;gap:1.25rem;height:calc(100vh - 320px);">
        <div class="ai-panel">
          <div class="ai-panel-header"><span class="ai-panel-title">Interview setup</span></div>
          <div style="padding:1rem;display:flex;flex-direction:column;gap:.75rem;">
            <div class="form-group" style="margin:0;"><label class="form-label">Role</label><input [(ngModel)]="iv.role" class="form-input" placeholder="Senior Engineer"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Company</label><input [(ngModel)]="iv.company" class="form-input" placeholder="Google"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Interview type</label>
              <select [(ngModel)]="iv.type" class="form-input">
                <option value="behavioral">Behavioral (STAR)</option>
                <option value="technical">Technical</option>
                <option value="system design">System Design</option>
                <option value="case">Case Interview</option>
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
            <button class="btn btn-primary" (click)="startInterview()" [disabled]="aiLoading()">{{ ivStarted()?"⬡ Next question":"⬡ Start interview" }}</button>
            @if (ivStarted()) { <button class="btn btn-ghost btn-sm" (click)="resetInterview()">Reset</button> }
          </div>
        </div>
        <div class="ai-panel" style="display:flex;flex-direction:column;">
          <div class="ai-panel-header"><span class="ai-panel-title">Mock Interview</span><span style="margin-left:auto;font-size:0.6rem;color:var(--muted);font-family:'JetBrains Mono',monospace;">{{ ivMsgs().length }} messages</span></div>
          <div #ivMsgs class="chat-wrap">
            @if (!ivMsgs().length) {
              <div class="empty"><div class="empty-icon">🎤</div><div class="empty-title">Ready when you are</div><div class="empty-hint">Set up the interview details and click Start to begin your mock session.</div></div>
            }
            @for (m of ivMessages(); track $index) {
              <div class="chat-msg" [class]="m.role" [innerHTML]="m.html"></div>
            }
          </div>
          <div class="chat-input-row">
            <input class="chat-input" [(ngModel)]="ivInput" placeholder="Type your answer..." (keydown.enter)="sendIvAnswer()">
            <button class="btn btn-primary btn-sm" (click)="sendIvAnswer()" [disabled]="aiLoading()||!ivInput.trim()">Send</button>
          </div>
        </div>
      </div>
    }

    <!-- ── SALARY COACH ── -->
    @if (activeTab()==="salary") {
      <div style="display:grid;grid-template-columns:300px 1fr;gap:1.25rem;height:calc(100vh - 320px);">
        <div class="ai-panel">
          <div class="ai-panel-header"><span class="ai-panel-title">Your situation</span></div>
          <div style="padding:1rem;display:flex;flex-direction:column;gap:.75rem;overflow-y:auto;">
            <div class="form-group" style="margin:0;"><label class="form-label">Role</label><input [(ngModel)]="sal.role" class="form-input" placeholder="Software Engineer"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Location</label><input [(ngModel)]="sal.location" class="form-input" placeholder="San Francisco, CA"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Years of experience</label><input type="number" [(ngModel)]="sal.yoe" class="form-input" placeholder="5"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Offer received ($)</label><input type="number" [(ngModel)]="sal.offer" class="form-input" placeholder="150000"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Your target ($)</label><input type="number" [(ngModel)]="sal.target" class="form-input" placeholder="175000"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Competing offers?</label><input [(ngModel)]="sal.competing" class="form-input" placeholder="Yes – $160k from Stripe"></div>
            <div class="form-group" style="margin:0;"><label class="form-label">Key strengths (1-2 sentences)</label><textarea [(ngModel)]="sal.strengths" class="form-input" rows="3" placeholder="Led migration to microservices, reduced infra cost 40%..."></textarea></div>
            <div class="quick-pills">
              <button class="quick-pill" (click)="salQuick('analyze')" [disabled]="aiLoading()">Analyze offer</button>
              <button class="quick-pill" (click)="salQuick('script')" [disabled]="aiLoading()">Write script</button>
              <button class="quick-pill" (click)="salQuick('email')" [disabled]="aiLoading()">Counter email</button>
              <button class="quick-pill" (click)="salQuick('equity')" [disabled]="aiLoading()">Equity tips</button>
            </div>
            <button class="btn btn-primary" (click)="salQuick('full')" [disabled]="aiLoading()||!sal.role">{{ aiLoading()?"Analyzing...":"⬡ Full negotiation plan" }}</button>
          </div>
        </div>
        <div class="ai-panel">
          <div class="ai-panel-header"><span class="ai-panel-title">Salary Negotiation Coach</span>
            @if (salOutput()) { <button class="btn btn-ghost btn-sm" style="margin-left:auto;" (click)="copyText(salOutput())">Copy</button> }
          </div>
          @if (!salOutput()) {
            <div class="empty"><div class="empty-icon">💰</div><div class="empty-title">Know your worth</div><div class="empty-hint">Fill in your details and I will analyze the offer, benchmark against market rates, and write your negotiation script.</div></div>
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
      <div class="modal-sub">Enter your Anthropic API key to unlock all 6 AI tools. Your key stays in your browser — never sent to QCareer servers.</div>
      <input class="api-modal-input" type="password" [(ngModel)]="apiKeyInput" placeholder="sk-ant-api03-...">
      <div style="font-size:0.62rem;color:var(--muted);margin-bottom:1.25rem;line-height:1.7;">Get a key at <a href="https://console.anthropic.com" target="_blank" style="color:#6366f1;">console.anthropic.com</a></div>
      <div style="display:flex;gap:.75rem;">
        <button class="btn btn-ghost" style="flex:1;justify-content:center;" (click)="showApiModal.set(false)">Cancel</button>
        <button class="btn btn-primary" style="flex:1;justify-content:center;" (click)="connectApi()">Connect</button>
      </div>
    </div>
  </div>
}
` })
export class AiAgentComponent {
  @ViewChild("ivMsgs") ivMsgsEl!: ElementRef<HTMLDivElement>;
  model = CLAUDE_MODEL.split("-").slice(-2).join("-");
  tabs = [
    { id:"resume",    label:"Resume Tailor",   icon:"📝" },
    { id:"cover",     label:"Cover Letter",     icon:"✉️" },
    { id:"interview", label:"Mock Interview",   icon:"🎤" },
    { id:"salary",    label:"Salary Coach",     icon:"💰" },
  ];
  activeTab = signal("resume");
  aiLoading = signal(false); apiConnected = signal(false);
  apiKey = signal(""); apiKeyInput = ""; showApiModal = signal(false);

  // Resume
  resumeText=""; jdText=""; resumeRole=""; resumeCompany=""; resumeOutput=signal("");
  resumeExample = "• Led backend development for e-commerce platform (Node.js, PostgreSQL)\n• Built REST APIs consumed by 3 frontend teams\n• Implemented Redis caching, reducing API latency by 30%\n• Mentored 2 junior developers";

  // Cover letter
  cl: any = { company:"", role:"", manager:"", tone:"professional", achievement:"", jd:"" };
  clOutput = signal("");

  // Interview
  iv: any = { role:"", company:"Google", type:"behavioral", difficulty:"medium" };
  ivInput=""; ivStarted=signal(false);
  ivMessages = signal<{role:string;html:string}[]>([]);

  // Salary
  sal: any = { role:"", location:"", yoe:5, offer:null, target:null, competing:"", strengths:"" };
  salOutput = signal("");

  connectApi() {
    const k = this.apiKeyInput.trim();
    if (!k.startsWith("sk-")) { alert("Key must start with sk-"); return; }
    this.apiKey.set(k); this.apiConnected.set(true); this.showApiModal.set(false);
  }

  private fmt(text: string): string {
    return text
      .replace(/```([\w]*)\n?([\s\S]*?)```/g, "<pre>$2</pre>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/^### (.+)$/gm, "<h4 style='color:#818cf8;font-size:.8rem;margin:.75rem 0 .25rem;'>$1</h4>")
      .replace(/^## (.+)$/gm,  "<h3 style='color:#a78bfa;font-size:.85rem;margin:.75rem 0 .25rem;'>$1</h3>")
      .replace(/^- (.+)$/gm, "<div style='display:flex;gap:.5rem;margin-bottom:.2rem;'><span style='color:#6366f1;flex-shrink:0;'>•</span><span>$1</span></div>")
      .replace(/\n/g, "<br>");
  }

  private async claude(system: string, prompt: string, onChunk: (t:string)=>void): Promise<void> {
    if (!this.apiConnected()) { this.showApiModal.set(true); return; }
    this.aiLoading.set(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key":this.apiKey(), "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:CLAUDE_MODEL, max_tokens:4096, stream:true, system, messages:[{role:"user",content:prompt}] })
      });
      if (!resp.ok) throw new Error((await resp.json()).error?.message || "API error");
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

  async tailorResume() {
    let out=""; this.resumeOutput.set("<span class='ai-stream-dot'></span> Tailoring...");
    await this.claude(CLAUDE_SYS,
      `Tailor these resume bullets for the role of "${this.resumeRole||"the position"}" at "${this.resumeCompany||"the company"}".\n\nMy current bullets:\n${this.resumeText}\n\nJob description:\n${this.jdText}\n\nRewrite each bullet to highlight skills and keywords from the JD. Use strong action verbs. Add measurable impact. Format as bullet points.`,
      chunk => { out+=chunk; this.resumeOutput.set(this.fmt(out)); });
  }

  async generateCoverLetter() {
    let out=""; this.clOutput.set("<span class='ai-stream-dot'></span> Writing...");
    await this.claude(CLAUDE_SYS,
      `Write a ${this.cl.tone} cover letter for a ${this.cl.role} position at ${this.cl.company}.\n${this.cl.manager?`Addressed to ${this.cl.manager}.`:""}\nMy top achievement: ${this.cl.achievement}\n${this.cl.jd?"Job description:\n"+this.cl.jd:""}`,
      chunk => { out+=chunk; this.clOutput.set(this.fmt(out)); });
  }

  addIvMsg(role:string,text:string){ this.ivMessages.update(m=>[...m,{role,html:this.fmt(text)}]); setTimeout(()=>{if(this.ivMsgsEl)this.ivMsgsEl.nativeElement.scrollTop=99999;},50); }
  updateLastIvMsg(text:string){ this.ivMessages.update(m=>{const c=[...m];c[c.length-1]={...c[c.length-1],html:this.fmt(text)};return c;}); }

  async startInterview() {
    this.ivStarted.set(true);
    const prompt = `You are conducting a ${this.iv.difficulty} ${this.iv.type} interview for a ${this.iv.role} position at ${this.iv.company}. Ask ONE clear interview question. Don't give hints or explain the question type — just ask it naturally as a real interviewer would.`;
    this.addIvMsg("system","Interview started. Good luck!");
    this.addIvMsg("ai","<span class='ai-stream-dot'></span>");
    let out="";
    await this.claude("You are a professional interviewer. Ask ONE interview question. Be concise.", prompt, chunk => { out+=chunk; this.updateLastIvMsg(out); });
  }

  async sendIvAnswer() {
    const ans=this.ivInput.trim(); if(!ans||this.aiLoading())return;
    this.ivInput=""; this.addIvMsg("user",ans);
    this.addIvMsg("ai","<span class='ai-stream-dot'></span>");
    let out="";
    const history = this.ivMessages().map(m=>m.role==="user"?`Candidate: ${ans}`:"").join("\n");
    await this.claude(
      `You are a ${this.iv.difficulty} ${this.iv.type} interviewer for ${this.iv.role} at ${this.iv.company}. Give brief structured feedback on the answer (2-3 sentences), then ask the next question.`,
      `Candidate answered: "${ans}"`,
      chunk => { out+=chunk; this.updateLastIvMsg(out); });
  }

  resetInterview() { this.ivMessages.set([]); this.ivStarted.set(false); }

  async salQuick(mode: string) {
    const prompts: Record<string,string> = {
      analyze: `Analyze this job offer: ${this.sal.role} in ${this.sal.location}, ${this.sal.yoe} years exp, offer: $${this.sal.offer}. Is this fair market rate? What is the typical range?`,
      script: `Write a salary negotiation script for: ${this.sal.role}, offer $${this.sal.offer}, target $${this.sal.target}, ${this.sal.competing?"competing offer: "+this.sal.competing:""}. Give exact words to say.`,
      email: `Write a professional counter-offer email for: ${this.sal.role} at unknown company, offer $${this.sal.offer}, asking for $${this.sal.target}. Keep it confident and brief.`,
      equity: `Explain equity negotiation tips for a ${this.sal.role} offer. Cover vesting schedules, cliff, strike price, RSUs vs options.`,
      full: `Full salary negotiation plan for:\nRole: ${this.sal.role}\nLocation: ${this.sal.location}\nExperience: ${this.sal.yoe} years\nOffer: $${this.sal.offer}\nTarget: $${this.sal.target}\nCompeting offers: ${this.sal.competing||"none"}\nKey strengths: ${this.sal.strengths}\n\nCover: 1) Market analysis, 2) Negotiation script (exact words), 3) Counter-offer email, 4) Equity tips, 5) What to do if they say no.`,
    };
    let out=""; this.salOutput.set("<span class='ai-stream-dot'></span> Analyzing...");
    await this.claude(CLAUDE_SYS, prompts[mode], chunk => { out+=chunk; this.salOutput.set(this.fmt(out)); });
  }

  copyText(html: string) { const t=html.replace(/<[^>]*>/g,""); navigator.clipboard.writeText(t); }
}
