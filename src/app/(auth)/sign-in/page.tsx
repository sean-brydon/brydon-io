import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "sign in",
};

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (session) redirect("/dashboard");

  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
