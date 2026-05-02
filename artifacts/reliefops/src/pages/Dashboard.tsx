import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { MapPin, AlertTriangle, Truck, Users, Activity as ActivityIcon, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { PriorityBadge } from "@/components/PriorityBadge";

export default function Dashboard() {
  const { data: summary, isLoading, isError } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="p-6 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5" />
        <p className="font-medium">Failed to load dashboard data. Please try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Command Center</h1>
        <p className="text-slate-500 mt-1">Real-time overview of your logistics network.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Urgent Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{summary.urgentRequests}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Require immediate attention</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Active Transfers</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{summary.activeTransfers}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">In transit right now</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Low Stock Alerts</CardTitle>
            <ActivityIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{summary.lowStockCount}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Items near depletion</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Available Volunteers</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{summary.availableVolunteers}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Ready for deployment</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white shadow-sm border-slate-200 flex flex-col">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ActivityIcon className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest events across your network</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto max-h-[400px]">
            {summary.recentActivity.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No recent activity</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-sm text-slate-900">
                          <span className="font-semibold">{activity.entityType}</span> {activity.action.replace(/_/g, ' ').toLowerCase()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-lg">Network Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600">Active Hubs</span>
                <span className="text-lg font-bold text-slate-900">{summary.totalHubs}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Critical Requests</span>
                  <span className="font-bold text-destructive">{summary.requestsByPriority["Critical"] || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Urgent Requests</span>
                  <span className="font-bold text-orange-500">{summary.requestsByPriority["Urgent"] || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Open Requests</span>
                  <span className="font-bold text-blue-600">{summary.requestsByStatus["Open"] || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/requests/new">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer group active-elevate-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Package className="h-5 w-5 text-primary group-hover:text-white" />
                </div>
                <h3 className="font-semibold text-slate-900">New Request</h3>
                <p className="text-xs text-slate-500 mt-1">Draft a supply request</p>
              </div>
            </Link>
            <Link href="/hubs">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group active-elevate-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-500 transition-colors">
                  <MapPin className="h-5 w-5 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="font-semibold text-slate-900">Manage Hubs</h3>
                <p className="text-xs text-slate-500 mt-1">View stock and locations</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
