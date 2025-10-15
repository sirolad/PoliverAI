export function extractErrorStatus(err: unknown): number | null {
  try {
    if (typeof err === 'object' && err !== null) {
      const anyObj = err as Record<string, unknown>;
      const status = anyObj.status ?? (anyObj.response && (anyObj.response as Record<string, unknown>).status);
      if (typeof status === 'number') return status;
      if (typeof status === 'string') return parseInt(status, 10) || null;
    }
  } catch {
    // ignore
  }
  return null;
}

export function extractErrorMessage(err: unknown): string | null {
  try {
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err !== null) {
      const anyObj = err as Record<string, unknown>;
      const msg = anyObj.message ?? anyObj.error ?? anyObj.detail;
      if (typeof msg === 'string') return msg;
    }
  } catch {
    // ignore
  }
  return null;
}
