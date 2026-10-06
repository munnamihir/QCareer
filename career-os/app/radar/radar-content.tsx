import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { CareerSidebar } from "@/components/career/sidebar";

export default async function RadarContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("profile_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    profile?.profile_status !==
    "approved"
  ) {
    redirect("/candidate");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex">
        <CareerSidebar radarUnlocked />

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <p className="text-sm text-indigo-400">
              PHASE 02
            </p>

            <h1 className="mt-2 text-4xl font-semibold">
              Rocketship Radar
            </h1>

            <p className="mt-4 max-w-xl text-zinc-400">
              Your candidate profile is
              approved. Live opportunity
              discovery is the next system we
              build.
            </p>

            <div className="mt-10 rounded-3xl border border-dashed border-zinc-700 p-12 text-center">
              <p className="text-zinc-500">
                Radar engine not connected yet.
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                Next milestone: company signals
                + live jobs + freshness
                verification.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
