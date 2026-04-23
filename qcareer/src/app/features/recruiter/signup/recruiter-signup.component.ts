
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { JobListingsService } from "../../../core/services/job-listings.service";
import { AuthService } from "../../../core/services/auth.service";

@Component({ selector:"app-recruiter-signup", standalone:true, imports:[FormsModule,RouterLink], template:`
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;position:relative;">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(99,102,241,0.08),transparent 60%);pointer-events:none;"></div>
  <div style="width:100%;max-width:560px;position:relative;z-index:1;">
    <div style="text-align:center;margin-bottom:2rem;">
      <a routerLink="/" style="font-family:'Orbitron',sans-serif;font-weight:900;font-size:1.4rem;text-decoration:none;"><span style="color:#6366f1;">Q</span><span style="color:#e2e8f0;">Career</span></a>
      <div style="font-size:0.65rem;color:#64748b;font-family:'JetBrains Mono',monospace;letter-spacing:1px;margin-top:.25rem;text-transform:uppercase;">Recruiter Portal</div>
    </div>
    <div style="background:#07091a;border:1px solid rgba(99,102,241,0.2);border-radius:16px;padding:2rem;">
      <h2 style="font-size:1rem;font-weight:700;color:#e2e8f0;margin-bottom:.35rem;">Post jobs on QCareer</h2>
      <p style="font-size:0.7rem;color:#64748b;margin-bottom:1.5rem;line-height:1.7;">Reach AI-assisted job seekers. First job free.</p>
      @if (!loggedIn()) {
        <div style="background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.12);border-radius:10px;padding:1.25rem;margin-bottom:1.25rem;">
          <div style="font-size:0.6rem;letter-spacing:1.5px;text-transform:uppercase;color:#818cf8;font-family:'JetBrains Mono',monospace;margin-bottom:.85rem;">Step 1 — Create account</div>
          <button (click)="loginGitHub()" [disabled]="loading()"
            style="width:100%;display:flex;align-items:center;justify-content:center;gap:.75rem;padding:.75rem;border-radius:8px;border:1px solid rgba(99,102,241,0.3);background:rgba(99,102,241,0.08);color:#a5b4fc;cursor:pointer;font-size:0.78rem;margin-bottom:.75rem;transition:all .2s;font-family:'Inter',sans-serif;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
            {{ loading() ? "Redirecting..." : "Continue with GitHub" }}
          </button>
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;"><div style="flex:1;height:1px;background:rgba(99,102,241,0.1);"></div><span style="font-size:.6rem;color:#475569;">or email</span><div style="flex:1;height:1px;background:rgba(99,102,241,0.1);"></div></div>
          <input type="email" [(ngModel)]="emailValue" name="email" placeholder="your@company.com" class="form-input" style="margin-bottom:.5rem;">
          @if (!sent()) { <button (click)="loginEmail()" [disabled]="loading()||!emailValue" class="btn btn-primary" style="width:100%;justify-content:center;">Send magic link</button>
          } @else { <div style="text-align:center;padding:.75rem;border:1px solid rgba(16,185,129,.2);border-radius:6px;background:rgba(16,185,129,.05);font-size:.7rem;color:#10b981;">Check {{ emailValue }}</div> }
        </div>
      } @else {
        <div style="background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.12);border-radius:10px;padding:1.25rem;margin-bottom:1.25rem;">
          <div style="font-size:0.6rem;letter-spacing:1.5px;text-transform:uppercase;color:#818cf8;font-family:'JetBrains Mono',monospace;margin-bottom:.85rem;">Step 2 — Company details</div>
          <form (ngSubmit)="createProfile()" style="display:flex;flex-direction:column;gap:.75rem;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
              <div class="form-group" style="margin:0;"><label class="form-label">Your name *</label><input [(ngModel)]="p.full_name" name="fn" required class="form-input" placeholder="Jane Smith"></div>
              <div class="form-group" style="margin:0;"><label class="form-label">Company *</label><input [(ngModel)]="p.company_name" name="cn" required class="form-input" placeholder="Acme Corp"></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
              <div class="form-group" style="margin:0;"><label class="form-label">Website</label><input [(ngModel)]="p.company_website" name="cw" class="form-input" placeholder="https://acme.com"></div>
              <div class="form-group" style="margin:0;"><label class="form-label">Size</label>
                <select [(ngModel)]="p.company_size" name="cs" class="form-input">
                  <option value="">Select</option>
                  <option value="1-10">1–10</option><option value="11-50">11–50</option>
                  <option value="51-200">51–200</option><option value="201-500">201–500</option><option value="500+">500+</option>
                </select>
              </div>
            </div>
            <div class="form-group" style="margin:0;"><label class="form-label">Company description</label><textarea [(ngModel)]="p.company_description" name="cd" class="form-input" rows="2" placeholder="What does your company do?"></textarea></div>
            @if (err()) { <div style="font-size:.65rem;color:#f43f5e;">{{ err() }}</div> }
            <button type="submit" [disabled]="saving()||!p.company_name||!p.full_name" class="btn btn-primary" style="justify-content:center;">{{ saving() ? "Creating..." : "Create profile & start posting →" }}</button>
          </form>
        </div>
      }
      <div style="text-align:center;font-size:0.62rem;color:#475569;">Looking for a job? <a routerLink="/jobs" style="color:#6366f1;text-decoration:none;">Browse openings →</a></div>
    </div>
  </div>
</div>
` })
export class RecruiterSignupComponent {
  private svc = inject(JobListingsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  loading=signal(false);saving=signal(false);sent=signal(false);err=signal("");
  emailValue=""; loggedIn=this.auth.isLoggedIn;
  p:any={full_name:"",company_name:"",company_website:"",company_size:"",company_description:""};
  async loginGitHub(){this.loading.set(true);try{await this.auth.signInWithGitHub();}catch(e:any){this.err.set(e.message);this.loading.set(false);}}
  async loginEmail(){if(!this.emailValue)return;this.loading.set(true);try{await this.auth.signInWithEmail(this.emailValue);this.sent.set(true);}catch(e:any){this.err.set(e.message);}finally{this.loading.set(false);}}
  async createProfile(){if(!this.p.company_name||!this.p.full_name)return;this.saving.set(true);this.err.set("");const ok=await this.svc.createRecruiter(this.p);if(ok)this.router.navigate(["/recruiter/dashboard"]);else this.err.set("Failed. Try again.");this.saving.set(false);}
}
