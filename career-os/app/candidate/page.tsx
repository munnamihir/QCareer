import { Suspense } from "react";

import CandidatePageContent from "./candidate-page-content";

function CandidateLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />

          <p className="mt-4 text-sm text-zinc-500">
            Loading Candidate Brain...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CandidatePage() {
  return (
    <Suspense fallback={<CandidateLoading />}>
      <CandidatePageContent />
    </Suspense>
  );
}