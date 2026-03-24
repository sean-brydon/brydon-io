"use client";

import { useState, useCallback } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import type { TechStackGroup } from "./tech-stack-block-extension";
import "./tech-stack-block.scss";

export const TechStackBlockView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  editor,
}) => {
  const groups: TechStackGroup[] = node.attrs.groups ?? [];
  const isEditable = editor.isEditable;

  const [inputs, setInputs] = useState<Record<number, string>>({});

  const update = useCallback(
    (newGroups: TechStackGroup[]) => {
      updateAttributes({ groups: newGroups });
    },
    [updateAttributes]
  );

  const updateGroup = useCallback(
    (index: number, patch: Partial<TechStackGroup>) => {
      const next = [...groups];
      next[index] = { ...next[index], ...patch };
      update(next);
    },
    [groups, update]
  );

  const addGroup = useCallback(() => {
    update([...groups, { label: "", skills: [] }]);
  }, [groups, update]);

  const removeGroup = useCallback(
    (index: number) => {
      update(groups.filter((_, i) => i !== index));
    },
    [groups, update]
  );

  const addSkill = useCallback(
    (groupIndex: number) => {
      const val = (inputs[groupIndex] ?? "").trim();
      if (!val) return;
      const next = [...groups];
      next[groupIndex] = {
        ...next[groupIndex],
        skills: [...next[groupIndex].skills, val],
      };
      update(next);
      setInputs((prev) => ({ ...prev, [groupIndex]: "" }));
    },
    [groups, inputs, update]
  );

  const removeSkill = useCallback(
    (groupIndex: number, skillIndex: number) => {
      const next = [...groups];
      next[groupIndex] = {
        ...next[groupIndex],
        skills: next[groupIndex].skills.filter((_, i) => i !== skillIndex),
      };
      update(next);
    },
    [groups, update]
  );

  // ── Read Mode ──
  if (!isEditable) {
    return (
      <NodeViewWrapper className="tech-stack-block" data-drag-handle>
        <div className="tech-stack-block__read">
          {groups
            .filter((g) => g.skills.length > 0)
            .map((group, gi) => (
              <div key={gi} className="tech-stack-block__group">
                {group.label && (
                  <span className="tech-stack-block__label">
                    {group.label}
                  </span>
                )}
                <div className="tech-stack-block__chips">
                  {group.skills.map((skill, si) => (
                    <span key={si} className="tech-stack-block__chip">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </NodeViewWrapper>
    );
  }

  // ── Edit Mode ──
  return (
    <NodeViewWrapper className="tech-stack-block" data-drag-handle>
      <div className="tech-stack-block__edit">
        {groups.map((group, gi) => (
          <div key={gi} className="tech-stack-block__group-editor">
            <div className="tech-stack-block__group-header">
              <input
                value={group.label}
                onChange={(e) => updateGroup(gi, { label: e.target.value })}
                placeholder="group label (e.g. languages)"
                className="tech-stack-block__group-input"
              />
              <button
                type="button"
                onClick={() => removeGroup(gi)}
                className="tech-stack-block__remove-group"
              >
                remove
              </button>
            </div>

            <div className="tech-stack-block__chips">
              {group.skills.map((skill, si) => (
                <span key={si} className="tech-stack-block__chip tech-stack-block__chip--editable">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(gi, si)}
                    className="tech-stack-block__remove-skill"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="tech-stack-block__skill-input-row">
              <input
                value={inputs[gi] ?? ""}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, [gi]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    addSkill(gi);
                  }
                }}
                placeholder="add skill + enter"
                className="tech-stack-block__skill-input"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addGroup}
          className="tech-stack-block__add-group"
        >
          + add group
        </button>
      </div>
    </NodeViewWrapper>
  );
};
