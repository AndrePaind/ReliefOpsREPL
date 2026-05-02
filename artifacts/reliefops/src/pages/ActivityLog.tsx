import { useListActivity, getListActivityQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Activity, Package, Truck, Users, ClipboardList, BarChart3 } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

function entityIcon(type: string) {
  switch (type) {
    case "request": return Package;
    case "transfer": return Truck;
    case "volunteer": return Users;
    case "task": return ClipboardList;
    case "stock": return BarChart3;
    default: return Activity;
  }
}

function entityColor(type: string) {
  switch (type) {
    case "request": return "bg-orange-100 text-orange-700";
    case "transfer": return "bg-blue-100 text-blue-700";
    case "volunteer": return "bg-emerald-100 text-emerald-700";
    case "task": return "bg-purple-100 text-purple-700";
    case "stock": return "bg-amber-100 text-amber-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

function actionLabel(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ActivityLog() {
  const { data: activities, isLoading, isError } = useListActivity(undefined, {
    query: { queryKey: getListActivityQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-2" />
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl w-full" />)}
        </div>
      </div>
    );
  }

  if (isError || !activities) {
    return <div className="p-8 text-center text-destructive">Failed to load activity log.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Activity Log</h1>
        <p className="text-slate-500 mt-1">Audit trail of all actions across your network.</p>
      </div>

      {activities.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
          <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No activity yet</h3>
          <p className="text-slate-500 mt-2">Actions will appear here as you use ReliefOps.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 hidden sm:block" />
          <div className="space-y-4">
            {activities.map((entry, idx) => {
              const Icon = entityIcon(entry.entityType);
              const color = entityColor(entry.entityType);
              return (
                <div
                  key={entry.id}
                  className="flex gap-4 items-start animate-in fade-in slide-in-from-left-2"
                  style={{ animationDelay: `${idx * 30}ms` }}
                  data-testid={`row-activity-${entry.id}`}
                >
                  {/* Icon dot */}
                  <div className={`hidden sm:flex h-12 w-12 rounded-full ${color} items-center justify-center shrink-0 z-10 shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`sm:hidden flex h-7 w-7 rounded-full ${color} items-center justify-center shrink-0`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <Badge variant="outline" className={`${color} text-xs border-0 font-medium`}>
                          {entry.entityType}
                        </Badge>
                        <span className="font-semibold text-slate-900">{actionLabel(entry.action)}</span>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {formatDistanceToNow(parseISO(entry.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      {entry.entityType}/{entry.entityId.substring(0, 12)}
                    </p>
                    {entry.payload && Object.keys(entry.payload as object).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(entry.payload as Record<string, string>).map(([k, v]) => (
                          <span key={k} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {k}: <strong>{String(v)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
