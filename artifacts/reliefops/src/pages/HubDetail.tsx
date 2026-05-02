import { useState, useCallback } from "react";
import { useParams, Link } from "wouter";
import {
  useGetHub, getGetHubQueryKey,
  useGetHubStock, getGetHubStockQueryKey,
  useDeleteStockEntry,
  useUpdateStockEntry,
  useUpdateHub,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Package, Scan, Upload, ArrowLeft, AlertTriangle, Trash2, Calendar, Pencil, Check, X, Settings2 } from "lucide-react";
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

interface EditingRow {
  stockId: string;
  quantity: string;
  expiryDate: string;
}

interface EditHubDialogProps {
  open: boolean;
  onClose: () => void;
  hub: { id: string; name: string; address?: string | null; lat?: number | null; lng?: number | null; imageUrl?: string | null };
}

function EditHubDialog({ open, onClose, hub }: EditHubDialogProps) {
  const queryClient = useQueryClient();
  const updateHub = useUpdateHub();
  const [name, setName] = useState(hub.name);
  const [address, setAddress] = useState(hub.address ?? "");
  const [lat, setLat] = useState(hub.lat != null ? String(hub.lat) : "");
  const [lng, setLng] = useState(hub.lng != null ? String(hub.lng) : "");
  const [imageUrl, setImageUrl] = useState(hub.imageUrl ?? "");

  const handleSave = () => {
    if (!name.trim()) { toast.error("Hub name is required"); return; }
    updateHub.mutate(
      {
        hubId: hub.id,
        data: {
          name: name.trim(),
          address: address.trim() || undefined,
          lat: lat ? parseFloat(lat) : undefined,
          lng: lng ? parseFloat(lng) : undefined,
          imageUrl: imageUrl.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetHubQueryKey(hub.id) });
          queryClient.invalidateQueries({ queryKey: ["listHubs"] });
          toast.success("Hub updated");
          onClose();
        },
        onError: () => toast.error("Failed to update hub"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Edit Hub Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Hub name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Khartoum Central Hub" />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, district, city, country" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Latitude</Label>
              <Input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 15.5007" />
            </div>
            <div className="space-y-1.5">
              <Label>Longitude</Label>
              <Input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. 32.5599" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Cover image URL</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden h-28 bg-slate-100">
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" disabled={!name.trim() || updateHub.isPending} onClick={handleSave}>
              {updateHub.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function HubDetail() {
  const { hubId } = useParams<{ hubId: string }>();
  const queryClient = useQueryClient();
  const [scanOpen, setScanOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [editHubOpen, setEditHubOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);

  const { data: hub, isLoading: hubLoading } = useGetHub(hubId, {
    query: { enabled: !!hubId, queryKey: getGetHubQueryKey(hubId) },
  });
  const { data: stock, isLoading: stockLoading } = useGetHubStock(hubId, {
    query: { enabled: !!hubId, queryKey: getGetHubStockQueryKey(hubId) },
  });

  const deleteStock = useDeleteStockEntry();
  const updateStock = useUpdateStockEntry();

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

  const startEdit = (entry: { id: string; quantity: number; expiryDate?: string | null }) => {
    setEditingRow({
      stockId: entry.id,
      quantity: String(entry.quantity),
      expiryDate: entry.expiryDate ? (entry.expiryDate as string).slice(0, 10) : "",
    });
  };

  const saveEdit = () => {
    if (!editingRow) return;
    const qty = parseInt(editingRow.quantity, 10);
    if (isNaN(qty) || qty < 0) { toast.error("Quantity must be a non-negative number"); return; }
    updateStock.mutate(
      {
        hubId,
        stockId: editingRow.stockId,
        data: {
          quantity: qty,
          expiryDate: editingRow.expiryDate || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetHubStockQueryKey(hubId) });
          toast.success("Stock updated");
          setEditingRow(null);
        },
        onError: () => toast.error("Failed to update stock"),
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
    return differenceInDays(parseISO(s.expiryDate as string), new Date()) <= 30;
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
        {editHubOpen && (
          <EditHubDialog open={editHubOpen} onClose={() => setEditHubOpen(false)} hub={hub} />
        )}

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
            <Button variant="outline" className="gap-2" onClick={() => setEditHubOpen(true)}>
              <Settings2 className="h-4 w-4" /> Edit Hub
            </Button>
            <Dialog open={scanOpen} onOpenChange={setScanOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Scan className="h-4 w-4" /> Scan Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Scan Barcode</DialogTitle></DialogHeader>
                <BarcodeScanner onResult={handleScanResult} />
              </DialogContent>
            </Dialog>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" /> Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Import Stock from CSV</DialogTitle></DialogHeader>
                <StockUpload hubId={hubId} onSuccess={() => setUploadOpen(false)} />
              </DialogContent>
            </Dialog>

            <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Package className="h-4 w-4" /> Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Add / Update Stock</DialogTitle></DialogHeader>
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
            <CardTitle className={`text-sm font-semibold ${lowStockCount > 0 ? "text-red-700" : "text-slate-600"}`}>Low Stock</CardTitle>
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
                    <th className="px-6 py-3 text-left font-semibold">Expiry Date</th>
                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockList.map((entry) => {
                    const isLow = entry.quantity < 10;
                    const isEditing = editingRow?.stockId === entry.id;

                    if (isEditing) {
                      return (
                        <tr key={entry.id} className="bg-orange-50/60">
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
                            <Input
                              type="number"
                              min="0"
                              value={editingRow.quantity}
                              onChange={(e) => setEditingRow({ ...editingRow, quantity: e.target.value })}
                              className="w-24 ml-auto text-right h-8 text-sm"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <Input
                              type="date"
                              value={editingRow.expiryDate}
                              onChange={(e) => setEditingRow({ ...editingRow, expiryDate: e.target.value })}
                              className="w-36 h-8 text-sm"
                            />
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                onClick={saveEdit}
                                disabled={updateStock.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:bg-slate-100"
                                onClick={() => setEditingRow(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={entry.id} className={`hover:bg-slate-50 transition-colors ${isLow ? "bg-red-50/50" : ""}`}>
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
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-orange-50"
                              onClick={() => startEdit(entry)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteStock(entry.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
