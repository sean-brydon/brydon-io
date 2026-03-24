import { mergeAttributes, Node } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TechStackBlockView } from "./tech-stack-block-view";

export interface TechStackGroup {
  label: string;
  skills: string[];
}

export interface TechStackBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    techStackBlock: {
      setTechStackBlock: (attrs?: {
        groups?: TechStackGroup[];
      }) => ReturnType;
    };
  }
}

export const TechStackBlock = Node.create<TechStackBlockOptions>({
  name: "techStackBlock",

  group: "block",

  draggable: true,

  selectable: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      groups: {
        default: [{ label: "", skills: [] }],
        parseHTML: (element) => {
          const raw = element.getAttribute("data-groups");
          if (!raw) return [{ label: "", skills: [] }];
          try {
            return JSON.parse(raw);
          } catch {
            return [{ label: "", skills: [] }];
          }
        },
        renderHTML: (attributes) => {
          return {
            "data-groups": JSON.stringify(attributes.groups),
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="tech-stack-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "tech-stack-block" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TechStackBlockView);
  },

  addCommands() {
    return {
      setTechStackBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              groups: attrs?.groups ?? [{ label: "", skills: [] }],
            },
          });
        },
    };
  },
});

export default TechStackBlock;
