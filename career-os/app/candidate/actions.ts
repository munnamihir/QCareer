"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { extractCandidateProfile } from "@/lib/candidate/extract";

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return {
    supabase,
    user,
  };
}

export async function analyzeResume(
  formData: FormData,
) {
  const resumeText =
    formData.get("resumeText")?.toString().trim() ?? "";

  if (resumeText.length < 100) {
    throw new Error(
      "Resume text is too short. Paste your complete resume.",
    );
  }

  const { supabase, user } =
    await getAuthenticatedUser();

  const extracted =
    extractCandidateProfile(resumeText);

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("candidate_profiles")
    .upsert(
      {
        user_id: user.id,

        full_name: extracted.fullName || null,

        professional_headline:
          extracted.professionalHeadline,

        current_title:
          extracted.currentTitle || null,

        current_company:
          extracted.currentCompany || null,

        seniority: extracted.seniority,

        profile_status: "review",
      },
      {
        onConflict: "user_id",
      },
    )
    .select("id")
    .single();

  if (profileError || !profile) {
    throw new Error(
      profileError?.message ??
        "Could not create candidate profile.",
    );
  }

  const profileId = profile.id;

  // -------------------------
  // MASTER RESUME VERSIONING
  // -------------------------

  await supabase
    .from("resumes")
    .update({
      is_master: false,
    })
    .eq("candidate_profile_id", profileId);

  const { data: previousResumes } =
    await supabase
      .from("resumes")
      .select("version")
      .eq("candidate_profile_id", profileId)
      .order("version", {
        ascending: false,
      })
      .limit(1);

  const nextVersion =
    (previousResumes?.[0]?.version ?? 0) + 1;

  const { error: resumeError } =
    await supabase.from("resumes").insert({
      candidate_profile_id: profileId,

      name: "Master Resume",

      version: nextVersion,

      resume_text: resumeText,

      source_filename: "pasted-resume",

      is_master: true,
    });

  if (resumeError) {
    throw new Error(resumeError.message);
  }

  // -------------------------
  // REBUILD DETECTED SKILLS
  // -------------------------

  await supabase
    .from("candidate_skills")
    .delete()
    .eq("candidate_profile_id", profileId);

  if (extracted.skills.length > 0) {
    const { error } = await supabase
      .from("candidate_skills")
      .insert(
        extracted.skills.map((skill) => ({
          candidate_profile_id: profileId,
          skill_name: skill,
          category: "Detected",
          is_core: true,
          evidence:
            "Detected in master resume.",
        })),
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  // -------------------------
  // REBUILD TARGET ROLES
  // -------------------------

  await supabase
    .from("target_roles")
    .delete()
    .eq("candidate_profile_id", profileId);

  if (extracted.targetRoles.length > 0) {
    const { error } = await supabase
      .from("target_roles")
      .insert(
        extracted.targetRoles.map(
          (title, index) => ({
            candidate_profile_id: profileId,
            title,
            priority: index + 1,
            is_active: true,
          }),
        ),
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  // -------------------------
  // REBUILD ACHIEVEMENTS
  // -------------------------

  await supabase
    .from("candidate_achievements")
    .delete()
    .eq("candidate_profile_id", profileId);

  if (extracted.achievements.length > 0) {
    const { error } = await supabase
      .from("candidate_achievements")
      .insert(
        extracted.achievements.map(
          (achievement, index) => ({
            candidate_profile_id: profileId,
            achievement_text: achievement,
            impact_score: 100 - index * 10,
          }),
        ),
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/candidate");
  revalidatePath("/dashboard");

  redirect("/candidate");
}

export async function approveCandidateProfile(
  formData: FormData,
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const fullName =
    formData.get("fullName")?.toString().trim() ?? "";

  const currentTitle =
    formData
      .get("currentTitle")
      ?.toString()
      .trim() ?? "";

  const currentCompany =
    formData
      .get("currentCompany")
      ?.toString()
      .trim() ?? "";

  const professionalHeadline =
    formData
      .get("professionalHeadline")
      ?.toString()
      .trim() ?? "";

  const seniority =
    formData.get("seniority")?.toString().trim() ??
    "";

  const location =
    formData.get("location")?.toString().trim() ??
    "";

  const targetRolesRaw =
    formData
      .get("targetRoles")
      ?.toString()
      .trim() ?? "";

  const {
    data: profile,
    error: lookupError,
  } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (lookupError || !profile) {
    throw new Error(
      "Candidate profile could not be found.",
    );
  }

  const { error: updateError } =
    await supabase
      .from("candidate_profiles")
      .update({
        full_name: fullName || null,

        current_title:
          currentTitle || null,

        current_company:
          currentCompany || null,

        professional_headline:
          professionalHeadline || null,

        seniority: seniority || null,

        location: location || null,

        profile_status: "approved",

        approved_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const targetRoles = targetRolesRaw
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  if (targetRoles.length > 0) {
    await supabase
      .from("target_roles")
      .delete()
      .eq(
        "candidate_profile_id",
        profile.id,
      );

    const { error } = await supabase
      .from("target_roles")
      .insert(
        targetRoles.map((title, index) => ({
          candidate_profile_id: profile.id,

          title,

          priority: index + 1,

          is_active: true,
        })),
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/candidate");
  revalidatePath("/dashboard");

  redirect("/dashboard");
}
