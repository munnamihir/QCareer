import { Injectable, signal } from '@angular/core';

export interface AgentContext {
  company: string;
  role: string;
  location?: string;
  notes?: string;      
  url?: string;
  tab: 'resume' | 'cover' | 'interview' | 'salary';
}

@Injectable({ providedIn: 'root' })
export class AgentContextService {
  private _ctx = signal<AgentContext | null>(null);
  readonly ctx = this._ctx.asReadonly();

  set(ctx: AgentContext) { this._ctx.set(ctx); }
  clear() { this._ctx.set(null); }
}
