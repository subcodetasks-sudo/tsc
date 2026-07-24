import { Node, findParentNode, mergeAttributes } from "@tiptap/core"
import type { EditorState, Transaction } from "@tiptap/pm/state"
import { TextSelection } from "@tiptap/pm/state"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    descriptionList: {
      /** Toggle a description list (`<dl>`) term/definition pair at the cursor. */
      toggleDescriptionList: () => ReturnType
    }
  }
}

type Dispatch = ((tr: Transaction) => void) | undefined

function findDescriptionList(state: EditorState) {
  return findParentNode((node) => node.type.name === "descriptionList")(state.selection)
}

/** Insert a new empty sibling node after the current dt/dd, or jump into it if it already exists. */
function insertOrMoveToSibling(state: EditorState, dispatch: Dispatch, typeName: "descriptionTerm" | "descriptionDetails") {
  const { $from } = state.selection
  if (!["descriptionTerm", "descriptionDetails"].includes($from.parent.type.name)) return false

  const siblingType = state.schema.nodes[typeName]
  if (!siblingType) return false

  const afterPos = $from.after()
  const nodeAfter = state.doc.resolve(afterPos).nodeAfter

  let tr = state.tr
  if (!nodeAfter || nodeAfter.type.name !== typeName) {
    tr = tr.insert(afterPos, siblingType.create())
  }

  tr.setSelection(TextSelection.create(tr.doc, afterPos + 1))
  if (dispatch) dispatch(tr.scrollIntoView())
  return true
}

/** Backspace at the very start of an empty, single-pair description list exits back to a paragraph. */
function exitEmptyDescriptionList(state: EditorState, dispatch: Dispatch) {
  const { $from, empty } = state.selection
  if (!empty || $from.parentOffset !== 0 || $from.parent.content.size !== 0) return false
  if (!["descriptionTerm", "descriptionDetails"].includes($from.parent.type.name)) return false

  const dl = findDescriptionList(state)
  if (!dl || dl.node.childCount !== 2) return false
  if (dl.node.child(0).content.size !== 0 || dl.node.child(1).content.size !== 0) return false

  const paragraphType = state.schema.nodes.paragraph
  if (!paragraphType) return false

  const tr = state.tr.replaceWith(dl.pos, dl.pos + dl.node.nodeSize, paragraphType.create())
  tr.setSelection(TextSelection.create(tr.doc, dl.pos + 1))
  if (dispatch) dispatch(tr.scrollIntoView())
  return true
}

export const DescriptionTerm = Node.create({
  name: "descriptionTerm",
  content: "inline*",
  defining: true,
  parseHTML() {
    return [{ tag: "dt" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["dt", mergeAttributes(HTMLAttributes), 0]
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => insertOrMoveToSibling(this.editor.state, this.editor.view.dispatch, "descriptionDetails"),
      Backspace: () => exitEmptyDescriptionList(this.editor.state, this.editor.view.dispatch),
    }
  },
})

export const DescriptionDetails = Node.create({
  name: "descriptionDetails",
  content: "inline*",
  defining: true,
  parseHTML() {
    return [{ tag: "dd" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["dd", mergeAttributes(HTMLAttributes), 0]
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => insertOrMoveToSibling(this.editor.state, this.editor.view.dispatch, "descriptionTerm"),
      Backspace: () => exitEmptyDescriptionList(this.editor.state, this.editor.view.dispatch),
    }
  },
})

export const DescriptionList = Node.create({
  name: "descriptionList",
  group: "block list",
  content: "(descriptionTerm descriptionDetails+)+",
  parseHTML() {
    return [{ tag: "dl" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["dl", mergeAttributes(HTMLAttributes), 0]
  },
  addCommands() {
    return {
      toggleDescriptionList:
        () =>
        ({ editor, state, dispatch, commands }) => {
          if (editor.isActive(this.name)) {
            const dl = findDescriptionList(state)
            if (!dl) return false

            const paragraphType = state.schema.nodes.paragraph
            const paragraphs: import("@tiptap/pm/model").Node[] = []
            dl.node.forEach((child) => {
              paragraphs.push(paragraphType.create(null, child.content))
            })

            const tr = state.tr
            tr.replaceWith(dl.pos, dl.pos + dl.node.nodeSize, paragraphs)
            if (dispatch) dispatch(tr.scrollIntoView())
            return true
          }

          const { selection } = state
          const text = state.doc.textBetween(selection.from, selection.to, " ")

          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: "descriptionTerm",
                content: text ? [{ type: "text", text }] : [],
              },
              { type: "descriptionDetails", content: [] },
            ],
          })
        },
    }
  },
})

export const DescriptionListKit = [DescriptionList, DescriptionTerm, DescriptionDetails]
