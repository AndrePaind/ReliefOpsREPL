import { useListHubs } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Package, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HubList() {
  const { data: hubs, isLoading, isError } = useListHubs();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !hubs) {
    return <div className="p-8 text-center text-destructive">Failed to load hubs.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Logistics Hubs</h1>
          <p className="text-slate-500 mt-1">Manage inventory across your network.</p>
        </div>
        <Button className="w-full sm:w-auto shadow-sm active-elevate-2">
          <MapPin className="mr-2 h-4 w-4" /> Add New Hub
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hubs.map((hub) => (
          <Link key={hub.id} href={`/hubs/${hub.id}`}>
            <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer border-slate-200 hover:border-primary group active-elevate-2 overflow-hidden flex flex-col h-full">
              <div className="h-32 bg-slate-100 relative">
                {hub.imageUrl ? (
                  <img src={hub.imageUrl} alt={hub.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-slate-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <h3 className="absolute bottom-3 left-4 text-white font-bold text-lg">{hub.name}</h3>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <Navigation className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                    <span className="line-clamp-2">{hub.address || "No address provided"}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600 group-hover:text-primary transition-colors flex items-center gap-1.5">
                    View Inventory <Package className="h-4 w-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {hubs.length === 0 && (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
          <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No hubs found</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">There are no logistics hubs in your network yet. Create one to start managing stock.</p>
        </div>
      )}
    </div>
  );
}
