import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class lists with clsx semantics and tailwind-merge deduping.
 * Exported from @poliverai/intl so it's available across apps/libs.
 */
export function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

export default cn;
