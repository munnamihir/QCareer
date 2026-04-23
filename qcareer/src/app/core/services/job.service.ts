import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { Job, JobStatus } from '../models';
@Injectable({ providedIn: 'root' })
export class JobService {
  private auth = inject(AuthService);
  jobs = signal<Job[]>([]);
  loading = signal(false);
  async loadJobs() {
    this.loading.set(true);
    const { data: { user } } = await this.auth.client.auth.getUser(); if (!user) return;
    const { data } = await this.auth.client.from('jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    this.jobs.set((data ?? []) as Job[]);
    this.loading.set(false);
  }
  async addJob(job: Partial<Job>) {
    const { data: { user } } = await this.auth.client.auth.getUser(); if (!user) return;
    const { data } = await this.auth.client.from('jobs').insert({ ...job, user_id: user.id, currency: job.currency ?? 'USD', excitement: job.excitement ?? 3, created_at: new Date().toISOString() }).select().single();
    if (data) this.jobs.update(j => [data as Job, ...j]);
  }
  async updateStatus(id: string, status: JobStatus) {
    await this.auth.client.from('jobs').update({ status }).eq('id', id);
    this.jobs.update(js => js.map(j => j.id === id ? { ...j, status } : j));
  }
  async deleteJob(id: string) {
    await this.auth.client.from('jobs').delete().eq('id', id);
    this.jobs.update(j => j.filter(x => x.id !== id));
  }
  async updateJob(id: string, updates: Partial<Job>) {
    await this.auth.client.from('jobs').update(updates).eq('id', id);
    this.jobs.update(js => js.map(j => j.id === id ? { ...j, ...updates } : j));
  }
}