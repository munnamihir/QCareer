import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({ selector:'app-home', standalone:true, imports:[RouterLink], template:`
<div style="min-height:100vh;position:relative;z-index:1;">
  <nav style="position:fixed;top:0;left:0;right:0;z-index:100;padding:1rem 2.5rem;display:flex;align-items:center;justify-content:space-between;background:rgba(3,8,16,0.92);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12);">
    <div style="font-family:'Orbitron',sans-serif;font-weight:900;font-size:1.1rem;"><span style="color:#6366f1;">Q</span><span style="color:#e2e8f0;">Career</span><span style="font-size:0.52rem;letter-spacing:2px;color:#64748b;margin-left:8px;font-family:'JetBrains Mono',monospace;text-transform:uppercase;">AI JOB HUNT</span></div>
    <div style="display:flex;gap:.75rem;align-items:center;">
      <a routerLink="/login" style="font-size:0.75rem;color:#64748b;text-decoration:none;padding:.5rem 1rem;">Sign in</a>
      <a routerLink="/login" class="btn btn-primary" style="font-size:0.75rem;">Get started free</a>
    </div>
  </nav>
  <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6rem 2rem 4rem;text-align:center;position:relative;">
    <canvas id="hero-canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;"></canvas>
    <div style="position:relative;z-index:1;max-width:900px;">
      <div style="display:inline-flex;align-items:center;gap:.5rem;font-size:0.62rem;letter-spacing:2px;text-transform:uppercase;color:#6366f1;border:1px solid rgba(99,102,241,0.25);padding:.35rem 1rem;border-radius:50px;background:rgba(99,102,241,0.06);margin-bottom:2rem;font-family:'JetBrains Mono',monospace;">
        <span style="width:6px;height:6px;border-radius:50%;background:#10b981;animation:pulse 1.5s infinite;display:inline-block;flex-shrink:0;"></span>
        Claude AI · 6 tools · Kanban · Analytics
      </div>
      <h1 style="font-family:'Orbitron',sans-serif;font-weight:900;font-size:clamp(2rem,6vw,4.2rem);color:#fff;line-height:1.05;margin-bottom:1.5rem;">
        Land your dream job<br><span style="color:#6366f1;">at quantum speed</span>
      </h1>
      <p style="font-size:0.95rem;color:#64748b;max-width:560px;margin:0 auto 0.75rem;line-height:1.9;">Track every application. Let Claude tailor your resume, write cover letters, run mock interviews, and coach your salary negotiation.</p>
      <p style="font-size:0.68rem;color:rgba(99,102,241,0.45);margin-bottom:3rem;font-family:'JetBrains Mono',monospace;">AI runs directly in your browser · your code stays yours</p>
      <div style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;margin-bottom:4rem;">
        <a routerLink="/login" class="btn btn-primary" style="font-size:0.85rem;padding:.8rem 2.25rem;">Start hunting free →</a>
        <a routerLink="/tracker" class="btn btn-outline" style="font-size:0.85rem;padding:.8rem 2.25rem;">View Kanban demo</a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;">
        @for (f of features; track f.title) {
          <div style="background:rgba(7,9,26,0.85);border:1px solid rgba(99,102,241,0.1);border-radius:12px;padding:1.25rem;text-align:left;transition:border-color 0.2s,transform 0.2s;" onmouseover="this.style.borderColor='rgba(99,102,241,0.35)';this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='rgba(99,102,241,0.1)';this.style.transform='none'">
            <div style="font-size:1.5rem;margin-bottom:.6rem;">{{ f.icon }}</div>
            <div style="font-size:0.78rem;font-weight:600;color:#e2e8f0;margin-bottom:.3rem;">{{ f.title }}</div>
            <div style="font-size:0.67rem;color:#64748b;line-height:1.7;">{{ f.desc }}</div>
          </div>
        }
      </div>
    </div>
  </div>
  <footer style="text-align:center;padding:2rem;border-top:1px solid rgba(99,102,241,0.08);font-size:0.62rem;color:#475569;font-family:'JetBrains Mono',monospace;">QCareer · Built with Claude AI · Accelerate your career</footer>
</div>
<style>@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.2;}}</style>
` })
export class HomeComponent {
  features = [
    { icon:"\uD83D\uDDC2\uFE0F", title:"Kanban Job Tracker", desc:"Drag cards across Wishlist, Applied, Interview, Offer. Never lose track of an application." },
    { icon:"\uD83D\uDCDD", title:"AI Resume Tailor", desc:"Paste a job description + your resume. Claude rewrites your bullets to match the role perfectly." },
    { icon:"\u2709\uFE0F", title:"Cover Letter Generator", desc:"Company-specific, role-specific, tone-specific. Claude writes it in seconds." },
    { icon:"\uD83C\uDFA4", title:"Mock Interview Prep", desc:"Claude plays interviewer. Real questions, real feedback before the real thing." },
    { icon:"\uD83D\uDCB0", title:"Salary Negotiation Coach", desc:"Know your worth. Claude analyzes market rates and scripts your counter-offer." },
    { icon:"\uD83D\uDCCA", title:"Application Analytics", desc:"Funnel visualization, response rates, excitement scores. Data-driven job hunting." },
  ];
  ngAfterViewInit() {
    const c = document.getElementById("hero-canvas") as HTMLCanvasElement; if (!c) return;
    const ctx = c.getContext("2d")!; let W=0,H=0;
    const pts:any[] = Array.from({length:80},()=>({x:Math.random()*1920,y:Math.random()*900,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3}));
    const resize=()=>{W=c.width=c.offsetWidth;H=c.height=c.offsetHeight;}; resize(); window.addEventListener("resize",resize);
    const draw=()=>{ctx.clearRect(0,0,W,H); pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,1.5,0,Math.PI*2);ctx.fillStyle="rgba(99,102,241,0.5)";ctx.fill();}); for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<120){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle="rgba(99,102,241,"+(1-d/120)*.15+")";ctx.lineWidth=.5;ctx.stroke();}} requestAnimationFrame(draw);}; draw();
  }
}
