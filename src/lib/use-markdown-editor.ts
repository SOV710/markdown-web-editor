import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  CustomKeymap,
  Underline,
  TaskList,
  TaskItem,
  Link,
  Image,
  Table,
  TableRow,
  TableHeader,
  TableCell,
  CodeBlockLowlight,
  MathInline,
  MathBlock,
  PlantUMLBlock,
} from "@/extensions";

export interface UseMarkdownEditorOptions {
  /** 初始内容 (HTML string) */
  content?: string;
  /** placeholder 提示文字 */
  placeholder?: string;
  /** 内容变更回调 */
  onUpdate?: (html: string) => void;
}

const DEFAULT_CONTENT = `
<h2>Welcome to the Editor</h2>
<p>Start typing, or press <code>/</code> for commands…</p>
`;

export function useMarkdownEditor(options: UseMarkdownEditorOptions = {}) {
  const {
    content = DEFAULT_CONTENT,
    placeholder = "Type '/' for commands…",
    onUpdate,
  } = options;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder }),
      CustomKeymap,
      Underline,
      TaskList,
      TaskItem,
      Link,
      Image,
      Table,
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight,
      MathInline,
      MathBlock,
      PlantUMLBlock,
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onUpdate?.(e.getHTML());
    },
    editorProps: {
      attributes: {
        spellcheck: "false",
      },
    },
  });

  return editor;
}
