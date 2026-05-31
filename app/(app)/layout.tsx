import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.accessToken) redirect("/signin");

  return (
    <div
      className="min-h-[100dvh]"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}
    >
      <main className="px-5 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
