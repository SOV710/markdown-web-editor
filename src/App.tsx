import { Editor } from "@/components/Editor";

export function App() {
  return (
    <div style={{ padding: "48px 24px", maxWidth: "100%" }}>
      <Editor
        onUpdate={(markdown) => {
          console.log("[editor:markdown]", markdown);
        }}
      />
    </div>
  );
}
