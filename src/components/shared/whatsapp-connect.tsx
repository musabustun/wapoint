"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  instanceName: string | null;
  alreadyConnected: boolean;
}

export function WhatsAppConnect({ instanceName, alreadyConnected }: Props) {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(
    alreadyConnected ? "connected" : instanceName ? "waiting" : "idle",
  );
  const [error, setError] = useState("");

  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/qrcode");
      if (!res.ok) throw new Error("Failed to get QR");
      const data = await res.json();
      if (data.base64) {
        setQrCode(data.base64);
        setStatus("qr_ready");
      }
    } catch {
      setError("Could not fetch QR code");
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/instance");
      if (!res.ok) return;
      const data = await res.json();
      if (data.connected) {
        setStatus("connected");
        router.refresh();
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, [router]);

  useEffect(() => {
    if (instanceName && !alreadyConnected) {
      fetchQR();
      const interval = setInterval(async () => {
        const done = await checkStatus();
        if (done) clearInterval(interval);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [instanceName, alreadyConnected, fetchQR, checkStatus]);

  return (
    <div className="space-y-4">
      {status === "connected" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-950/50 border border-green-800">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <div>
            <p className="text-white font-medium">Connected</p>
            <p className="text-sm text-zinc-400">
              Instance: {instanceName}
            </p>
          </div>
        </div>
      )}

      {(status === "qr_ready" || status === "waiting") && (
        <>
          <div className="flex justify-center">
            {qrCode ? (
              <img
                src={`data:image/png;base64,${qrCode}`}
                alt="WhatsApp QR Code"
                className="w-64 h-64 rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">
                    Generating QR code...
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-zinc-500 text-center">
            1. Open WhatsApp {"→"} Linked Devices {"→"} Link a Device
            <br />
            2. Scan the QR code above
          </p>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-400"
              onClick={() => {
                setQrCode(null);
                setStatus("waiting");
                fetchQR();
              }}
            >
              Refresh QR
            </Button>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
    </div>
  );
}
