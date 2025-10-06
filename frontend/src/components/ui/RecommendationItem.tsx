type Recommendation = { suggestion?: string; article?: string | number }
export default function RecommendationItem({ suggestion, article }: Recommendation) {
  return <li>{suggestion} <span className="text-xs text-gray-500">({article})</span></li>
}
