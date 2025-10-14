export function isTransactionSuccess(t: unknown) {
  const tt = t as Record<string, unknown>
  const s = (tt?.status || '').toString().toLowerCase()
  if (s === 'completed' || s === 'success') return true
  const et = (tt?.event_type || '').toString().toLowerCase()
  if (et.includes('completed') || et.includes('success')) return true
  return false
}

export function computeTransactionTotals(txs: Array<unknown>, resp: unknown) {
  const isSuccess = isTransactionSuccess
  const txList = txs as Array<Record<string, unknown>>
  const total_bought_credits = txList.reduce((acc, t) => {
    const credits = typeof t.credits === 'number' ? t.credits : 0
    const et = (t.event_type || '').toString().toLowerCase()
    if (et.includes('subscription') || et.includes('subs') || et.includes('task')) return acc
    return acc + (credits > 0 && isSuccess(t) ? credits : 0)
  }, 0)

  const total_subscription_credits = txList.reduce((acc, t) => {
    const credits = typeof t.credits === 'number' ? t.credits : 0
    const et = (t.event_type || '').toString().toLowerCase()
    if (et.includes('subscription') && isSuccess(t) && credits > 0) return acc + credits
    return acc
  }, 0)

  const r = resp as Record<string, unknown> | null
  const total_spent_credits = r?.total_spent_credits as number | undefined

  const total_subscription_usd = txList.reduce((acc, t) => {
    const et = (t.event_type || '').toString().toLowerCase()
    const amount = typeof t.amount_usd === 'number' ? t.amount_usd : 0
    return acc + (et.includes('subscription') && isSuccess(t) ? amount : 0)
  }, 0)

  return { total_bought_credits, total_spent_credits, total_subscription_usd, total_subscription_credits }
}

