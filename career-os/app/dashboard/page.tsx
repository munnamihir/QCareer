import { Suspense } from "react";

import DashboardContent from "./dashboard-content";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
          <p className="text-zinc-500">
            Loading Career OS...
          </p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
