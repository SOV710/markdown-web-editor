import { TextAlignLeft, BracketsAngle } from "@phosphor-icons/react";
import styles from "./ViewToggle.module.css";

export type ViewMode = "richtext" | "source";

interface ViewToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onModeChange }: ViewToggleProps) {
  return (
    <div className={styles.container}>
      <button
        className={styles.btn}
        data-active={mode === "richtext"}
        onClick={() => onModeChange("richtext")}
        type="button"
        title="Rich Text View"
      >
        <TextAlignLeft size={16} />
      </button>
      <button
        className={styles.btn}
        data-active={mode === "source"}
        onClick={() => onModeChange("source")}
        type="button"
        title="Markdown Source"
      >
        <BracketsAngle size={16} />
      </button>
    </div>
  );
}
