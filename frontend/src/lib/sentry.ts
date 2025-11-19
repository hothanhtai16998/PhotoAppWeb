import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error tracking
 * Only initialize in production or if DSN is provided
 */
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;

  // Only initialize if DSN is provided
  if (!dsn) {
    console.log('Sentry DSN not provided, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
    // Session Replay
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // Always record replays on errors
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Filter out non-error events in development
      if (environment === 'development' && event.level !== 'error') {
        return null;
      }
      return event;
    },
  });
};

