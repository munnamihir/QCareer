import { Suspense } from "react";

import RadarContent from "./radar-content";

export default function RadarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
          <p className="text-zinc-500">
            Loading Radar...
          </p>
        </div>
      }
    >
      <RadarContent />
    </Suspense>
  );
}
