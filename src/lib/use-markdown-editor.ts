import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";
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
  VideoBlock,
  SlashCommand,
  HeadingPlaceholder,
  Highlight,
} from "@/extensions";
import { slashCommandSuggestion } from "./slash-command-suggestion";

export interface UseMarkdownEditorOptions {
  /** 初始内容 (Markdown string) */
  content?: string;
  /** placeholder 提示文字 */
  placeholder?: string;
  /** 内容变更回调 */
  onUpdate?: (markdown: string) => void;
}

const DEFAULT_CONTENT = `## Welcome to the Editor

Start typing, or press \`/\` for commands…
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
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder }),
      // tiptap-markdown: enables Markdown serialization/parsing directly on ProseMirror doc
      // html: true allows raw HTML in Markdown (needed for video/image with attributes)
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
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
      VideoBlock,
      HeadingPlaceholder,
      Highlight,
      SlashCommand.configure({
        suggestion: slashCommandSuggestion,
      }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      // tiptap-markdown adds `markdown` to storage at runtime
      const storage = e.storage as unknown as { markdown: MarkdownStorage };
      onUpdate?.(storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        spellcheck: "false",
      },
    },
  });

  return editor;
}
