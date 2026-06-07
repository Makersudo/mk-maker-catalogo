import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export function AnimatedCounter({
  value,
  format = (current) => Math.round(current).toLocaleString('pt-BR'),
}: {
  value: number;
  format?: (value: number) => string;
}) {
  const reducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayed(value);
      return;
    }

    const startedAt = performance.now();
    const initial = displayed;
    const duration = 550;
    let frame = 0;

    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(initial + (value - initial) * eased);
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, value]);

  return <>{format(displayed)}</>;
}
