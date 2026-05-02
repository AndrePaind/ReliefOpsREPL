import { useState, useCallback } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, FileUp, Upload, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getGetHubStockQueryKey } from "@workspace/api-client-react";

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  duplicateWarnings: string[];
  errors: string[];
}

interface StockUploadProps {
  hubId?: string;
  onSuccess?: () => void;
}

export function StockUpload({ hubId, onSuccess }: StockUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = useCallback(() => {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const raw = results.data as Record<string, string>[];
        const rows = raw.map((r) => ({
          // hub_name is optional when hubId is supplied — use a placeholder the backend ignores
          hubName: r["hub_name"] || r["hubName"] || "__current_hub__",
          itemName: r["item_name"] || r["itemName"] || "",
          category: r["category"] || "Hygiene",
          quantity: parseInt(r["quantity"] || "0", 10),
          unit: r["unit"] || undefined,
          expiryDate: r["expiry_date"] || r["expiryDate"] || undefined,
          barcode: r["barcode"] || undefined,
        })).filter((r) => r.itemName);

        if (!rows.length) {
          toast.error("No valid rows found. Make sure item_name and quantity columns exist.");
          return;
        }

        setIsPending(true);
        try {
          const r = await fetch("/api/stock/csv-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ rows, hubId: hubId ?? undefined }),
          });
          if (!r.ok) throw new Error(await r.text());
          const res: ImportResult = await r.json();
          setResult(res);
          if (hubId) {
            await queryClient.invalidateQueries({ queryKey: getGetHubStockQueryKey(hubId) });
          }
          toast.success(`Import complete — ${res.imported} new, ${res.updated} updated`);
          if (res.errors.length === 0) onSuccess?.();
        } catch (e: any) {
          toast.error(`Import failed: ${e.message}`);
        } finally {
          setIsPending(false);
        }
      },
      error: (error) => {
        toast.error(`CSV parse error: ${error.message}`);
      },
    });
  }, [file, hubId, queryClient, onSuccess]);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileUp className="h-5 w-5 text-primary" />
          Bulk Stock Import
        </CardTitle>
        <CardDescription>
          Upload a CSV to update inventory.{" "}
          {hubId ? "hub_name is optional — stock will be added to this hub." : "Include hub_name to route rows to specific hubs."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="csv-upload">CSV File</Label>
          <Input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600">
          <p className="font-semibold text-slate-800 mb-1.5">Required columns:</p>
          <div className="flex flex-wrap gap-1">
            {["item_name", "quantity"].map((col) => (
              <code key={col} className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-mono">{col}</code>
            ))}
          </div>
          <p className="mt-2 font-semibold text-slate-800 mb-1.5">Optional columns:</p>
          <div className="flex flex-wrap gap-1">
            {["hub_name", "category", "unit", "barcode", "expiry_date"].map((col) => (
              <code key={col} className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">{col}</code>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            category values: <code className="bg-slate-100 px-1 py-0.5 rounded">Medicine</code>{" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded">Food</code>{" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded">Hygiene</code>{" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded">First Aid</code>
          </p>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || isPending}
          className="w-full"
        >
          {isPending ? "Importing..." : "Upload & Import"}
          {!isPending && <Upload className="ml-2 h-4 w-4" />}
        </Button>

        {result && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-emerald-700">{result.imported}</div>
                <div className="text-xs text-emerald-600 font-medium mt-0.5">Imported</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-700">{result.updated}</div>
                <div className="text-xs text-blue-600 font-medium mt-0.5">Updated</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-slate-700">{result.skipped}</div>
                <div className="text-xs text-slate-600 font-medium mt-0.5">Skipped</div>
              </div>
            </div>
            {result.duplicateWarnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-yellow-800 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-4 w-4" /> Warnings
                </p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {result.duplicateWarnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-red-800 flex items-center gap-1.5 mb-1">
                  <X className="h-4 w-4" /> Errors
                </p>
                <ul className="text-xs text-red-700 space-y-1">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            {result.errors.length === 0 && result.imported + result.updated > 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Import successful! Stock list has been updated.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
