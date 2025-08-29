import { useEffect, useState, useRef } from "react";

export function useWindowSize() {
  const [size, setSize] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Use the actual container dimensions (already accounts for padding)
      setSize({ w: rect.width, h: rect.height });
    };
    
    // Initial size
    onResize();
    
    // Listen for window resize
    window.addEventListener("resize", onResize);
    
    // Use ResizeObserver for more accurate container size tracking
    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
    };
  }, []);

  return { size, containerRef };
}
