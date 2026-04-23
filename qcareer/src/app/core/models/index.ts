export type JobStatus = 'wishlist'|'applied'|'screening'|'interview'|'offer'|'rejected';
export type UserPlan = 'free'|'pro';
export interface User { id:string; email:string; full_name?:string; github_username?:string; github_avatar?:string; plan:UserPlan; jobs_count:number; created_at:string; }
export interface Job {
  id:string; user_id:string; company:string; role:string; status:JobStatus;
  salary_min?:number; salary_max?:number; currency:string; location?:string;
  url?:string; notes?:string; excitement:number; applied_at?:string; created_at:string;
}
export const STATUS_META: Record<JobStatus,{label:string;icon:string;color:string;cls:string}> = {
  wishlist:  { label:'Wishlist',  icon:'🔮', color:'#818cf8', cls:'s-wishlist' },
  applied:   { label:'Applied',   icon:'📤', color:'#38bdf8', cls:'s-applied' },
  screening: { label:'Screening', icon:'📞', color:'#f59e0b', cls:'s-screening' },
  interview: { label:'Interview', icon:'🎯', color:'#a78bfa', cls:'s-interview' },
  offer:     { label:'Offer',     icon:'🎉', color:'#10b981', cls:'s-offer' },
  rejected:  { label:'Rejected',  icon:'❌', color:'#f43f5e', cls:'s-rejected' },
};