import { useRef, useEffect } from "react";
import { ProjectState } from "../types";

export function useHistory(proj: ProjectState, setProj: (state: ProjectState) => void) {
  const history = useRef<ProjectState[]>([proj]);
  const future = useRef<ProjectState[]>([]);

  useEffect(() => {
    // push shallow snapshot on change of entities or calibration
    const currentState = { ...proj, entities: [...proj.entities] };
    const lastState = history.current[history.current.length - 1];
    
    // Only push if state actually changed
    if (!lastState || 
        lastState.entities.length !== currentState.entities.length ||
        lastState.calibration.ppm !== currentState.calibration.ppm) {
      history.current.push(currentState);
      if (history.current.length > 100) history.current.shift();
      future.current = [];
    }
  }, [proj.entities.length, proj.calibration.ppm]);

  const undo = () => {
    if (history.current.length <= 1) return;
    const current = history.current.pop();
    if (!current) return;
    const prev = history.current[history.current.length - 1];
    if (prev) {
      future.current.push(current);
      setProj({ ...prev, entities: [...prev.entities] });
    }
  };

  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push({ ...proj, entities: [...proj.entities] });
    setProj({ ...next, entities: [...next.entities] });
  };

  return { undo, redo };
}
