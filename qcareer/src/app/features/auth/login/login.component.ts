import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../core/services/auth.service";
@Component({ selector:"app-login", standalone:true, imports:[FormsModule], styles:[".gh{width:100%;display:flex;align-items:center;justify-content:center;gap:.75rem;padding:.8rem;border-radius:8px;border:1px solid rgba(99,102,241,0.3);background:rgba(99,102,241,0.08);color:#a5b4fc;cursor:pointer;font-size:0.8rem;font-weight:500;transition:all .2s;font-family:'Inter',sans-serif;margin-bottom:1.25rem;}.gh:hover{border-color:rgba(99,102,241,0.6);background:rgba(99,102,241,0.15);}.gh:disabled{opacity:.5;cursor:not-allowed;}"], template:`
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;position:relative;">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(99,102,241,0.08),transparent 60%);pointer-events:none;"></div>
  <div style="width:100%;max-width:400px;position:relative;z-index:1;">
    <div style="text-align:center;margin-bottom:2.5rem;">
      <div style="font-family:'Orbitron',sans-serif;font-weight:900;font-size:1.8rem;margin-bottom:.4rem;"><span style="color:#6366f1;">Q</span><span style="color:#e2e8f0;">Career</span></div>
      <div style="font-size:0.65rem;color:#64748b;font-family:'JetBrains Mono',monospace;letter-spacing:1px;text-transform:uppercase;">AI-Powered Job Hunt</div>
    </div>
    <div style="background:#07091a;border:1px solid rgba(99,102,241,0.15);border-radius:16px;padding:2rem;">
      <h2 style="font-size:0.9rem;font-weight:600;color:#e2e8f0;margin-bottom:1.5rem;">Sign in to your account</h2>
      <button (click)="loginGitHub()" [disabled]="loading()" class="gh">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
        {{ loading() ? "Redirecting..." : "Continue with GitHub" }}
      </button>
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.25rem;"><div style="flex:1;height:1px;background:rgba(99,102,241,0.1);"></div><span style="font-size:0.62rem;color:#475569;">or email magic link</span><div style="flex:1;height:1px;background:rgba(99,102,241,0.1);"></div></div>
      @if (sent()) {
        <div style="text-align:center;padding:1rem;border:1px solid rgba(16,185,129,.2);border-radius:8px;background:rgba(16,185,129,.05);"><div style="font-size:.8rem;color:#10b981;margin-bottom:.25rem;">Check {{ email() }}</div></div>
      } @else {
        <form (ngSubmit)="loginEmail()" style="display:flex;flex-direction:column;gap:.75rem;">
          <input type="email" [(ngModel)]="emailValue" name="email" required placeholder="you@company.com" class="form-input">
          <button type="submit" [disabled]="loading()||!emailValue" class="btn btn-primary" style="width:100%;justify-content:center;">Send magic link</button>
        </form>
      }
      @if (error()) { <div style="margin-top:.75rem;font-size:.68rem;color:#f43f5e;text-align:center;">{{ error() }}</div> }
    </div>
  </div>
</div>
` })
export class LoginComponent {
  private auth = inject(AuthService);
  loading=signal(false);sent=signal(false);error=signal("");emailValue="";email=signal("");
  async loginGitHub(){this.loading.set(true);try{await this.auth.signInWithGitHub();}catch(e:any){this.error.set(e.message);this.loading.set(false);}}
  async loginEmail(){if(!this.emailValue)return;this.loading.set(true);this.error.set("");try{await this.auth.signInWithEmail(this.emailValue);this.email.set(this.emailValue);this.sent.set(true);}catch(e:any){this.error.set(e.message);}finally{this.loading.set(false);}}
}
