import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export function AnimatedCounter({
  value,
  format = (current) => Math.round(current).toLocaleString('pt-BR'),
  durationMs = 1200,
}: {
  value: number;
  format?: (value: number) => string;
  durationMs?: number;
}) {
  const reducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayed(value);
      return;
    }

    const startedAt = performance.now();
    const initial = 0;
    setDisplayed(initial);
    let frame = 0;

    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(initial + (value - initial) * eased);
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, reducedMotion, value]);

  return <>{format(displayed)}</>;
}
