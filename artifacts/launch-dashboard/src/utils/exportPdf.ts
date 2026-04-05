// html2pdf.js dynamic import wrapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function exportToPdf(elementId: string, filename: string): Promise<void> {
  // html2pdf.js is a CommonJS module — import dynamically to avoid SSR/TS issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2pdf = (await import("html2pdf.js" as any)).default as any;

  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`exportToPdf: element #${elementId} not found`);
    return;
  }

  const opt = {
    margin:      [8, 8, 8, 8],
    filename,
    image:       { type: "jpeg", quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#0a0a0a" },
    jsPDF:       { unit: "mm", format: "a4", orientation: "landscape" },
  };

  await html2pdf().set(opt).from(el).save();
}
