import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { CareerSidebar } from "@/components/career/sidebar";

import {
  analyzeResume,
  approveCandidateProfile,
} from "./actions";

type CandidateProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  professional_headline: string | null;
  current_title: string | null;
  current_company: string | null;
  seniority: string | null;
  years_experience: number | null;
  location: string | null;
  target_locations: string[] | null;
  preferred_work_types: string[] | null;
  requires_sponsorship: boolean | null;
  profile_status: "draft" | "review" | "approved";
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export default async function CandidatePageContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  let skills: {
    id: string;
    skill_name: string;
  }[] = [];

  let roles: {
    id: string;
    title: string;
    priority: number;
  }[] = [];

  let achievements: {
    id: string;
    achievement_text: string;
  }[] = [];

  let masterResume:
    | {
        id: string;
        version: number;
        resume_text: string | null;
      }
    | null = null;

  if (profile) {
    const [
      skillsResult,
      rolesResult,
      achievementsResult,
      resumeResult,
    ] = await Promise.all([
      supabase
        .from("candidate_skills")
        .select("id, skill_name")
        .eq(
          "candidate_profile_id",
          profile.id,
        ),

      supabase
        .from("target_roles")
        .select("id, title, priority")
        .eq(
          "candidate_profile_id",
          profile.id,
        )
        .order("priority"),

      supabase
        .from("candidate_achievements")
        .select(
          "id, achievement_text",
        )
        .eq(
          "candidate_profile_id",
          profile.id,
        )
        .order("impact_score", {
          ascending: false,
        }),

      supabase
        .from("resumes")
        .select(
          "id, version, resume_text",
        )
        .eq(
          "candidate_profile_id",
          profile.id,
        )
        .eq("is_master", true)
        .maybeSingle(),
    ]);

    skills = skillsResult.data ?? [];
    roles = rolesResult.data ?? [];
    achievements =
      achievementsResult.data ?? [];

    masterResume =
      resumeResult.data ?? null;
  }

  const approved =
    profile?.profile_status === "approved";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex">
        <CareerSidebar
          radarUnlocked={approved}
        />

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
            <div>
              <p className="text-sm text-zinc-500">
                CANDIDATE BRAIN
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Your canonical career profile
              </h1>

              <p className="mt-3 max-w-2xl text-zinc-400">
                This profile becomes the source
                of truth for matching, resume
                tuning and outreach.
              </p>
            </div>

            {!profile && <ResumeInput />}

            {profile &&
              profile.profile_status !==
                "approved" && (
                <>
                  <Progress />

                  <ReviewForm
                    profile={profile}
                    skills={skills}
                    roles={roles}
                    achievements={
                      achievements
                    }
                  />
                </>
              )}

            {approved && profile && (
              <>
                <ApprovedProfile
                  profile={profile}
                  skills={skills}
                  roles={roles}
                  achievements={
                    achievements
                  }
                />

                <ResumeReplacement
                  currentResume={
                    masterResume?.resume_text ??
                    ""
                  }
                  version={
                    masterResume?.version ?? 0
                  }
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ResumeInput() {
  return (
    <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-7">
      <div>
        <p className="text-sm font-medium text-indigo-400">
          STEP 1 / 3
        </p>

        <h2 className="mt-3 text-2xl font-semibold">
          Add your master resume
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          For the first implementation, paste
          the resume text. PDF/DOCX upload comes
          immediately after the data flow is
          proven.
        </p>
      </div>

      <form
        action={analyzeResume}
        className="mt-6"
      >
        <label
          htmlFor="resumeText"
          className="text-sm font-medium text-zinc-300"
        >
          Resume text
        </label>

        <textarea
          id="resumeText"
          name="resumeText"
          required
          rows={22}
          placeholder="Paste your complete resume here..."
          className="mt-2 w-full resize-y rounded-2xl border border-zinc-800 bg-zinc-950 p-5 font-mono text-sm leading-6 text-zinc-300 outline-none transition focus:border-indigo-500"
        />

        <button
          type="submit"
          className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
        >
          Analyze Resume →
        </button>
      </form>
    </section>
  );
}

function Progress() {
  return (
    <div className="mt-8 grid grid-cols-3 gap-3">
      <ProgressItem
        title="Resume"
        complete
      />

      <ProgressItem
        title="Extraction"
        complete
      />

      <ProgressItem
        title="Approval"
        complete={false}
      />
    </div>
  );
}

function ProgressItem({
  title,
  complete,
}: {
  title: string;
  complete: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div
        className={`h-2 w-2 rounded-full ${
          complete
            ? "bg-emerald-400"
            : "bg-zinc-700"
        }`}
      />

      <p className="mt-3 text-sm text-zinc-300">
        {title}
      </p>
    </div>
  );
}

function ReviewForm({
  profile,
  skills,
  roles,
  achievements,
}: {
  profile: CandidateProfile;

  skills: {
    id: string;
    skill_name: string;
  }[];

  roles: {
    id: string;
    title: string;
    priority: number;
  }[];

  achievements: {
    id: string;
    achievement_text: string;
  }[];
}) {
  return (
    <form
      action={approveCandidateProfile}
      className="mt-6 space-y-6"
    >
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-amber-400">
              REVIEW REQUIRED
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Verify Candidate Brain
            </h2>
          </div>

          <span className="rounded-full border border-amber-800 px-3 py-1 text-xs text-amber-400">
            NOT APPROVED
          </span>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Field
            label="Full name"
            name="fullName"
            defaultValue={
              profile.full_name ?? ""
            }
          />

          <Field
            label="Current title"
            name="currentTitle"
            defaultValue={
              profile.current_title ?? ""
            }
          />

          <Field
            label="Current company"
            name="currentCompany"
            defaultValue={
              profile.current_company ?? ""
            }
          />

          <Field
            label="Seniority"
            name="seniority"
            defaultValue={
              profile.seniority ?? ""
            }
          />

          <Field
            label="Location"
            name="location"
            defaultValue={
              profile.location ?? ""
            }
          />

          <Field
            label="Target roles"
            name="targetRoles"
            defaultValue={roles
              .map((role) => role.title)
              .join(", ")}
          />
        </div>

        <div className="mt-5">
          <label className="text-sm text-zinc-400">
            Professional headline
          </label>

          <textarea
            name="professionalHeadline"
            rows={3}
            defaultValue={
              profile.professional_headline ??
              ""
            }
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-7">
        <p className="text-xs font-medium tracking-widest text-zinc-500">
          DETECTED SKILLS
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {skills.length === 0 && (
            <p className="text-sm text-zinc-500">
              No skills detected yet.
            </p>
          )}

          {skills.map((skill) => (
            <span
              key={skill.id}
              className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300"
            >
              {skill.skill_name}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-7">
        <p className="text-xs font-medium tracking-widest text-zinc-500">
          QUANTIFIED EVIDENCE
        </p>

        <div className="mt-5 space-y-4">
          {achievements.length === 0 && (
            <p className="text-sm text-zinc-500">
              Candidate Brain did not find a
              strongly quantified achievement.
            </p>
          )}

          {achievements.map(
            (achievement, index) => (
              <div
                key={achievement.id}
                className="flex gap-4 rounded-xl border border-zinc-800 p-4"
              >
                <span className="text-sm font-semibold text-indigo-400">
                  {String(index + 1).padStart(
                    2,
                    "0",
                  )}
                </span>

                <p className="text-sm leading-6 text-zinc-300">
                  {
                    achievement.achievement_text
                  }
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      <div className="flex items-center justify-between rounded-3xl border border-emerald-900/40 bg-emerald-950/10 p-6">
        <div>
          <p className="font-medium">
            Does this accurately represent you?
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Radar remains locked until you
            approve.
          </p>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black"
        >
          Approve Profile ✓
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="text-sm text-zinc-400">
        {label}
      </label>

      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
      />
    </div>
  );
}

function ApprovedProfile({
  profile,
  skills,
  roles,
  achievements,
}: {
  profile: CandidateProfile;

  skills: {
    id: string;
    skill_name: string;
  }[];

  roles: {
    id: string;
    title: string;
    priority: number;
  }[];

  achievements: {
    id: string;
    achievement_text: string;
  }[];
}) {
  return (
    <section className="mt-10 rounded-3xl border border-emerald-900/40 bg-zinc-900/40 p-8">
      <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-400">
        PROFILE APPROVED
      </span>

      <h2 className="mt-6 text-3xl font-semibold">
        {profile.full_name ||
          "Candidate"}
      </h2>

      <p className="mt-2 text-zinc-300">
        {profile.current_title ||
          profile.seniority}
      </p>

      {profile.current_company && (
        <p className="text-sm text-zinc-500">
          {profile.current_company}
        </p>
      )}

      <div className="mt-8">
        <p className="text-xs tracking-widest text-zinc-500">
          TARGET ROLES
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {roles.map((role) => (
            <span
              key={role.id}
              className="rounded-full border border-indigo-900 bg-indigo-950/40 px-3 py-1.5 text-sm text-indigo-300"
            >
              {role.title}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs tracking-widest text-zinc-500">
          CORE STACK
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="rounded-full border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300"
            >
              {skill.skill_name}
            </span>
          ))}
        </div>
      </div>

      {achievements.length > 0 && (
        <div className="mt-8">
          <p className="text-xs tracking-widest text-zinc-500">
            TOP EVIDENCE
          </p>

          <div className="mt-4 space-y-3">
            {achievements.map(
              (achievement, index) => (
                <div
                  key={achievement.id}
                  className="flex gap-3"
                >
                  <span className="text-sm text-indigo-400">
                    {String(index + 1).padStart(
                      2,
                      "0",
                    )}
                  </span>

                  <p className="text-sm text-zinc-300">
                    {
                      achievement.achievement_text
                    }
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ResumeReplacement({
  currentResume,
  version,
}: {
  currentResume: string;
  version: number;
}) {
  return (
    <details className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/30">
      <summary className="cursor-pointer p-5 text-sm font-medium text-zinc-300">
        Replace / re-analyze master resume
        {version > 0
          ? ` — Version ${version}`
          : ""}
      </summary>

      <form
        action={analyzeResume}
        className="border-t border-zinc-800 p-5"
      >
        <textarea
          name="resumeText"
          required
          rows={18}
          defaultValue={currentResume}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-300"
        />

        <button className="mt-4 rounded-xl border border-zinc-700 px-5 py-3 text-sm">
          Re-analyze Resume
        </button>
      </form>
    </details>
  );
}