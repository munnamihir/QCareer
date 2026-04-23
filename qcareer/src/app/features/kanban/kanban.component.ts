
import { Component, inject, signal, computed, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { JobService } from "../../core/services/job.service";
import { Job, JobStatus, STATUS_META } from "../../core/models";

const COLS: JobStatus[] = ["wishlist","applied","screening","interview","offer","rejected"];

@Component({ selector:"app-kanban", standalone:true, imports:[FormsModule,DatePipe], template:`
<div style="height:100%;display:flex;flex-direction:column;overflow:hidden;">
  <!-- Header -->
  <div style="padding:1.25rem 2rem;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
    <div>
      <h1 style="font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;color:#e2e8f0;letter-spacing:1px;">Job Tracker</h1>
      <div style="font-size:0.65rem;color:var(--muted);margin-top:2px;font-family:'JetBrains Mono',monospace;">{{ jobSvc.jobs().length }} applications tracked</div>
    </div>
    <button (click)="showAddModal.set(true)" class="btn btn-primary">+ Add job</button>
  </div>
  <!-- Board -->
  <div style="flex:1;overflow:auto;padding:1.25rem 2rem;">
    <div class="kanban-board">
      @for (col of cols; track col) {
        <div class="kanban-col">
          <div class="kanban-header" [style.borderColor]="meta[col].color+'33'">
            <span>{{ meta[col].icon }}</span>
            <span class="col-title" [style.color]="meta[col].color">{{ meta[col].label }}</span>
            <span class="col-count">{{ colJobs(col).length }}</span>
          </div>
          <!-- Drop zone -->
          <div class="kanban-drop-zone" [class.drag-over]="dragOver()===col"
            (dragover)="$event.preventDefault();dragOver.set(col)"
            (dragleave)="dragOver.set(null)"
            (drop)="onDrop($event,col)">
            Drop here
          </div>
          @for (job of colJobs(col); track job.id) {
            <div class="job-card" draggable="true"
              (dragstart)="dragJob.set(job)"
              (dragend)="dragJob.set(null);dragOver.set(null)">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:.4rem;">
                <div class="company">{{ job.company }}</div>
                <div style="display:flex;gap:.25rem;">
                  @for (i of [1,2,3,4,5]; track i) {
                    <span style="font-size:0.6rem;cursor:pointer;opacity:{{ i<=job.excitement?1:0.2 }};" (click)="setExcitement(job,i)">⭐</span>
                  }
                </div>
              </div>
              <div class="role">{{ job.role }}</div>
              @if (job.location) { <div style="font-size:0.62rem;color:var(--muted);margin-bottom:.35rem;">📍 {{ job.location }}</div> }
              @if (job.salary_min) {
                <div class="salary">{{ job.currency }} {{ job.salary_min | number }}{{ job.salary_max ? " – "+( job.salary_max | number ) : "" }}</div>
              }
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:.6rem;">
                <div class="date">{{ job.applied_at ? (job.applied_at | date:"MMM d") : (job.created_at | date:"MMM d") }}</div>
                @if (job.url) { <a [href]="job.url" target="_blank" style="font-size:0.6rem;color:#6366f1;text-decoration:none;">🔗 JD</a> }
              </div>
              <div class="actions">
                @for (s of moveOptions(col); track s) {
                  <button (click)="move(job,s)" class="btn btn-ghost btn-sm" style="font-size:0.55rem;padding:2px 6px;" title="Move to {{ meta[s].label }}">→ {{ meta[s].label }}</button>
                }
                <button (click)="deleteJob(job.id)" class="btn btn-ghost btn-sm" style="font-size:0.55rem;padding:2px 6px;color:var(--rose);" title="Delete">✕</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  </div>
</div>

<!-- Add Job Modal -->
@if (showAddModal()) {
  <div class="modal-overlay" (click)="showAddModal.set(false)">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-title">Add job application</div>
      <div class="modal-sub">Track a new opportunity in your pipeline.</div>
      <form (ngSubmit)="addJob()" style="display:flex;flex-direction:column;gap:.85rem;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Company *</label><input [(ngModel)]="form.company" name="company" required class="form-input" placeholder="Google"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Role *</label><input [(ngModel)]="form.role" name="role" required class="form-input" placeholder="Senior Engineer"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Status</label>
            <select [(ngModel)]="form.status" name="status" class="form-input">
              @for (s of statusKeys; track s) { <option [value]="s">{{ meta[s].icon }} {{ meta[s].label }}</option> }
            </select>
          </div>
          <div class="form-group" style="margin:0;"><label class="form-label">Location</label><input [(ngModel)]="form.location" name="location" class="form-input" placeholder="Remote / NYC"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 80px;gap:.75rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Salary min</label><input type="number" [(ngModel)]="form.salary_min" name="salary_min" class="form-input" placeholder="120000"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Salary max</label><input type="number" [(ngModel)]="form.salary_max" name="salary_max" class="form-input" placeholder="160000"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Currency</label><input [(ngModel)]="form.currency" name="currency" class="form-input" placeholder="USD"></div>
        </div>
        <div class="form-group" style="margin:0;"><label class="form-label">Job URL</label><input [(ngModel)]="form.url" name="url" class="form-input" placeholder="https://jobs.example.com/..."></div>
        <div class="form-group" style="margin:0;"><label class="form-label">Excitement (1-5 ⭐)</label>
          <div style="display:flex;gap:.5rem;margin-top:.25rem;">
            @for (i of [1,2,3,4,5]; track i) {
              <span style="font-size:1.2rem;cursor:pointer;opacity:{{ i<=form.excitement?1:0.3 }};" (click)="form.excitement=i">⭐</span>
            }
          </div>
        </div>
        <div style="display:flex;gap:.75rem;margin-top:.5rem;">
          <button type="button" (click)="showAddModal.set(false)" class="btn btn-ghost" style="flex:1;justify-content:center;">Cancel</button>
          <button type="submit" [disabled]="!form.company||!form.role||saving()" class="btn btn-primary" style="flex:1;justify-content:center;">{{ saving() ? "Saving..." : "Add job" }}</button>
        </div>
      </form>
    </div>
  </div>
}
` })
export class KanbanComponent implements OnInit {
  jobSvc = inject(JobService);
  cols = COLS; meta = STATUS_META;
  statusKeys = COLS;
  showAddModal = signal(false); saving = signal(false);
  dragJob = signal<Job|null>(null); dragOver = signal<JobStatus|null>(null);
  form: any = { company:"", role:"", status:"applied", location:"", salary_min:null, salary_max:null, currency:"USD", url:"", excitement:3 };

  colJobs(col: JobStatus) { return this.jobSvc.jobs().filter(j=>j.status===col); }
  moveOptions(current: JobStatus): JobStatus[] { return COLS.filter(c=>c!==current).slice(0,2); }

  async ngOnInit() { await this.jobSvc.loadJobs(); }

  async addJob() {
    if (!this.form.company||!this.form.role) return;
    this.saving.set(true);
    await this.jobSvc.addJob({ ...this.form, applied_at: this.form.status!=="wishlist"?new Date().toISOString():undefined });
    this.form = { company:"",role:"",status:"applied",location:"",salary_min:null,salary_max:null,currency:"USD",url:"",excitement:3 };
    this.showAddModal.set(false); this.saving.set(false);
  }

  async move(job: Job, status: JobStatus) { await this.jobSvc.updateStatus(job.id, status); }
  async deleteJob(id: string) { if (confirm("Delete this job?")) await this.jobSvc.deleteJob(id); }
  async setExcitement(job: Job, n: number) { await this.jobSvc.updateJob(job.id, { excitement:n }); }

  async onDrop(e: DragEvent, col: JobStatus) {
    e.preventDefault(); this.dragOver.set(null);
    const job = this.dragJob(); if (!job||job.status===col) return;
    await this.jobSvc.updateStatus(job.id, col); this.dragJob.set(null);
  }
}
