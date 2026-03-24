import { isHtmlContent } from "@/lib/content-format";
import { MDXContent } from "./mdx-content";
import { HTMLContent } from "./html-content";

/**
 * Smart content renderer that detects whether post content is HTML
 * (from the tiptap rich-text editor) or MDX (legacy markdown posts)
 * and renders with the appropriate component.
 */
export function PostContent({ source }: { source: string }) {
  if (isHtmlContent(source)) {
    return <HTMLContent source={source} />;
  }
  return <MDXContent source={source} />;
}
