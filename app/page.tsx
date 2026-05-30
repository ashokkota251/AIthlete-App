import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootRedirect() {
  const session = await auth();
  redirect(session?.accessToken ? "/dashboard" : "/signin");
}
