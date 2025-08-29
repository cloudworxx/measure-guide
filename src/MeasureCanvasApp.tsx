import React, { useEffect, useRef, useState } from "react";
import { listen } from '@tauri-apps/api/event';
import { TopBar, Canvas, Toolbar, CalibrationOverlay } from "./components";
import { useWindowSize, useViewport, useHistory } from "./hooks";
import { Tool, Units, ProjectState, LineEntity, RectEntity, CircleEntity, TextEntity, Point } from "./types";
import { distPx, uid, unitToMeters } from "./utils";
import { exportPNG, exportPDF, loadImage } from "./services";

export default function MeasureCanvasApp() {
  const { size, containerRef } = useWindowSize();
  const viewport = useViewport();

  // state
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#00a3ff");
  const [fill, setFill] = useState("rgba(0,163,255,0.08)");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [unit, setUnit] = useState<Units>("m");
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [projectFileName, setProjectFileName] = useState<string | null>(null);

  const [proj, setProj] = useState<ProjectState>({
    image: null,
    imageSize: null,
    calibration: { mode: "two-point", ppm: null, displayUnit: "m" },
    entities: [],
  });

  // drawing temp states
  const tempStart = useRef<Point | null>(null);
  const [hoverPos, setHoverPos] = useState<Point | null>(null);
  const [calibrationAB, setCalibrationAB] = useState<{ a?: Point; b?: Point; knownMeters?: number } | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const [shiftDown, setShiftDown] = useState(false);
  const [lineStart, setLineStart] = useState<Point | null>(null); // Für Click-to-Click Linien
  const [editingText, setEditingText] = useState<{id: string; text: string} | null>(null);
  const [textInputValue, setTextInputValue] = useState("");
  const [textColor, setTextColor] = useState("#000000"); // Separate Textfarbe

  const { undo, redo } = useHistory(proj, setProj);

  // Tool change handler to reset states
  const handleToolChange = (newTool: Tool) => {
    // Reset drawing states when changing tools
    setLineStart(null);
    tempStart.current = null;
    setEditingText(null);
    setTextInputValue("");
    if (newTool !== "calibrate") {
      setCalibrationAB(null);
    }
    setTool(newTool);
  };

  // Helper function to snap to straight lines when shift is held
  const snapToStraightLine = (start: Point, current: Point): Point => {
    if (!shiftDown) return current;

    const dx = Math.abs(current.x - start.x);
    const dy = Math.abs(current.y - start.y);

    // Snap to horizontal, vertical, or 45° diagonal
    if (dx > dy * 2) {
      // Horizontal line
      return { x: current.x, y: start.y };
    } else if (dy > dx * 2) {
      // Vertical line
      return { x: start.x, y: current.y };
    } else {
      // 45° diagonal
      const size = Math.max(dx, dy);
      return {
        x: start.x + (current.x > start.x ? size : -size),
        y: start.y + (current.y > start.y ? size : -size)
      };
    }
  };

  // Mouse event handlers
  const handleMouseDown = (e: any) => {
    const stage = viewport.stageRef.current as any;
    const pos = stage.getPointerPosition();
    const canvasPos = viewport.toCanvas(pos);

    if (tool === 'select' && e.target === stage) {
      setSelectedId(null);
    }

    if (tool === "hand" || spaceDown) {
      viewport.setIsPanning(true);
      return;
    }

    if (tool === "calibrate") {
      if (!calibrationAB || !calibrationAB.a) {
        setCalibrationAB({ a: canvasPos });
      } else if (!calibrationAB.b) {
        // Use hoverPos for consistent coordinates with preview
        const finalPos = hoverPos || canvasPos;
        setCalibrationAB({ ...calibrationAB, b: finalPos });
      } else {
        // Reset and start over
        setCalibrationAB({ a: canvasPos, b: undefined, knownMeters: calibrationAB.knownMeters });
      }
      return;
    }

    if (tool === "line" || tool === "draw-line") {
      if (!lineStart) {
        // Ersten Punkt setzen
        setLineStart(canvasPos);
      } else {
        // Use hoverPos for consistent coordinates with preview
        const finalPos = hoverPos || canvasPos;
        if (distPx(lineStart, finalPos) > 5) {
          const isDrawTool = tool.startsWith("draw-");
          const ent: LineEntity = { 
            type: "line", 
            id: uid("line"), 
            a: lineStart, 
            b: finalPos, 
            stroke: color, 
            strokeWidth,
            isDrawing: isDrawTool
          };
          setProj(p => ({ ...p, entities: [...p.entities, ent] }));
          setHasUnsavedChanges(true); // Mark as changed
        }
        setLineStart(null); // Reset
      }
      return;
    }

    if (tool === "text") {
      // Create text at click position
      const textId = uid("text");
      const newText = {
        type: "text" as const,
        id: textId,
        pos: canvasPos,
        text: "",
        fontSize,
        fontFamily,
        color: textColor, // Verwende separate Textfarbe
        stroke: textColor,
        strokeWidth: 1
      };
      setProj(p => ({ ...p, entities: [...p.entities, newText] }));
      setEditingText({ id: textId, text: "" });
      setTextInputValue("");
      setHasUnsavedChanges(true);
      return;
    }

    if (["rect", "circle", "draw-rect", "draw-circle"].includes(tool)) {
      tempStart.current = canvasPos;
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = viewport.stageRef.current as any;
    const pos = stage.getPointerPosition();
    const canvasPos = viewport.toCanvas(pos);

    // Apply snapping for calibration, line tool when shift is held
    let finalPos = canvasPos;
    if ((tool === "calibrate" && calibrationAB?.a) || ((tool === "line" || tool === "draw-line") && lineStart)) {
      const startPoint = tool === "calibrate" ? calibrationAB!.a! : lineStart!;
      finalPos = snapToStraightLine(startPoint, canvasPos);
    } else if ((tool === "line" || tool === "draw-line") && tempStart.current) {
      finalPos = snapToStraightLine(tempStart.current, canvasPos);
    }
    // Note: rect and circle don't have snapping yet, but use the same finalPos for consistency

    setHoverPos(finalPos);
  };

  const handleMouseUp = (e: any) => {
    const stage = viewport.stageRef.current as any;
    const pos = stage.getPointerPosition();
    const canvasPos = viewport.toCanvas(pos);

    viewport.setIsPanning(false);

    // Line tool uses click-to-click now, handled in mouseDown

    if ((tool === "rect" || tool === "draw-rect") && tempStart.current) {
      // Use consistent coordinates - either hoverPos or canvasPos
      const finalPos = hoverPos || canvasPos;
      // Only create rect if there's meaningful area
      if (Math.abs(finalPos.x - tempStart.current.x) > 5 && Math.abs(finalPos.y - tempStart.current.y) > 5) {
        const isDrawTool = tool.startsWith("draw-");
        const ent: RectEntity = { 
          type: "rect", 
          id: uid("rect"), 
          a: tempStart.current, 
          b: finalPos, 
          stroke: color, 
          strokeWidth, 
          fill,
          isDrawing: isDrawTool
        };
        setProj(p => ({ ...p, entities: [...p.entities, ent] }));
        setHasUnsavedChanges(true); // Mark as changed
      }
      tempStart.current = null;
    }
    if ((tool === "circle" || tool === "draw-circle") && tempStart.current) {
      // Use consistent coordinates - either hoverPos or canvasPos
      const finalPos = hoverPos || canvasPos;
      // Only create circle if there's meaningful radius
      const radius = distPx(tempStart.current, finalPos);
      if (radius > 5) {
        const isDrawTool = tool.startsWith("draw-");
        const ent: CircleEntity = { 
          type: "circle", 
          id: uid("circle"), 
          center: tempStart.current, 
          radius, 
          stroke: color, 
          strokeWidth, 
          fill,
          isDrawing: isDrawTool
        };
        setProj(p => ({ ...p, entities: [...p.entities, ent] }));
        setHasUnsavedChanges(true); // Mark as changed
      }
      tempStart.current = null;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(true);
      if (e.key === 'Shift') setShiftDown(true);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); viewport.resetZoom(containerRef, proj.imageSize); }
      if (e.key === 'Escape') {
        // ESC cancels current drawing operations
        if (editingText) {
          handleTextCancel();
        } else {
          setLineStart(null);
          tempStart.current = null;
          setCalibrationAB(null);
        }
      }
      if (e.key === 'Enter' && editingText) {
        e.preventDefault();
        handleTextSubmit();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        setProj(p => ({ ...p, entities: p.entities.filter(en => en.id !== selectedId) }));
        setSelectedId(null);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false);
      if (e.key === 'Shift') setShiftDown(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [selectedId, undo, redo, viewport, containerRef, proj.imageSize]);

  // Image handling
  const onOpenImage = async (file: File) => {
    try {
      const img = await loadImage(file);
      setProj(p => ({ ...p, image: img, imageSize: { w: img.width, h: img.height } }));
      setHasUnsavedChanges(true); // Mark as changed

      // Fit image initially
      if (containerRef.current) {
        viewport.fitToImage(containerRef, { w: img.width, h: img.height });
      }
    } catch (error) {
      alert("Fehler beim Laden des Bildes");
    }
  };

  // Calibration logic
  const startTwoPointCalibration = () => {
    handleToolChange("calibrate");
    setCalibrationAB(null); // Reset komplett
  };

  const confirmCalibration = () => {
    if (!calibrationAB?.a || !calibrationAB?.b || !calibrationAB?.knownMeters) return;
    const px = distPx(calibrationAB.a, calibrationAB.b);
    const meters = unitToMeters(calibrationAB.knownMeters, unit);
    const ppm = px / meters; // pixels per meter
    setProj(p => ({ ...p, calibration: { ...p.calibration, ppm, mode: "two-point", displayUnit: unit } }));
    setCalibrationAB(null);
    setHasUnsavedChanges(true); // Mark as changed
    handleToolChange("line"); // Automatisch zum Linien-Tool wechseln
  };

  const cancelCalibration = () => {
    setCalibrationAB(null);
    handleToolChange("select");
  };

  // Text handling functions
  const handleTextEdit = (textId: string) => {
    const textEntity = proj.entities.find(e => e.id === textId) as TextEntity;
    if (textEntity && textEntity.type === "text") {
      setEditingText({ id: textId, text: textEntity.text });
      setTextInputValue(textEntity.text);
      // Load the text properties into the current state
      if (textEntity.fontSize) setFontSize(textEntity.fontSize);
      if (textEntity.fontFamily) setFontFamily(textEntity.fontFamily);
      if (textEntity.color) setTextColor(textEntity.color);
    }
  };

  const handleTextSubmit = () => {
    if (editingText && textInputValue.trim()) {
      setProj(p => ({
        ...p,
        entities: p.entities.map(e => 
          e.id === editingText.id 
            ? { ...e, text: textInputValue.trim(), fontSize, fontFamily, color: textColor, stroke: textColor }
            : e
        )
      }));
      setHasUnsavedChanges(true);
    }
    setEditingText(null);
    setTextInputValue("");
  };

  const handleTextCancel = () => {
    if (editingText) {
      // If it's a new text (empty or just whitespace), remove it
      if (textInputValue.trim() === "") {
        setProj(p => ({
          ...p,
          entities: p.entities.filter(e => e.id !== editingText.id)
        }));
      }
    }
    setEditingText(null);
    setTextInputValue("");
  };

  // Entity selection
  const onSelectEntity = (id: string) => {
    setSelectedId(id);
    
    // Get entity info before potentially changing tool
    const entity = proj.entities.find(e => e.id === id);
    const wasSelectTool = tool === 'select';
    
    // Auto-switch to select tool when clicking on any entity
    if (tool !== 'select') {
      setTool('select');
    }
    
    // If it's a text entity, allow editing
    if (entity && entity.type === "text") {
      if (wasSelectTool) {
        // If we were already in select mode, edit immediately
        handleTextEdit(id);
      } else {
        // If we just switched tools, edit after a short delay
        setTimeout(() => {
          handleTextEdit(id);
        }, 100);
      }
    }
  };

  // Update selected entity properties
  const onUpdateSelectedEntity = (updates: any) => {
    if (!selectedId) return;
    
    setProj(p => ({
      ...p,
      entities: p.entities.map(entity => 
        entity.id === selectedId 
          ? { ...entity, ...updates }
          : entity
      )
    }));
    setHasUnsavedChanges(true);
  };

  // Delete selected entity
  const onDelete = () => {
    if (!selectedId) return;
    setProj(p => ({ ...p, entities: p.entities.filter(en => en.id !== selectedId) }));
    setSelectedId(null);
    setHasUnsavedChanges(true); // Mark as changed
  };

  // New project handler
  const handleNewProject = () => {
    setProj({
      image: null,
      imageSize: null,
      calibration: { mode: "two-point", ppm: null, displayUnit: "m" },
      entities: [],
    });
    setSelectedId(null);
    setLineStart(null);
    tempStart.current = null;
    setCalibrationAB(null);
    setTool("select");
    setHasUnsavedChanges(false);
    setProjectFileName(null); // Reset filename
  };

  // Save/Load project handlers
  const handleSaveProject = async () => {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      
      const filePath = await save({
        defaultPath: 'measureguide-project.megu',
        filters: [{
          name: 'MeasureGuide Project',
          extensions: ['megu']
        }]
      });
      
      if (filePath) {
        // Create project data - save image as data URL (not src)
        let imageDataUrl = null;
        if (proj.image) {
          // Create canvas to convert image to data URL
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx && proj.imageSize) {
            canvas.width = proj.imageSize.w;
            canvas.height = proj.imageSize.h;
            ctx.drawImage(proj.image, 0, 0);
            imageDataUrl = canvas.toDataURL('image/png');
          }
        }
        
        const projectData = {
          imageDataUrl,
          imageSize: proj.imageSize,
          calibration: proj.calibration,
          entities: proj.entities,
          unit,
          color,
          fill,
          strokeWidth,
          tool,
          timestamp: new Date().toISOString()
        };
        
        await writeTextFile(filePath, JSON.stringify(projectData, null, 2));
        setHasUnsavedChanges(false);
        // Extract filename from path
        const fileName = filePath.split('/').pop()?.replace('.megu', '') || 'untitled';
        setProjectFileName(fileName);
        console.log('Project saved successfully:', filePath);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleLoadProject = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readTextFile } = await import('@tauri-apps/plugin-fs');
      
      const filePath = await open({
        multiple: false,
        filters: [{
          name: 'MeasureGuide Project',
          extensions: ['megu']
        }]
      });
      
      if (filePath) {
        const fileContent = await readTextFile(filePath);
        const projectData = JSON.parse(fileContent);
        
        // Function to restore project state
        const restoreProjectState = (imageObj: HTMLImageElement | null = null) => {
          setProj({
            image: imageObj,
            imageSize: projectData.imageSize,
            calibration: projectData.calibration,
            entities: projectData.entities || []
          });
          
          // Restore settings
          if (projectData.unit) setUnit(projectData.unit);
          if (projectData.color) setColor(projectData.color);
          if (projectData.fill) setFill(projectData.fill);
          if (projectData.strokeWidth) setStrokeWidth(projectData.strokeWidth);
          if (projectData.tool) setTool(projectData.tool);
          
          // Reset drawing states
          setSelectedId(null);
          setLineStart(null);
          tempStart.current = null;
          setCalibrationAB(null);
          setHasUnsavedChanges(false);
          
          // Set filename
          const fileName = filePath.split('/').pop()?.replace('.megu', '') || 'untitled';
          setProjectFileName(fileName);
          
          console.log('Project loaded successfully:', filePath);
        };
        
        // Restore image if exists (check both old and new format)
        const imageData = projectData.imageDataUrl || projectData.imageBase64;
        if (imageData) {
          const img = new window.Image();
          img.onload = () => {
            restoreProjectState(img);
            // Fit to image after loading
            if (containerRef.current && projectData.imageSize) {
              setTimeout(() => {
                viewport.fitToImage(containerRef, projectData.imageSize);
              }, 100);
            }
          };
          img.onerror = () => {
            console.error('Failed to load image from project file');
            restoreProjectState(null);
          };
          img.src = imageData;
        } else {
          restoreProjectState(null);
        }
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  // Export handlers
  const handleExportPNG = () => exportPNG(viewport.stageRef, proj.imageSize, proj.entities);
  const handleExportPDF = () => exportPDF(viewport.stageRef, unit, proj.calibration.ppm, proj.imageSize, proj.entities);

  // Native menu event listeners (removed - no custom menu events)
  // All functionality is handled via Canvas buttons

  return (
    <div className="w-full h-screen flex flex-col">
      <TopBar 
        onOpenImage={onOpenImage}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        onNewProject={handleNewProject}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        hasImage={!!proj.image}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      
      {/* Main content with padding for fixed TopBar and Toolbar */}
      <div className="flex-1 pt-12 pb-12 overflow-hidden" ref={containerRef}>

      <Canvas
        size={size}
        scale={viewport.scale}
        offset={viewport.offset}
        image={proj.image}
        imageSize={proj.imageSize}
        entities={proj.entities}
        calibrationAB={calibrationAB}
        lineStart={lineStart}
        tempStart={tempStart.current}
        hoverPos={hoverPos}
        tool={tool}
        color={color}
        fill={fill}
        strokeWidth={strokeWidth}
        unit={unit}
        calibrationPPM={proj.calibration.ppm}
        selectedId={selectedId}
        stageRef={viewport.stageRef}
        isPanning={viewport.isPanning}
        spaceDown={spaceDown}
        shiftDown={shiftDown}
        onWheel={viewport.onWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onSelectEntity={onSelectEntity}
      />

      <CalibrationOverlay
        calibrationAB={calibrationAB}
        setCalibrationAB={setCalibrationAB}
        unit={unit}
        setUnit={setUnit}
        onConfirm={confirmCalibration}
        onCancel={cancelCalibration}
        tool={tool}
      />

      {/* Text Input Overlay */}
      {editingText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-3">Text bearbeiten</h3>
            
            {/* Text Tools */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Text-Formatierung
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {/* Font Family */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schriftart</label>
                  <select 
                    value={fontFamily} 
                    onChange={(e) => setFontFamily(e.target.value)} 
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Impact">Impact</option>
                  </select>
                </div>
                
                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schriftgröße</label>
                  <input 
                    type="number" 
                    min={8} 
                    max={72} 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value || "16"))} 
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>
              
              {/* Text Color - Full Width */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Textfarbe</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={textColor} 
                    onChange={(e) => setTextColor(e.target.value)} 
                    className="w-10 h-8 border border-gray-300 rounded cursor-pointer" 
                  />
                  <input 
                    type="text" 
                    value={textColor} 
                    onChange={(e) => setTextColor(e.target.value)} 
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono" 
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
            
            {/* Text Input */}
            <textarea
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              className="w-full h-24 p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Text eingeben..."
              style={{
                fontFamily: fontFamily,
                fontSize: Math.min(fontSize, 14) + 'px',
                color: textColor
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  handleTextSubmit();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleTextCancel();
                }
              }}
            />
            
            <div className="flex justify-between items-center mt-3">
              <div className="text-xs text-gray-500">
                <div>Strg+Enter zum Speichern</div>
                <div>Esc zum Abbrechen</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleTextCancel}
                  className="px-3 py-1 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleTextSubmit}
                  className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toolbar
        tool={tool}
        setTool={handleToolChange}
        color={color}
        setColor={setColor}
        fill={fill}
        setFill={setFill}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        unit={unit}
        setUnit={setUnit}
        selectedId={selectedId}
        onDelete={onDelete}
        onStartCalibration={startTwoPointCalibration}
        onResetZoom={() => viewport.resetZoom(containerRef, proj.imageSize)}
        onFitToImage={() => viewport.fitToImage(containerRef, proj.imageSize)}
        scale={viewport.scale}
        calibrationPPM={proj.calibration.ppm}
        shiftDown={shiftDown}
        onUpdateSelectedEntity={onUpdateSelectedEntity}
      />
      </div>
    </div>
  );
}
