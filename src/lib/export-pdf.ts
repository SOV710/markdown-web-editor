import { renderMarkdownForPdf } from "./pdf-renderer";
import type { LocaleRef } from "@/i18n";

export async function exportToPdf(
  markdown: string,
  localeRef: LocaleRef,
): Promise<void> {
  const html = await renderMarkdownForPdf(markdown, localeRef);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Failed to open print window. Please allow popups.");
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for all images to load before printing
  const images = printWindow.document.querySelectorAll("img");
  const imagePromises = Array.from(images).map(
    (img) =>
      new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
          return;
        }
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Don't block on failed images
      })
  );

  // Also wait for KaTeX CSS to load
  const links = printWindow.document.querySelectorAll('link[rel="stylesheet"]');
  const linkPromises = Array.from(links).map(
    (link) =>
      new Promise<void>((resolve) => {
        const el = link as HTMLLinkElement;
        el.onload = () => resolve();
        el.onerror = () => resolve();
        // Timeout fallback in case onload doesn't fire
        setTimeout(resolve, 5000);
      })
  );

  await Promise.all([...imagePromises, ...linkPromises]);

  // Small delay to ensure rendering is complete
  await new Promise((resolve) => setTimeout(resolve, 300));

  printWindow.print();

  // Close window after print dialog is dismissed
  printWindow.addEventListener("afterprint", () => {
    printWindow.close();
  });
}
