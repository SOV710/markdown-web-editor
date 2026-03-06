import { Node, mergeAttributes } from "@tiptap/core";

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
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "video-block" }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.classList.add("video-block");
      dom.setAttribute("data-type", "video-block");

      const video = document.createElement("video");
      video.classList.add("video-block-player");
      video.controls = true;
      video.src = node.attrs.src as string;
      video.title = node.attrs.title as string;
      video.style.width = `${node.attrs.width}%`;

      dom.appendChild(video);

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "videoBlock") return false;

          video.src = updatedNode.attrs.src as string;
          video.title = updatedNode.attrs.title as string;
          video.style.width = `${updatedNode.attrs.width}%`;

          return true;
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
