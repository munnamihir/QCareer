
import { Component, inject, signal, OnInit, computed } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DatePipe } from "@angular/common";
import { AuthService } from "../../core/services/auth.service";
import { JobService } from "../../core/services/job.service";
import { STATUS_META, JobStatus } from "../../core/models";
@Component({ selector:"app-dashboard", standalone:true, imports:[RouterLink,DatePipe], template:`
<div style="min-height:100%;padding:2rem;position:relative;z-index:1;">
  <div style="max-width:1100px;margin:0 auto;">
    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2rem;">
      <div>
        <h1 style="font-family:'Orbitron',sans-serif;font-size:1.3rem;font-weight:700;color:#e2e8f0;letter-spacing:1px;">Dashboard</h1>
        <div style="font-size:0.72rem;color:var(--muted);margin-top:4px;">Welcome back, <span style="color:#e2e8f0;">{{ dbUser()?.github_username ?? dbUser()?.email }}</span></div>
      </div>
      <div style="display:flex;gap:.75rem;">
        <a routerLink="/ai-agent" class="btn btn-outline btn-sm">⬡ AI Agent</a>
        <a routerLink="/tracker" class="btn btn-primary btn-sm">+ Add Job</a>
      </div>
    </div>

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem;">
      @for (s of stats(); track s.label) {
        <div class="stat-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem;">
            <div style="font-size:0.62rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-family:'JetBrains Mono',monospace;">{{ s.label }}</div>
            <div style="font-size:1.1rem;">{{ s.icon }}</div>
          </div>
          <div class="stat-val" [style.color]="s.color">{{ s.value }}</div>
          <div class="stat-delta" [class.up]="s.trend==='up'" [class.down]="s.trend==='down'">{{ s.note }}</div>
        </div>
      }
    </div>

    <!-- Recent jobs + pipeline -->
    <div style="display:grid;grid-template-columns:1fr 320px;gap:1.5rem;">
      <!-- Recent jobs -->
      <div class="card" style="padding:1.25rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
          <div style="font-size:0.75rem;font-weight:600;color:#e2e8f0;">Recent Applications</div>
          <a routerLink="/tracker" style="font-size:0.65rem;color:#6366f1;text-decoration:none;">View all →</a>
        </div>
        @if (loading()) { <div style="padding:2rem;text-align:center;color:var(--muted);font-size:0.72rem;">Loading...</div> }
        @else if (!recentJobs().length) {
          <div class="empty"><div class="empty-icon">🗂️</div><div class="empty-title">No applications yet</div><div class="empty-hint">Add your first job to the tracker.</div><a routerLink="/tracker" class="btn btn-primary btn-sm" style="margin-top:.5rem;">+ Add job</a></div>
        } @else {
          @for (j of recentJobs(); track j.id) {
            <div style="display:flex;align-items:center;padding:.75rem 0;border-bottom:1px solid rgba(99,102,241,0.06);">
              <div style="flex:1;min-width:0;">
                <div style="font-size:0.78rem;font-weight:500;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ j.company }}</div>
                <div style="font-size:0.67rem;color:var(--muted);">{{ j.role }}</div>
              </div>
              <span class="status-badge" [class]="meta[j.status].cls">{{ meta[j.status].icon }} {{ meta[j.status].label }}</span>
            </div>
          }
        }
      </div>

      <!-- Pipeline -->
      <div class="card" style="padding:1.25rem;">
        <div style="font-size:0.75rem;font-weight:600;color:#e2e8f0;margin-bottom:1.25rem;">Pipeline</div>
        @for (s of pipeline(); track s.label) {
          <div style="margin-bottom:0.9rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.3rem;">
              <span style="font-size:0.65rem;color:var(--muted);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.5px;">{{ s.label }}</span>
              <span style="font-size:0.68rem;font-weight:600;" [style.color]="s.color">{{ s.count }}</span>
            </div>
            <div style="height:5px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;">
              <div style="height:100%;border-radius:3px;transition:width .6s ease;" [style.width]="(s.pct)+'%'" [style.background]="s.color"></div>
            </div>
          </div>
        }
        <a routerLink="/analytics" style="display:block;margin-top:1rem;font-size:0.65rem;color:#6366f1;text-decoration:none;text-align:center;">Full analytics →</a>
      </div>
    </div>

    <!-- AI Tip banner -->
    <div style="margin-top:1.5rem;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.06));border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:1.25rem;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-size:0.72rem;color:#818cf8;margin-bottom:.25rem;font-weight:500;">⬡ AI Agent ready</div>
        <div style="font-size:0.68rem;color:var(--muted);">Tailor your resume, generate cover letters, prep for interviews, and negotiate your salary — all with Claude AI.</div>
      </div>
      <a routerLink="/ai-agent" class="btn btn-primary btn-sm" style="flex-shrink:0;margin-left:1rem;">Open AI Agent →</a>
    </div>
  </div>
</div>
` })
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private jobSvc = inject(JobService);
  dbUser = this.auth.dbUser;
  loading = this.jobSvc.loading;
  meta = STATUS_META;
  recentJobs = computed(() => this.jobSvc.jobs().slice(0, 6));
  stats = computed(() => {
    const j = this.jobSvc.jobs();
    const offers    = j.filter(x=>x.status==="offer").length;
    const interviews= j.filter(x=>x.status==="interview").length;
    const applied   = j.filter(x=>["applied","screening","interview","offer"].includes(x.status)).length;
    const rate      = applied ? Math.round((interviews/applied)*100) : 0;
    return [
      { label:"Total", icon:"🗂️", value:j.length, color:"#818cf8", trend:"", note:"applications tracked" },
      { label:"Interviews", icon:"🎯", value:interviews, color:"#a78bfa", trend:interviews>0?"up":"", note:interviews>0?"you are in the game":"keep applying" },
      { label:"Offers", icon:"🎉", value:offers, color:"#10b981", trend:offers>0?"up":"", note:offers>0?"congratulations!":"keep going" },
      { label:"Response rate", icon:"📨", value:rate+"%", color:rate>=20?"#10b981":rate>=10?"#f59e0b":"#f43f5e", trend:"", note:rate>=20?"above average":rate>=10?"average":"below avg" },
    ];
  });
  pipeline = computed(() => {
    const j = this.jobSvc.jobs(); const total = j.length || 1;
    return Object.entries(STATUS_META).map(([k,v]) => ({ label:v.label, color:v.color, count:j.filter(x=>x.status===k).length, pct:Math.round((j.filter(x=>x.status===k).length/total)*100) }));
  });
  async ngOnInit() { await this.jobSvc.loadJobs(); }
}
