import * as Sentry from '@sentry/react-native';

type ReportContext = {
  action: string;
  extra?: Record<string, unknown>;
};

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const message =
      (typeof obj.message === 'string' && obj.message) ||
      (typeof obj.code === 'string' && obj.code) ||
      'Unknown error';
    const wrapped = new Error(message);
    Object.assign(wrapped, obj);
    return wrapped;
  }
  return new Error(typeof err === 'string' ? err : 'Unknown error');
}

export function reportError(err: unknown, context: ReportContext): void {
  const error = toError(err);

  Sentry.addBreadcrumb({
    category: 'app.error',
    message: context.action,
    level: 'error',
    data: context.extra,
  });

  Sentry.captureException(error, {
    tags: { action: context.action },
    contexts: context.extra ? { extra: context.extra } : undefined,
  });

  if (__DEV__) {
    console.error(`[reportError] ${context.action}`, error, context.extra);
  }
}
