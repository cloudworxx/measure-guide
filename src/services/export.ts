export async function exportPNG(stageRef: React.RefObject<any>, imageSize?: { w: number; h: number } | null, entities?: any[]) {
  if (!stageRef.current) {
    console.error('Fehler: Kein Canvas verfügbar für Export');
    return false;
  }
  
  try {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeFile } = await import('@tauri-apps/plugin-fs');
    
    // Show save dialog
    const filePath = await save({
      defaultPath: 'measurement.png',
      filters: [{
        name: 'PNG Images',
        extensions: ['png']
      }]
    });
    
    if (!filePath) {
      console.log('PNG Export abgebrochen');
      return false;
    }
    
    const stage = stageRef.current;
    
    // Calculate bounding box of all content (image + entities)
    let minX = 0, minY = 0, maxX = imageSize?.w || stage.width(), maxY = imageSize?.h || stage.height();
    
    // Include all entities in bounding box calculation
    if (entities && entities.length > 0) {
      entities.forEach(ent => {
        if (ent.type === 'line') {
          minX = Math.min(minX, ent.a.x, ent.b.x);
          minY = Math.min(minY, ent.a.y, ent.b.y);
          maxX = Math.max(maxX, ent.a.x, ent.b.x);
          maxY = Math.max(maxY, ent.a.y, ent.b.y);
        } else if (ent.type === 'rect') {
          minX = Math.min(minX, ent.a.x, ent.b.x);
          minY = Math.min(minY, ent.a.y, ent.b.y);
          maxX = Math.max(maxX, ent.a.x, ent.b.x);
          maxY = Math.max(maxY, ent.a.y, ent.b.y);
        } else if (ent.type === 'circle') {
          minX = Math.min(minX, ent.center.x - ent.radius);
          minY = Math.min(minY, ent.center.y - ent.radius);
          maxX = Math.max(maxX, ent.center.x + ent.radius);
          maxY = Math.max(maxY, ent.center.y + ent.radius);
        } else if (ent.type === 'text') {
          const textWidth = (ent.text?.length || 0) * (ent.fontSize || 16) * 0.6;
          const textHeight = ent.fontSize || 16;
          minX = Math.min(minX, ent.pos.x);
          minY = Math.min(minY, ent.pos.y - textHeight);
          maxX = Math.max(maxX, ent.pos.x + textWidth);
          maxY = Math.max(maxY, ent.pos.y);
        }
      });
    }
    
    // Add some padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const exportWidth = maxX - minX;
    const exportHeight = maxY - minY;
    
    // Save current viewport state
    const originalScale = stage.scaleX();
    const originalPosition = { x: stage.x(), y: stage.y() };
    
    // Reset to show full content
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw(); // Force redraw
    
    // Generate image data for the complete bounding box
    const dataUrl = stage.toDataURL({ 
      pixelRatio: 2,
      x: minX,
      y: minY,
      width: exportWidth,
      height: exportHeight
    });
    
    // Restore original viewport
    stage.scale({ x: originalScale, y: originalScale });
    stage.position(originalPosition);
    stage.batchDraw();
    
    const base64Data = dataUrl.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Write file
    await writeFile(filePath, binaryData);
    console.log('PNG Export erfolgreich gespeichert:', filePath);
    return true;
  } catch (error) {
    console.error('PNG Export fehlgeschlagen:', error);
    return false;
  }
}

export async function exportPDF(stageRef: React.RefObject<any>, unit: string, calibrationPPM: number | null, imageSize?: { w: number; h: number } | null, entities?: any[]) {
  if (!stageRef.current) {
    console.error('Fehler: Kein Canvas verfügbar für Export');
    return false;
  }
  
  try {
    const { save } = await import('@tauri-apps/plugin-dialog');
    
    // Show save dialog
    const filePath = await save({
      defaultPath: 'measurement.pdf',
      filters: [{
        name: 'PDF Documents',
        extensions: ['pdf']
      }]
    });
    
    if (!filePath) {
      console.log('PDF Export abgebrochen');
      return false;
    }
    
    const stage = stageRef.current;
    
    // Save current viewport state
    const originalScale = stage.scaleX();
    const originalPosition = { x: stage.x(), y: stage.y() };
    
    // Reset to show full content
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw(); // Force redraw
    
    // Generate image data for the complete bounding box
    const dataUrl = stage.toDataURL({ 
      pixelRatio: 2,
      x: minX,
      y: minY,
      width: exportWidth,
      height: exportHeight
    });
    
    // Restore original viewport
    stage.scale({ x: originalScale, y: originalScale });
    stage.position(originalPosition);
    stage.batchDraw();
    
    let jsPDF: any;
    try {
      // @ts-ignore dynamic import if available in bundler
      jsPDF = (await import("jspdf")).jsPDF;
    } catch (e) {
      console.error("jsPDF konnte nicht geladen werden. Füge es deinem Build hinzu (npm i jspdf).");
      return false;
    }
    
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    
    return new Promise<boolean>((resolve) => {
      // compute fit
      const img = new window.Image();
      img.onload = async () => {
        const ratio = Math.min(pageW / img.width, pageH / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (pageW - w) / 2;
        const y = (pageH - h) / 2;
        pdf.addImage(dataUrl, "PNG", x, y, w, h);
        
        // legend: unit
        pdf.setFontSize(10);
        const ppmText = calibrationPPM ? `${calibrationPPM.toFixed(2)} px/m` : "nicht kalibriert";
        pdf.text(`Einheit: ${unit}  |  Kalibrierung: ${ppmText}`, 24, pageH - 24);
        
        // Save to specified path
        const pdfBlob = pdf.output('arraybuffer');
        try {
          const { writeFile } = await import('@tauri-apps/plugin-fs');
          await writeFile(filePath, new Uint8Array(pdfBlob));
          console.log('PDF Export erfolgreich gespeichert:', filePath);
          resolve(true);
        } catch (error) {
          console.error('Fehler beim Speichern der PDF:', error);
          resolve(false);
        }
      };
      img.onerror = () => {
        console.error('Fehler beim Laden des Bildes für PDF Export');
        resolve(false);
      };
      img.src = dataUrl;
    });
  } catch (error) {
    console.error('PDF Export fehlgeschlagen:', error);
    return false;
  }
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
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
