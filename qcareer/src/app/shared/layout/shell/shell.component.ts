
import { Component, inject } from "@angular/core";
import { RouterOutlet, RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
@Component({ selector:"app-shell", standalone:true, imports:[RouterOutlet,RouterLink,RouterLinkActive], template:`
<div style="display:flex;height:100vh;background:var(--bg);overflow:hidden;">
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="name"><span class="q">Q</span><span class="career">Career</span></div>
      <div class="tagline">AI Job Hunt</div>
    </div>
    <div class="nav-section">
      <div class="nav-section-label">Workspace</div>
      @for (item of nav; track item.href) {
        <a [routerLink]="item.href" routerLinkActive="active" class="nav-link">
          <span class="icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
          @if (item.badge) { <span class="nav-badge">{{ item.badge }}</span> }
        </a>
      }
    </div>
    <div style="flex:1;"></div>
    <div style="padding:1rem 1.25rem;border-top:1px solid var(--border);">
      @if (dbUser()?.github_avatar) {
        <img [src]="dbUser()!.github_avatar" style="width:32px;height:32px;border-radius:50%;border:2px solid rgba(99,102,241,0.3);margin-bottom:.5rem;display:block;">
      }
      <div style="font-size:0.68rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:.25rem;">{{ dbUser()?.github_username ?? dbUser()?.email }}</div>
      <span style="font-size:0.55rem;padding:2px 7px;border-radius:10px;background:rgba(99,102,241,0.1);color:#818cf8;border:1px solid rgba(99,102,241,0.2);text-transform:uppercase;letter-spacing:1px;font-family:'JetBrains Mono',monospace;">{{ plan() }}</span>
      <br><button (click)="signOut()" style="margin-top:.5rem;font-size:0.6rem;color:var(--muted);background:none;border:none;cursor:pointer;">sign out</button>
    </div>
  </aside>
  <main style="flex:1;overflow:hidden;display:flex;flex-direction:column;position:relative;z-index:1;">
    <router-outlet />
  </main>
</div>
` })
export class ShellComponent {
  private auth = inject(AuthService);
  dbUser = this.auth.dbUser; plan = this.auth.plan;
  nav = [
    { href:"/dashboard", label:"Dashboard",  icon:"▤",  badge:null },
    { href:"/tracker",   label:"Job Tracker", icon:"🗂️", badge:null },
    { href:"/ai-agent",  label:"AI Agent",    icon:"⬡",  badge:"6 tools" },
    { href:"/analytics", label:"Analytics",   icon:"📊", badge:null },
    { href:"/settings",  label:"Settings",    icon:"⚙",  badge:null },
  ];
  signOut() { this.auth.signOut(); }
}
