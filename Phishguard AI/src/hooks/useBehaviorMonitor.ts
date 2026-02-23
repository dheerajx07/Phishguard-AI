import { useEffect, useRef, useState } from 'react';

export interface BehaviorData {
  typingSpeed: number;
  mouseJitter: number;
  timestamp: number;
}

export const useBehaviorMonitor = (isActive: boolean) => {
  const [data, setData] = useState<BehaviorData>({ typingSpeed: 0, mouseJitter: 0, timestamp: Date.now() });
  const lastKeyTime = useRef<number>(0);
  const keyIntervals = useRef<number[]>([]);
  const mousePositions = useRef<{x: number, y: number}[]>([]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = () => {
      const now = Date.now();
      if (lastKeyTime.current !== 0) {
        keyIntervals.current.push(now - lastKeyTime.current);
        if (keyIntervals.current.length > 10) keyIntervals.current.shift();
      }
      lastKeyTime.current = now;
      
      const avgSpeed = keyIntervals.current.length > 0 
        ? keyIntervals.current.reduce((a, b) => a + b, 0) / keyIntervals.current.length 
        : 0;
        
      setData(prev => ({ ...prev, typingSpeed: avgSpeed, timestamp: now }));
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePositions.current.push({ x: e.clientX, y: e.clientY });
      if (mousePositions.current.length > 20) mousePositions.current.shift();
      
      // Calculate jitter (simplified as variance in movement vector)
      let jitter = 0;
      if (mousePositions.current.length > 2) {
        const deltas = [];
        for (let i = 1; i < mousePositions.current.length; i++) {
          const d = Math.sqrt(
            Math.pow(mousePositions.current[i].x - mousePositions.current[i-1].x, 2) +
            Math.pow(mousePositions.current[i].y - mousePositions.current[i-1].y, 2)
          );
          deltas.push(d);
        }
        const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        jitter = deltas.reduce((a, b) => a + Math.abs(b - avg), 0) / deltas.length;
      }

      setData(prev => ({ ...prev, mouseJitter: jitter, timestamp: Date.now() }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isActive]);

  return data;
};
