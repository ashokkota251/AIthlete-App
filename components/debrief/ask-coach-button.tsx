import Link from "next/link";
import { MessageSquare } from "lucide-react";

interface Props {
  activityName: string;
  delay?: number;
}

export function AskCoachButton({ activityName, delay = 5 }: Props) {
  const q = encodeURIComponent(`Tell me more about my "${activityName}" — anything I should change?`);
  return (
    <Link href={`/coach?q=${q}`} className={`btn-ask reveal delay-${delay} mt-1`}>
      <MessageSquare size={17} strokeWidth={2} />
      Ask the coach about this ride
    </Link>
  );
}
