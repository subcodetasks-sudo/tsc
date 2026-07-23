"use client"

import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
} from "lucide-react"
import { normalizeRichTextHtml } from "@/lib/rich-text"
import { cn } from "@/lib/utils"

function isEmptyHtml(html: string) {
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim()
  return text.length === 0
}

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  dir?: "ltr" | "rtl"
  className?: string
  minHeight?: string
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded text-[#374151] transition-colors",
        "hover:bg-[#EAF4FB] hover:text-[#006EA8] disabled:pointer-events-none disabled:opacity-40",
        active && "bg-[#EAF4FB] text-[#006EA8]"
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "",
  dir = "ltr",
  className,
  minHeight = "96px",
}: RichTextEditorProps) {
  const normalizedValue = normalizeRichTextHtml(value)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[#006EA8] underline" },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["paragraph"] }),
    ],
    content: normalizedValue || "",
    editorProps: {
      attributes: {
        dir,
        class: cn(
          "rich-text-editor-body max-w-none px-3 py-2 text-sm text-[#111827] outline-none",
          "[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5",
          "[&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5",
          "focus:outline-none"
        ),
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML()
      onChange(isEmptyHtml(html) ? "" : html)
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = normalizedValue || ""
    if (isEmptyHtml(current) && isEmptyHtml(next)) return
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, normalizedValue])

  useEffect(() => {
    if (!editor) return
    const attrs = (editor.options.editorProps?.attributes ?? {}) as Record<string, string>
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        attributes: { ...attrs, dir },
      },
    })
  }, [editor, dir])

  if (!editor) {
    return (
      <div
        className={cn("mt-1 rounded-lg border border-[#E5E7EB] bg-white", className)}
        style={{ minHeight }}
      />
    )
  }

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("URL", previous || "https://")
    if (url === null) return
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run()
  }

  return (
    <div
      className={cn(
        "mt-1 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white focus-within:border-[#006EA8] focus-within:ring-1 focus-within:ring-[#006EA8]",
        className
      )}
    >
      <style>{`
        .rich-text-editor-body p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          height: 0;
          color: #9ca3af;
          pointer-events: none;
        }
        .rich-text-editor-body[dir="rtl"] p.is-editor-empty:first-child::before {
          float: right;
        }
      `}</style>

      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#E5E7EB] bg-[#F9FAFB] px-1.5 py-1">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-[#E5E7EB]" aria-hidden />

        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Ordered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-[#E5E7EB]" aria-hidden />

        <ToolbarButton
          label="Align left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-[#E5E7EB]" aria-hidden />

        <ToolbarButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
