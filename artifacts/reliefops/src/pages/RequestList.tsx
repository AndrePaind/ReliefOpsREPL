import { useListRequests } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus, Calendar, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";

export default function RequestList() {
  const { data: requests, isLoading, isError } = useListRequests();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !requests) {
    return <div className="p-8 text-center text-destructive">Failed to load requests.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Supply Requests</h1>
          <p className="text-slate-500 mt-1">Manage and track incoming needs across hubs.</p>
        </div>
        <Link href="/requests/new">
          <Button className="w-full sm:w-auto shadow-sm active-elevate-2">
            <Plus className="mr-2 h-4 w-4" /> Create Request
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <Link key={request.id} href={`/requests/${request.id}`}>
            <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer border-slate-200 hover:border-primary group active-elevate-2">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900 text-lg">REQ-{request.id.substring(0, 6).toUpperCase()}</h3>
                      <PriorityBadge priority={request.priority} />
                      <StatusBadge status={request.status} />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{request.requestingHub.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{format(new Date(request.createdAt), 'MMM d, yyyy - HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex items-center justify-end">
                    <Button variant="ghost" size="sm" className="group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {requests.length === 0 && (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No requests found</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">There are currently no supply requests in the system.</p>
        </div>
      )}
    </div>
  );
}
