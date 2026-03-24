"use client"

import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import { CalSlots } from "@/components/cal-slots"
import "@/components/tiptap-extension/contact-block/contact-block.scss"

export const ContactBlockView: React.FC<NodeViewProps> = (props) => {
  const { calUsername, description } = props.node.attrs
  const isEditable = props.editor.isEditable

  const updateAttr = (key: string, value: string) => {
    props.updateAttributes({ [key]: value })
  }

  if (isEditable) {
    return (
      <NodeViewWrapper className="contact-block contact-block--edit">
        <div className="contact-block__header">
          <span className="contact-block__label">📅 Contact Block</span>
        </div>
        <div className="contact-block__fields">
          <div className="contact-block__field">
            <label className="contact-block__field-label">
              cal.com username
            </label>
            <input
              type="text"
              value={calUsername ?? ""}
              onChange={(e) => updateAttr("calUsername", e.target.value)}
              placeholder="sean-brydon"
              className="contact-block__input"
            />
          </div>
          <div className="contact-block__field">
            <label className="contact-block__field-label">description</label>
            <input
              type="text"
              value={description ?? ""}
              onChange={(e) => updateAttr("description", e.target.value)}
              placeholder="book a 30 min call — times in your timezone"
              className="contact-block__input"
            />
          </div>
        </div>
        {calUsername && (
          <div className="contact-block__preview">
            <span className="contact-block__preview-label">Preview</span>
            {description && (
              <p className="contact-block__description">{description}</p>
            )}
            <CalSlots calUsername={calUsername} />
          </div>
        )}
      </NodeViewWrapper>
    )
  }

  // Read mode
  return (
    <NodeViewWrapper className="contact-block contact-block--read">
      {description && (
        <p className="contact-block__description">{description}</p>
      )}
      {calUsername && <CalSlots calUsername={calUsername} />}
      {!calUsername && (
        <div className="contact-block__empty">
          No cal.com username configured
        </div>
      )}
    </NodeViewWrapper>
  )
}
