"use client";

import { useEffect, useRef } from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Selection } from "@tiptap/extensions";
import { Placeholder } from "@tiptap/extension-placeholder";

// --- UI Primitives ---
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

// --- Tiptap Node Extensions ---
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import { TechStackBlock } from "@/components/tiptap-extension/tech-stack-block/tech-stack-block-extension";
import { ContactBlockExtension } from "@/components/tiptap-extension/contact-block";
import { EducationBlock } from "@/components/tiptap-extension/education-block/education-block-extension";
import { GitHubBlock } from "@/components/tiptap-extension/github-block/github-block-extension";
import { HeroBlock } from "@/components/tiptap-extension/hero-block";

// --- Node Styles ---
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-extension/tech-stack-block/tech-stack-block.scss";
import "@/components/tiptap-extension/contact-block/contact-block.scss";
import "@/components/tiptap-extension/education-block/education-block.scss";
import "@/components/tiptap-extension/github-block/github-block.scss";
import "@/components/tiptap-extension/hero-block/hero-block.scss";

// --- Tiptap UI (toolbar buttons) ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import { TechStackBlockButton } from "@/components/tiptap-ui/tech-stack-block-button";
import { GitHubBlockButton } from "@/components/tiptap-ui/github-block-button";
import { EducationBlockButton } from "@/components/tiptap-ui/education-block-button";
import { LinkPopover } from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
import { Button } from "@/components/tiptap-ui-primitive/button";

// --- Scoped Styles ---
import "@/components/tiptap-editor.scss";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start typing...",
}: TiptapEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Rich text editor",
        class: "tiptap-editor-prose",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      Placeholder.configure({ placeholder }),
      TechStackBlock,
      ContactBlockExtension,
      GitHubBlock,
      EducationBlock,
      HeroBlock,
    ],
    content: content || "",
    onUpdate: ({ editor: e }) => {
      onChangeRef.current(e.getHTML());
    },
  });

  // Sync external content changes (e.g. when loading existing data)
  const initialContentSet = useRef(false);
  useEffect(() => {
    if (editor && content && !initialContentSet.current) {
      // Only set once after editor is ready — avoids cursor-jump on every keystroke
      const currentContent = editor.getHTML();
      if (currentContent !== content && content !== "<p></p>") {
        editor.commands.setContent(content, { emitUpdate: false });
      }
      initialContentSet.current = true;
    }
  }, [editor, content]);

  return (
    <div className="tiptap-editor-field">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar className="tiptap-editor-toolbar">
          <ToolbarGroup>
            <UndoRedoButton action="undo" />
            <UndoRedoButton action="redo" />
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <HeadingDropdownMenu modal={false} levels={[1, 2, 3]} />
            <ListDropdownMenu
              modal={false}
              types={["bulletList", "orderedList", "taskList"]}
            />
            <BlockquoteButton />
            <CodeBlockButton />
            <TechStackBlockButton />
            <GitHubBlockButton />
            <EducationBlockButton />
            <Button
              variant="ghost"
              tooltip="Contact Block"
              aria-label="Insert contact block"
              onClick={() => editor?.commands.setContactBlock()}
            >
              <span className="tiptap-button-icon">📅</span>
            </Button>
            <Button
              variant="ghost"
              tooltip="Hero Block"
              aria-label="Insert hero block"
              onClick={() => editor?.commands.setHeroBlock()}
            >
              <span className="tiptap-button-icon">🎨</span>
            </Button>
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <MarkButton type="bold" />
            <MarkButton type="italic" />
            <MarkButton type="strike" />
            <MarkButton type="code" />
            <MarkButton type="underline" />
            <LinkPopover />
          </ToolbarGroup>
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="tiptap-editor-content"
        />
      </EditorContext.Provider>
    </div>
  );
}
