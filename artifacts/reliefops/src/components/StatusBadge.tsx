import { Badge } from "@/components/ui/badge";
import { SupplyRequestStatus, TransferStatus } from "@workspace/api-client-react";

type StatusType = SupplyRequestStatus | TransferStatus | "Planned";

export function StatusBadge({ status, className }: { status: StatusType, className?: string }) {
  const getVariants = () => {
    switch (status) {
      case "Draft":
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      case "Open":
      case "Planned":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "Assigned":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
      case "Dispatched":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
      case "Delivered":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Badge className={`${getVariants()} font-medium ${className || ""}`} variant="outline">
      {status}
    </Badge>
  );
}
