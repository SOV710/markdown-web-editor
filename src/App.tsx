import { Editor } from "@/components/Editor";

export function App() {
  return (
    <div style={{ padding: "48px 24px", maxWidth: "100%" }}>
      <Editor
        onUpdate={(markdown) => {
          // 开发时观察输出，正式接入时替换为状态管理
          console.log("[editor:markdown]", markdown);
        }}
      />
    </div>
  );
}
