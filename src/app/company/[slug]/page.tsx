import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { companies } from "@/db/schema";

/**
 * Legacy route — /company/[slug]
 *
 * Company slugs are unique per user, not globally. This route resolves
 * the ambiguity by only redirecting when exactly one company matches.
 * If multiple companies share the same slug, we cannot determine which
 * one was intended, so we return 404 instead of guessing.
 *
 * Redirects permanently to the canonical user-scoped path:
 *   /company/[username]/[slug]
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CompanySlugRedirect({ params }: Props) {
  const { slug } = await params;

  // Find ALL companies with this slug to detect ambiguity
  const matches = await db.query.companies.findMany({
    where: eq(companies.slug, slug),
    with: { user: true },
    limit: 2, // We only need to know if there's more than one
  });

  // No match → 404
  if (matches.length === 0) {
    notFound();
  }

  // Ambiguous — multiple companies share this slug, can't safely redirect
  if (matches.length > 1) {
    notFound();
  }

  const company = matches[0];

  // Owner has no username set → can't build canonical URL
  if (!company.user?.username) {
    notFound();
  }

  redirect(`/company/${company.user.username}/${slug}`);
}
