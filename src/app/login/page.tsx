import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "sign in",
};

/**
 * /login → /sign-in redirect.
 *
 * The canonical sign-in route is /sign-in. This page exists only to
 * redirect anyone who bookmarked or linked to /login.
 * Query params (e.g. ?callbackUrl=/dashboard) are preserved.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      qs.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    }
  }

  const query = qs.toString();
  redirect(`/sign-in${query ? `?${query}` : ""}`);
}
