// Analytics client and utilities
export { analytics } from './client'
export type { AnalyticsEvent, EventData } from './client'

// Analytics queries and data fetching
export {
  getUserEngagementMetrics,
  getConversionFunnelData,
  getRetentionMetrics,
  getPopularChoicesAnalytics,
  getUserJourneyAnalytics,
  triggerMetricsCalculation
} from './queries'

export type {
  AnalyticsFilters,
  UserEngagementMetrics,
  ConversionFunnelData
} from './queries'

// React hooks for analytics
export {
  usePageTracking,
  useStoryTracking,
  useFeatureTracking,
  useSessionTracking,
  useConversionTracking,
  useAnalytics
} from '../hooks/useAnalyticsTracking'

// Analytics components
export { AnalyticsDashboard } from '../../components/analytics/AnalyticsDashboard'
export { AnalyticsProvider, useAnalyticsContext } from '../../components/analytics/AnalyticsProvider'
export { RetentionMetrics } from '../../components/analytics/RetentionMetrics'