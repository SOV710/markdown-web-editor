import { useState, useCallback } from "react";
import { FilePdf } from "@phosphor-icons/react";
import { useLocale } from "@/i18n";
import type { LocaleRef } from "@/i18n";
import { exportToPdf } from "@/lib/export-pdf";
import styles from "./ExportButton.module.css";

interface ExportButtonProps {
  getMarkdown: (() => string) | null;
  localeRef: LocaleRef;
  disabled?: boolean;
}

export function ExportButton({ getMarkdown, localeRef, disabled }: ExportButtonProps) {
  const { t } = useLocale();
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!getMarkdown || exporting) return;

    setExporting(true);
    try {
      const markdown = getMarkdown();
      await exportToPdf(markdown, localeRef);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [getMarkdown, localeRef, exporting]);

  return (
    <button
      type="button"
      className={styles.btn}
      onClick={handleExport}
      disabled={disabled || exporting || !getMarkdown}
      title={exporting ? t.exportButton.exporting : t.exportButton.title}
    >
      <FilePdf size={16} />
    </button>
  );
}
