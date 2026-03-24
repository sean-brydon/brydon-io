import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "sign up",
};

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (session) redirect("/dashboard");

  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
