
import { Component, inject } from "@angular/core";
import { AuthService } from "../../core/services/auth.service";
@Component({ selector:"app-settings", standalone:true, template:`
<div style="height:100%;overflow-y:auto;padding:2rem;position:relative;z-index:1;">
  <div style="max-width:680px;margin:0 auto;">
    <h1 style="font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;color:#e2e8f0;letter-spacing:1px;margin-bottom:2rem;">⚙ Settings</h1>
    <div class="card" style="overflow:hidden;margin-bottom:1.5rem;">
      @for (row of rows(); track row.label) {
        <div style="display:flex;align-items:center;justify-content:space-between;padding:.85rem 1.25rem;border-bottom:1px solid rgba(99,102,241,0.06);">
          <span style="font-size:0.68rem;color:var(--muted);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.5px;">{{ row.label }}</span>
          <span style="font-size:0.75rem;color:#e2e8f0;">{{ row.value }}</span>
        </div>
      }
    </div>
    <div style="background:rgba(244,63,94,0.05);border:1px solid rgba(244,63,94,0.2);border-radius:12px;padding:1.25rem;">
      <div style="font-size:0.75rem;font-weight:500;color:#f43f5e;margin-bottom:.35rem;">Danger Zone</div>
      <div style="font-size:0.65rem;color:var(--muted);margin-bottom:.75rem;">Permanently delete your account and all job data.</div>
      <button disabled style="font-size:0.65rem;color:#f43f5e;background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.2);border-radius:6px;padding:.4rem 1rem;cursor:not-allowed;opacity:0.6;">Delete account (contact support)</button>
    </div>
  </div>
</div>
` })
export class SettingsComponent {
  private auth = inject(AuthService);
  rows() {
    const u = this.auth.dbUser();
    return [
      { label:"Email", value:u?.email??"—" },
      { label:"GitHub", value:u?.github_username??"—" },
      { label:"Plan", value:(u?.plan??"free").toUpperCase() },
      { label:"Jobs tracked", value:u?.jobs_count??0 },
      { label:"Member since", value:u?.created_at?new Date(u.created_at).toLocaleDateString():"—" },
    ];
  }
}
