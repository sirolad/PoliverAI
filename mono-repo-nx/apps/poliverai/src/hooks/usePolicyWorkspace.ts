import type { ComplianceResult } from '../types/api'

export default function usePolicyWorkspace(opts: {
  persisted: unknown
  result: ComplianceResult | null
  userReportsCount: number | null
  reportFilename: string | null
}) {
  const { persisted, result, userReportsCount, reportFilename } = opts

  const showWorkInProgress = Boolean(persisted && typeof (persisted as Record<string, unknown>)['fileName'] === 'string')
  const findingsCount = result?.findings?.length ?? 0

  return { showWorkInProgress, findingsCount, userReportsCount, reportFilename }
}
