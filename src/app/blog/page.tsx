import { redirect } from "next/navigation";

/**
 * Legacy route — redirects to the default user's blog.
 * TODO: Remove once all old links have been updated.
 */
export default function LegacyBlogPage() {
  redirect("/sean/blog");
}
