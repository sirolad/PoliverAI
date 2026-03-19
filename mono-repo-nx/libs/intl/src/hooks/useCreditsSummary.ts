export type CreditsSummaryValues = {
  subscriptionUsd: number
  purchasedUsd: number
  spentUsd: number
}

export default function useCreditsSummary(subscriptionCredits: number, purchasedCredits: number, totalSpentCredits: number): CreditsSummaryValues {
  const usdPerCredit = 0.1
  return {
    subscriptionUsd: subscriptionCredits * usdPerCredit,
    purchasedUsd: purchasedCredits * usdPerCredit,
    spentUsd: totalSpentCredits * usdPerCredit,
  }
}
