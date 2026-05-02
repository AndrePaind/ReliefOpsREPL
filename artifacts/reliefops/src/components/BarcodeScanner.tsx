import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, AlertCircle } from "lucide-react";

interface BarcodeScannerProps {
  onResult: (result: string) => void;
}

export function BarcodeScanner({ onResult }: BarcodeScannerProps) {
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState<{ type: "error" | "info"; msg: string } | null>(null);
  const [scanning, setScanning] = useState(false);

  const handlePhoto = async (file: File) => {
    setStatus(null);
    setScanning(true);
    try {
      if ("BarcodeDetector" in window) {
        const bd = new (window as any).BarcodeDetector({
          formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "data_matrix"],
        });
        const img = await createImageBitmap(file);
        const results = await bd.detect(img);
        if (results.length > 0) {
          onResult(results[0].rawValue);
          return;
        }
        setStatus({ type: "error", msg: "No barcode detected. Try a closer or clearer photo, or enter the number below." });
      } else {
        setStatus({ type: "info", msg: "Barcode auto-detection is not available in this browser. Please enter the barcode number manually." });
      }
    } catch {
      setStatus({ type: "error", msg: "Could not read the image. Please enter the barcode manually." });
    } finally {
      setScanning(false);
    }
  };

  const handleSubmitManual = () => {
    const code = manual.trim();
    if (code) onResult(code);
  };

  return (
    <div className="space-y-5 py-1">
      <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors group">
        <Camera className="h-10 w-10 text-primary/60 mb-2 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-semibold text-slate-700">
          {scanning ? "Reading barcode…" : "Take a photo of the barcode"}
        </span>
        <span className="text-xs text-slate-400 mt-1">Opens back camera on mobile · gallery on desktop</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={scanning}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handlePhoto(f);
            e.target.value = "";
          }}
        />
      </label>

      {status && (
        <div className={`flex items-start gap-2 text-sm rounded-lg p-3 ${status.type === "error" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{status.msg}</span>
        </div>
      )}

      <div className="relative flex items-center gap-2">
        <div className="flex-1 border-t border-slate-200" />
        <span className="text-xs text-slate-400 font-medium">or enter barcode manually</span>
        <div className="flex-1 border-t border-slate-200" />
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="e.g. 5012345678900"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmitManual()}
          className="flex-1 font-mono"
        />
        <Button onClick={handleSubmitManual} disabled={!manual.trim()}>
          Use
        </Button>
      </div>
    </div>
  );
}
