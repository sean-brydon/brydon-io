import { mergeAttributes, Node } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { HeroBlockView } from "./hero-block-view"

export interface HeroBlockOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    heroBlock: {
      setHeroBlock: (attrs?: {
        shape1Type?: string
        shape1Text?: string
        shape1Svg?: string
        shape2Type?: string
        shape2Text?: string
        shape2Svg?: string
        height?: number
        particleCount?: number
        showBadge?: boolean
        badgeText?: string
      }) => ReturnType
    }
  }
}

export const HeroBlock = Node.create<HeroBlockOptions>({
  name: "heroBlock",

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
      shape1Type: {
        default: "heart",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-shape1-type") ?? "heart",
        renderHTML: (attributes) => ({
          "data-shape1-type": attributes.shape1Type as string,
        }),
      },
      shape1Text: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-shape1-text") ?? "",
        renderHTML: (attributes) => ({
          "data-shape1-text": attributes.shape1Text as string,
        }),
      },
      shape1Svg: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-shape1-svg") ?? "",
        renderHTML: (attributes) => ({
          "data-shape1-svg": attributes.shape1Svg as string,
        }),
      },
      shape2Type: {
        default: "text",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-shape2-type") ?? "text",
        renderHTML: (attributes) => ({
          "data-shape2-type": attributes.shape2Type as string,
        }),
      },
      shape2Text: {
        default: "S B",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-shape2-text") ?? "S B",
        renderHTML: (attributes) => ({
          "data-shape2-text": attributes.shape2Text as string,
        }),
      },
      shape2Svg: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-shape2-svg") ?? "",
        renderHTML: (attributes) => ({
          "data-shape2-svg": attributes.shape2Svg as string,
        }),
      },
      height: {
        default: 280,
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute("data-height")
          return raw ? Number(raw) : 280
        },
        renderHTML: (attributes) => ({
          "data-height": String(attributes.height ?? 280),
        }),
      },
      particleCount: {
        default: 2000,
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute("data-particle-count")
          return raw ? Number(raw) : 2000
        },
        renderHTML: (attributes) => ({
          "data-particle-count": String(attributes.particleCount ?? 2000),
        }),
      },
      showBadge: {
        default: true,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-show-badge") !== "false",
        renderHTML: (attributes) => ({
          "data-show-badge": String(attributes.showBadge ?? true),
        }),
      },
      badgeText: {
        default: "click to morph",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-badge-text") ?? "click to morph",
        renderHTML: (attributes) => ({
          "data-badge-text": attributes.badgeText as string,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="hero-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "hero-block" }, HTMLAttributes),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(HeroBlockView)
  },

  addCommands() {
    return {
      setHeroBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              shape1Type: attrs?.shape1Type ?? "heart",
              shape1Text: attrs?.shape1Text ?? "",
              shape1Svg: attrs?.shape1Svg ?? "",
              shape2Type: attrs?.shape2Type ?? "text",
              shape2Text: attrs?.shape2Text ?? "S B",
              shape2Svg: attrs?.shape2Svg ?? "",
              height: attrs?.height ?? 280,
              particleCount: attrs?.particleCount ?? 2000,
              showBadge: attrs?.showBadge ?? true,
              badgeText: attrs?.badgeText ?? "click to morph",
            },
          })
        },
    }
  },
})

export default HeroBlock
