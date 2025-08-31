# Analytics System

A comprehensive analytics and engagement tracking system built on Supabase for the Interactive Story Generator.

## Overview

This analytics system provides:
- **Event Tracking**: User actions, story interactions, feature usage
- **Session Management**: User sessions with device/browser detection
- **Retention Analytics**: Cohort analysis and retention metrics
- **Engagement Metrics**: Story completion rates, choice patterns, feature usage
- **Conversion Tracking**: Premium feature attempts and upgrades
- **Real-time Dashboard**: Analytics visualization and reporting

## Architecture

### Database Tables

- `user_events` - Individual user actions and interactions
- `user_sessions` - Session tracking with device information
- `daily_metrics` - Aggregated daily engagement metrics
- `retention_cohorts` - User retention analysis by cohort
- `feature_usage` - Feature-specific usage tracking
- `conversion_events` - Premium conversion tracking

### Key Components

1. **Analytics Client** (`client.ts`) - Core tracking functionality
2. **React Hooks** (`useAnalyticsTracking.ts`) - Easy integration with React components
3. **Analytics Provider** (`AnalyticsProvider.tsx`) - App-wide analytics initialization
4. **Dashboard Components** - Visualization and reporting
5. **Query Functions** (`queries.ts`) - Data fetching and analysis

## Quick Start

### 1. Setup Analytics Provider

Wrap your app with the AnalyticsProvider:

```tsx
import { AnalyticsProvider } from '@/lib/analytics'

function App() {
  return (
    <AnalyticsProvider>
      {/* Your app content */}
    </AnalyticsProvider>
  )
}
```

### 2. Track Events in Components

Use the analytics hooks in your components:

```tsx
import { useAnalytics } from '@/lib/analytics'

function StoryComponent() {
  const { trackStoryStart, trackChoiceMade, trackStoryComplete } = useAnalytics()

  const handleStoryStart = () => {
    trackStoryStart('fantasy', 'medium', 'moderate')
  }

  const handleChoiceSelect = (choice: Choice) => {
    trackChoiceMade('trust_stranger', 'A', 1, 'fantasy')
  }

  const handleStoryComplete = () => {
    trackStoryComplete('hero_ending', 'common', 'fantasy')
  }

  // ... component logic
}
```

### 3. View Analytics Dashboard

Add the analytics dashboard to your admin area:

```tsx
import { AnalyticsDashboard } from '@/lib/analytics'

function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <AnalyticsDashboard />
    </div>
  )
}
```

## Event Types

### Core Story Events

- `story_start` - User begins a new story
- `choice_made` - User selects a choice option
- `story_complete` - User completes a story
- `story_step_viewed` - User views a story step

### Feature Usage Events

- `choice_statistics_viewed` - User views choice statistics
- `endings_gallery_viewed` - User views endings collection
- `personality_profile_viewed` - User views personality insights
- `premium_feature_attempted` - User tries to access premium feature

### Conversion Events

- `upgrade_clicked` - User clicks upgrade/premium button
- `trial_start` - User starts premium trial
- `upgrade` - User upgrades to premium
- `downgrade` - User downgrades subscription
- `churn` - User cancels subscription

### UI/UX Events

- `page_view` - User views a page
- `session_start` - User starts a session
- `session_end` - User ends a session
- `trait_impact_viewed` - User expands trait impact details

## Analytics Hooks

### useAnalytics()

Main hook providing all analytics functionality:

```tsx
const {
  // Story tracking
  trackStoryStart,
  trackChoiceMade,
  trackStoryComplete,
  
  // Feature tracking
  trackFeatureUsage,
  trackEndingsGalleryViewed,
  trackPersonalityProfileViewed,
  trackPremiumFeatureAttempt,
  trackUpgradeClick,
  
  // Session management
  endSession,
  getSessionInfo,
  
  // Conversion tracking
  trackConversion,
  
  // Generic event tracking
  track
} = useAnalytics()
```

### useStoryTracking()

Specialized hook for story-related events:

```tsx
const {
  trackStoryStart,
  trackChoiceMade,
  trackStoryComplete,
  trackChoiceStatisticsViewed
} = useStoryTracking()
```

### useFeatureTracking()

Hook for feature usage tracking:

```tsx
const {
  trackFeatureUsage,
  trackEndingsGalleryViewed,
  trackPersonalityProfileViewed,
  trackPremiumFeatureAttempt,
  trackUpgradeClick
} = useFeatureTracking()
```

## Data Queries

### Get User Engagement Metrics

```tsx
import { getUserEngagementMetrics } from '@/lib/analytics'

const metrics = await getUserEngagementMetrics('user-id', {
  startDate: new Date('2024-01-01'),
  endDate: new Date()
})

console.log(metrics)
// {
//   totalEvents: 150,
//   uniqueSessions: 12,
//   avgEventsPerSession: 12.5,
//   totalTimeSpent: 3600,
//   storiesStarted: 8,
//   storiesCompleted: 6,
//   choicesMade: 45,
//   featuresUsed: ['endings_gallery', 'choice_statistics'],
//   lastActivity: Date
// }
```

### Get Conversion Funnel Data

```tsx
import { getConversionFunnelData } from '@/lib/analytics'

const funnelData = await getConversionFunnelData({
  startDate: new Date('2024-01-01'),
  endDate: new Date()
})

console.log(funnelData)
// [
//   { step: 'Visited Site', users: 1000, conversionRate: 100 },
//   { step: 'Started Story', users: 750, conversionRate: 75 },
//   { step: 'Made Choice', users: 600, conversionRate: 60 },
//   { step: 'Completed Story', users: 400, conversionRate: 40 },
//   { step: 'Viewed Features', users: 200, conversionRate: 20 },
//   { step: 'Clicked Upgrade', users: 50, conversionRate: 5 }
// ]
```

### Get Retention Metrics

```tsx
import { getRetentionMetrics } from '@/lib/analytics'

const retentionRates = await getRetentionMetrics(new Date('2024-01-01'))
console.log(retentionRates) // [100, 45, 32, 28, 25, 23, 21, 20, ...] (31 days)
```

## Custom Event Tracking

Track custom events with additional data:

```tsx
import { analytics } from '@/lib/analytics'

// Track custom event
await analytics.track('custom_event', {
  customProperty: 'value',
  numericValue: 42,
  booleanFlag: true
})

// Track with page context
await analytics.track('button_clicked', {
  buttonText: 'Get Started',
  pageUrl: '/landing',
  section: 'hero'
})
```

## Privacy & Compliance

- **Anonymous Sessions**: Guest users tracked via session ID only
- **User Consent**: Respect user privacy preferences
- **Data Retention**: Automatic cleanup of old data
- **PII Protection**: No personally identifiable information stored
- **GDPR Compliance**: User data deletion support

## Performance Considerations

- **Async Tracking**: All events tracked asynchronously
- **Error Handling**: Graceful degradation if tracking fails
- **Batching**: Events can be batched for performance
- **Caching**: Analytics queries use materialized views
- **Rate Limiting**: Built-in protection against spam

## Database Functions

The system includes several PostgreSQL functions:

- `track_user_event()` - Record user events
- `start_user_session()` - Initialize user sessions
- `end_user_session()` - Close user sessions
- `calculate_daily_metrics()` - Aggregate daily metrics
- `calculate_retention_cohorts()` - Calculate retention rates

## Automated Tasks

Daily cron jobs handle:
- Daily metrics calculation (1 AM)
- Retention cohorts calculation (2 AM)
- Old data cleanup (configurable)

## Testing

Run analytics tests:

```bash
npm test -- src/lib/analytics/__tests__/analytics.test.ts
```

## Migration

To set up the analytics system:

1. Run the database migration:
```bash
npx supabase db push
```

2. The migration `006_analytics_system.sql` creates all necessary tables and functions.

## Troubleshooting

### Events Not Tracking

1. Check browser console for errors
2. Verify Supabase connection
3. Ensure user has proper permissions
4. Check RLS policies

### Dashboard Not Loading

1. Verify user has admin permissions
2. Check database connection
3. Ensure analytics tables exist
4. Check for JavaScript errors

### Performance Issues

1. Check database indexes
2. Verify materialized views are refreshing
3. Consider data archiving for old records
4. Monitor query performance

## Future Enhancements

- Real-time event streaming
- Advanced segmentation
- A/B testing framework
- Predictive analytics
- Custom dashboard builder
- Export functionality