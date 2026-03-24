import { mergeAttributes, Node } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { EducationBlockView } from "./education-block-view"

export interface EducationEntry {
  school: string
  degree: string
  field: string
  startYear: number | ""
  endYear: number | ""
}

export interface EducationBlockOptions {
  /** HTML attributes to add to the wrapper element */
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    educationBlock: {
      /**
       * Insert an education block node
       */
      setEducationBlock: (entries?: EducationEntry[]) => ReturnType
    }
  }
}

export const EducationBlock = Node.create<EducationBlockOptions>({
  name: "educationBlock",

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
      entries: {
        default: [] as EducationEntry[],
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute("data-entries")
          if (!raw) return []
          try {
            return JSON.parse(raw)
          } catch {
            return []
          }
        },
        renderHTML: (attributes) => {
          return {
            "data-entries": JSON.stringify(attributes.entries ?? []),
          }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="education-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "education-block" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(EducationBlockView)
  },

  addCommands() {
    return {
      setEducationBlock:
        (entries) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              entries: entries ?? [
                { school: "", degree: "", field: "", startYear: "", endYear: "" },
              ],
            },
          })
        },
    }
  },
})

export default EducationBlock
