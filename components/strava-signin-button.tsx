import { signInWithStrava } from "@/lib/actions";

interface Props {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Form-driven Strava sign-in. The form's `action` is a server action that
 * calls NextAuth's server-side signIn — no client JS required.
 */
export function SignInButton({ children, className }: Props) {
  return (
    <form action={signInWithStrava} className="contents">
      <button type="submit" className={className} style={{ cursor: "pointer" }}>
        {children}
      </button>
    </form>
  );
}
