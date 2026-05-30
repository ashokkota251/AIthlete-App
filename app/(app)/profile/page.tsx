import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/components/sign-out-button";
import { formatKm, formatDuration } from "@/lib/format";
import { Settings, Bell, Ruler, Shield, ChevronRight, Link2 } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  const provider = getStravaProvider({ accessToken: session!.accessToken! });
  const athleteId = session!.stravaAthleteId!;
  const [athlete, activities] = await Promise.all([
    provider.getAthleteProfile(athleteId),
    provider.getRecentActivities(athleteId, 15),
  ]);

  const totalKm = activities.reduce((s, a) => s + a.distance / 1000, 0);
  const totalSec = activities.reduce((s, a) => s + a.movingTime, 0);
  const totalElev = activities.reduce((s, a) => s + a.totalElevationGain, 0);
  const initials = `${athlete.firstName[0] ?? ""}${athlete.lastName[0] ?? ""}`;
  const joined = athlete.joinedAt ? new Date(athlete.joinedAt).getFullYear() : "—";

  return (
    <div className="space-y-5 pb-2">
      {/* Profile hero */}
      <section className="rise flex flex-col items-center text-center pt-2 pb-1">
        <Avatar src={athlete.avatarUrl} initials={initials} size={88} ring />
        <h1 className="mt-4 font-display-wide text-2xl text-ink-900 leading-none">
          {athlete.firstName} {athlete.lastName}
        </h1>
        <div className="mt-1.5 text-[12px] text-ink-500 flex items-center gap-1.5 nums">
          <span>@{athlete.username}</span>
          <span className="text-ink-300">·</span>
          <span>Athlete since {joined}</span>
        </div>
      </section>

      {/* Lifetime-from-fetched-window stats */}
      <section className="rise delay-1">
        <div className="eyebrow mb-2 px-1">From your last {activities.length} activities</div>
        <Card className="!p-0 overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-ink-100">
            <Block value={formatKm(totalKm * 1000, 1).replace(" km", "")} unit="km" label="Distance" />
            <Block value={formatDuration(totalSec)} label="Moving" />
            <Block value={`${Math.round(totalElev)}m`} label="Elevation" />
          </div>
        </Card>
      </section>

      {/* Settings list */}
      <section className="rise delay-2 space-y-1.5">
        <div className="eyebrow mb-2 px-1">Settings</div>
        <SettingRow Icon={Ruler} label="Units" value="Kilometres" />
        <SettingRow Icon={Bell} label="Notifications" value="On" />
        <SettingRow Icon={Settings} label="Coach preferences" value="Endurance" />
        <SettingRow Icon={Shield} label="Privacy" value="Default" />
      </section>

      {/* Strava connection */}
      <section className="rise delay-3 space-y-1.5">
        <div className="eyebrow mb-2 px-1">Connections</div>
        <div className="card !p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="size-9 rounded-xl bg-strava grid place-items-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden>
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
            </span>
            <div className="leading-tight">
              <div className="text-sm font-medium text-ink-900">Strava</div>
              <div className="text-[11px] text-ink-400">
                Connected as @{athlete.username}
              </div>
            </div>
          </div>
          <button className="text-[12px] text-coral-700 hover:text-coral font-medium flex items-center gap-1">
            <Link2 size={13} />
            Disconnect
          </button>
        </div>
      </section>

      <section className="rise delay-4">
        <SignOutButton />
      </section>

      <footer className="rise delay-5 pt-4 pb-1 flex items-center justify-between text-[10px] text-ink-400">
        <span className="eyebrow !text-ink-400">Powered by Strava</span>
        <span className="nums">AIthlete · v0.1.0</span>
      </footer>
    </div>
  );
}

function Block({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="p-4 text-center">
      <div className="flex items-baseline justify-center gap-0.5 nums">
        <span className="font-display-compressed text-2xl text-ink-900 leading-none">{value}</span>
        {unit && <span className="text-[11px] text-ink-400 ml-0.5">{unit}</span>}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-widest font-semibold text-ink-400">
        {label}
      </div>
    </div>
  );
}

function SettingRow({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <button className="w-full card !p-4 flex items-center justify-between hover:shadow-elev transition-shadow">
      <div className="flex items-center gap-3">
        <span className="size-9 rounded-xl bg-coral-50 grid place-items-center">
          <Icon size={15} className="text-coral" />
        </span>
        <span className="text-sm font-medium text-ink-900">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[12px] text-ink-500">
        <span>{value}</span>
        <ChevronRight size={14} className="text-ink-300" />
      </div>
    </button>
  );
}
