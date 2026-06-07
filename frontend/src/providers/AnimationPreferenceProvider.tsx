import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { shouldReduceDashboardMotion } from '../modules/dashboard/dashboardAnimation';

type MotionConfigReducedMotion = 'always' | 'never' | 'user';

type AnimationPreferenceContextValue = {
  prefersReducedMotion: boolean;
  shouldReduceDashboardMotion: boolean;
  motionConfigReducedMotion: MotionConfigReducedMotion;
};

const fallbackAnimationPreference: AnimationPreferenceContextValue = {
  prefersReducedMotion: false,
  shouldReduceDashboardMotion: false,
  motionConfigReducedMotion: 'never',
};

const AnimationPreferenceContext = createContext<AnimationPreferenceContextValue>(fallbackAnimationPreference);

export function AnimationPreferenceProvider({ children }: { children: ReactNode }) {
  const framerPrefersReducedMotion = useReducedMotion();
  const prefersReducedMotion = framerPrefersReducedMotion ?? false;
  const reduceDashboardMotion = shouldReduceDashboardMotion(prefersReducedMotion);

  const value = useMemo<AnimationPreferenceContextValue>(() => ({
    prefersReducedMotion,
    shouldReduceDashboardMotion: reduceDashboardMotion,
    motionConfigReducedMotion: reduceDashboardMotion ? 'always' : 'never',
  }), [prefersReducedMotion, reduceDashboardMotion]);

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
