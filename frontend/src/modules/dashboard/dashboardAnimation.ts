export interface DashboardAnimationConfig {
  pageDuration: number;
  cardDuration: number;
  chartDuration: number;
  compactChartDuration: number;
  progressDuration: number;
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
  pageDuration: 1.2,
  cardDuration: 1.4,
  chartDuration: 2.8,
  compactChartDuration: 1.8,
  progressDuration: 1.8,
  counterDurationMs: 2200,
  counterFrameMs: 16,
  cardStagger: 0.12,
  barDelayStep: 0.08,
  compactBarDelayStep: 0.04,
  maxElementDelay: 0.6,
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
