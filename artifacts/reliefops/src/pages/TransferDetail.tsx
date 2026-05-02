import { useParams, Link } from "wouter";
import {
  useGetTransfer, getGetTransferQueryKey,
  useUpdateTransfer, getListTransfersQueryKey,
  useListVolunteers, getListVolunteersQueryKey,
  useCreateTask, getListTasksQueryKey,
  useUpdateTask,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Truck, MapPin, Package, Users, ArrowRight, Clock, Plus, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const TRANSFER_STATUSES = ["Planned", "Dispatched", "Delivered"] as const;

export default function TransferDetail() {
  const { transferId } = useParams<{ transferId: string }>();
  const queryClient = useQueryClient();

  const { data: transfer, isLoading } = useGetTransfer(transferId, {
    query: { enabled: !!transferId, queryKey: getGetTransferQueryKey(transferId) },
  });
  const { data: volunteers } = useListVolunteers(undefined, {
    query: { queryKey: getListVolunteersQueryKey() },
  });

  const updateTransfer = useUpdateTransfer();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const handleStatusChange = (status: string) => {
    const isDispatching = status === "Dispatched" && (transfer as any)?.status !== "Dispatched";
    updateTransfer.mutate(
      { transferId, data: { status: status as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTransferQueryKey(transferId) });
          queryClient.invalidateQueries({ queryKey: getListTransfersQueryKey() });
          toast.success(isDispatching ? "Transfer dispatched — stock reduced at source hub" : `Status updated to ${status}`);
        },
        onError: () => toast.error("Failed to update transfer"),
      }
    );
  };

  const handleAssignVolunteer = (taskId: string, volunteerId: string) => {
    updateTask.mutate(
      { taskId, data: { volunteerId, status: "Assigned" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTransferQueryKey(transferId) });
          toast.success("Volunteer assigned");
        },
        onError: () => toast.error("Failed to assign volunteer"),
      }
    );
  };

  const handleAddTask = (type: string) => {
    createTask.mutate(
      { data: { transferId, type: type as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTransferQueryKey(transferId) });
          toast.success("Task created");
        },
        onError: () => toast.error("Failed to create task"),
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

  if (!transfer) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Truck className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Transfer not found</h2>
        <Link href="/transfers"><Button variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></Link>
      </div>
    );
  }

  const t = transfer as any;
  const availableVols = (volunteers ?? [] as any[]).filter((v: any) => v.availabilityStatus === "Available");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link href="/transfers">
          <Button variant="ghost" className="-ml-2 mb-4 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> All Transfers
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                TRF-{t.id.substring(0, 6).toUpperCase()}
              </h1>
              <StatusBadge status={t.status} />
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="font-medium">{t.fromHub?.name ?? "Unknown"}</span>
              <ArrowRight className="h-4 w-4" />
              <span className="font-medium">{t.toHub?.name ?? "Unknown"}</span>
              {t.etaMinutes != null && (
                <span className="ml-2 flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4" /> {t.etaMinutes} min ETA
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={t.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40" data-testid="select-transfer-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSFER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {t.status !== "Dispatched" && (
        <Card className="bg-amber-50 border-amber-200 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              Setting status to <strong>Dispatched</strong> will automatically reduce stock at {t.fromHub?.name ?? "the source hub"}.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Items */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5" /> Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(t.items ?? []).length === 0 ? (
              <div className="p-8 text-center text-slate-500">No items</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(t.items ?? []).map((item: any) => (
                  <div key={item.id} className="px-6 py-3 flex items-center justify-between" data-testid={`row-transfer-item-${item.id}`}>
                    <div>
                      <p className="font-medium text-slate-900">{item.item?.name ?? item.itemId}</p>
                      <p className="text-xs text-slate-500">{item.item?.category}</p>
                    </div>
                    <span className="font-bold text-slate-900">{item.quantity} <span className="text-xs text-slate-400 font-normal">{item.item?.unit}</span></span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Tasks</CardTitle>
            <div className="flex gap-1">
              {(["Pickup", "Delivery/Transfer"] as const).map((type) => (
                <Button key={type} variant="outline" size="sm" onClick={() => handleAddTask(type)} data-testid={`button-add-task-${type}`}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> {type === "Pickup" ? "Pickup" : "Delivery"}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(t.tasks ?? []).length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No tasks yet. Add pickup or delivery tasks.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(t.tasks ?? []).map((task: any) => (
                  <div key={task.id} className="px-6 py-3 space-y-2" data-testid={`row-task-${task.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700">{task.type}</Badge>
                        <Badge variant="outline" className={`text-xs ${task.status === "Done" ? "bg-emerald-100 text-emerald-700" : task.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{task.status}</Badge>
                      </div>
                    </div>
                    {!task.volunteerId ? (
                      <Select onValueChange={(v) => handleAssignVolunteer(task.id, v)}>
                        <SelectTrigger className="h-8 text-xs" data-testid={`select-volunteer-${task.id}`}>
                          <SelectValue placeholder="Assign volunteer…" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVols.map((v: any) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.fullName}{v.hasVehicle ? " (vehicle)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-slate-700 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {task.volunteer?.fullName ?? task.volunteerId}
                        {task.volunteer?.hasVehicle && <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">Vehicle</Badge>}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
