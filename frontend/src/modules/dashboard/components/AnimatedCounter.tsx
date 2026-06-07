import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { dashboardAnimation } from '../dashboardAnimation';

export function AnimatedCounter({
  value,
  format = (current) => Math.round(current).toLocaleString('pt-BR'),
  durationMs = dashboardAnimation.counterDurationMs,
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
    let timer = 0;

    const update = () => {
      const now = performance.now();
      const progress = Math.min((now - startedAt) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(initial + (value - initial) * eased);
      if (progress < 1) timer = window.setTimeout(update, dashboardAnimation.counterFrameMs);
    };
    timer = window.setTimeout(update, dashboardAnimation.counterFrameMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, reducedMotion, value]);

  return <>{format(displayed)}</>;
}
