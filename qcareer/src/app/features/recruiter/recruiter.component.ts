import { Component, inject, signal, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { JobListing, JOB_TYPE_LABELS, EXP_LABELS, REMOTE_LABELS } from "../../core/models";

const BLANK = (): Partial<JobListing> => ({
  title:"", company:"", location:"", remote_type:"hybrid", job_type:"full_time",
  experience_level:"mid", description:"", requirements:"", benefits:"",
  currency:"USD", salary_min:undefined, salary_max:undefined,
  equity_min:undefined, equity_max:undefined,
  apply_url:"", apply_email:"", skills:[], status:"active"
});

@Component({ selector:"app-recruiter", standalone:true, imports:[FormsModule,DatePipe,RouterLink], template:`
<div style="min-height:100vh;display:flex;flex-direction:column;">
  <!-- Header -->
  <div style="padding:1.25rem 2rem;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
    <div>
      <h1 style="font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;color:#e2e8f0;letter-spacing:1px;">🏢 Recruiter Portal</h1>
      <div style="font-size:0.62rem;color:var(--muted);margin-top:2px;font-family:'JetBrains Mono',monospace;">{{ auth.dbUser()?.company_name }} · {{ listings().length }} active listings</div>
    </div>
    <div style="display:flex;gap:.75rem;">
      <a routerLink="/browse" class="btn btn-outline btn-sm">View job board ↗</a>
      <button (click)="openForm()" class="btn btn-amber btn-sm">+ Post a job</button>
    </div>
  </div>

  <div style="padding:2rem;max-width:1100px;margin:0 auto;width:100%;">

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem;">
      @for (s of stats(); track s.label) {
        <div class="stat-card">
          <div style="font-size:0.6rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-bottom:.5rem;">{{ s.label }}</div>
          <div class="stat-val" [style.color]="s.color">{{ s.value }}</div>
        </div>
      }
    </div>

    <!-- Listings table -->
    <div class="card" style="overflow:hidden;">
      <div style="padding:1rem 1.25rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:0.75rem;font-weight:600;color:#e2e8f0;">Your Job Listings</div>
      </div>
      @if (loading()) {
        <div style="padding:3rem;text-align:center;color:var(--muted);font-size:0.72rem;">Loading...</div>
      } @else if (!listings().length) {
        <div class="empty"><div class="empty-icon">📋</div><div class="empty-title">No listings yet</div><div class="empty-hint">Post your first job opening to start receiving applications.</div><button (click)="openForm()" class="btn btn-amber btn-sm" style="margin-top:.75rem;">+ Post a job</button></div>
      } @else {
        @for (j of listings(); track j.id) {
          <div style="display:grid;grid-template-columns:1fr auto auto auto auto;align-items:center;padding:.85rem 1.25rem;border-bottom:1px solid rgba(99,102,241,0.06);gap:1rem;">
            <div>
              <div style="font-size:0.78rem;font-weight:500;color:#e2e8f0;">{{ j.title }}</div>
              <div style="font-size:0.65rem;color:var(--muted);margin-top:2px;font-family:'JetBrains Mono',monospace;">{{ j.location }} · {{ remoteLabels[j.remote_type] }} · {{ typeLabels[j.job_type] }}</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:0.7rem;font-family:'JetBrains Mono',monospace;color:#818cf8;">{{ j.views }}</div>
              <div style="font-size:0.55rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">views</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:0.7rem;font-family:'JetBrains Mono',monospace;color:#10b981;">{{ j.applications_count }}</div>
              <div style="font-size:0.55rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">applied</div>
            </div>
            <span style="font-size:0.6rem;padding:2px 8px;border-radius:10px;font-family:'JetBrains Mono',monospace;" [style.background]="j.status==='active'?'rgba(16,185,129,0.1)':'rgba(100,116,139,0.1)'" [style.color]="j.status==='active'?'#10b981':'#64748b'" [style.border]="'1px solid '+(j.status==='active'?'rgba(16,185,129,0.3)':'rgba(100,116,139,0.2)')">{{ j.status }}</span>
            <div style="display:flex;gap:.4rem;">
              <button (click)="editListing(j)" class="btn btn-ghost btn-sm" style="font-size:0.62rem;padding:3px 8px;">Edit</button>
              <button (click)="toggleStatus(j)" class="btn btn-ghost btn-sm" style="font-size:0.62rem;padding:3px 8px;">{{ j.status==="active"?"Close":"Reopen" }}</button>
              <button (click)="deleteListing(j.id)" class="btn btn-ghost btn-sm" style="font-size:0.62rem;padding:3px 8px;color:var(--rose);">Del</button>
            </div>
          </div>
        }
      }
    </div>
  </div>
</div>

<!-- Post Job Modal -->
@if (showForm()) {
  <div class="modal-overlay" (click)="$event.target===formOverlay&&closeForm()" #formOverlay>
    <div style="background:var(--bg3);border:1px solid rgba(99,102,241,0.25);border-radius:16px;padding:2rem;width:100%;max-width:700px;max-height:90vh;overflow-y:auto;" (click)="$event.stopPropagation()">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
        <div style="font-family:'Orbitron',sans-serif;font-size:1rem;color:#e2e8f0;">{{ editing()?"Edit Listing":"Post a Job" }}</div>
        <button (click)="closeForm()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.2rem;">✕</button>
      </div>
      <form (ngSubmit)="saveListing()" style="display:flex;flex-direction:column;gap:1rem;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Job title *</label><input [(ngModel)]="form.title" name="title" required class="form-input" placeholder="Senior React Developer"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Company *</label><input [(ngModel)]="form.company" name="company" required class="form-input" [placeholder]="auth.dbUser()?.company_name||'Your company'"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.75rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Location *</label><input [(ngModel)]="form.location" name="location" required class="form-input" placeholder="New York, NY"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Remote</label>
            <select [(ngModel)]="form.remote_type" name="remote_type" class="form-input">
              <option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option>
            </select>
          </div>
          <div class="form-group" style="margin:0;"><label class="form-label">Job type</label>
            <select [(ngModel)]="form.job_type" name="job_type" class="form-input">
              <option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="contract">Contract</option><option value="internship">Internship</option><option value="freelance">Freelance</option>
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Experience level</label>
            <select [(ngModel)]="form.experience_level" name="exp" class="form-input">
              <option value="intern">Intern</option><option value="entry">Entry</option><option value="mid">Mid-level</option><option value="senior">Senior</option><option value="lead">Lead</option><option value="director">Director</option><option value="vp">VP</option><option value="c_level">C-Level</option>
            </select>
          </div>
          <div class="form-group" style="margin:0;"><label class="form-label">Apply URL or Email</label><input [(ngModel)]="form.apply_url" name="apply_url" class="form-input" placeholder="https://careers.company.com/..."></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 80px;gap:.75rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Salary min ($)</label><input type="number" [(ngModel)]="form.salary_min" name="sal_min" class="form-input" placeholder="80000"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Salary max ($)</label><input type="number" [(ngModel)]="form.salary_max" name="sal_max" class="form-input" placeholder="120000"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Currency</label><input [(ngModel)]="form.currency" name="currency" class="form-input" placeholder="USD"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Equity min (%)</label><input type="number" step="0.01" [(ngModel)]="form.equity_min" name="eq_min" class="form-input" placeholder="0.10"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Equity max (%)</label><input type="number" step="0.01" [(ngModel)]="form.equity_max" name="eq_max" class="form-input" placeholder="0.50"></div>
        </div>
        <div class="form-group" style="margin:0;"><label class="form-label">Skills (comma-separated)</label><input [(ngModel)]="skillsInput" name="skills" class="form-input" placeholder="React, TypeScript, Node.js, PostgreSQL"></div>
        <div class="form-group" style="margin:0;"><label class="form-label">Job description * (markdown supported)</label><textarea [(ngModel)]="form.description" name="description" required class="form-input" rows="5" placeholder="Describe the role, team, and what the candidate will work on..."></textarea></div>
        <div class="form-group" style="margin:0;"><label class="form-label">Requirements</label><textarea [(ngModel)]="form.requirements" name="requirements" class="form-input" rows="4" placeholder="• 3+ years React experience&#10;• Strong TypeScript skills&#10;• Experience with REST APIs"></textarea></div>
        <div class="form-group" style="margin:0;"><label class="form-label">Benefits</label><textarea [(ngModel)]="form.benefits" name="benefits" class="form-input" rows="3" placeholder="• Competitive salary&#10;• Remote-first&#10;• Health, dental, vision&#10;• 401k matching"></textarea></div>
        <div style="display:flex;gap:.75rem;margin-top:.5rem;">
          <button type="button" (click)="closeForm()" class="btn btn-ghost" style="flex:1;justify-content:center;">Cancel</button>
          <button type="button" (click)="form.status='draft';saveListing()" [disabled]="saving()||!form.title||!form.company||!form.description" class="btn btn-ghost" style="flex:1;justify-content:center;">Save draft</button>
          <button type="submit" [disabled]="saving()||!form.title||!form.company||!form.description" class="btn btn-amber" style="flex:1;justify-content:center;">{{ saving()?"Saving...":editing()?"Update listing":"Publish job" }}</button>
        </div>
      </form>
    </div>
  </div>
}
` })
export class RecruiterComponent implements OnInit {
  auth = inject(AuthService);
  listings = signal<JobListing[]>([]); loading = signal(false); saving = signal(false);
  showForm = signal(false); editing = signal<string|null>(null);
  form: any = BLANK(); skillsInput = "";
  typeLabels = JOB_TYPE_LABELS; expLabels = EXP_LABELS; remoteLabels = REMOTE_LABELS;

  stats = () => [
    { label:"Active listings", value:this.listings().filter(l=>l.status==="active").length, color:"#10b981" },
    { label:"Total views", value:this.listings().reduce((s,l)=>s+l.views,0), color:"#818cf8" },
    { label:"Applications", value:this.listings().reduce((s,l)=>s+l.applications_count,0), color:"#f59e0b" },
    { label:"Drafts", value:this.listings().filter(l=>l.status==="draft").length, color:"#64748b" },
  ];

  async ngOnInit() { await this.load(); }
  async load() {
    this.loading.set(true);
    const { data:{ user } } = await this.auth.client.auth.getUser(); if (!user) return;
    const { data } = await this.auth.client.from("job_listings").select("*").eq("recruiter_id",user.id).order("created_at",{ascending:false});
    this.listings.set((data||[]) as JobListing[]);
    this.loading.set(false);
  }

  openForm() { this.form=BLANK(); this.skillsInput=""; this.editing.set(null); this.showForm.set(true); }
  closeForm() { this.showForm.set(false); this.editing.set(null); }
  editListing(j: JobListing) {
    this.form={...j}; this.skillsInput=(j.skills||[]).join(", ");
    this.editing.set(j.id); this.showForm.set(true);
  }

  async saveListing() {
    this.saving.set(true);
    const { data:{user} } = await this.auth.client.auth.getUser(); if (!user) return;
    const payload = { ...this.form, recruiter_id:user.id, company:this.form.company||this.auth.dbUser()?.company_name||"", skills:this.skillsInput.split(",").map((s:string)=>s.trim()).filter(Boolean) };
    if (this.editing()) {
      await this.auth.client.from("job_listings").update({...payload,updated_at:new Date().toISOString()}).eq("id",this.editing());
    } else {
      await this.auth.client.from("job_listings").insert(payload);
    }
    await this.load(); this.closeForm(); this.saving.set(false);
  }
  async toggleStatus(j: JobListing) {
    const s = j.status==="active"?"closed":"active";
    await this.auth.client.from("job_listings").update({status:s}).eq("id",j.id);
    await this.load();
  }
  async deleteListing(id: string) {
    if (!confirm("Delete this listing?")) return;
    await this.auth.client.from("job_listings").delete().eq("id",id);
    this.listings.update(l=>l.filter(x=>x.id!==id));
  }
}
