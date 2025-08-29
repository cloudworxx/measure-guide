import React from "react";
import { Rect as KonvaRect, Text as KonvaText, Group } from "react-konva";

interface LabelProps {
  pos: { x: number; y: number };
  text: string;
}

export function MeasurementLabel({ pos, text }: LabelProps) {
  return (
    <Group x={pos.x} y={pos.y}>
      <KonvaRect 
        x={-4} 
        y={-18} 
        width={text.length * 7.5 + 8} 
        height={20} 
        fill="rgba(0,0,0,0.6)" 
        cornerRadius={4} 
      />
      <KonvaText 
        x={0} 
        y={-16} 
        text={text} 
        fontSize={12} 
        fill="#fff" 
      />
    </Group>
  );
}
