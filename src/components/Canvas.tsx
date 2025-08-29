import React from "react";
import { Stage, Layer, Image as KonvaImage, Line as KonvaLine, Rect as KonvaRect, Circle as KonvaCircle, Text as KonvaText, Group } from "react-konva";
import { Entity, Tool, Point, Units } from "../types";
import { MeasurementLabel } from "./MeasurementLabel";
import { distPx, midPoint, formatLength, areaLabel } from "../utils/geometry";

// Helper function to calculate arrow points
function getArrowPoints(start: Point, end: Point, arrowLength = 12, arrowAngle = Math.PI / 6): Point[] {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  
  const arrowPoint1 = {
    x: end.x - arrowLength * Math.cos(angle - arrowAngle),
    y: end.y - arrowLength * Math.sin(angle - arrowAngle)
  };
  
  const arrowPoint2 = {
    x: end.x - arrowLength * Math.cos(angle + arrowAngle),
    y: end.y - arrowLength * Math.sin(angle + arrowAngle)
  };
  
  return [arrowPoint1, arrowPoint2];
}

interface CanvasProps {
  size: { w: number; h: number };
  scale: number;
  offset: Point;
  image: HTMLImageElement | null;
  imageSize: { w: number; h: number } | null;
  entities: Entity[];
  calibrationAB: { a?: Point; b?: Point; knownMeters?: number } | null;
  lineStart: Point | null;
  tempStart: Point | null;
  hoverPos: Point | null;
  tool: Tool;
  color: string;
  fill: string;
  strokeWidth: number;
  unit: Units;
  calibrationPPM: number | null;
  selectedId: string | null;
  stageRef: React.RefObject<any>;
  isPanning: boolean;
  spaceDown: boolean;
  shiftDown: boolean;
  onWheel: (e: any) => void;
  onMouseDown: (e: any) => void;
  onMouseMove: (e: any) => void;
  onMouseUp: (e: any) => void;
  onSelectEntity: (id: string) => void;
  headerHeight?: number;
}

export function Canvas({
  size,
  scale,
  offset,
  image,
  imageSize,
  entities,
  calibrationAB,
  lineStart,
  tempStart,
  hoverPos,
  tool,
  color,
  fill,
  strokeWidth,
  unit,
  calibrationPPM,
  selectedId,
  stageRef,
  isPanning,
  spaceDown,
  shiftDown,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onSelectEntity,
}: CanvasProps) {
  const lineLengthMeters = (ent: Entity) => {
    if (ent.type !== "line" || !calibrationPPM) return null;
    return distPx(ent.a, ent.b) / calibrationPPM;
  };

  const rectAreaMeters2 = (ent: Entity) => {
    if (ent.type !== "rect" || !calibrationPPM) return null;
    const w = Math.abs(ent.b.x - ent.a.x) / calibrationPPM;
    const h = Math.abs(ent.b.y - ent.a.y) / calibrationPPM;
    return w * h;
  };

  const circleAreaMeters2 = (ent: Entity) => {
    if (ent.type !== "circle" || !calibrationPPM) return null;
    const r = ent.radius / calibrationPPM;
    return Math.PI * r * r;
  };

  return (
    <div className="relative flex-1 bg-[linear-gradient(45deg,#f7f7f7_25%,transparent_25%,transparent_75%,#f7f7f7_75%,#f7f7f7),linear-gradient(45deg,#f7f7f7_25%,transparent_25%,transparent_75%,#f7f7f7_75%,#f7f7f7)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        draggable={tool === 'hand' || spaceDown}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={{ cursor: (tool === 'hand' || spaceDown) ? (isPanning ? 'grabbing' : 'grab') : (tempStart ? 'crosshair' : 'default') }}
      >
        <Layer>
          {/* Background image */}
          {image && (
            <KonvaImage
              image={image}
              x={0}
              y={0}
              width={imageSize?.w}
              height={imageSize?.h}
            />
          )}
          
          {/* Calibration line */}
          {calibrationAB?.a && calibrationAB?.b && (
            <KonvaLine
              points={[calibrationAB.a.x, calibrationAB.a.y, calibrationAB.b.x, calibrationAB.b.y]}
              stroke="red"
              strokeWidth={3}
              dash={shiftDown ? [5, 5] : [10, 5]}
            />
          )}
          
          {/* Calibration preview while dragging */}
          {tool === "calibrate" && calibrationAB?.a && !calibrationAB?.b && hoverPos && (
            <KonvaLine
              points={[calibrationAB.a.x, calibrationAB.a.y, hoverPos.x, hoverPos.y]}
              stroke="red"
              strokeWidth={2}
              opacity={0.7}
              dash={shiftDown ? [3, 3] : [8, 4]}
            />
          )}
          
          {/* Temp drawing preview */}
          {lineStart && hoverPos && (tool === "line" || tool === "draw-line") && (() => {
            const leftArrowPoints = getArrowPoints(hoverPos, lineStart, 12, Math.PI / 6);
            const rightArrowPoints = getArrowPoints(lineStart, hoverPos, 12, Math.PI / 6);
            return (
              <Group>
                <KonvaLine
                  points={[lineStart.x, lineStart.y, hoverPos.x, hoverPos.y]}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  opacity={0.7}
                  dash={shiftDown ? [3, 3] : [5, 5]}
                />
                <KonvaLine
                  points={[leftArrowPoints[0].x, leftArrowPoints[0].y, lineStart.x, lineStart.y, leftArrowPoints[1].x, leftArrowPoints[1].y]}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  opacity={0.7}
                  lineCap="round"
                  lineJoin="round"
                />
                <KonvaLine
                  points={[rightArrowPoints[0].x, rightArrowPoints[0].y, hoverPos.x, hoverPos.y, rightArrowPoints[1].x, rightArrowPoints[1].y]}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  opacity={0.7}
                  lineCap="round"
                  lineJoin="round"
                />
              </Group>
            );
          })()}
          
          {tempStart && hoverPos && (tool === "line" || tool === "draw-line") && (
            <KonvaLine
              points={[tempStart.x, tempStart.y, hoverPos.x, hoverPos.y]}
              stroke={color}
              strokeWidth={strokeWidth}
              opacity={0.5}
              dash={shiftDown ? [3, 3] : [5, 5]}
            />
          )}
          
          {tempStart && hoverPos && (tool === "rect" || tool === "draw-rect") && (
            <KonvaRect
              x={Math.min(tempStart.x, hoverPos.x)}
              y={Math.min(tempStart.y, hoverPos.y)}
              width={Math.abs(hoverPos.x - tempStart.x)}
              height={Math.abs(hoverPos.y - tempStart.y)}
              stroke={color}
              strokeWidth={strokeWidth}
              fill={fill}
              opacity={0.5}
              dash={[5, 5]}
            />
          )}
          
          {tempStart && hoverPos && (tool === "circle" || tool === "draw-circle") && (
            <KonvaCircle
              x={tempStart.x}
              y={tempStart.y}
              radius={distPx(tempStart, hoverPos)}
              stroke={color}
              strokeWidth={strokeWidth}
              fill={fill}
              opacity={0.5}
              dash={[5, 5]}
            />
          )}
          
          {/* Entities */}
          {entities.map(ent => {
            if (ent.type === "line") {
              // Show measurements and arrows only for measurement tools (NOT for drawing tools)
              const showMeasurements = !ent.isDrawing;
              const lengthMeters = showMeasurements ? lineLengthMeters(ent) : null;
              const midPos = midPoint(ent.a, ent.b);
              
              // Calculate arrow points for both ends
              const leftArrowPoints = getArrowPoints(ent.b, ent.a, 12, Math.PI / 6);
              const rightArrowPoints = getArrowPoints(ent.a, ent.b, 12, Math.PI / 6);
              
              return (
                <Group key={ent.id}>
                  {/* Main line */}
                  <KonvaLine
                    points={[ent.a.x, ent.a.y, ent.b.x, ent.b.y]}
                    stroke={ent.stroke}
                    strokeWidth={ent.strokeWidth}
                    onClick={() => onSelectEntity(ent.id)}
                    onMouseEnter={(e) => {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = 'default';
                    }}
                    shadowBlur={selectedId === ent.id ? 8 : 0}
                    shadowColor="blue"
                  />
                  {/* Show arrows only for measurement tools */}
                  {showMeasurements && (
                    <>
                      {/* Left arrow (pointing left) */}
                      <KonvaLine
                        points={[leftArrowPoints[0].x, leftArrowPoints[0].y, ent.a.x, ent.a.y, leftArrowPoints[1].x, leftArrowPoints[1].y]}
                        stroke={ent.stroke}
                        strokeWidth={ent.strokeWidth}
                        lineCap="round"
                        lineJoin="round"
                        onClick={() => onSelectEntity(ent.id)}
                      />
                      {/* Right arrow (pointing right) */}
                      <KonvaLine
                        points={[rightArrowPoints[0].x, rightArrowPoints[0].y, ent.b.x, ent.b.y, rightArrowPoints[1].x, rightArrowPoints[1].y]}
                        stroke={ent.stroke}
                        strokeWidth={ent.strokeWidth}
                        lineCap="round"
                        lineJoin="round"
                        onClick={() => onSelectEntity(ent.id)}
                      />
                    </>
                  )}
                  {lengthMeters && <MeasurementLabel pos={midPos} text={formatLength(lengthMeters, unit)} />}
                </Group>
              );
            }
            
            if (ent.type === "rect") {
              const x = Math.min(ent.a.x, ent.b.x);
              const y = Math.min(ent.a.y, ent.b.y);
              const width = Math.abs(ent.b.x - ent.a.x);
              const height = Math.abs(ent.b.y - ent.a.y);
              const showMeasurements = !ent.isDrawing;
              const areaMeters2 = showMeasurements ? rectAreaMeters2(ent) : null;
              const centerPos = { x: x + width / 2, y: y + height / 2 };
              
              return (
                <Group key={ent.id}>
                  <KonvaRect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    stroke={ent.stroke}
                    strokeWidth={ent.strokeWidth}
                    fill={ent.fill}
                    onClick={() => onSelectEntity(ent.id)}
                    onMouseEnter={(e) => {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = 'default';
                    }}
                    shadowBlur={selectedId === ent.id ? 8 : 0}
                    shadowColor="blue"
                  />
                  {areaMeters2 && <MeasurementLabel pos={centerPos} text={areaLabel(areaMeters2, unit)} />}
                </Group>
              );
            }
            
            if (ent.type === "circle") {
              const showMeasurements = !ent.isDrawing;
              const areaMeters2 = showMeasurements ? circleAreaMeters2(ent) : null;
              const labelPos = { x: ent.center.x, y: ent.center.y - ent.radius / 2 };
              
              return (
                <Group key={ent.id}>
                  <KonvaCircle
                    x={ent.center.x}
                    y={ent.center.y}
                    radius={ent.radius}
                    stroke={ent.stroke}
                    strokeWidth={ent.strokeWidth}
                    fill={ent.fill}
                    onClick={() => onSelectEntity(ent.id)}
                    onMouseEnter={(e) => {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = 'default';
                    }}
                    shadowBlur={selectedId === ent.id ? 8 : 0}
                    shadowColor="blue"
                  />
                  {areaMeters2 && <MeasurementLabel pos={labelPos} text={areaLabel(areaMeters2, unit)} />}
                </Group>
              );
            }
            
            if (ent.type === "text") {
              return (
                <KonvaText
                  key={ent.id}
                  x={ent.pos.x}
                  y={ent.pos.y}
                  text={ent.text}
                  fontSize={ent.fontSize}
                  fontFamily={ent.fontFamily || 'Arial'}
                  fill={ent.color}
                  onClick={() => onSelectEntity(ent.id)}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'default';
                  }}
                  shadowBlur={selectedId === ent.id ? 8 : 0}
                  shadowColor="blue"
                  draggable={tool === 'select'}
                  onDragEnd={(e) => {
                    if (tool === 'select') {
                      // Update text position after drag
                      // This would need to be handled by a callback prop
                    }
                  }}
                />
              );
            }
            
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
}
