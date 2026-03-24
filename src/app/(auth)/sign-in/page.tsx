import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "sign in",
};

/**
 * /sign-in page — server wrapper that provides a Suspense boundary
 * for the client-side SignInForm (which uses useSearchParams).
 */
export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
