export type Units = "mm" | "cm" | "m";
export type Tool = "select" | "hand" | "calibrate" | "line" | "rect" | "circle" | "draw-line" | "draw-rect" | "draw-circle" | "text";

export interface Point { 
  x: number; 
  y: number;
}

export interface BaseEntity { 
  id: string; 
  stroke: string; 
  strokeWidth: number; 
  fill?: string; 
  selected?: boolean;
}

export interface LineEntity extends BaseEntity { 
  type: "line"; 
  a: Point; 
  b: Point; 
  label?: string;
  isDrawing?: boolean; // true = nur zeichnen (keine Messung), false/undefined = Messung
}

export interface RectEntity extends BaseEntity { 
  type: "rect"; 
  a: Point; 
  b: Point; 
  label?: string;
  isDrawing?: boolean;
}

export interface CircleEntity extends BaseEntity { 
  type: "circle"; 
  center: Point; 
  radius: number; 
  label?: string;
  isDrawing?: boolean;
}

export interface TextEntity extends BaseEntity { 
  type: "text"; 
  pos: Point; 
  text: string; 
  fontSize: number; 
  fontFamily?: string;
  color: string;
}

export type Entity = LineEntity | RectEntity | CircleEntity | TextEntity;

export interface Calibration {
  mode: "scale" | "two-point";
  // pixels per meter is the canonical internal unit
  ppm: number | null;
  displayUnit: Units;
}

export interface ProjectState {
  image?: HTMLImageElement | null;
  imageSize?: { w: number; h: number } | null;
  calibration: Calibration;
  entities: Entity[];
}
