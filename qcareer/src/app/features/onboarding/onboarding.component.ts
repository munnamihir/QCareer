import { Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";
@Component({ selector:"app-onboarding", standalone:true, imports:[FormsModule], template:`
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;position:relative;">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(99,102,241,0.1),transparent 65%);pointer-events:none;"></div>
  <div style="width:100%;max-width:560px;position:relative;z-index:1;">
    <div style="text-align:center;margin-bottom:2.5rem;">
      <div style="font-family:'Orbitron',sans-serif;font-weight:900;font-size:2rem;margin-bottom:.5rem;"><span style="color:#6366f1;">Q</span><span style="color:#e2e8f0;">Career</span></div>
      <div style="font-size:0.8rem;color:#64748b;">Welcome! Tell us how you will use QCareer.</div>
    </div>
    @if (!selectedRole()) {
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
        <button (click)="selectedRole.set('seeker')" style="background:#07091a;border:2px solid rgba(99,102,241,0.2);border-radius:16px;padding:2.5rem 1.5rem;cursor:pointer;transition:all .2s;text-align:center;width:100%;" onmouseover="this.style.borderColor='rgba(99,102,241,0.6)';this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='rgba(99,102,241,0.2)';this.style.transform='none'">
          <div style="font-size:3rem;margin-bottom:1rem;">🎯</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:0.85rem;font-weight:700;color:#e2e8f0;margin-bottom:.5rem;">Job Seeker</div>
          <div style="font-size:0.7rem;color:#64748b;line-height:1.6;">Track applications, tailor resume, prep for interviews with AI.</div>
        </button>
        <button (click)="selectedRole.set('recruiter')" style="background:#07091a;border:2px solid rgba(245,158,11,0.2);border-radius:16px;padding:2.5rem 1.5rem;cursor:pointer;transition:all .2s;text-align:center;width:100%;" onmouseover="this.style.borderColor='rgba(245,158,11,0.6)';this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='rgba(245,158,11,0.2)';this.style.transform='none'">
          <div style="font-size:3rem;margin-bottom:1rem;">🏢</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:0.85rem;font-weight:700;color:#e2e8f0;margin-bottom:.5rem;">Recruiter</div>
          <div style="font-size:0.7rem;color:#64748b;line-height:1.6;">Post job openings and find great candidates for your company.</div>
        </button>
      </div>
    }
    @if (selectedRole() === "seeker") {
      <div style="background:#07091a;border:1px solid rgba(99,102,241,0.2);border-radius:16px;padding:2rem;">
        <div style="font-size:0.85rem;font-weight:600;color:#e2e8f0;margin-bottom:1.25rem;">🎯 Job Seeker Setup</div>
        <div class="form-group"><label class="form-label">Your headline</label><input [(ngModel)]="headline" class="form-input" placeholder="Senior Full Stack Developer · React + Node.js"></div>
        <div style="display:flex;gap:.75rem;margin-top:1.25rem;">
          <button (click)="selectedRole.set('')" class="btn btn-ghost" style="flex:1;justify-content:center;">← Back</button>
          <button (click)="save()" [disabled]="saving()" class="btn btn-primary" style="flex:1;justify-content:center;">{{ saving()?"Saving...":"Get started →" }}</button>
        </div>
      </div>
    }
    @if (selectedRole() === "recruiter") {
      <div style="background:#07091a;border:1px solid rgba(245,158,11,0.2);border-radius:16px;padding:2rem;">
        <div style="font-size:0.85rem;font-weight:600;color:#e2e8f0;margin-bottom:1.25rem;">🏢 Recruiter Setup</div>
        <div class="form-group"><label class="form-label">Company name *</label><input [(ngModel)]="companyName" class="form-input" placeholder="Acme Corp"></div>
        <div class="form-group"><label class="form-label">Company website</label><input [(ngModel)]="companyWebsite" class="form-input" placeholder="https://acme.com"></div>
        <div class="form-group"><label class="form-label">Your title</label><input [(ngModel)]="headline" class="form-input" placeholder="Head of Talent at Acme Corp"></div>
        <div style="display:flex;gap:.75rem;margin-top:1.25rem;">
          <button (click)="selectedRole.set('')" class="btn btn-ghost" style="flex:1;justify-content:center;">← Back</button>
          <button (click)="save()" [disabled]="saving()||!companyName" class="btn btn-amber" style="flex:1;justify-content:center;">{{ saving()?"Saving...":"Create recruiter account →" }}</button>
        </div>
      </div>
    }
  </div>
</div>
` })
export class OnboardingComponent {
  private auth = inject(AuthService); private router = inject(Router);
  selectedRole = signal(""); saving = signal(false);
  headline = ""; companyName = ""; companyWebsite = "";
  async save() {
    this.saving.set(true);
    const sb = this.auth.client;
    const { data: { user } } = await sb.auth.getUser(); if (!user) return;
    await sb.from("users").update({ role:this.selectedRole(), headline:this.headline||null, company_name:this.companyName||null, company_website:this.companyWebsite||null }).eq("id", user.id);
    setTimeout(() => this.router.navigate([this.selectedRole()==="recruiter"?"/recruiter":"/dashboard"]), 400);
  }
}
