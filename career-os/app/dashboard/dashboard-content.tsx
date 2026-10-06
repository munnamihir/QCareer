import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { CareerSidebar } from "@/components/career/sidebar";

export default async function DashboardContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select(
      `
      id,
      full_name,
      professional_headline,
      current_title,
      seniority,
      profile_status
      `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const approved =
    profile?.profile_status === "approved";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex">
        <CareerSidebar
          radarUnlocked={approved}
        />

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">
                  COMMAND CENTER
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  Career intelligence starts here.
                </h1>
              </div>

              <div className="rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-400">
                Phase 1
              </div>
            </header>

            {!profile && (
              <EmptyCandidate />
            )}

            {profile &&
              profile.profile_status !==
                "approved" && (
                <ReviewRequired
                  name={
                    profile.full_name ??
                    "Candidate"
                  }
                />
              )}

            {approved && profile && (
              <ApprovedDashboard
                profile={profile}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function EmptyCandidate() {
  return (
    <section className="mt-12 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8">
      <p className="text-sm font-medium text-indigo-400">
        CANDIDATE BRAIN
      </p>

      <h2 className="mt-4 text-2xl font-semibold">
        Build your career profile.
      </h2>

      <p className="mt-3 max-w-2xl text-zinc-400">
        Career OS needs to understand what
        you&apos;ve actually done before it starts
        searching the market.
      </p>

      <div className="mt-8">
        <Link
          href="/candidate"
          className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Build Candidate Profile →
        </Link>
      </div>
    </section>
  );
}

function ReviewRequired({
  name,
}: {
  name: string;
}) {
  return (
    <section className="mt-12 rounded-3xl border border-amber-900/40 bg-amber-950/10 p-8">
      <p className="text-sm font-medium text-amber-400">
        REVIEW REQUIRED
      </p>

      <h2 className="mt-4 text-2xl font-semibold">
        Candidate Brain analyzed your resume.
      </h2>

      <p className="mt-3 text-zinc-400">
        {name}, verify the extracted profile
        before Radar is allowed to search for
        jobs.
      </p>

      <Link
        href="/candidate"
        className="mt-8 inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-black"
      >
        Review Profile →
      </Link>
    </section>
  );
}

type ApprovedProfile = {
  full_name: string | null;
  professional_headline: string | null;
  current_title: string | null;
  seniority: string | null;
  profile_status: string;
};

function ApprovedDashboard({
  profile,
}: {
  profile: ApprovedProfile;
}) {
  return (
    <>
      <section className="mt-10 grid gap-4 md:grid-cols-4">
        <Metric
          label="New jobs"
          value="—"
        />

        <Metric
          label="Strong matches"
          value="—"
        />

        <Metric
          label="Act today"
          value="—"
        />

        <Metric
          label="Applications"
          value="0"
        />
      </section>

      <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-400">
                PROFILE APPROVED
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-semibold">
              {profile.full_name ??
                "Candidate"}
            </h2>

            <p className="mt-2 text-zinc-300">
              {profile.current_title ??
                profile.seniority ??
                "Software Professional"}
            </p>

            {profile.professional_headline && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                {
                  profile.professional_headline
                }
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Link
              href="/candidate"
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium"
            >
              View Profile
            </Link>

            <Link
              href="/radar"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Launch Radar →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold">
        {value}
      </p>
    </div>
  );
}
