import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { FeedList } from "./feed-list";

export const metadata = { title: "feed" };

export default async function FeedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?callbackUrl=/feed");

  return (
    <div className="max-w-[640px] mx-auto px-5 py-12">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>feed</h1>
      <p className="text-sm mb-10" style={{ color: "var(--text-muted)" }}>
        posts from developers you follow.
      </p>
      <FeedList />
    </div>
  );
}
