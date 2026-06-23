"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  serviceName: string | null;
  duration: number | null;
  status: string;
  source: string;
  otpVerified: boolean;
}

function statusColor(status: string): string {
  switch (status) {
    case "ONAYLANDI":
      return "bg-blue-950/50 text-blue-400 border-blue-800";
    case "TAMAMLANDI":
      return "bg-green-950/50 text-green-400 border-green-800";
    case "IPTAL":
      return "bg-red-950/50 text-red-400 border-red-800";
    case "BEKLIYOR":
      return "bg-yellow-950/50 text-yellow-400 border-yellow-800";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    ONAYLANDI: "Confirmed",
    TAMAMLANDI: "Completed",
    IPTAL: "Cancelled",
    BEKLIYOR: "Pending",
  };
  return labels[status] ?? status;
}

function sourceIcon(source: string): string {
  return source === "WHATSAPP" ? "WA" : source === "WEB" ? "WEB" : source;
}

interface Props {
  appointments: Appointment[];
  weeklyCount: number;
}

export function AppointmentsList({ appointments, weeklyCount }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? appointments
      : appointments.filter((a) => a.status === filter);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch("/api/barber/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id, status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["all", "ONAYLANDI", "TAMAMLANDI", "IPTAL", "BEKLIYOR"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                filter === f
                  ? "bg-white text-zinc-900 border-white"
                  : "border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {f === "all" ? "All" : statusLabel(f)}
            </button>
          ))}
        </div>
        <p className="text-sm text-zinc-500">
          {appointments.length} today &middot; {weeklyCount} this week
        </p>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-zinc-600">
          <p className="text-lg">No appointments</p>
          <p className="text-sm mt-1">
            {filter === "all"
              ? "No appointments scheduled for today"
              : `No ${statusLabel(filter).toLowerCase()} appointments`}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((a) => {
          const st = parseISO(a.startTime);
          const et = parseISO(a.endTime);
          const time = `${format(st, "HH:mm")} - ${format(et, "HH:mm")}`;

          return (
            <div
              key={a.id}
              className="border border-zinc-800 bg-zinc-900 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-white">
                      {format(st, "HH:mm")}
                    </span>
                    <span className="text-zinc-500 text-sm">{time}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${statusColor(a.status)}`}
                    >
                      {statusLabel(a.status)}
                    </span>
                    <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">
                      {sourceIcon(a.source)}
                    </span>
                  </div>
                  <p className="text-white font-medium">{a.customerName}</p>
                  <p className="text-sm text-zinc-500">{a.customerPhone}</p>
                  <div className="flex gap-4 text-sm text-zinc-400">
                    <span>{a.serviceName ?? "Standart"}</span>
                    {a.duration && <span>{a.duration} dk</span>}
                    {a.otpVerified && (
                      <span className="text-green-500">OTP ✓</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {a.status === "ONAYLANDI" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-800 text-green-400 hover:bg-green-950"
                        onClick={() => updateStatus(a.id, "TAMAMLANDI")}
                        disabled={updating === a.id}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-800 text-red-400 hover:bg-red-950"
                        onClick={() => updateStatus(a.id, "IPTAL")}
                        disabled={updating === a.id}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {a.status === "BEKLIYOR" && (
                    <Button
                      size="sm"
                      className="bg-white text-zinc-900 hover:bg-zinc-200"
                      onClick={() => updateStatus(a.id, "ONAYLANDI")}
                      disabled={updating === a.id}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
