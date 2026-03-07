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
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 4h12M2 8h8M2 12h10" />
        </svg>
      </button>
      <button
        className={styles.btn}
        data-active={mode === "source"}
        onClick={() => onModeChange("source")}
        type="button"
        title="Markdown Source"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5.5 4L2 8l3.5 4M10.5 4L14 8l-3.5 4" />
        </svg>
      </button>
    </div>
  );
}
