import { auth } from "@/lib/auth";
import { getStravaProvider } from "@/lib/strava";
import { ChatWindow } from "@/components/chat-window";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const session = await auth();
  const provider = getStravaProvider({ accessToken: session!.accessToken! });
  const athlete = await provider.getAthleteProfile(session!.stravaAthleteId!);
  return <ChatWindow athleteFirstName={athlete.firstName} />;
}
