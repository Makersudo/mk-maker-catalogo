import { useEffect, useRef, useState } from 'react';
import { useAnimationPreference } from '../../../providers/AnimationPreferenceProvider';
import { dashboardAnimation } from '../dashboardAnimation';

type AnimatedCounterProps = {
  value: number;
  format?: (value: number) => string;
  durationMs?: number;
};

const defaultCounterFormatter = (current: number) => Math.round(current).toLocaleString('pt-BR');

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * Animates dashboard numbers with requestAnimationFrame and full cleanup.
 *
 * The visual text updates every frame, while the polite live label only changes
 * when the animation reaches the final value. This keeps the counter visible
 * without flooding assistive technology announcements.
 */
export function AnimatedCounter({
  value,
  format = defaultCounterFormatter,
  durationMs = dashboardAnimation.counterDurationMs,
}: AnimatedCounterProps) {
  const {
    durationScale,
    paused,
    shouldReduceDashboardMotion: reducedMotion,
  } = useAnimationPreference();
  const [displayed, setDisplayed] = useState(0);
  const [announced, setAnnounced] = useState(() => format(0));
  const frameRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const finalValue = Number.isFinite(value) ? value : 0;
    const scaledDuration = Math.max(1, durationMs * durationScale);

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (reducedMotion) {
      setDisplayed(finalValue);
      setAnnounced(format(finalValue));
      return;
    }

    const startValue = 0;
    let startAt = now();
    let pausedAt: number | null = paused || document.visibilityState === 'hidden' ? now() : null;
    let pausedDuration = 0;
    let completed = false;

    setDisplayed(startValue);
    setAnnounced(format(startValue));

    const cancelFrame = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const schedule = () => {
      cancelFrame();
      frameRef.current = requestAnimationFrame(tick);
    };

    const complete = () => {
      completed = true;
      cancelFrame();
      if (!mountedRef.current) return;
      setDisplayed(finalValue);
      setAnnounced(format(finalValue));
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pausedAt = now();
        cancelFrame();
        return;
      }

      if (pausedAt !== null) {
        pausedDuration += now() - pausedAt;
        pausedAt = null;
      }

      if (!completed) schedule();
    };

    function tick(timestamp: number) {
      if (!mountedRef.current || completed) return;

      if (document.visibilityState === 'hidden') {
        pausedAt = pausedAt ?? timestamp;
        cancelFrame();
        return;
      }

      const elapsed = Math.max(0, timestamp - startAt - pausedDuration);
      const progress = Math.min(elapsed / scaledDuration, 1);
      const eased = easeOutCubic(progress);
      const current = startValue + (finalValue - startValue) * eased;

      setDisplayed(current);

      if (progress >= 1) {
        complete();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    document.addEventListener('visibilitychange', handleVisibility);

    if (paused || document.visibilityState === 'hidden') {
      pausedAt = now();
    } else {
      startAt = now();
      schedule();
    }

    return () => {
      completed = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelFrame();
    };
  }, [durationMs, durationScale, format, reducedMotion, value]);

  const visualValue = format(displayed);

  return (
    <span role="timer" aria-live="polite" aria-atomic="true" aria-label={announced}>
      <span aria-hidden="true">{visualValue}</span>
    </span>
  );
}
