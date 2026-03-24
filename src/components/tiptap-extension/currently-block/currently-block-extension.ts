import { mergeAttributes, Node } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { CurrentlyBlockView } from "./currently-block-view"

export interface CurrentlyBlockOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    currentlyBlock: {
      setCurrentlyBlock: (attrs?: {
        categories?: { label: string; items: { name: string; detail: string }[] }[]
      }) => ReturnType
    }
  }
}

export const CurrentlyBlock = Node.create<CurrentlyBlockOptions>({
  name: "currentlyBlock",

  group: "block",

  atom: true,

  draggable: true,

  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      categories: {
        default: [],
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute("data-categories")
          if (!raw) return []
          try {
            return JSON.parse(raw)
          } catch {
            return []
          }
        },
        renderHTML: (attributes) => {
          return {
            "data-categories": JSON.stringify(attributes.categories ?? []),
          }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="currently-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "currently-block" }, HTMLAttributes),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CurrentlyBlockView)
  },

  addCommands() {
    return {
      setCurrentlyBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              categories: attrs?.categories ?? [],
            },
          })
        },
    }
  },
})

export default CurrentlyBlock
