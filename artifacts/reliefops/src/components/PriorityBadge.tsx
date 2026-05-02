import { Badge } from "@/components/ui/badge";
import { SupplyRequestPriority } from "@workspace/api-client-react";

export function PriorityBadge({ priority, className }: { priority: SupplyRequestPriority, className?: string }) {
  const getVariants = () => {
    switch (priority) {
      case "Critical":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent";
      case "Urgent":
        return "bg-orange-500 text-white hover:bg-orange-600 border-transparent";
      case "Medium":
        return "bg-amber-400 text-amber-950 hover:bg-amber-500 border-transparent";
      case "Low":
        return "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent";
      default:
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
    }
  };

  return (
    <Badge className={`${getVariants()} ${className || ""}`} variant="outline">
      {priority}
    </Badge>
  );
}
