import { mergeAttributes, Node } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ContactBlockView } from "@/components/tiptap-extension/contact-block/contact-block-view"

export interface ContactBlockOptions {
  /**
   * HTML attributes to add to the contact block element.
   * @default {}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLAttributes: Record<string, any>
}

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    contactBlock: {
      setContactBlock: (attrs?: {
        calUsername?: string
        description?: string
      }) => ReturnType
    }
  }
}

/**
 * A Tiptap node extension that renders a Cal.com booking block.
 * In edit mode, shows input fields for calUsername and description.
 * In read mode, renders the CalSlots component.
 */
export const ContactBlockExtension = Node.create<ContactBlockOptions>({
  name: "contactBlock",

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
      calUsername: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-cal-username") ?? "",
        renderHTML: (attributes) => ({
          "data-cal-username": attributes.calUsername as string,
        }),
      },
      description: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-description") ?? "",
        renderHTML: (attributes) => ({
          "data-description": attributes.description as string,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="contact-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "contact-block" }, HTMLAttributes),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ContactBlockView)
  },

  addCommands() {
    return {
      setContactBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              calUsername: attrs?.calUsername ?? "",
              description: attrs?.description ?? "",
            },
          })
        },
    }
  },
})

export default ContactBlockExtension
