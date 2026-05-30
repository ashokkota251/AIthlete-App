"use server";

import { signIn, signOut } from "@/lib/auth";

export async function signInWithStrava() {
  await signIn("strava", { redirectTo: "/dashboard" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/signin" });
}
