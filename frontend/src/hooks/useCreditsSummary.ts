export type CreditsSummaryValues = {
  total: number
  subscriptionUsd: number
  purchasedUsd: number
  spentUsd: number
}

export default function useCreditsSummary(subscriptionCredits: number, purchasedCredits: number, totalSpentCredits: number): CreditsSummaryValues {
  const total = subscriptionCredits + purchasedCredits
  const subscriptionUsd = subscriptionCredits / 10
  const purchasedUsd = purchasedCredits / 10
  const spentUsd = totalSpentCredits / 10
  return { total, subscriptionUsd, purchasedUsd, spentUsd }
}
