import { Component, inject, signal, computed, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePipe, DecimalPipe } from "@angular/common";
import { RouterLink, Router } from "@angular/router";
import { JobService } from "../../core/services/job.service";
import { Job, JobStatus, STATUS_META } from "../../core/models";

const COLS: JobStatus[] = ["wishlist","applied","screening","interview","offer","rejected"];

@Component({
  selector: "app-kanban",
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe, RouterLink],
  template: `
<div style="height:100vh;display:flex;flex-direction:column;background:var(--bg);overflow:hidden;">

  <!-- Top bar -->
  <div style="padding:1rem 1.5rem;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;align-items:center;gap:1rem;flex-shrink:0;">
    <div>
      <h1 style="font-family:'Orbitron',sans-serif;font-size:1rem;font-weight:700;color:#e2e8f0;letter-spacing:1px;">🗂️ Job Tracker</h1>
      <div style="font-size:0.6rem;color:var(--muted);margin-top:1px;font-family:'JetBrains Mono',monospace;">{{ totalJobs() }} applications · {{ activeJobs() }} active</div>
    </div>

    <!-- Search -->
    <div style="flex:1;max-width:280px;position:relative;">
      <span style="position:absolute;left:.75rem;top:50%;transform:translateY(-50%);font-size:.8rem;pointer-events:none;">🔍</span>
      <input [(ngModel)]="search" placeholder="Search jobs..."
        style="width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.5rem .75rem .5rem 2.2rem;color:#e2e8f0;font-size:0.72rem;outline:none;transition:border-color .2s;"
        (focus)="$event.target.style.borderColor='#6366f1'" (blur)="$event.target.style.borderColor='rgba(99,102,241,0.15)'">
    </div>

    <!-- Filter by excitement -->
    <div style="display:flex;gap:.25rem;">
      @for (s of [0,1,2,3,4,5]; track s) {
        <button (click)="filterStars.set(filterStars()===s?0:s)"
          style="padding:.3rem .5rem;border-radius:6px;font-size:.7rem;border:1px solid;transition:all .15s;cursor:pointer;"
          [style.background]="filterStars()===s?'rgba(245,158,11,0.15)':'transparent'"
          [style.borderColor]="filterStars()===s?'rgba(245,158,11,0.4)':'var(--border)'"
          [style.color]="filterStars()===s?'#f59e0b':'var(--muted)'">
          {{ s===0?"All":"⭐".repeat(s) }}
        </button>
      }
    </div>

    <button (click)="showAddModal.set(true)" class="btn btn-primary btn-sm" style="margin-left:auto;flex-shrink:0;">
      + Add job
    </button>
  </div>

  <!-- Stats strip -->
  <div style="display:flex;gap:0;border-bottom:1px solid var(--border);flex-shrink:0;overflow-x:auto;">
    @for (col of cols; track col) {
      <div style="flex:1;min-width:120px;padding:.6rem 1rem;border-right:1px solid var(--border);position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;" [style.background]="meta[col].color"></div>
        <div style="font-size:0.55rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-family:'JetBrains Mono',monospace;">{{ meta[col].label }}</div>
        <div style="font-size:1.2rem;font-weight:700;font-family:'Orbitron',sans-serif;line-height:1;margin-top:.2rem;" [style.color]="meta[col].color">{{ colJobs(col).length }}</div>
      </div>
    }
  </div>

  <!-- Board -->
  <div style="flex:1;overflow-x:auto;overflow-y:hidden;padding:1rem 1.25rem;display:flex;gap:.85rem;align-items:flex-start;">
    @for (col of cols; track col) {
      <div style="flex-shrink:0;width:270px;display:flex;flex-direction:column;gap:.6rem;height:100%;">

        <!-- Column header -->
        <div style="display:flex;align-items:center;gap:.5rem;padding:.6rem .85rem;border-radius:10px;border:1px solid;position:sticky;top:0;z-index:2;"
          [style.borderColor]="meta[col].color+'33'"
          [style.background]="'rgba(7,9,26,0.95)'">
          <span style="font-size:1rem;">{{ meta[col].icon }}</span>
          <span style="font-size:0.68rem;font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-family:'JetBrains Mono',monospace;" [style.color]="meta[col].color">{{ meta[col].label }}</span>
          <span style="margin-left:auto;font-size:0.6rem;font-family:'JetBrains Mono',monospace;color:var(--muted);">{{ colJobs(col).length }}</span>
          <button (click)="quickAdd(col)" style="width:20px;height:20px;border-radius:4px;border:1px solid;background:transparent;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center;transition:all .15s;"
            [style.borderColor]="meta[col].color+'55'"
            [style.color]="meta[col].color"
            onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'"
            title="Quick add">+</button>
        </div>

        <!-- Scrollable cards area -->
        <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:.6rem;padding-bottom:.5rem;"
          (dragover)="$event.preventDefault();dragOver.set(col)"
          (dragleave)="dragOver.set(null)"
          (drop)="onDrop($event,col)"
          [style.background]="dragOver()===col?'rgba(99,102,241,0.04)':'transparent'"
          [style.borderRadius]="'8px'"
          [style.transition]="'background .2s'">

          @for (job of colJobs(col); track job.id) {
            <div
              draggable="true"
              (dragstart)="dragJob.set(job)"
              (dragend)="dragJob.set(null);dragOver.set(null)"
              (click)="openDetail(job)"
              style="background:var(--bg2);border-radius:10px;padding:.85rem;cursor:pointer;transition:all .2s;border:1px solid;position:relative;overflow:hidden;"
              [style.borderColor]="dragJob()?.id===job.id?meta[col].color:selectedJob()?.id===job.id?'rgba(99,102,241,0.5)':'rgba(99,102,241,0.1)'"
              [style.transform]="dragJob()?.id===job.id?'scale(0.97) rotate(1deg)':''"
              [style.opacity]="dragJob()?.id===job.id?'0.6':'1'"
              [style.boxShadow]="selectedJob()?.id===job.id?'0 0 0 2px rgba(99,102,241,0.3)':''"
              onmouseover="this.style.borderColor='rgba(99,102,241,0.35)';this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'"
              onmouseout="this.style.borderColor='rgba(99,102,241,0.1)';this.style.transform='';this.style.boxShadow=''">

              <!-- Color bar -->
              <div style="position:absolute;top:0;left:0;right:0;height:2px;" [style.background]="meta[col].color+'88'"></div>

              <!-- Company + actions -->
              <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:.35rem;">
                <div style="font-size:0.78rem;font-weight:600;color:#e2e8f0;line-height:1.3;flex:1;padding-right:.5rem;">{{ job.company }}</div>
                <div style="display:flex;gap:.2rem;flex-shrink:0;" (click)="$event.stopPropagation()">
                  @if (job.url) {
                    <a [href]="job.url" target="_blank" style="width:22px;height:22px;border-radius:4px;border:1px solid var(--border);background:transparent;display:flex;align-items:center;justify-content:center;font-size:.7rem;text-decoration:none;color:var(--muted);transition:all .15s;" onmouseover="this.style.borderColor='rgba(99,102,241,0.4)';this.style.color='#818cf8'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'" title="Open job">↗</a>
                  }
                  <button (click)="deleteJob(job.id)" style="width:22px;height:22px;border-radius:4px;border:1px solid var(--border);background:transparent;cursor:pointer;font-size:.7rem;color:var(--muted);transition:all .15s;display:flex;align-items:center;justify-content:center;" onmouseover="this.style.borderColor='rgba(244,63,94,0.4)';this.style.color='#f43f5e'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'" title="Delete">✕</button>
                </div>
              </div>

              <!-- Role -->
              <div style="font-size:0.68rem;color:#818cf8;margin-bottom:.5rem;font-weight:500;">{{ job.role }}</div>

              <!-- Location -->
              @if (job.location) {
                <div style="font-size:0.62rem;color:var(--muted);margin-bottom:.4rem;">📍 {{ job.location }}</div>
              }

              <!-- Salary -->
              @if (job.salary_min) {
                <div style="font-size:0.62rem;color:#10b981;font-family:'JetBrains Mono',monospace;margin-bottom:.4rem;">
                  {{ job.currency }} {{ job.salary_min | number:'1.0-0' }}{{ job.salary_max ? "–"+(job.salary_max | number:'1.0-0') : "+" }}
                </div>
              }

              <!-- Footer: date + stars -->
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:.6rem;padding-top:.6rem;border-top:1px solid rgba(99,102,241,0.08);">
                <div style="font-size:0.58rem;color:var(--muted);font-family:'JetBrains Mono',monospace;">
                  {{ (job.applied_at || job.created_at) | date:"MMM d" }}
                </div>
                <!-- Excitement stars (click to change) -->
                <div style="display:flex;gap:1px;" (click)="$event.stopPropagation()">
                  @for (i of [1,2,3,4,5]; track i) {
                    <span style="font-size:0.62rem;cursor:pointer;transition:opacity .15s;"
                      [style.opacity]="i<=job.excitement?'1':'0.2'"
                      (click)="setExcitement(job,i)">⭐</span>
                  }
                </div>
              </div>

              <!-- Notes preview -->
              @if (job.notes) {
                <div style="margin-top:.5rem;font-size:0.6rem;color:var(--muted);background:rgba(0,0,0,.2);border-radius:5px;padding:.35rem .5rem;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">
                  {{ job.notes }}
                </div>
              }
            </div>
          }

          @if (!colJobs(col).length) {
            <div style="border:2px dashed rgba(99,102,241,0.1);border-radius:8px;padding:1.5rem;text-align:center;color:var(--muted);font-size:0.65rem;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .2s;"
              (click)="quickAdd(col)"
              onmouseover="this.style.borderColor='rgba(99,102,241,0.3)';this.style.color='#818cf8'" onmouseout="this.style.borderColor='rgba(99,102,241,0.1)';this.style.color='var(--muted)'">
              Drop here or click + to add
            </div>
          }
        </div>
      </div>
    }
  </div>
</div>

<!-- ── ADD JOB MODAL ── -->
@if (showAddModal()) {
  <div class="modal-overlay" (click)="closeAddModal()">
    <div class="modal" style="max-width:540px;" (click)="$event.stopPropagation()">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
        <div class="modal-title" style="margin:0;">Add job application</div>
        <button (click)="closeAddModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.2rem;line-height:1;">×</button>
      </div>
      <form (ngSubmit)="addJob()" style="display:flex;flex-direction:column;gap:.85rem;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
          <div class="form-group" style="margin:0;"><label class="form-label">Company *</label><input [(ngModel)]="form.company" name="company" required class="form-input" placeholder="Google" autofocus></div>
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
          <div class="form-group" style="margin:0;"><label class="form-label">Salary min</label><input type="number" [(ngModel)]="form.salary_min" name="smin" class="form-input" placeholder="120000"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Salary max</label><input type="number" [(ngModel)]="form.salary_max" name="smax" class="form-input" placeholder="160000"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Currency</label><input [(ngModel)]="form.currency" name="cur" class="form-input" placeholder="USD"></div>
        </div>
        <div class="form-group" style="margin:0;"><label class="form-label">Job URL</label><input [(ngModel)]="form.url" name="url" class="form-input" placeholder="https://..."></div>
        <div class="form-group" style="margin:0;"><label class="form-label">Notes</label><textarea [(ngModel)]="form.notes" name="notes" class="form-input" rows="2" placeholder="Recruiter name, next steps, anything to remember..."></textarea></div>
        <div class="form-group" style="margin:0;"><label class="form-label">Excitement</label>
          <div style="display:flex;gap:.4rem;margin-top:.3rem;">
            @for (i of [1,2,3,4,5]; track i) {
              <span style="font-size:1.4rem;cursor:pointer;transition:opacity .15s;" [style.opacity]="i<=form.excitement?'1':'0.25'" (click)="form.excitement=i">⭐</span>
            }
          </div>
        </div>
        <div style="display:flex;gap:.75rem;margin-top:.25rem;">
          <button type="button" (click)="closeAddModal()" class="btn btn-ghost" style="flex:1;justify-content:center;">Cancel</button>
          <button type="submit" [disabled]="!form.company||!form.role||saving()" class="btn btn-primary" style="flex:2;justify-content:center;">
            {{ saving() ? "Saving..." : "Add to tracker" }}
          </button>
        </div>
      </form>
    </div>
  </div>
}

<!-- ── JOB DETAIL SIDE PANEL ── -->
@if (selectedJob()) {
  <div style="position:fixed;top:0;right:0;bottom:0;width:380px;background:var(--bg2);border-left:1px solid var(--border);z-index:200;display:flex;flex-direction:column;box-shadow:-20px 0 60px rgba(0,0,0,0.5);">
    <!-- Panel header -->
    <div style="padding:1.1rem 1.25rem;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;">
      <div style="flex:1;">
        <div style="font-size:0.55rem;letter-spacing:2px;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-bottom:.3rem;" [style.color]="meta[selectedJob()!.status].color">{{ meta[selectedJob()!.status].icon }} {{ meta[selectedJob()!.status].label }}</div>
        <div style="font-size:0.95rem;font-weight:700;color:#e2e8f0;line-height:1.2;">{{ selectedJob()!.company }}</div>
        <div style="font-size:0.75rem;color:#818cf8;margin-top:2px;">{{ selectedJob()!.role }}</div>
      </div>
      <button (click)="selectedJob.set(null)" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.3rem;line-height:1;padding:.25rem;flex-shrink:0;">×</button>
    </div>

    <!-- Panel body -->
    <div style="flex:1;overflow-y:auto;padding:1.1rem 1.25rem;display:flex;flex-direction:column;gap:1rem;">

      <!-- Status selector -->
      <div>
        <div style="font-size:0.6rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-bottom:.5rem;">Move to</div>
        <div style="display:flex;flex-wrap:wrap;gap:.35rem;">
          @for (s of statusKeys; track s) {
            <button (click)="moveJob(selectedJob()!.id,s)" class="status-badge" [class]="meta[s].cls"
              [style.opacity]="selectedJob()!.status===s?'1':'0.45'"
              [style.cursor]="selectedJob()!.status===s?'default':'pointer'"
              style="transition:opacity .15s;">
              {{ meta[s].icon }} {{ meta[s].label }}
            </button>
          }
        </div>
      </div>

      <!-- Details -->
      <div style="display:flex;flex-direction:column;gap:.6rem;">
        @if (selectedJob()!.location) {
          <div style="display:flex;align-items:center;gap:.6rem;">
            <span style="font-size:.8rem;">📍</span>
            <span style="font-size:.72rem;color:var(--muted);">{{ selectedJob()!.location }}</span>
          </div>
        }
        @if (selectedJob()!.salary_min) {
          <div style="display:flex;align-items:center;gap:.6rem;">
            <span style="font-size:.8rem;">💰</span>
            <span style="font-size:.72rem;color:#10b981;font-family:'JetBrains Mono',monospace;">{{ selectedJob()!.currency }} {{ selectedJob()!.salary_min | number:'1.0-0' }}{{ selectedJob()!.salary_max?"–"+(selectedJob()!.salary_max|number:'1.0-0'):"+" }}</span>
          </div>
        }
        @if (selectedJob()!.url) {
          <div style="display:flex;align-items:center;gap:.6rem;">
            <span style="font-size:.8rem;">🔗</span>
            <a [href]="selectedJob()!.url" target="_blank" style="font-size:.72rem;color:#6366f1;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ selectedJob()!.url }}</a>
          </div>
        }
        <div style="display:flex;align-items:center;gap:.6rem;">
          <span style="font-size:.8rem;">📅</span>
          <span style="font-size:.72rem;color:var(--muted);font-family:'JetBrains Mono',monospace;">{{ (selectedJob()!.applied_at||selectedJob()!.created_at)|date:"MMMM d, y" }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:.4rem;">
          <span style="font-size:.8rem;">⭐</span>
          <div style="display:flex;gap:2px;">
            @for (i of [1,2,3,4,5]; track i) {
              <span style="font-size:.75rem;cursor:pointer;" [style.opacity]="i<=selectedJob()!.excitement?'1':'0.2'" (click)="setExcitement(selectedJob()!,i)">⭐</span>
            }
          </div>
        </div>
      </div>

      <!-- Editable notes -->
      <div>
        <div style="font-size:0.6rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-bottom:.5rem;">Notes</div>
        <textarea [(ngModel)]="editNotes" (blur)="saveNotes()" rows="5"
          style="width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:.65rem .85rem;color:#e2e8f0;font-size:.72rem;outline:none;resize:vertical;font-family:'JetBrains Mono',monospace;line-height:1.7;transition:border-color .2s;"
          (focus)="$event.target.style.borderColor='#6366f1'" (blur)="$event.target.style.borderColor='rgba(99,102,241,0.15)';saveNotes()"
          placeholder="Interview notes, recruiter contact, next steps, feedback...">
        </textarea>
        <div style="font-size:0.58rem;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:.25rem;">Auto-saves on blur</div>
      </div>

      <!-- Quick AI actions -->
      <div>
        <div style="font-size:0.6rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-bottom:.5rem;">Quick Actions</div>
        <div style="display:flex;flex-direction:column;gap:.4rem;">
          <button (click)="goToAgent(selectedJob()!, 'resume')"
            style="display:flex;align-items:center;gap:.6rem;padding:.6rem .85rem;background:var(--ai-bg);border:1px solid var(--ai-border);border-radius:8px;cursor:pointer;transition:all .15s;width:100%;"
            onmouseover="this.style.background='rgba(124,92,252,0.14)'" onmouseout="this.style.background='var(--ai-bg)'">
            <span>📝</span><span style="font-size:.7rem;color:var(--ai2);">Tailor resume for {{ selectedJob()!.company }}</span>
          </button>
          <button (click)="goToAgent(selectedJob()!, 'cover')"
            style="display:flex;align-items:center;gap:.6rem;padding:.6rem .85rem;background:var(--ai-bg);border:1px solid var(--ai-border);border-radius:8px;cursor:pointer;transition:all .15s;width:100%;"
            onmouseover="this.style.background='rgba(124,92,252,0.14)'" onmouseout="this.style.background='var(--ai-bg)'">
            <span>✉️</span><span style="font-size:.7rem;color:var(--ai2);">Write cover letter for {{ selectedJob()!.role }}</span>
          </button>
          <button (click)="goToAgent(selectedJob()!, 'interview')"
            style="display:flex;align-items:center;gap:.6rem;padding:.6rem .85rem;background:var(--ai-bg);border:1px solid var(--ai-border);border-radius:8px;cursor:pointer;transition:all .15s;width:100%;"
            onmouseover="this.style.background='rgba(124,92,252,0.14)'" onmouseout="this.style.background='var(--ai-bg)'">
            <span>🎤</span><span style="font-size:.7rem;color:var(--ai2);">Practice interview for {{ selectedJob()!.company }}</span>
          </button>
          <button (click)="goToAgent(selectedJob()!, 'salary')"
            style="display:flex;align-items:center;gap:.6rem;padding:.6rem .85rem;background:var(--ai-bg);border:1px solid var(--ai-border);border-radius:8px;cursor:pointer;transition:all .15s;width:100%;"
            onmouseover="this.style.background='rgba(124,92,252,0.14)'" onmouseout="this.style.background='var(--ai-bg)'">
            <span>💰</span><span style="font-size:.7rem;color:var(--ai2);">Negotiate salary for {{ selectedJob()!.company }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Panel footer -->
    <div style="padding:.85rem 1.25rem;border-top:1px solid var(--border);flex-shrink:0;">
      <button (click)="deleteJob(selectedJob()!.id);selectedJob.set(null)" style="width:100%;padding:.55rem;border-radius:8px;border:1px solid rgba(244,63,94,0.2);background:rgba(244,63,94,0.05);color:#f43f5e;font-size:.7rem;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .15s;" onmouseover="this.style.background='rgba(244,63,94,0.1)'" onmouseout="this.style.background='rgba(244,63,94,0.05)'">
        Delete this application
      </button>
    </div>
  </div>
  <!-- Overlay to close panel -->
  <div style="position:fixed;inset:0;z-index:199;" (click)="selectedJob.set(null)"></div>
}
  `
})
export class KanbanComponent implements OnInit {
  jobSvc = inject(JobService);
  private router = inject(Router);
  cols = COLS;
  meta = STATUS_META;
  statusKeys = COLS;

  search = "";
  filterStars = signal(0);
  showAddModal = signal(false);
  saving = signal(false);
  dragJob = signal<Job|null>(null);
  dragOver = signal<JobStatus|null>(null);
  selectedJob = signal<Job|null>(null);
  editNotes = "";

  form: any = { company:"", role:"", status:"applied", location:"", salary_min:null, salary_max:null, currency:"USD", url:"", notes:"", excitement:3 };

  totalJobs = () => this.jobSvc.jobs().length;
  activeJobs = () => this.jobSvc.jobs().filter(j=>!["rejected","offer"].includes(j.status)).length;

  colJobs(col: JobStatus): Job[] {
    return this.jobSvc.jobs().filter(j => {
      if (j.status !== col) return false;
      if (this.filterStars() > 0 && j.excitement !== this.filterStars()) return false;
      if (this.search) {
        const q = this.search.toLowerCase();
        return j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) || false;
      }
      return true;
    });
  }

  async ngOnInit() { await this.jobSvc.loadJobs(); }

  openDetail(job: Job) { this.selectedJob.set(job); this.editNotes = job.notes || ""; }
  closeAddModal() { this.showAddModal.set(false); this.resetForm(); }

  quickAdd(col: JobStatus) {
    this.form.status = col;
    this.showAddModal.set(true);
  }

  resetForm() {
    this.form = { company:"", role:"", status:"applied", location:"", salary_min:null, salary_max:null, currency:"USD", url:"", notes:"", excitement:3 };
  }

  async addJob() {
    if (!this.form.company || !this.form.role) return;
    this.saving.set(true);
    await this.jobSvc.addJob({ ...this.form, applied_at: this.form.status !== "wishlist" ? new Date().toISOString() : undefined });
    this.closeAddModal();
    this.saving.set(false);
  }

  async moveJob(id: string, status: JobStatus) {
    await this.jobSvc.updateStatus(id, status);
    this.selectedJob.update(j => j ? { ...j, status } : j);
  }

  async deleteJob(id: string) {
    if (!confirm("Delete this application?")) return;
    await this.jobSvc.deleteJob(id);
  }

  async setExcitement(job: Job, n: number) {
    await this.jobSvc.updateJob(job.id, { excitement: n });
    this.selectedJob.update(j => j?.id === job.id ? { ...j, excitement: n } : j);
  }

  async saveNotes() {
    const job = this.selectedJob(); if (!job) return;
    if (this.editNotes === job.notes) return;
    await this.jobSvc.updateJob(job.id, { notes: this.editNotes });
    this.selectedJob.update(j => j ? { ...j, notes: this.editNotes } : j);
  }

  goToAgent(job: Job, tab: 'resume'|'cover'|'interview'|'salary') {
    this.router.navigate(["/ai-agent"], { queryParams: {
      company: job.company,
      role: job.role,
      location: job.location || "",
      notes: (job.notes || "").slice(0, 500),
      url: job.url || "",
      tab,
    }});
  }

  async onDrop(e: DragEvent, col: JobStatus) {
    e.preventDefault(); this.dragOver.set(null);
    const job = this.dragJob(); if (!job || job.status === col) return;
    await this.jobSvc.updateStatus(job.id, col);
    this.dragJob.set(null);
  }
}
