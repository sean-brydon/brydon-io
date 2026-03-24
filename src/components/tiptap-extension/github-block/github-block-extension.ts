import { mergeAttributes, Node } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { GitHubBlockView } from "@/components/tiptap-extension/github-block/github-block-view"

export interface GitHubBlockOptions {
  /**
   * HTML attributes to add to the github-block element.
   * @default {}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLAttributes: Record<string, any>
}

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    githubBlock: {
      /**
       * Insert a GitHub contributions block
       */
      setGitHubBlock: (attrs?: { username?: string }) => ReturnType
    }
  }
}

/**
 * A Tiptap node extension that renders a GitHub contributions graph.
 * In edit mode, shows a username input field.
 * In read mode, renders the GitHubContributions component.
 */
export const GitHubBlock = Node.create<GitHubBlockOptions>({
  name: "githubBlock",

  group: "block",

  draggable: true,

  selectable: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      username: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-username") || "",
        renderHTML: (attributes) => ({
          "data-username": attributes.username as string,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="github-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "github-block" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(GitHubBlockView)
  },

  addCommands() {
    return {
      setGitHubBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              username: attrs?.username || "",
            },
          })
        },
    }
  },
})

export default GitHubBlock
