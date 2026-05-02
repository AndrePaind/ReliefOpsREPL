import { useState } from "react";
import {
  useListVolunteers, getListVolunteersQueryKey,
  useUpdateVolunteer,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Car, CheckCircle, Clock, XCircle, ClipboardList } from "lucide-react";
import { toast } from "sonner";

const AVAILABILITY_FILTERS = ["All", "Available", "Busy", "Offline"] as const;

function availabilityStyle(status: string) {
  switch (status) {
    case "Available": return { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle, iconColor: "text-emerald-600" };
    case "Busy": return { bg: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, iconColor: "text-amber-600" };
    case "Offline": return { bg: "bg-slate-100 text-slate-600 border-slate-200", icon: XCircle, iconColor: "text-slate-400" };
    default: return { bg: "bg-slate-100 text-slate-600 border-slate-200", icon: XCircle, iconColor: "text-slate-400" };
  }
}

export default function VolunteerList() {
  const [availFilter, setAvailFilter] = useState<string>("All");
  const [vehicleFilter, setVehicleFilter] = useState<string>("All");
  const queryClient = useQueryClient();

  const { data: volunteers, isLoading, isError } = useListVolunteers(undefined, {
    query: { queryKey: getListVolunteersQueryKey() },
  });
  const updateVolunteer = useUpdateVolunteer();

  const handleStatusChange = (volunteerId: string, status: string) => {
    updateVolunteer.mutate(
      { volunteerId, data: { availabilityStatus: status as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVolunteersQueryKey() });
          toast.success("Availability updated");
        },
        onError: () => toast.error("Failed to update volunteer"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-2" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError || !volunteers) {
    return <div className="p-8 text-center text-destructive">Failed to load volunteers.</div>;
  }

  let filtered = volunteers as any[];
  if (availFilter !== "All") filtered = filtered.filter((v) => v.availabilityStatus === availFilter);
  if (vehicleFilter === "Yes") filtered = filtered.filter((v) => v.hasVehicle);
  if (vehicleFilter === "No") filtered = filtered.filter((v) => !v.hasVehicle);

  const available = volunteers.filter((v: any) => v.availabilityStatus === "Available").length;
  const busy = volunteers.filter((v: any) => v.availabilityStatus === "Busy").length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Volunteers</h1>
          <p className="text-slate-500 mt-1">
            {available} available · {busy} busy · {volunteers.length} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-2">
          {AVAILABILITY_FILTERS.map((f) => (
            <Button
              key={f}
              variant={availFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setAvailFilter(f)}
              data-testid={`filter-avail-${f}`}
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 border-l pl-3">
          {(["All", "Yes", "No"] as const).map((f) => (
            <Button
              key={f}
              variant={vehicleFilter === f ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setVehicleFilter(f)}
              data-testid={`filter-vehicle-${f}`}
            >
              <Car className="h-3.5 w-3.5 mr-1" />
              {f === "All" ? "Any" : f === "Yes" ? "Has Vehicle" : "No Vehicle"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No volunteers found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your filters.</p>
          </div>
        ) : (
          filtered.map((vol: any) => {
            const { bg, icon: Icon, iconColor } = availabilityStyle(vol.availabilityStatus);
            return (
              <Card key={vol.id} className="bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow" data-testid={`card-volunteer-${vol.id}`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                        {vol.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{vol.fullName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {vol.hasVehicle && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 gap-1">
                              <Car className="h-3 w-3" /> Vehicle
                            </Badge>
                          )}
                          {vol.activeTasks > 0 && (
                            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200 gap-1">
                              <ClipboardList className="h-3 w-3" /> {vol.activeTasks} task{vol.activeTasks !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${bg} text-xs gap-1`}>
                      <Icon className={`h-3 w-3 ${iconColor}`} />
                      {vol.availabilityStatus}
                    </Badge>
                  </div>
                  <Select value={vol.availabilityStatus} onValueChange={(v) => handleStatusChange(vol.id, v)}>
                    <SelectTrigger className="h-8 text-xs" data-testid={`select-availability-${vol.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Busy">Busy</SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
