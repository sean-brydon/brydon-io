import { redirect } from "next/navigation";

/**
 * Legacy route — redirects to the default user's work page.
 * TODO: Remove once all old links have been updated.
 */
export default function LegacyWorkPage() {
  redirect("/sean/work");
}
