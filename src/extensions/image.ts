import Image from "@tiptap/extension-image";

const ConfiguredImage = Image.configure({
  inline: false,
  allowBase64: true,
});

export { ConfiguredImage as Image };
