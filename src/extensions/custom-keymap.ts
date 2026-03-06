import { Extension } from "@tiptap/core";

/**
 * 自定义快捷键扩展。
 *
 * StarterKit 已经内置了 Bold(Ctrl+B), Italic(Ctrl+I) 等常用快捷键。
 * 这里补充你需求中提到的额外快捷键：
 *   - Ctrl+Alt+1/2/3  → Heading 1/2/3
 *   - Ctrl+Alt+0      → Normal text (paragraph)
 *   - Ctrl+U           → Underline (需要单独安装 @tiptap/extension-underline)
 *
 * 后续扩展时在此文件添加即可。
 */
export const CustomKeymap = Extension.create({
  name: "customKeymap",

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-1": () =>
        this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
      "Mod-Alt-2": () =>
        this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
      "Mod-Alt-3": () =>
        this.editor.chain().focus().toggleHeading({ level: 3 }).run(),
      "Mod-Alt-0": () =>
        this.editor.chain().focus().setParagraph().run(),
    };
  },
});
