import Link from "next/link";

type SidebarProps = {
  radarUnlocked: boolean;
};

const lockedItems = [
  "Matches",
  "Network",
  "Pipeline",
  "Intelligence",
];

export function CareerSidebar({
  radarUnlocked,
}: SidebarProps) {
  return (
    <aside className="hidden min-h-screen w-64 border-r border-zinc-800 bg-zinc-950 lg:block">
      <div className="sticky top-0 p-6">
        <Link
          href="/dashboard"
          className="text-xl font-semibold tracking-tight text-white"
        >
          Career OS
        </Link>

        <p className="mt-1 text-xs text-zinc-500">
          Opportunity Intelligence
        </p>

        <nav className="mt-10 space-y-1">
          <NavItem
            href="/dashboard"
            label="Command Center"
          />

          <NavItem
            href="/candidate"
            label="Candidate"
          />

          <NavItem
            href={
              radarUnlocked
                ? "/radar"
                : "/candidate"
            }
            label="Radar"
            locked={!radarUnlocked}
          />

          {lockedItems.map((item) => (
            <NavItem
              key={item}
              href="/dashboard"
              label={item}
              locked
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  locked = false,
}: {
  href: string;
  label: string;
  locked?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
    >
      <span>{label}</span>

      {locked && (
        <span className="text-xs text-zinc-600">
          LOCKED
        </span>
      )}
    </Link>
  );
}
