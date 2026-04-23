
import { Component, inject, computed, OnInit } from "@angular/core";
import { JobService } from "../../core/services/job.service";
import { STATUS_META } from "../../core/models";

@Component({ selector:"app-analytics", standalone:true, template:`
<div style="min-height:100%;padding:2rem;position:relative;z-index:1;">
  <div style="max-width:1000px;margin:0 auto;">
    <h1 style="font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;color:#e2e8f0;letter-spacing:1px;margin-bottom:2rem;">📊 Analytics</h1>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem;">
      <!-- Application Funnel -->
      <div class="card" style="padding:1.5rem;">
        <div style="font-size:0.78rem;font-weight:600;color:#e2e8f0;margin-bottom:1.25rem;">Application Funnel</div>
        @for (s of funnelData(); track s.label) {
          <div class="funnel-bar">
            <div class="funnel-label">{{ s.icon }} {{ s.label }}</div>
            <div class="funnel-track">
              <div class="funnel-fill" [style.width]="s.pct+'%'" [style.background]="s.color">
                @if (s.pct > 15) { <span>{{ s.pct }}%</span> }
              </div>
            </div>
            <div class="funnel-count">{{ s.count }}</div>
          </div>
        }
        <div style="margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border);">
          <div style="font-size:0.68rem;color:var(--muted);font-family:'JetBrains Mono',monospace;">
            Total tracked: {{ total() }} &nbsp;·&nbsp;
            Response rate: <span [style.color]="responseRate()>=20?'#10b981':responseRate()>=10?'#f59e0b':'#f43f5e'">{{ responseRate() }}%</span>
          </div>
        </div>
      </div>

      <!-- Excitement distribution -->
      <div class="card" style="padding:1.5rem;">
        <div style="font-size:0.78rem;font-weight:600;color:#e2e8f0;margin-bottom:1.25rem;">Excitement Distribution ⭐</div>
        @for (e of excitementData(); track e.stars) {
          <div class="funnel-bar">
            <div class="funnel-label">{{ e.label }}</div>
            <div class="funnel-track">
              <div class="funnel-fill" [style.width]="e.pct+'%'" style="background:linear-gradient(90deg,#f59e0b,#f97316);">
                @if (e.pct > 15) { <span>{{ e.pct }}%</span> }
              </div>
            </div>
            <div class="funnel-count">{{ e.count }}</div>
          </div>
        }
      </div>
    </div>

    <!-- Insights row -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;">
      @for (insight of insights(); track insight.label) {
        <div class="card" style="padding:1.25rem;">
          <div style="font-size:1.5rem;margin-bottom:.5rem;">{{ insight.icon }}</div>
          <div style="font-size:0.7rem;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-bottom:.35rem;">{{ insight.label }}</div>
          <div style="font-size:1.3rem;font-family:'Orbitron',sans-serif;font-weight:700;" [style.color]="insight.color">{{ insight.value }}</div>
          <div style="font-size:0.65rem;color:var(--muted);margin-top:.25rem;">{{ insight.note }}</div>
        </div>
      }
    </div>

    <!-- Top companies -->
    @if (topCompanies().length) {
      <div class="card" style="padding:1.5rem;">
        <div style="font-size:0.78rem;font-weight:600;color:#e2e8f0;margin-bottom:1.25rem;">Companies in Pipeline</div>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;">
          @for (c of topCompanies(); track c.name) {
            <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.5rem 1rem;display:flex;align-items:center;gap:.5rem;">
              <span style="font-size:0.75rem;color:#e2e8f0;font-weight:500;">{{ c.name }}</span>
              <span class="status-badge" [class]="meta[c.status].cls">{{ meta[c.status].label }}</span>
            </div>
          }
        </div>
      </div>
    }

    @if (!total()) {
      <div class="empty" style="padding:4rem;"><div class="empty-icon">📊</div><div class="empty-title">No data yet</div><div class="empty-hint">Add applications to your job tracker to see analytics here.</div></div>
    }
  </div>
</div>
` })
export class AnalyticsComponent implements OnInit {
  private jobSvc = inject(JobService);
  meta = STATUS_META;
  total = computed(() => this.jobSvc.jobs().length);
  responseRate = computed(() => {
    const j = this.jobSvc.jobs(); const active = j.filter(x=>["screening","interview","offer"].includes(x.status)).length;
    return j.length ? Math.round((active/j.length)*100) : 0;
  });
  funnelData = computed(() => {
    const j = this.jobSvc.jobs(); const t = j.length||1;
    return Object.entries(STATUS_META).map(([k,v]) => ({ label:v.label, icon:v.icon, color:v.color, count:j.filter(x=>x.status===k).length, pct:Math.round((j.filter(x=>x.status===k).length/t)*100) }));
  });
  excitementData = computed(() => {
    const j = this.jobSvc.jobs(); const t = j.length||1;
    return [5,4,3,2,1].map(n => ({ stars:n, label:"⭐".repeat(n), count:j.filter(x=>x.excitement===n).length, pct:Math.round((j.filter(x=>x.excitement===n).length/t)*100) }));
  });
  insights = computed(() => {
    const j = this.jobSvc.jobs();
    const offers    = j.filter(x=>x.status==="offer").length;
    const interviews= j.filter(x=>x.status==="interview").length;
    const avgExcite = j.length ? (j.reduce((s,x)=>s+x.excitement,0)/j.length).toFixed(1) : "—";
    const withSalary= j.filter(x=>x.salary_min).length;
    const avgSalary = withSalary ? Math.round(j.filter(x=>x.salary_min).reduce((s,x)=>s+(x.salary_min||0),0)/withSalary) : null;
    return [
      { icon:"🎯", label:"Interviews", value:interviews, color:"#a78bfa", note:"active interview stages" },
      { icon:"🎉", label:"Offers", value:offers, color:"#10b981", note:offers>0?"you have an offer!":"keep pushing" },
      { icon:"⭐", label:"Avg excitement", value:avgExcite, color:"#f59e0b", note:"out of 5 stars" },
    ];
  });
  topCompanies = computed(() => this.jobSvc.jobs().slice(0, 12).map(j => ({ name:j.company, status:j.status })));
  async ngOnInit() { await this.jobSvc.loadJobs(); }
}
