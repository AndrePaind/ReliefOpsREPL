import { useState } from "react";
import { useListTransfers, getListTransfersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Truck, MapPin, Clock, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format, parseISO } from "date-fns";

const STATUS_FILTERS = ["All", "Planned", "Dispatched", "Delivered"] as const;

export default function TransferList() {
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const { data: transfers, isLoading, isError } = useListTransfers(undefined, {
    query: { queryKey: getListTransfersQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-2" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl w-full" />)}
        </div>
      </div>
    );
  }

  if (isError || !transfers) {
    return <div className="p-8 text-center text-destructive">Failed to load transfers.</div>;
  }

  const filtered = statusFilter === "All" ? transfers : transfers.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Transfers</h1>
          <p className="text-slate-500 mt-1">Track supplies in transit across hubs.</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
            data-testid={`filter-status-${s}`}
          >
            {s}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
            <Truck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No transfers found</h3>
            <p className="text-slate-500 mt-2">No transfers match the selected filter.</p>
          </div>
        ) : (
          filtered.map((transfer) => (
            <Link key={transfer.id} href={`/transfers/${transfer.id}`}>
              <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer border-slate-200 hover:border-primary group" data-testid={`card-transfer-${transfer.id}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-slate-900">TRF-{transfer.id.substring(0, 6).toUpperCase()}</span>
                        <StatusBadge status={transfer.status} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="font-medium">{(transfer as any).fromHub?.name ?? "Unknown"}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium">{(transfer as any).toHub?.name ?? "Unknown"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 sm:text-right">
                      {transfer.etaMinutes != null && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>ETA {transfer.etaMinutes} min</span>
                        </div>
                      )}
                      <span className="text-xs text-slate-400">{format(parseISO(transfer.createdAt), "dd MMM yyyy")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
