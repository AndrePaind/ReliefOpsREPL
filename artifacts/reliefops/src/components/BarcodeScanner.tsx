import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface BarcodeScannerProps {
  onResult: (result: string) => void;
}

export function BarcodeScanner({ onResult }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 220, height: 220 } },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        onResult(decodedText);
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
      },
      (error) => {
        // ignore errors
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onResult]);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Scan Barcode</CardTitle>
        <CardDescription>Position the barcode within the frame</CardDescription>
      </CardHeader>
      <CardContent>
        <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border border-slate-200 bg-black/5" />
      </CardContent>
    </Card>
  );
}
