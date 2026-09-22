import { App } from "@/components/app";
import { getAllBlogPosts } from "@/lib/mdx";

export default function Page() {
  const posts = getAllBlogPosts().map(({ slug, title, date }) => ({
    slug,
    title,
    date,
  }));
  return <App posts={posts} />;
}
