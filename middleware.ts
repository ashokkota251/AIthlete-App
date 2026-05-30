import { auth } from "@/lib/auth";

export default auth;

export const config = {
  // Run on everything except static assets — the `authorized` callback decides the rest.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
