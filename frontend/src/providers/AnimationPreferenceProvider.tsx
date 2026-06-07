import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { shouldReduceDashboardMotion } from '../modules/dashboard/dashboardAnimation';

type MotionConfigReducedMotion = 'always' | 'never' | 'user';

type AnimationPreferenceContextValue = {
  prefersReducedMotion: boolean;
  shouldReduceDashboardMotion: boolean;
  motionConfigReducedMotion: MotionConfigReducedMotion;
  durationScale: number;
  paused: boolean;
};

const fallbackAnimationPreference: AnimationPreferenceContextValue = {
  prefersReducedMotion: false,
  shouldReduceDashboardMotion: false,
  motionConfigReducedMotion: 'never',
  durationScale: 1,
  paused: false,
};

const AnimationPreferenceContext = createContext<AnimationPreferenceContextValue>(fallbackAnimationPreference);

function getDocumentHidden() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

export function AnimationPreferenceProvider({
  children,
  durationScale = 1,
}: {
  children: ReactNode;
  durationScale?: number;
}) {
  const framerPrefersReducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(getDocumentHidden);
  const prefersReducedMotion = framerPrefersReducedMotion ?? false;
  const reduceDashboardMotion = shouldReduceDashboardMotion(prefersReducedMotion);

  useEffect(() => {
    const syncVisibility = () => setPaused(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, []);

  const value = useMemo<AnimationPreferenceContextValue>(() => ({
    prefersReducedMotion,
    shouldReduceDashboardMotion: reduceDashboardMotion,
    motionConfigReducedMotion: reduceDashboardMotion ? 'always' : 'never',
    durationScale,
    paused,
  }), [durationScale, paused, prefersReducedMotion, reduceDashboardMotion]);

  return (
    <AnimationPreferenceContext.Provider value={value}>
      <MotionConfig reducedMotion={value.motionConfigReducedMotion}>
        {children}
      </MotionConfig>
    </AnimationPreferenceContext.Provider>
  );
}

export function useAnimationPreference() {
  return useContext(AnimationPreferenceContext);
}
