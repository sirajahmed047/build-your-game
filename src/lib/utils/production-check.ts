/**
 * Production readiness checks
 * Validates that all required environment variables are set and no localhost URLs are used
 */

export function validateProductionConfig(): {
  isReady: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ];

  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (!value) {
      issues.push(`Missing required environment variable: ${envVar}`);
    } else if (value.includes('placeholder')) {
      issues.push(`Environment variable ${envVar} contains placeholder value`);
    } else if (value.includes('localhost')) {
      issues.push(`Environment variable ${envVar} contains localhost URL`);
    }
  });

  // Check Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
    warnings.push('Supabase URL does not appear to be a production URL');
  }

  // Check if we're in production mode
  if (process.env.NODE_ENV !== 'production') {
    warnings.push('NODE_ENV is not set to production');
  }

  // Check PostHog configuration
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!posthogKey || posthogKey.includes('placeholder')) {
    warnings.push('PostHog analytics not configured (optional for MVP)');
  }

  return {
    isReady: issues.length === 0,
    issues,
    warnings
  };
}

export function logProductionReadiness(): void {
  const check = validateProductionConfig();
  
  if (check.isReady) {
    console.log('✅ Production configuration validated successfully');
    if (check.warnings.length > 0) {
      console.warn('⚠️ Warnings:', check.warnings);
    }
  } else {
    console.error('❌ Production configuration issues found:');
    check.issues.forEach(issue => console.error(`  - ${issue}`));
    if (check.warnings.length > 0) {
      console.warn('⚠️ Additional warnings:', check.warnings);
    }
  }
}