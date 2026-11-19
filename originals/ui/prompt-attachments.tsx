"use client";

import { useRef, useState, type DragEvent } from "react";
import { Paperclip } from "lucide-react";
import { PromptInput, PromptInputAction } from "./prompt-input";
import { Attachment, AttachmentList, type AttachmentProps } from "./attachment";

/* Prompt with attachments: the chat composer with a file picker and drag-and-drop; chosen files appear as removable chips above the field. The parent owns the list and any uploading. */

export interface PromptAttachment extends Omit<AttachmentProps, "onRemove" | "className"> {
  id: string;
}

/** Files from a drop or picker, minus any whose name and size match one already listed. */
export function newFiles(files: File[], existing: PromptAttachment[]): File[] {
  return files.filter((f) => !existing.some((a) => a.name === f.name && a.size === f.size));
}

export interface PromptAttachmentsProps {
  attachments: PromptAttachment[];
  onAdd?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  onSubmit?: (text: string, attachments: PromptAttachment[]) => void;
  accept?: string;
  placeholder?: string;
  className?: string;
}

export function PromptAttachments({ attachments, onAdd, onRemove, onSubmit, accept, placeholder = "Ask about your files", className = "" }: PromptAttachmentsProps) {
  const picker = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const add = (list: FileList | null) => {
    const files = newFiles(Array.from(list ?? []), attachments);
    if (files.length) onAdd?.(files);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    add(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`w-full max-w-xl rounded-[26px] transition-shadow ${dragging ? "shadow-[0_0_0_3px_var(--select)]" : ""} ${className}`}
    >
      <input ref={picker} type="file" multiple accept={accept} hidden aria-label="Choose files" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      <PromptInput
        placeholder={placeholder}
        onSubmit={(text) => onSubmit?.(text, attachments)}
        leading={<PromptInputAction label="Attach files" onClick={() => picker.current?.click()}><Paperclip size={17} aria-hidden /></PromptInputAction>}
        header={attachments.length > 0 && (
          <AttachmentList>
            {attachments.map(({ id, ...rest }) => <Attachment key={id} {...rest} onRemove={onRemove && (() => onRemove(id))} />)}
          </AttachmentList>
        )}
      />
      {dragging && <p role="status" className="mt-1 text-center text-xs text-select-text">Drop to attach</p>}
    </div>
  );
}
