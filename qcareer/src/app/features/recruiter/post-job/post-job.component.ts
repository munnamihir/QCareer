
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { JobListingsService } from "../../../core/services/job-listings.service";

@Component({ selector:"app-post-job", standalone:true, imports:[FormsModule,RouterLink], template:`
<div style="min-height:100vh;padding:2rem;position:relative;z-index:1;">
  <div style="max-width:760px;margin:0 auto;">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem;">
      <div>
        <h1 style="font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;color:#e2e8f0;letter-spacing:1px;">Post a Job</h1>
        <div style="font-size:0.65rem;color:var(--muted);margin-top:2px;font-family:'JetBrains Mono',monospace;">Fill in the details below</div>
      </div>
      <a routerLink="/recruiter/dashboard" class="btn btn-ghost btn-sm">← Back</a>
    </div>

    <form (ngSubmit)="post()" style="display:flex;flex-direction:column;gap:1.25rem;">

      <!-- Basic info -->
      <div class="card" style="padding:1.5rem;">
        <div style="font-size:0.72rem;font-weight:600;color:#e2e8f0;margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:1px solid var(--border);">📋 Basic Information</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.85rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Job title *</label><input [(ngModel)]="f.title" name="title" required class="form-input" placeholder="Senior Software Engineer"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Company name *</label><input [(ngModel)]="f.company_name" name="company" required class="form-input" [placeholder]="recName()"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.85rem;margin-top:.85rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Location *</label><input [(ngModel)]="f.location" name="location" required class="form-input" placeholder="New York, NY"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Remote type</label>
            <select [(ngModel)]="f.remote_type" name="remote_type" class="form-input">
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </div>
          <div class="form-group" style="margin:0;"><label class="form-label">Job type</label>
            <select [(ngModel)]="f.job_type" name="job_type" class="form-input">
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>
        </div>
        <div style="margin-top:.85rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Experience level</label>
            <select [(ngModel)]="f.experience_level" name="exp" class="form-input" style="max-width:200px;">
              <option value="intern">Intern</option>
              <option value="junior">Junior (0–2yr)</option>
              <option value="mid">Mid (2–5yr)</option>
              <option value="senior">Senior (5–8yr)</option>
              <option value="lead">Lead / Staff</option>
              <option value="executive">Executive / Director</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Compensation -->
      <div class="card" style="padding:1.5rem;">
        <div style="font-size:0.72rem;font-weight:600;color:#e2e8f0;margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:1px solid var(--border);">💰 Compensation</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 80px;gap:.85rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Salary min</label><input type="number" [(ngModel)]="f.salary_min" name="smin" class="form-input" placeholder="80000"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Salary max</label><input type="number" [(ngModel)]="f.salary_max" name="smax" class="form-input" placeholder="120000"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Currency</label><input [(ngModel)]="f.currency" name="cur" class="form-input" placeholder="USD"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.85rem;margin-top:.85rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Equity min (%)</label><input type="number" step="0.01" [(ngModel)]="f.equity_min" name="emin" class="form-input" placeholder="0.05"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Equity max (%)</label><input type="number" step="0.01" [(ngModel)]="f.equity_max" name="emax" class="form-input" placeholder="0.25"></div>
        </div>
      </div>

      <!-- Description -->
      <div class="card" style="padding:1.5rem;">
        <div style="font-size:0.72rem;font-weight:600;color:#e2e8f0;margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:1px solid var(--border);">📝 Job Details</div>
        <div class="form-group"><label class="form-label">Job description * <span style="color:var(--muted);font-weight:400;">(markdown supported)</span></label>
          <textarea [(ngModel)]="f.description" name="desc" required class="form-input" rows="8" placeholder="Describe the role, team, and day-to-day responsibilities..."></textarea>
        </div>
        <div class="form-group"><label class="form-label">Requirements</label>
          <textarea [(ngModel)]="f.requirements" name="req" class="form-input" rows="4" placeholder="Must-have qualifications, experience, and skills..."></textarea>
        </div>
        <div class="form-group" style="margin:0;"><label class="form-label">Benefits & perks</label>
          <textarea [(ngModel)]="f.benefits" name="ben" class="form-input" rows="3" placeholder="Health insurance, 401k, unlimited PTO, remote stipend..."></textarea>
        </div>
      </div>

      <!-- Skills -->
      <div class="card" style="padding:1.5rem;">
        <div style="font-size:0.72rem;font-weight:600;color:#e2e8f0;margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:1px solid var(--border);">🛠️ Required Skills</div>
        <div class="form-group" style="margin:0;"><label class="form-label">Skills (comma separated)</label>
          <input [(ngModel)]="skillsInput" name="skills" class="form-input" placeholder="React, TypeScript, Node.js, PostgreSQL, AWS">
        </div>
        @if (parsedSkills().length) {
          <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.75rem;">
            @for (s of parsedSkills(); track s) {
              <span style="font-size:0.65rem;padding:3px 10px;border-radius:6px;background:rgba(99,102,241,0.1);color:#818cf8;border:1px solid rgba(99,102,241,0.2);">{{ s }}</span>
            }
          </div>
        }
      </div>

      <!-- Apply -->
      <div class="card" style="padding:1.5rem;">
        <div style="font-size:0.72rem;font-weight:600;color:#e2e8f0;margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:1px solid var(--border);">📨 How to Apply</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.85rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Apply URL</label><input [(ngModel)]="f.apply_url" name="aurl" class="form-input" placeholder="https://jobs.acme.com/apply"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Or apply email</label><input [(ngModel)]="f.apply_email" name="aemail" class="form-input" placeholder="hiring@acme.com"></div>
        </div>
      </div>

      @if (err()) { <div style="font-size:.7rem;color:#f43f5e;text-align:center;padding:.75rem;background:rgba(244,63,94,0.05);border:1px solid rgba(244,63,94,0.2);border-radius:8px;">{{ err() }}</div> }

      <div style="display:flex;gap:.75rem;">
        <a routerLink="/recruiter/dashboard" class="btn btn-ghost" style="flex:1;justify-content:center;">Cancel</a>
        <button type="submit" [disabled]="saving()||!f.title||!f.description" class="btn btn-primary" style="flex:2;justify-content:center;font-size:.85rem;">
          {{ saving() ? "Publishing..." : "🚀 Publish job listing" }}
        </button>
      </div>
    </form>
  </div>
</div>
` })
export class PostJobComponent {
  private svc = inject(JobListingsService);
  private router = inject(Router);
  saving=signal(false);err=signal("");
  skillsInput="";
  recName=()=>this.svc.recruiter()?.company_name||"Your company";
  parsedSkills=()=>this.skillsInput.split(",").map(s=>s.trim()).filter(Boolean);
  f:any={title:"",company_name:"",location:"",remote_type:"hybrid",job_type:"full_time",experience_level:"mid",
    salary_min:null,salary_max:null,currency:"USD",equity_min:null,equity_max:null,
    description:"",requirements:"",benefits:"",apply_url:"",apply_email:""};
  async ngOnInit(){await this.svc.loadRecruiter();}
  async post(){
    if(!this.f.title||!this.f.description)return;
    this.saving.set(true);this.err.set("");
    const id=await this.svc.postJob({...this.f,skills:this.parsedSkills()});
    if(id)this.router.navigate(["/recruiter/dashboard"]);
    else this.err.set("Failed to post. Try again.");
    this.saving.set(false);
  }
}
