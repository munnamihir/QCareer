
import { Component, inject, signal, OnInit, computed } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DatePipe } from "@angular/common";
import { JobListingsService } from "../../../core/services/job-listings.service";

@Component({ selector:"app-recruiter-dashboard", standalone:true, imports:[RouterLink,DatePipe], template:`
<div style="min-height:100vh;padding:2rem;position:relative;z-index:1;">
  <div style="max-width:1100px;margin:0 auto;">

    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2rem;">
      <div>
        <h1 style="font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;color:#e2e8f0;letter-spacing:1px;">Recruiter Dashboard</h1>
        <div style="font-size:0.65rem;color:var(--muted);margin-top:2px;">{{ rec()?.company_name || "Your company" }}</div>
      </div>
      <div style="display:flex;gap:.75rem;">
        <a routerLink="/" style="font-size:0.7rem;color:var(--muted);text-decoration:none;padding:.5rem .75rem;border:1px solid var(--border);border-radius:6px;">← Job seeker view</a>
        <a routerLink="/recruiter/post" class="btn btn-primary">+ Post a job</a>
      </div>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem;">
      @for (s of stats(); track s.label) {
        <div class="stat-card">
          <div style="font-size:0.55rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-bottom:.5rem;">{{ s.label }}</div>
          <div class="stat-val" [style.color]="s.color">{{ s.value }}</div>
        </div>
      }
    </div>

    <!-- No profile yet -->
    @if (!rec() && !loading()) {
      <div class="card" style="padding:3rem;text-align:center;">
        <div style="font-size:2rem;margin-bottom:1rem;">🏢</div>
        <div style="font-size:0.85rem;font-weight:600;color:#e2e8f0;margin-bottom:.5rem;">Set up your recruiter profile</div>
        <div style="font-size:0.7rem;color:var(--muted);margin-bottom:1.5rem;">You need a recruiter profile to post jobs.</div>
        <a routerLink="/recruiter/signup" class="btn btn-primary">Create profile →</a>
      </div>
    }

    <!-- Job listings -->
    @if (listings().length || loading()) {
      <div class="card" style="overflow:hidden;">
        <div style="padding:1rem 1.25rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:0.75rem;font-weight:600;color:#e2e8f0;">Your Job Listings</div>
          <span style="font-size:0.62rem;color:var(--muted);font-family:'JetBrains Mono',monospace;">{{ listings().length }} total</span>
        </div>
        @if (loading()) { <div style="padding:3rem;text-align:center;color:var(--muted);font-size:0.72rem;">Loading...</div> }
        @for (job of listings(); track job.id) {
          <div style="padding:1rem 1.25rem;border-bottom:1px solid rgba(99,102,241,0.06);display:flex;align-items:center;gap:1rem;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:0.8rem;font-weight:500;color:#e2e8f0;margin-bottom:2px;">{{ job.title }}</div>
              <div style="font-size:0.65rem;color:var(--muted);">{{ job.location }} · {{ job.remote_type }} · {{ job.job_type | titlecase }}</div>
            </div>
            <div style="display:flex;align-items:center;gap:1rem;flex-shrink:0;">
              <div style="text-align:center;">
                <div style="font-size:0.85rem;font-weight:600;color:#818cf8;">{{ job.views }}</div>
                <div style="font-size:0.55rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">views</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:0.85rem;font-weight:600;color:#10b981;">{{ job.applications_count }}</div>
                <div style="font-size:0.55rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">applied</div>
              </div>
              <span style="font-size:0.6rem;padding:2px 8px;border-radius:10px;font-family:'JetBrains Mono',monospace;"
                [style.background]="job.status==='active'?'rgba(16,185,129,0.1)':job.status==='paused'?'rgba(245,158,11,0.1)':'rgba(244,63,94,0.1)'"
                [style.color]="job.status==='active'?'#10b981':job.status==='paused'?'#f59e0b':'#f43f5e'"
                [style.border]="'1px solid '+(job.status==='active'?'rgba(16,185,129,0.25)':job.status==='paused'?'rgba(245,158,11,0.25)':'rgba(244,63,94,0.25)')">
                {{ job.status }}
              </span>
              <div style="display:flex;gap:.4rem;">
                @if (job.status==='active') { <button (click)="updateStatus(job.id,'paused')" class="btn btn-ghost btn-sm" style="font-size:0.6rem;padding:3px 8px;">Pause</button> }
                @if (job.status==='paused') { <button (click)="updateStatus(job.id,'active')" class="btn btn-ghost btn-sm" style="font-size:0.6rem;padding:3px 8px;">Activate</button> }
                <button (click)="viewApps(job.id)" class="btn btn-outline btn-sm" style="font-size:0.6rem;padding:3px 8px;">Applicants</button>
                <button (click)="deleteJob(job.id)" class="btn btn-ghost btn-sm" style="font-size:0.6rem;padding:3px 8px;color:var(--rose);">Delete</button>
              </div>
            </div>
          </div>
        }
        @if (!listings().length && !loading()) {
          <div class="empty" style="padding:3rem;"><div class="empty-icon">📋</div><div class="empty-title">No jobs posted yet</div><div class="empty-hint">Post your first opening to start getting applicants.</div><a routerLink="/recruiter/post" class="btn btn-primary btn-sm" style="margin-top:1rem;">+ Post a job</a></div>
        }
      </div>
    }

    <!-- Applications panel -->
    @if (showApps()) {
      <div class="card" style="margin-top:1.5rem;overflow:hidden;">
        <div style="padding:1rem 1.25rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:0.75rem;font-weight:600;color:#e2e8f0;">Applicants</div>
          <button (click)="showApps.set(false)" class="btn btn-ghost btn-sm" style="font-size:0.62rem;">Close</button>
        </div>
        @if (appsLoading()) { <div style="padding:2rem;text-align:center;color:var(--muted);">Loading...</div> }
        @for (app of applications(); track app.id) {
          <div style="padding:.85rem 1.25rem;border-bottom:1px solid rgba(99,102,241,0.06);display:flex;align-items:center;gap:1rem;">
            @if (app.users?.github_avatar) { <img [src]="app.users.github_avatar" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border);flex-shrink:0;"> }
            <div style="flex:1;">
              <div style="font-size:0.75rem;color:#e2e8f0;">{{ app.users?.github_username || app.users?.email }}</div>
              <div style="font-size:0.62rem;color:var(--muted);">Applied {{ app.created_at | date:"mediumDate" }}</div>
              @if (app.cover_letter) { <div style="font-size:0.65rem;color:var(--muted);margin-top:.25rem;line-height:1.6;">{{ app.cover_letter | slice:0:120 }}...</div> }
            </div>
            <select (change)="updateAppStatus(app.id, $any($event.target).value)" [value]="app.status"
              style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:4px 8px;color:#e2e8f0;font-size:0.65rem;outline:none;cursor:pointer;">
              <option value="applied">Applied</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired ✓</option>
            </select>
          </div>
        }
        @if (!applications().length && !appsLoading()) {
          <div class="empty" style="padding:2rem;"><div class="empty-title">No applicants yet</div></div>
        }
      </div>
    }
  </div>
</div>
` })
export class RecruiterDashboardComponent implements OnInit {
  private svc = inject(JobListingsService);
  rec = this.svc.recruiter;
  listings = this.svc.myListings;
  loading = signal(false);
  showApps = signal(false);
  appsLoading = signal(false);
  applications = signal<any[]>([]);
  stats = computed(()=>{
    const l=this.listings();
    return [
      {label:"Active jobs",value:l.filter(j=>j.status==="active").length,color:"#10b981"},
      {label:"Total views",value:l.reduce((s,j)=>s+j.views,0),color:"#818cf8"},
      {label:"Applications",value:l.reduce((s,j)=>s+j.applications_count,0),color:"#f59e0b"},
      {label:"Jobs posted",value:this.rec()?.jobs_posted??0,color:"#38bdf8"},
    ];
  });
  async ngOnInit(){this.loading.set(true);await this.svc.loadRecruiter();await this.svc.loadMyListings();this.loading.set(false);}
  async updateStatus(id:string,status:any){await this.svc.updateJobStatus(id,status);}
  async deleteJob(id:string){if(confirm("Delete this job?"))await this.svc.deleteJob(id);}
  async viewApps(jobId:string){this.showApps.set(true);this.appsLoading.set(true);this.applications.set(await this.svc.getJobApplications(jobId));this.appsLoading.set(false);}
  async updateAppStatus(appId:string,status:string){await this.svc.updateApplicationStatus(appId,status);}
}
