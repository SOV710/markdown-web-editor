import { useState, useRef, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { Link, X } from "@phosphor-icons/react";
import styles from "./LinkInput.module.css";

export interface LinkInputProps {
  editor: Editor;
  onClose: () => void;
  position: { x: number; y: number };
}

export function LinkInput({ editor, onClose, position }: LinkInputProps) {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (url.trim()) {
        // Add https:// if no protocol specified
        let finalUrl = url.trim();
        if (!/^https?:\/\//i.test(finalUrl)) {
          finalUrl = `https://${finalUrl}`;
        }

        editor.chain().focus().setLink({ href: finalUrl }).run();
      }

      onClose();
    },
    [editor, url, onClose]
  );

  const handleRemoveLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    onClose();
  }, [editor, onClose]);

  // Check if currently in a link
  const isInLink = editor.isActive("link");
  const currentHref = editor.getAttributes("link").href || "";

  // Initialize with current link href if editing
  useEffect(() => {
    if (isInLink && currentHref) {
      setUrl(currentHref);
    }
  }, [isInLink, currentHref]);

  // Calculate adjusted position to keep within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 320),
    y: Math.min(position.y, window.innerHeight - 80),
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <Link size={16} weight="bold" className={styles.icon} />
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL..."
            className={styles.input}
          />
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.submitBtn}>
            {isInLink ? "Update" : "Add"}
          </button>
          {isInLink && (
            <button
              type="button"
              onClick={handleRemoveLink}
              className={styles.removeBtn}
              title="Remove link"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
