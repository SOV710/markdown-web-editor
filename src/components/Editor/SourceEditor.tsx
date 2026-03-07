import { useRef, useEffect } from "react";
import styles from "./SourceEditor.module.css";

interface SourceEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SourceEditor({ value, onChange, className }: SourceEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className={`${styles.container} ${className ?? ""}`}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="# Markdown source..."
      />
    </div>
  );
}
