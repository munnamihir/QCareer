import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

export interface JobListing {
  id: string;
  recruiter_id: string;
  title: string;
  company_name: string;
  company_logo_url?: string;
  location: string;
  remote_type: 'remote'|'hybrid'|'onsite';
  job_type: 'full_time'|'part_time'|'contract'|'internship'|'freelance';
  salary_min?: number;
  salary_max?: number;
  currency: string;
  equity_min?: number;
  equity_max?: number;
  description: string;
  requirements?: string;
  benefits?: string;
  skills: string[];
  experience_level: 'intern'|'junior'|'mid'|'senior'|'lead'|'executive';
  apply_url?: string;
  apply_email?: string;
  status: 'active'|'paused'|'closed';
  source: 'qcareer'|'scraped'|'rss';
  views: number;
  applications_count: number;
  featured: boolean;
  created_at: string;
  expires_at?: string;
}

export interface Recruiter {
  id: string;
  email: string;
  full_name?: string;
  company_name: string;
  company_website?: string;
  company_size?: string;
  company_logo_url?: string;
  company_description?: string;
  linkedin_url?: string;
  verified: boolean;
  plan: string;
  jobs_posted: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class JobListingsService {
  private auth = inject(AuthService);

  listings = signal<JobListing[]>([]);
  myListings = signal<JobListing[]>([]);
  recruiter = signal<Recruiter|null>(null);
  loading = signal(false);

  get sb() { return this.auth.client; }

  // ── Public job search ──────────────────────────────────
  async searchJobs(query: string, filters: any = {}): Promise<JobListing[]> {
    let q = this.sb.from('job_listings')
      .select('*')
      .eq('status', 'active')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (query) {
      q = q.or(`title.ilike.%${query}%,company_name.ilike.%${query}%,description.ilike.%${query}%,skills.cs.{${query}}`);
    }
    if (filters.remote_type) q = q.eq('remote_type', filters.remote_type);
    if (filters.job_type) q = q.eq('job_type', filters.job_type);
    if (filters.experience_level) q = q.eq('experience_level', filters.experience_level);
    if (filters.salary_min) q = q.gte('salary_min', filters.salary_min);

    const { data } = await q.limit(50);
    return (data ?? []) as JobListing[];
  }

  async getJob(id: string): Promise<JobListing|null> {
    const { data } = await this.sb.from('job_listings').select('*').eq('id', id).single();
    if (data) await this.sb.rpc('increment_job_views', { p_job_id: id });
    return data as JobListing|null;
  }

  // ── Applications ───────────────────────────────────────
  async applyToJob(jobId: string, coverLetter: string): Promise<boolean> {
    const { data: { user } } = await this.sb.auth.getUser(); if (!user) return false;
    const { error } = await this.sb.from('job_applications').insert({
      job_id: jobId, applicant_id: user.id, cover_letter: coverLetter, status: 'applied'
    });
    if (!error) {
      await this.sb.rpc('increment_job_applications', { p_job_id: jobId });
      return true;
    }
    return false;
  }

  async hasApplied(jobId: string): Promise<boolean> {
    const { data: { user } } = await this.sb.auth.getUser(); if (!user) return false;
    const { data } = await this.sb.from('job_applications').select('id').eq('job_id', jobId).eq('applicant_id', user.id).single();
    return !!data;
  }

  async myApplications() {
    const { data: { user } } = await this.sb.auth.getUser(); if (!user) return [];
    const { data } = await this.sb.from('job_applications').select('*, job_listings(*)').eq('applicant_id', user.id).order('created_at', { ascending: false });
    return data ?? [];
  }

  // ── Recruiter ─────────────────────────────────────────
  async loadRecruiter(): Promise<Recruiter|null> {
    const { data: { user } } = await this.sb.auth.getUser(); if (!user) return null;
    const { data } = await this.sb.from('recruiters').select('*').eq('id', user.id).single();
    this.recruiter.set(data as Recruiter);
    return data as Recruiter;
  }

  async createRecruiter(profile: Partial<Recruiter>): Promise<boolean> {
    const { data: { user } } = await this.sb.auth.getUser(); if (!user) return false;
    const { error } = await this.sb.from('recruiters').upsert({ id: user.id, email: user.email!, ...profile });
    if (!error) { await this.loadRecruiter(); return true; }
    return false;
  }

  async updateRecruiter(updates: Partial<Recruiter>): Promise<void> {
    const { data: { user } } = await this.sb.auth.getUser(); if (!user) return;
    await this.sb.from('recruiters').update(updates).eq('id', user.id);
    this.recruiter.update(r => r ? { ...r, ...updates } : r);
  }

  async loadMyListings(): Promise<void> {
    const { data: { user } } = await this.sb.auth.getUser(); if (!user) return;
    const { data } = await this.sb.from('job_listings').select('*').eq('recruiter_id', user.id).order('created_at', { ascending: false });
    this.myListings.set((data ?? []) as JobListing[]);
  }

  async postJob(job: Partial<JobListing>): Promise<string|null> {
    const { data: { user } } = await this.sb.auth.getUser(); if (!user) return null;
    const rec = this.recruiter();
    const { data, error } = await this.sb.from('job_listings').insert({
      ...job,
      recruiter_id: user.id,
      company_name: job.company_name || rec?.company_name || '',
      company_logo_url: job.company_logo_url || rec?.company_logo_url,
      source: 'qcareer',
      skills: job.skills || [],
      currency: job.currency || 'USD',
      status: 'active',
    }).select().single();
    if (!error && data) {
      await this.sb.from('recruiters').update({ jobs_posted: (rec?.jobs_posted ?? 0) + 1 }).eq('id', user.id);
      this.myListings.update(l => [data as JobListing, ...l]);
      return (data as any).id;
    }
    return null;
  }

  async updateJobStatus(id: string, status: 'active'|'paused'|'closed'): Promise<void> {
    await this.sb.from('job_listings').update({ status }).eq('id', id);
    this.myListings.update(l => l.map(j => j.id === id ? { ...j, status } : j));
  }

  async deleteJob(id: string): Promise<void> {
    await this.sb.from('job_listings').delete().eq('id', id);
    this.myListings.update(l => l.filter(j => j.id !== id));
  }

  async getJobApplications(jobId: string) {
    const { data } = await this.sb.from('job_applications').select('*, users(email, github_username, github_avatar)').eq('job_id', jobId).order('created_at', { ascending: false });
    return data ?? [];
  }

  async updateApplicationStatus(appId: string, status: string): Promise<void> {
    await this.sb.from('job_applications').update({ status }).eq('id', appId);
  }
}
