import { useState, useRef } from "react";
import { Point } from "../types";

export function useViewport() {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  const stageRef = useRef<any>(null);

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  
  const zoomAt = (nextScale: number, pointer: Point) => {
    const stage = stageRef.current as any;
    const oldScale = scale;
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const s = clamp(nextScale, 0.1, 5);
    setScale(s);
    setOffset({ x: pointer.x - mousePointTo.x * s, y: pointer.y - mousePointTo.y * s });
  };

  const onWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current as any;
    const pointer = stage.getPointerPosition();
    const factor = e.evt.deltaY > 0 ? 1 / 1.12 : 1.12; // ~12% per notch
    zoomAt(scale * factor, pointer);
  };

  const toCanvas = (stagePos: Point): Point => {
    const stage = stageRef.current as any;
    if (!stage) {
      // Fallback to manual calculation if stage not available
      return {
        x: (stagePos.x - offset.x) / scale,
        y: (stagePos.y - offset.y) / scale,
      };
    }
    
    // Use Konva's built-in transformation - this is pixel-perfect
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const canvasPos = transform.point(stagePos);
    return canvasPos;
  };

  const fromCanvas = (canvasPos: Point): Point => {
    const stage = stageRef.current as any;
    if (!stage) {
      // Fallback to manual calculation if stage not available
      return {
        x: canvasPos.x * scale + offset.x,
        y: canvasPos.y * scale + offset.y,
      };
    }
    
    // Use Konva's built-in transformation - this is pixel-perfect
    const transform = stage.getAbsoluteTransform();
    const stagePos = transform.point(canvasPos);
    return stagePos;
  };

  const resetZoom = (containerRef: React.RefObject<HTMLDivElement>, imageSize?: { w: number; h: number } | null) => {
    if (!containerRef.current || !imageSize) { 
      setScale(1); 
      setOffset({ x: 0, y: 0 }); 
      return; 
    }
    const rect = containerRef.current.getBoundingClientRect();
    setScale(1);
    setOffset({ x: (rect.width - imageSize.w) / 2, y: (rect.height - 96 - imageSize.h) / 2 });
  };

  const fitToImage = (containerRef: React.RefObject<HTMLDivElement>, imageSize?: { w: number; h: number } | null) => {
    if (!containerRef.current || !imageSize) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.w;
    const scaleY = (rect.height - 96) / imageSize.h;
    const s = Math.min(scaleX, scaleY) * 0.9;
    setScale(s);
    setOffset({ x: (rect.width - imageSize.w * s) / 2, y: (rect.height - 96 - imageSize.h * s) / 2 });
  };

  return {
    scale,
    offset,
    isPanning,
    setIsPanning,
    stageRef,
    onWheel,
    toCanvas,
    fromCanvas,
    resetZoom,
    fitToImage,
  };
}
