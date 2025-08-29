import React from "react";
import { Units, Tool } from "../types";

interface CalibrationOverlayProps {
  calibrationAB: { a?: { x: number; y: number }; b?: { x: number; y: number }; knownMeters?: number } | null;
  setCalibrationAB: (value: any) => void;
  unit: Units;
  setUnit: (unit: Units) => void;
  onConfirm: () => void;
  onCancel: () => void;
  tool: Tool;
}

export function CalibrationOverlay({
  calibrationAB,
  setCalibrationAB,
  unit,
  setUnit,
  onConfirm,
  onCancel,
  tool,
}: CalibrationOverlayProps) {
  if (tool !== "calibrate") return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white border shadow px-4 py-3 rounded-xl flex items-center gap-3 pointer-events-none z-20">
      <div className="text-sm">
        {!calibrationAB?.a ? "Ersten Punkt anklicken" : 
         !calibrationAB?.b ? "Zweiten Punkt anklicken" :
         "Reale Länge eingeben:"}
      </div>
      {calibrationAB?.a && calibrationAB?.b && (
        <>
          <input 
            type="number" 
            step="0.1"
            placeholder="z.B. 10.5"
            className="w-28 px-2 py-1 border rounded pointer-events-auto" 
            value={calibrationAB?.knownMeters ?? ""} 
            onChange={(e) => setCalibrationAB((v: any) => ({ ...(v||{}), knownMeters: parseFloat(e.target.value) || undefined }))} 
          />
          <select 
            className="px-2 py-1 border rounded pointer-events-auto" 
            value={unit} 
            onChange={(e) => setUnit(e.target.value as Units)}
          >
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="m">m</option>
          </select>
          <button 
            onClick={onConfirm} 
            className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50 pointer-events-auto" 
            disabled={!calibrationAB?.knownMeters}
          >
            Kalibrieren
          </button>
          <button 
            onClick={onCancel}
            className="px-3 py-1.5 rounded border pointer-events-auto"
          >
            Abbrechen
          </button>
        </>
      )}
    </div>
  );
}
