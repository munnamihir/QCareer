export type JobStatus = 'wishlist'|'applied'|'screening'|'interview'|'offer'|'rejected';
export type UserPlan = 'free'|'pro';
export type UserRole = 'seeker'|'recruiter'|'admin';
export type RemoteType = 'remote'|'hybrid'|'onsite';
export type JobType = 'full_time'|'part_time'|'contract'|'internship'|'freelance';
export type ExperienceLevel = 'intern'|'entry'|'mid'|'senior'|'lead'|'director'|'vp'|'c_level';
export type ListingStatus = 'draft'|'active'|'closed'|'expired';

export interface User {
  id:string; email:string; full_name?:string; github_username?:string; github_avatar?:string;
  plan:UserPlan; role:UserRole; jobs_count:number;
  company_name?:string; company_website?:string; headline?:string; created_at:string;
}

export interface Job {
  id:string; user_id:string; company:string; role:string; status:JobStatus;
  salary_min?:number; salary_max?:number; currency:string; location?:string;
  url?:string; notes?:string; excitement:number; applied_at?:string; created_at:string;
}

export interface JobListing {
  id:string; recruiter_id:string;
  title:string; company:string; company_logo_url?:string;
  location:string; remote_type:RemoteType; apply_url?:string; apply_email?:string;
  salary_min?:number; salary_max?:number; currency:string;
  equity_min?:number; equity_max?:number;
  description:string; requirements?:string; benefits?:string;
  job_type:JobType; experience_level:ExperienceLevel;
  skills:string[]; status:ListingStatus;
  views:number; applications_count:number; featured:boolean;
  created_at:string; updated_at:string; expires_at:string;
  // joined
  recruiter?: Partial<User>;
}

export const STATUS_META: Record<JobStatus,{label:string;icon:string;color:string;cls:string}> = {
  wishlist:  { label:'Wishlist',  icon:'🔮', color:'#818cf8', cls:'s-wishlist' },
  applied:   { label:'Applied',   icon:'📤', color:'#38bdf8', cls:'s-applied' },
  screening: { label:'Screening', icon:'📞', color:'#f59e0b', cls:'s-screening' },
  interview: { label:'Interview', icon:'🎯', color:'#a78bfa', cls:'s-interview' },
  offer:     { label:'Offer',     icon:'🎉', color:'#10b981', cls:'s-offer' },
  rejected:  { label:'Rejected',  icon:'❌', color:'#f43f5e', cls:'s-rejected' },
};

export const JOB_TYPE_LABELS: Record<JobType,string> = {
  full_time:'Full-time', part_time:'Part-time', contract:'Contract',
  internship:'Internship', freelance:'Freelance'
};
export const EXP_LABELS: Record<ExperienceLevel,string> = {
  intern:'Intern', entry:'Entry', mid:'Mid-level', senior:'Senior',
  lead:'Lead', director:'Director', vp:'VP', c_level:'C-Level'
};
export const REMOTE_LABELS: Record<RemoteType,string> = {
  remote:'Remote', hybrid:'Hybrid', onsite:'On-site'
};
