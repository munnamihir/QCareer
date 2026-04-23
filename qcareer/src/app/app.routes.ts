import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },
  // Recruiter routes (no auth guard — self-serve signup)
  { path: 'recruiter', loadComponent: () => import('./features/recruiter/signup/recruiter-signup.component').then(m => m.RecruiterSignupComponent) },
  { path: 'recruiter/signup', loadComponent: () => import('./features/recruiter/signup/recruiter-signup.component').then(m => m.RecruiterSignupComponent) },
  { path: 'recruiter/dashboard', loadComponent: () => import('./features/recruiter/dashboard/recruiter-dashboard.component').then(m => m.RecruiterDashboardComponent), canActivate: [authGuard] },
  { path: 'recruiter/post', loadComponent: () => import('./features/recruiter/post-job/post-job.component').then(m => m.PostJobComponent), canActivate: [authGuard] },
  // Job seeker shell
  { path: '', loadComponent: () => import('./shared/layout/shell/shell.component').then(m => m.ShellComponent), canActivate: [authGuard],
    children: [
      { path: 'dashboard',  loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'jobs',       loadComponent: () => import('./features/job-search/job-search.component').then(m => m.JobSearchComponent) },
      { path: 'tracker',    loadComponent: () => import('./features/kanban/kanban.component').then(m => m.KanbanComponent) },
      { path: 'ai-agent',   loadComponent: () => import('./features/ai-agent/ai-agent.component').then(m => m.AiAgentComponent) },
      { path: 'analytics',  loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent) },
      { path: 'settings',   loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
