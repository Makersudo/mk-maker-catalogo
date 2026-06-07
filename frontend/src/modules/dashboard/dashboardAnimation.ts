export interface DashboardAnimationConfig {
  pageDuration: number;
  cardDuration: number;
  chartDuration: number;
  compactChartDuration: number;
  counterDurationMs: number;
  counterFrameMs: number;
  cardStagger: number;
  barDelayStep: number;
  compactBarDelayStep: number;
  maxElementDelay: number;
  easeOut: readonly [number, number, number, number];
  respectReducedMotion: boolean;
}

export const dashboardAnimation = {
  pageDuration: 20,
  cardDuration: 24,
  chartDuration: 36,
  compactChartDuration: 24,
  counterDurationMs: 32000,
  counterFrameMs: 80,
  cardStagger: 1.6,
  barDelayStep: 1.35,
  compactBarDelayStep: 0.75,
  maxElementDelay: 12,
  easeOut: [0.16, 1, 0.3, 1],
  respectReducedMotion: true,
} as const satisfies DashboardAnimationConfig;

/**
 * Returns whether dashboard-specific animation should be reduced.
 *
 * Unknown motion preference is treated as "no reduced-motion request" so the
 * dashboard still animates after mount in browsers where the preference is not
 * available yet. Set `respectReducedMotion` to false only for controlled demos.
 */
export function shouldReduceDashboardMotion(
  prefersReducedMotion: boolean | null | undefined,
  config: Pick<DashboardAnimationConfig, 'respectReducedMotion'> = dashboardAnimation,
) {
  return config.respectReducedMotion && (prefersReducedMotion ?? false);
}
