import { renderMarkdownForPdf } from "./pdf-renderer";
import type { LocaleRef } from "@/i18n";

export async function exportToPdf(
  markdown: string,
  localeRef: LocaleRef,
): Promise<void> {
  const html = await renderMarkdownForPdf(markdown, localeRef);

  // Use a hidden iframe instead of window.open to avoid visible blank page flash
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;width:0;height:0;border:none;left:-9999px";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc || !iframe.contentWindow) {
    iframe.remove();
    throw new Error("Failed to create print iframe.");
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for all images to load before printing
  const images = iframeDoc.querySelectorAll("img");
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
  const links = iframeDoc.querySelectorAll('link[rel="stylesheet"]');
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

  iframe.contentWindow.print();

  // Remove iframe after print dialog is dismissed
  const cleanup = () => iframe.remove();
  iframe.contentWindow.addEventListener("afterprint", cleanup);
  // Timeout fallback in case afterprint doesn't fire
  setTimeout(cleanup, 60000);
}
