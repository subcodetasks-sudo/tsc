"use client"

import { useEffect, useRef } from "react"
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
  ListTree,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
} from "lucide-react"
import { normalizeRichTextHtml } from "@/lib/rich-text"
import { DescriptionListKit } from "@/components/ui/rich-text-description-list"
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
  /** Max UTF-8 byte length of the HTML output (TipTap). */
  maxBytes?: number
  /** Shown next to the counter when over/near the limit. */
  limitLabel?: string
}

function utf8ByteLength(value: string) {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length
  }
  return value.length
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
  maxBytes,
  limitLabel,
}: RichTextEditorProps) {
  const normalizedValue = normalizeRichTextHtml(value)
  const lastAcceptedRef = useRef(normalizedValue || "")
  const onChangeRef = useRef(onChange)
  const maxBytesRef = useRef(maxBytes)

  useEffect(() => {
    lastAcceptedRef.current = normalizedValue || ""
  }, [normalizedValue])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    maxBytesRef.current = maxBytes
  }, [maxBytes])

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
      ...DescriptionListKit,
    ],
    content: normalizedValue || "",
    editorProps: {
      attributes: {
        dir,
        class: cn(
          "rich-text-editor-body max-w-none px-3 py-2 text-sm text-[#111827] outline-none",
          "[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5",
          "[&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5",
          "[&_dl]:my-1 [&_dt]:font-bold [&_dt]:text-base [&_dd]:ps-5 [&_dd]:my-0.5 [&_dd]:text-sm",
          "focus:outline-none"
        ),
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML()
      const empty = isEmptyHtml(html)
      const next = empty ? "" : html
      const limit = maxBytesRef.current
      if (limit) {
        const nextBytes = utf8ByteLength(next)
        if (nextBytes > limit) {
          const prevBytes = utf8ByteLength(lastAcceptedRef.current || "")
          // Allow shrinking when already over the limit; block growth only
          if (nextBytes > prevBytes) {
            ed.commands.undo()
            return
          }
        }
      }
      lastAcceptedRef.current = next
      onChangeRef.current(next)
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

  const currentHtml = isEmptyHtml(editor.getHTML()) ? "" : editor.getHTML()
  const currentBytes = utf8ByteLength(currentHtml)
  const overLimit = typeof maxBytes === "number" && currentBytes > maxBytes
  const nearLimit = typeof maxBytes === "number" && currentBytes >= maxBytes * 0.9

  return (
    <div className={cn("mt-1", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-white focus-within:ring-1",
          overLimit
            ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500"
            : "border-[#E5E7EB] focus-within:border-[#006EA8] focus-within:ring-[#006EA8]"
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
          <ToolbarButton
            label="Description list"
            active={editor.isActive("descriptionList")}
            onClick={() => editor.chain().focus().toggleDescriptionList().run()}
          >
            <ListTree className="h-3.5 w-3.5" />
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

      {typeof maxBytes === "number" && (
        <div
          className={cn(
            "mt-1 flex items-center justify-between gap-2 text-xs",
            overLimit ? "text-red-600" : nearLimit ? "text-amber-600" : "text-[#6B7280]"
          )}
        >
          <span>
            {overLimit
              ? limitLabel || "Content exceeds the maximum size. Shorten the text to save."
              : limitLabel || "Maximum size for this language"}
          </span>
          <span className="shrink-0 font-medium tabular-nums">
            {currentBytes.toLocaleString()} / {maxBytes.toLocaleString()} bytes
          </span>
        </div>
      )}
    </div>
  )
}
