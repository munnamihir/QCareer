import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sb = inject(SupabaseService).client;
  private router = inject(Router);
  private _session = signal<any>(null);
  private _dbUser = signal<User|null>(null);
  private _loading = signal(true);
  private _initialized = false;

  readonly session    = this._session.asReadonly();
  readonly dbUser     = this._dbUser.asReadonly();
  readonly loading    = this._loading.asReadonly();
  readonly isLoggedIn = computed(() => !!this._session());
  readonly plan       = computed(() => this._dbUser()?.plan ?? 'free');

  constructor() {
    this.sb.auth.getSession().then(({ data }) => {
      this._session.set(data.session);
      if (data.session) {
        this.loadUser(data.session.user.id);
      } else {
        this._loading.set(false);
      }
      this._initialized = true;
    });

    this.sb.auth.onAuthStateChange((_e, session) => {
      this._session.set(session);
      if (session) {
        this.loadUser(session.user.id).then(() => {
          // Navigate to dashboard after OAuth login
          const url = window.location.href;
          if (url.includes('access_token') || url.includes('code=')) {
            this.router.navigate(['/dashboard']);
          }
        });
      } else {
        this._dbUser.set(null);
        this._loading.set(false);
      }
    });
  }

  private async loadUser(id: string) {
    const { data } = await this.sb.from('users').select('*').eq('id', id).single();
    this._dbUser.set(data as User);
    this._loading.set(false);
  }

  async signInWithGitHub() {
    await this.sb.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    });
  }

  async signInWithEmail(email: string) {
    const { error } = await this.sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) throw error;
  }

  async signOut() {
    await this.sb.auth.signOut();
    this.router.navigate(['/']);
  }

  get client() { return this.sb; }
}
