// export.ts

type Size = { w: number; h: number };
type Point = { x: number; y: number };

type LineEntity = { type: "line"; a: Point; b: Point };
type RectEntity = { type: "rect"; a: Point; b: Point };
type CircleEntity = { type: "circle"; center: Point; radius: number };
type TextEntity = { type: "text"; pos: Point; text?: string; fontSize?: number };

type AnyEntity = LineEntity | RectEntity | CircleEntity | TextEntity;

function computeBounds(
    stage: any,
    imageSize?: Size | null,
    entities?: AnyEntity[],
    padding = 50
) {
  // Start mit Bildgröße oder Stage-Größe
  let minX = 0;
  let minY = 0;
  let maxX = imageSize?.w ?? stage.width();
  let maxY = imageSize?.h ?? stage.height();

  if (entities && entities.length > 0) {
    for (const ent of entities) {
      switch (ent.type) {
        case "line": {
          minX = Math.min(minX, ent.a.x, ent.b.x);
          minY = Math.min(minY, ent.a.y, ent.b.y);
          maxX = Math.max(maxX, ent.a.x, ent.b.x);
          maxY = Math.max(maxY, ent.a.y, ent.b.y);
          break;
        }
        case "rect": {
          const x1 = Math.min(ent.a.x, ent.b.x);
          const y1 = Math.min(ent.a.y, ent.b.y);
          const x2 = Math.max(ent.a.x, ent.b.x);
          const y2 = Math.max(ent.a.y, ent.b.y);
          minX = Math.min(minX, x1);
          minY = Math.min(minY, y1);
          maxX = Math.max(maxX, x2);
          maxY = Math.max(maxY, y2);
          break;
        }
        case "circle": {
          const x1 = ent.center.x - ent.radius;
          const y1 = ent.center.y - ent.radius;
          const x2 = ent.center.x + ent.radius;
          const y2 = ent.center.y + ent.radius;
          minX = Math.min(minX, x1);
          minY = Math.min(minY, y1);
          maxX = Math.max(maxX, x2);
          maxY = Math.max(maxY, y2);
          break;
        }
        case "text": {
          const textWidth = (ent.text?.length ?? 0) * ((ent.fontSize ?? 16) * 0.6);
          const textHeight = ent.fontSize ?? 16;
          minX = Math.min(minX, ent.pos.x);
          minY = Math.min(minY, ent.pos.y - textHeight);
          maxX = Math.max(maxX, ent.pos.x + textWidth);
          maxY = Math.max(maxY, ent.pos.y);
          break;
        }
      }
    }
  }

  // Padding
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const exportWidth = Math.max(1, maxX - minX);
  const exportHeight = Math.max(1, maxY - minY);

  return { minX, minY, exportWidth, exportHeight };
}

export async function exportPNG(
    stageRef: React.RefObject<any>,
    imageSize?: Size | null,
    entities?: AnyEntity[]
) {
  const stage = stageRef.current;
  if (!stage) {
    console.error("Fehler: Kein Canvas verfügbar für Export");
    return false;
  }

  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");

    const filePath = await save({
      defaultPath: "measurement.png",
      filters: [{ name: "PNG Images", extensions: ["png"] }],
    });
    if (!filePath) {
      console.log("PNG Export abgebrochen");
      return false;
    }

    const { minX, minY, exportWidth, exportHeight } = computeBounds(
        stage,
        imageSize ?? null,
        entities ?? []
    );

    // Viewport sichern
    const originalScale = stage.scaleX?.() ?? 1;
    const originalPos = { x: stage.x?.() ?? 0, y: stage.y?.() ?? 0 };

    // Neutraler Viewport
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw?.();

    // Bild erzeugen
    const dataUrl: string = stage.toDataURL({
      pixelRatio: 2,
      x: minX,
      y: minY,
      width: exportWidth,
      height: exportHeight,
    });

    // Viewport wiederherstellen
    stage.scale({ x: originalScale, y: originalScale });
    stage.position(originalPos);
    stage.batchDraw?.();

    // Base64 → Uint8Array
    const base64 = dataUrl.split(",")[1] ?? "";
    const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    await writeFile(filePath, binary);
    console.log("PNG Export erfolgreich gespeichert:", filePath);
    return true;
  } catch (error) {
    console.error("PNG Export fehlgeschlagen:", error);
    return false;
  }
}

export async function exportPDF(
    stageRef: React.RefObject<any>,
    unit: string,
    calibrationPPM: number | null,
    imageSize?: Size | null,
    entities?: AnyEntity[]
) {
  const stage = stageRef.current;
  if (!stage) {
    console.error("Fehler: Kein Canvas verfügbar für Export");
    return false;
  }

  try {
    const { save } = await import("@tauri-apps/plugin-dialog");

    const filePath = await save({
      defaultPath: "measurement.pdf",
      filters: [{ name: "PDF Documents", extensions: ["pdf"] }],
    });
    if (!filePath) {
      console.log("PDF Export abgebrochen");
      return false;
    }

    const { minX, minY, exportWidth, exportHeight } = computeBounds(
        stage,
        imageSize ?? null,
        entities ?? []
    );

    // Viewport sichern
    const originalScale = stage.scaleX?.() ?? 1;
    const originalPos = { x: stage.x?.() ?? 0, y: stage.y?.() ?? 0 };

    // Neutraler Viewport
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw?.();

    // PNG-Daten erzeugen (als PDF-Bild)
    const dataUrl: string = stage.toDataURL({
      pixelRatio: 2,
      x: minX,
      y: minY,
      width: exportWidth,
      height: exportHeight,
    });

    // Viewport wiederherstellen
    stage.scale({ x: originalScale, y: originalScale });
    stage.position(originalPos);
    stage.batchDraw?.();

    // jsPDF dynamisch laden
    let jsPDF: any;
    try {
      jsPDF = (await import("jspdf")).jsPDF;
    } catch {
      console.error("jsPDF konnte nicht geladen werden. Füge es deinem Build hinzu (npm i jspdf).");
      return false;
    }

    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const ok = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = async () => {
        const ratio = Math.min(pageW / img.width, pageH / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (pageW - w) / 2;
        const y = (pageH - h) / 2;

        pdf.addImage(dataUrl, "PNG", x, y, w, h);

        // Legende
        pdf.setFontSize(10);
        const ppmText = calibrationPPM ? `${calibrationPPM.toFixed(2)} px/m` : "nicht kalibriert";
        pdf.text(`Einheit: ${unit}  |  Kalibrierung: ${ppmText}`, 24, pageH - 24);

        // Speichern via Tauri FS
        try {
          const { writeFile } = await import("@tauri-apps/plugin-fs");
          const arrBuf = pdf.output("arraybuffer");
          await writeFile(filePath, new Uint8Array(arrBuf));
          console.log("PDF Export erfolgreich gespeichert:", filePath);
          resolve(true);
        } catch (err) {
          console.error("Fehler beim Speichern der PDF:", err);
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    });

    return ok;
  } catch (error) {
    console.error("PDF Export fehlgeschlagen:", error);
    return false;
  }
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}