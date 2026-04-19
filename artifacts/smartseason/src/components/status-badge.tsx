import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-0">Completed</Badge>;
    case "at_risk":
      return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-0">At Risk</Badge>;
    case "active":
      return <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-0">Active</Badge>;
    default:
      return <Badge variant="secondary" className="capitalize">{status.replace("_", " ")}</Badge>;
  }
}

const STAGE_ORDER = ["planted", "growing", "ready", "harvested"];

export function StageProgress({ currentStage }: { currentStage: string }) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  
  return (
    <div className="flex items-center gap-1.5 w-full max-w-[200px]">
      {STAGE_ORDER.map((stage, idx) => {
        const isPassed = idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        return (
          <div key={stage} className="flex-1 flex flex-col gap-1" title={stage}>
            <div 
              className={cn(
                "h-2 w-full rounded-full transition-colors",
                isPassed ? "bg-primary" : "bg-muted",
                isCurrent && "bg-primary ring-2 ring-primary/20 ring-offset-1"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  return <Badge variant="outline" className="capitalize">{stage}</Badge>;
}