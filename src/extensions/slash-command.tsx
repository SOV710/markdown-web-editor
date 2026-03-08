import { Extension, Range } from "@tiptap/core";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import type { Editor } from "@tiptap/core";
import type { ReactNode } from "react";
import {
  TextHOne,
  TextHTwo,
  TextHThree,
  ListBullets,
  ListNumbers,
  CheckSquare,
  Quotes,
  CodeBlock,
  Minus,
  Table,
  Image,
  VideoCamera,
  MathOperations,
  TreeStructure,
} from "@phosphor-icons/react";
import { insertMarkdownImage, insertMarkdownVideo } from "@/lib/link-utils";

const SLASH_ICON_SIZE = 20;

export type SlashCommandGroup = "text" | "list" | "block" | "media" | "advanced";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: ReactNode;
  group: SlashCommandGroup;
  command: (props: { editor: Editor; range: Range }) => void;
}

export const slashCommandItems: SlashCommandItem[] = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: <TextHOne size={SLASH_ICON_SIZE} />,
    group: "text",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: <TextHTwo size={SLASH_ICON_SIZE} />,
    group: "text",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: <TextHThree size={SLASH_ICON_SIZE} />,
    group: "text",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bullet list",
    icon: <ListBullets size={SLASH_ICON_SIZE} />,
    group: "list",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    icon: <ListNumbers size={SLASH_ICON_SIZE} />,
    group: "list",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Task List",
    description: "Track tasks with checkboxes",
    icon: <CheckSquare size={SLASH_ICON_SIZE} />,
    group: "list",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Blockquote",
    description: "Capture a quote",
    icon: <Quotes size={SLASH_ICON_SIZE} />,
    group: "block",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Code Block",
    description: "Display code with syntax highlighting",
    icon: <CodeBlock size={SLASH_ICON_SIZE} />,
    group: "block",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Horizontal Rule",
    description: "Divide content with a line",
    icon: <Minus size={SLASH_ICON_SIZE} />,
    group: "block",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Table",
    description: "Insert a 3x3 table",
    icon: <Table size={SLASH_ICON_SIZE} />,
    group: "media",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: "Image",
    description: "Insert an image with ![alt](url)",
    icon: <Image size={SLASH_ICON_SIZE} />,
    group: "media",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      insertMarkdownImage(editor);
    },
  },
  {
    title: "Video",
    description: "Insert a video with @[title](url)",
    icon: <VideoCamera size={SLASH_ICON_SIZE} />,
    group: "media",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      insertMarkdownVideo(editor);
    },
  },
  {
    title: "Math Block",
    description: "Insert a LaTeX math block",
    icon: <MathOperations size={SLASH_ICON_SIZE} />,
    group: "advanced",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.commands.insertContent({
        type: "mathBlock",
        attrs: { latex: "" },
      });
    },
  },
  {
    title: "PlantUML",
    description: "Insert a PlantUML diagram",
    icon: <TreeStructure size={SLASH_ICON_SIZE} />,
    group: "advanced",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.commands.insertContent({
        type: "plantumlBlock",
        attrs: { source: "@startuml\n\n@enduml" },
      });
    },
  },
];

export interface SlashCommandOptions {
  suggestion: Partial<SuggestionOptions<SlashCommandItem>>;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
