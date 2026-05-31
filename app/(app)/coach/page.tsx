import { auth } from "@/lib/auth";
import { ChatWindow } from "@/components/chat-window";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function CoachPage({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;
  const firstName = (session?.user?.name ?? "Athlete").split(/\s+/)[0] || "Athlete";
  const initialQuery = params.q?.trim() ?? "";

  return <ChatWindow athleteFirstName={firstName} initialQuery={initialQuery} />;
}
