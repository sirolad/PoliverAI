import { getPlatformStorage, isWebPlatform } from '@poliverai/intl';

const PENDING_PAYMENT_RETURN_KEY = '@poliverai/pending-payment-return';

export type PendingPaymentReturn = {
  session_id?: string | null;
  status?: string | null;
  savedAt: number;
};

function normalizePendingPaymentReturn(
  value: Partial<PendingPaymentReturn> | null | undefined
): PendingPaymentReturn | null {
  if (!value) return null;

  const session_id =
    typeof value.session_id === 'string' && value.session_id.trim() !== ''
      ? value.session_id
      : null;
  const status =
    typeof value.status === 'string' && value.status.trim() !== ''
      ? value.status
      : null;
  const savedAt =
    typeof value.savedAt === 'number' && Number.isFinite(value.savedAt)
      ? value.savedAt
      : Date.now();

  if (!session_id && !status) {
    return null;
  }

  return {
    session_id,
    status,
    savedAt,
  };
}

export async function savePendingPaymentReturn(
  value: Partial<PendingPaymentReturn>
): Promise<void> {
  const normalized = normalizePendingPaymentReturn(value);
  if (!normalized) return;

  const storage = getPlatformStorage();
  await storage.setItem(PENDING_PAYMENT_RETURN_KEY, JSON.stringify(normalized));
}

export async function getPendingPaymentReturn(): Promise<PendingPaymentReturn | null> {
  const storage = getPlatformStorage();
  const raw = await storage.getItem(PENDING_PAYMENT_RETURN_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingPaymentReturn>;
    return normalizePendingPaymentReturn(parsed);
  } catch {
    return null;
  }
}

export async function clearPendingPaymentReturn(): Promise<void> {
  const storage = getPlatformStorage();
  await storage.removeItem(PENDING_PAYMENT_RETURN_KEY);
}

export function readPaymentReturnFromWebLocation():
  | { session_id?: string; status?: string }
  | null {
  if (!isWebPlatform() || typeof window === 'undefined') {
    return null;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get('session_id') ?? undefined;
    const status = params.get('status') ?? undefined;
    return session_id || status ? { session_id, status } : null;
  } catch {
    return null;
  }
}
