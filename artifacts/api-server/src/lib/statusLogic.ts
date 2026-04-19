/**
 * Field status is computed based on:
 * - "completed" if stage is "harvested"
 * - "at_risk" if:
 *   - stage is "growing" and planting date is more than 90 days ago (overdue for harvest)
 *   - stage is "ready" and more than 7 days have passed since last update (stale/delayed harvest)
 *   - stage is "planted" and more than 14 days have passed since last update (no progress)
 * - "active" otherwise
 */
export function computeStatus(
  stage: "planted" | "growing" | "ready" | "harvested",
  plantingDate: Date,
  lastUpdatedAt: Date | null
): "active" | "at_risk" | "completed" {
  if (stage === "harvested") return "completed";

  const now = new Date();
  const daysSincePlanting = (now.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceUpdate = lastUpdatedAt
    ? (now.getTime() - lastUpdatedAt.getTime()) / (1000 * 60 * 60 * 24)
    : daysSincePlanting;

  if (stage === "growing" && daysSincePlanting > 90) return "at_risk";
  if (stage === "ready" && daysSinceUpdate > 7) return "at_risk";
  if (stage === "planted" && daysSinceUpdate > 14) return "at_risk";

  return "active";
}
