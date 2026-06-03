import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { MigrateLocalStorage } from "@/components/migrate-local-storage";
import { resolveAthleteId } from "@/lib/athlete-id";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.accessToken) redirect("/signin");
  const athleteId = resolveAthleteId(session.stravaAthleteId);

  return (
    <div
      className="min-h-[100dvh]"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}
    >
      <main className="px-5 pt-6 md:px-8 md:pt-10">
        <div className="page-shell">{children}</div>
      </main>
      <BottomNav />
      <MigrateLocalStorage athleteId={athleteId} />
    </div>
  );
}
