import { useState, useCallback } from "react";
import { useParams, Link } from "wouter";
import {
  useGetHub, getGetHubQueryKey,
  useGetHubStock, getGetHubStockQueryKey,
  useDeleteStockEntry,
  useUpdateStockEntry,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Package, Scan, Upload, ArrowLeft, AlertTriangle, Trash2, Calendar } from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { StockUpload } from "@/components/StockUpload";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { AddStockDialog } from "@/components/AddStockDialog";

function ExpiryWarning({ expiryDate }: { expiryDate: string | null | undefined }) {
  if (!expiryDate) return null;
  const days = differenceInDays(parseISO(expiryDate), new Date());
  if (days > 30) return null;
  const color = days <= 10 ? "bg-red-100 text-red-700 border-red-200" : "bg-yellow-100 text-yellow-700 border-yellow-200";
  return (
    <Badge variant="outline" className={`${color} text-xs gap-1`}>
      <Calendar className="h-3 w-3" />
      Expires in {days}d
    </Badge>
  );
}

export default function HubDetail() {
  const { hubId } = useParams<{ hubId: string }>();
  const queryClient = useQueryClient();
  const [scanOpen, setScanOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  const { data: hub, isLoading: hubLoading } = useGetHub(hubId, {
    query: { enabled: !!hubId, queryKey: getGetHubQueryKey(hubId) },
  });
  const { data: stock, isLoading: stockLoading } = useGetHubStock(hubId, {
    query: { enabled: !!hubId, queryKey: getGetHubStockQueryKey(hubId) },
  });

  const deleteStock = useDeleteStockEntry();

  const handleDeleteStock = async (stockId: string) => {
    deleteStock.mutate(
      { hubId, stockId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetHubStockQueryKey(hubId) });
          toast.success("Stock entry removed");
        },
        onError: () => toast.error("Failed to delete stock entry"),
      }
    );
  };

  const handleScanResult = useCallback((barcode: string) => {
    setScannedBarcode(barcode);
    setScanOpen(false);
    setAddStockOpen(true);
    toast.success(`Barcode scanned: ${barcode}`);
  }, []);

  if (hubLoading || stockLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!hub) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <MapPin className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Hub not found</h2>
        <Link href="/hubs"><Button variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />Back to Hubs</Button></Link>
      </div>
    );
  }

  const stockList = stock ?? [];
  const totalItems = stockList.reduce((sum, s) => sum + s.quantity, 0);
  const lowStockCount = stockList.filter((s) => s.quantity < 10 && s.quantity > 0).length;
  const expiryWarningCount = stockList.filter((s) => {
    if (!s.expiryDate) return false;
    const days = differenceInDays(parseISO(s.expiryDate as string), new Date());
    return days <= 30;
  }).length;

  const categoryColors: Record<string, string> = {
    Medicine: "bg-blue-100 text-blue-700",
    Food: "bg-emerald-100 text-emerald-700",
    Hygiene: "bg-purple-100 text-purple-700",
    "First Aid": "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <Link href="/hubs">
          <Button variant="ghost" className="-ml-2 mb-4 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> All Hubs
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{hub.name}</h1>
            {hub.address && (
              <p className="text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {hub.address}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={scanOpen} onOpenChange={setScanOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-scan-barcode">
                  <Scan className="h-4 w-4" /> Scan Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Scan Barcode</DialogTitle>
                </DialogHeader>
                <BarcodeScanner onResult={handleScanResult} />
              </DialogContent>
            </Dialog>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-csv-import-open">
                  <Upload className="h-4 w-4" /> Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Import Stock from CSV</DialogTitle>
                </DialogHeader>
                <StockUpload hubId={hubId} onSuccess={() => setUploadOpen(false)} />
              </DialogContent>
            </Dialog>

            <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-stock">
                  <Package className="h-4 w-4" /> Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add / Update Stock</DialogTitle>
                </DialogHeader>
                <AddStockDialog
                  hubId={hubId}
                  prefilledBarcode={scannedBarcode ?? undefined}
                  onSuccess={() => { setAddStockOpen(false); setScannedBarcode(null); }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-600">Total Units</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalItems.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">across {stockList.length} item types</p>
          </CardContent>
        </Card>
        <Card className={`shadow-sm border ${lowStockCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className={`text-sm font-semibold ${lowStockCount > 0 ? "text-red-700" : "text-slate-600"}`}>Low Stock Items</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${lowStockCount > 0 ? "text-red-500" : "text-slate-400"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${lowStockCount > 0 ? "text-red-700" : "text-slate-900"}`}>{lowStockCount}</div>
            <p className={`text-xs mt-1 ${lowStockCount > 0 ? "text-red-600" : "text-slate-500"}`}>items with quantity &lt; 10</p>
          </CardContent>
        </Card>
        <Card className={`shadow-sm border ${expiryWarningCount > 0 ? "bg-yellow-50 border-yellow-200" : "bg-white border-slate-200"}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className={`text-sm font-semibold ${expiryWarningCount > 0 ? "text-yellow-700" : "text-slate-600"}`}>Expiry Warnings</CardTitle>
            <Calendar className={`h-4 w-4 ${expiryWarningCount > 0 ? "text-yellow-500" : "text-slate-400"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${expiryWarningCount > 0 ? "text-yellow-700" : "text-slate-900"}`}>{expiryWarningCount}</div>
            <p className={`text-xs mt-1 ${expiryWarningCount > 0 ? "text-yellow-600" : "text-slate-500"}`}>expiring within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-lg">Inventory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stockList.length === 0 ? (
            <div className="text-center p-12">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No stock recorded</h3>
              <p className="text-slate-500 mt-2">Add items manually or import a CSV.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-600">
                    <th className="px-6 py-3 text-left font-semibold">Item</th>
                    <th className="px-6 py-3 text-left font-semibold">Category</th>
                    <th className="px-6 py-3 text-right font-semibold">Quantity</th>
                    <th className="px-6 py-3 text-left font-semibold">Expiry</th>
                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockList.map((entry) => {
                    const isLow = entry.quantity < 10;
                    return (
                      <tr key={entry.id} className={`hover:bg-slate-50 transition-colors ${isLow ? "bg-red-50/50" : ""}`} data-testid={`row-stock-${entry.id}`}>
                        <td className="px-6 py-3">
                          <div className="font-medium text-slate-900">{entry.item?.name ?? "Unknown"}</div>
                          {entry.item?.barcode && <div className="text-xs text-slate-400 font-mono">{entry.item.barcode}</div>}
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant="outline" className={`text-xs ${categoryColors[entry.item?.category ?? ""] ?? "bg-slate-100 text-slate-600"}`}>
                            {entry.item?.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className={`font-bold text-lg ${isLow ? "text-red-600" : "text-slate-900"}`}>{entry.quantity}</span>
                          {isLow && <AlertTriangle className="inline ml-1 h-3.5 w-3.5 text-red-500" />}
                          <span className="text-xs text-slate-400 ml-1">{entry.item?.unit}</span>
                        </td>
                        <td className="px-6 py-3">
                          {entry.expiryDate ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-600 text-xs">{format(parseISO(entry.expiryDate as string), "dd MMM yyyy")}</span>
                              <ExpiryWarning expiryDate={entry.expiryDate as string} />
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteStock(entry.id)}
                            data-testid={`button-delete-stock-${entry.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
