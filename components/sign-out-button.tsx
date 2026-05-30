import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction} className="contents">
      <button
        type="submit"
        className="w-full flex items-center justify-between p-4 rounded-card border border-ink-100 text-ink-700 hover:border-coral-200 hover:text-coral transition-colors"
        style={{ cursor: "pointer" }}
      >
        <span className="flex items-center gap-3">
          <LogOut size={16} />
          <span className="font-medium text-sm">Sign out</span>
        </span>
        <span className="text-[11px] text-ink-400">end session</span>
      </button>
    </form>
  );
}
