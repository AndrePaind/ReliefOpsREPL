import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetRequest, getGetRequestQueryKey,
  useUpdateRequest, getListRequestsQueryKey,
  useGetMatchingHubs, getGetMatchingHubsQueryKey,
  useCreateTransfer, getListTransfersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Truck, MapPin, CheckCircle, Package, AlertTriangle, CheckSquare } from "lucide-react";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const REQUEST_STATUSES = ["Draft", "Open", "Assigned", "Dispatched", "Delivered"] as const;

export default function RequestDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [createTransferOpen, setCreateTransferOpen] = useState(false);
  const [selectedHubId, setSelectedHubId] = useState<string>("");

  const { data: request, isLoading } = useGetRequest(requestId, {
    query: { enabled: !!requestId, queryKey: getGetRequestQueryKey(requestId) },
  });
  const { data: matches, isLoading: matchesLoading } = useGetMatchingHubs(requestId, {
    query: { enabled: !!requestId, queryKey: getGetMatchingHubsQueryKey(requestId) },
  });

  const updateRequest = useUpdateRequest();
  const createTransfer = useCreateTransfer();

  const handleStatusChange = (status: string) => {
    updateRequest.mutate(
      { requestId, data: { status: status as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRequestQueryKey(requestId) });
          queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey() });
          toast.success(`Status updated to ${status}`);
        },
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  const handleCreateTransfer = () => {
    if (!selectedHubId || !request) return;
    const items = ((request as any).items ?? []).map((ri: any) => ({
      itemId: ri.itemId,
      quantity: ri.quantityNeeded,
    }));
    createTransfer.mutate(
      { data: { requestId, fromHubId: selectedHubId, toHubId: (request as any).requestingHubId, items } },
      {
        onSuccess: (transfer) => {
          queryClient.invalidateQueries({ queryKey: getGetRequestQueryKey(requestId) });
          queryClient.invalidateQueries({ queryKey: getListTransfersQueryKey() });
          toast.success("Transfer created successfully");
          setCreateTransferOpen(false);
          setLocation(`/transfers/${(transfer as any).id}`);
        },
        onError: () => toast.error("Failed to create transfer"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Package className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Request not found</h2>
        <Link href="/requests"><Button variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></Link>
      </div>
    );
  }

  const req = request as any;
  const matchList = (matches ?? []) as any[];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link href="/requests">
          <Button variant="ghost" className="-ml-2 mb-4 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> All Requests
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                REQ-{req.id.substring(0, 6).toUpperCase()}
              </h1>
              <PriorityBadge priority={req.priority} />
              <StatusBadge status={req.status} />
            </div>
            <p className="text-slate-500 flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {req.requestingHub?.name ?? "Unknown Hub"} — {format(parseISO(req.createdAt), "dd MMM yyyy, HH:mm")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={req.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40" data-testid="select-request-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={createTransferOpen} onOpenChange={setCreateTransferOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-create-transfer">
                  <Truck className="h-4 w-4" /> Create Transfer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Create Transfer</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <p className="text-sm text-slate-600">Select the source hub that will supply the requested items.</p>
                  <Select value={selectedHubId} onValueChange={setSelectedHubId}>
                    <SelectTrigger data-testid="select-source-hub">
                      <SelectValue placeholder="Select source hub…" />
                    </SelectTrigger>
                    <SelectContent>
                      {matchList.map((m: any) => (
                        <SelectItem key={m.hub.id} value={m.hub.id}>
                          {m.hub.name} — {m.distanceKm.toFixed(1)} km{m.canFulfillAll ? " ✓" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full"
                    disabled={!selectedHubId || createTransfer.isPending}
                    onClick={handleCreateTransfer}
                    data-testid="button-confirm-transfer"
                  >
                    {createTransfer.isPending ? "Creating…" : "Confirm & Create Transfer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {req.notes && (
        <Card className="bg-amber-50 border-amber-200 shadow-none">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{req.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Items requested */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-lg">Items Requested</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(req.items ?? []).length === 0 ? (
              <div className="p-8 text-center text-slate-500">No items specified</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(req.items ?? []).map((ri: any) => (
                  <div key={ri.id} className="px-6 py-3 flex items-center justify-between" data-testid={`row-request-item-${ri.id}`}>
                    <div>
                      <p className="font-medium text-slate-900">{ri.item?.name ?? ri.itemId}</p>
                      <p className="text-xs text-slate-500">{ri.item?.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 text-lg">{ri.quantityNeeded}</span>
                      <span className="text-xs text-slate-400 ml-1">{ri.item?.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matching hubs */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Candidate Hubs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {matchesLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : matchList.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No matching hubs found</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {matchList.map((match: any, idx: number) => (
                  <div key={match.hub.id} className={`px-6 py-4 ${idx === 0 ? "bg-emerald-50/50" : ""}`} data-testid={`row-hub-match-${match.hub.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {idx === 0 && <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Nearest</Badge>}
                        <span className="font-semibold text-slate-900">{match.hub.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{match.distanceKm.toFixed(1)} km</span>
                        {match.canFulfillAll ? (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(match.availableItems ?? []).map((ai: any) => (
                        <span key={ai.itemId} className={`text-xs px-2 py-0.5 rounded-full border ${ai.availableQuantity >= ai.requestedQuantity ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                          {ai.itemName}: {ai.availableQuantity}/{ai.requestedQuantity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Existing transfers */}
      {(req.transfers ?? []).length > 0 && (
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" /> Transfers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {(req.transfers ?? []).map((t: any) => (
                <Link key={t.id} href={`/transfers/${t.id}`}>
                  <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors" data-testid={`row-transfer-${t.id}`}>
                    <span className="text-sm font-medium text-slate-900">TRF-{t.id.substring(0, 6).toUpperCase()}</span>
                    <StatusBadge status={t.status} />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
