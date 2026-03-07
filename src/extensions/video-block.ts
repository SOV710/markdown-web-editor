import { Node, mergeAttributes } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

// Types for tiptap-markdown serialization
interface MarkdownSerializerState {
  write(text: string): void;
  text(text: string, escape?: boolean): void;
  ensureNewLine(): void;
  closeBlock(node: ProseMirrorNode): void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoBlock: {
      setVideoBlock: (attributes: {
        src: string;
        width?: number;
        title?: string;
      }) => ReturnType;
    };
  }
}

export const VideoBlock = Node.create({
  name: "videoBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: "",
      },
      width: {
        default: 100,
      },
      title: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="video-block"]',
      },
      {
        // Parse raw <video> tags from Markdown HTML
        tag: "video[src]",
        getAttrs: (element) => {
          const el = element as HTMLVideoElement;
          const widthAttr = el.getAttribute("width");
          let width = 100;
          if (widthAttr) {
            // Handle both "50%" and "50" formats
            const parsed = parseInt(widthAttr.replace("%", ""), 10);
            if (!isNaN(parsed)) width = parsed;
          }
          return {
            src: el.getAttribute("src") || "",
            width,
            title: el.getAttribute("title") || "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "video-block" }),
    ];
  },

  addStorage() {
    return {
      markdown: {
        // Serialize as raw HTML since Markdown has no video syntax
        // html: true is enabled in Markdown.configure() to support this
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
          const src = node.attrs.src as string;
          const width = node.attrs.width as number;
          const title = node.attrs.title as string;
          state.write(`<video src="${src}" width="${width}%" title="${title}"></video>`);
          state.closeBlock(node);
        },
        parse: {
          // Parsing is handled by parseHTML() since markdown-it with html: true
          // will pass through <video> tags which TipTap then parses
        },
      },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const container = document.createElement("div");
      container.classList.add("resizable-video");
      container.style.width = `${node.attrs.width}%`;

      const video = document.createElement("video");
      video.classList.add("video-block-player");
      video.controls = true;
      video.src = node.attrs.src as string;
      video.title = node.attrs.title as string;
      video.style.width = "100%";

      const leftHandle = document.createElement("div");
      leftHandle.classList.add("resize-handle", "resize-handle-left");

      const rightHandle = document.createElement("div");
      rightHandle.classList.add("resize-handle", "resize-handle-right");

      container.appendChild(leftHandle);
      container.appendChild(video);
      container.appendChild(rightHandle);

      let isDragging = false;
      let startX = 0;
      let startWidth = 0;
      let side: "left" | "right" = "right";

      const handleMouseDown = (e: MouseEvent, handleSide: "left" | "right") => {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        startX = e.clientX;
        startWidth = container.offsetWidth;
        side = handleSide;
        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const parent = container.parentElement;
        if (!parent) return;

        const parentWidth = parent.offsetWidth;
        const deltaX = e.clientX - startX;
        const multiplier = side === "right" ? 1 : -1;
        const newWidth = startWidth + deltaX * multiplier * 2;
        const newWidthPercent = Math.max(10, Math.min(100, (newWidth / parentWidth) * 100));

        container.style.width = `${newWidthPercent}%`;
      };

      const handleMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        if (typeof getPos !== "function") return;
        const pos = getPos();
        if (pos === undefined) return;

        const parent = container.parentElement;
        if (!parent) return;

        const parentWidth = parent.offsetWidth;
        const currentWidth = container.offsetWidth;
        const widthPercent = Math.round((currentWidth / parentWidth) * 100);

        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              width: widthPercent,
            });
            return true;
          })
          .run();
      };

      leftHandle.addEventListener("mousedown", (e) => handleMouseDown(e, "left"));
      rightHandle.addEventListener("mousedown", (e) => handleMouseDown(e, "right"));
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "videoBlock") return false;
          video.src = updatedNode.attrs.src as string;
          video.title = updatedNode.attrs.title as string;
          container.style.width = `${updatedNode.attrs.width}%`;
          return true;
        },
        destroy: () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        },
      };
    };
  },

  addCommands() {
    return {
      setVideoBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});
