import * as Sentry from '@sentry/browser';

export function initSentry(dsn: string) {
  if (!dsn) return;
  Sentry.init({
    dsn,
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/pwa-demo.nhan\.app/],
      }),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
