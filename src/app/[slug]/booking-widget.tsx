"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number | null;
}

interface AvailabilitySlot {
  dayOfWeek: number;
  startMin: number;
  endMin: number;
}

interface Props {
  barberSlug: string;
  barberName: string;
  services: Service[];
  availability: AvailabilitySlot[];
  requireOtp: boolean;
}

function dayName(day: number): string {
  return ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"][day];
}

function toTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getNextAvailableDates(availability: AvailabilitySlot[], count = 14): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 60 && dates.length < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const day = d.getDay();
    if (availability.some((a) => a.dayOfWeek === day)) {
      dates.push(d);
    }
  }
  return dates;
}

export function BookingWidget({ barberSlug, barberName, services, availability, requireOtp }: Props) {
  const [step, setStep] = useState<"service" | "datetime" | "info" | "otp" | "confirm">(
    services.length > 0 ? "service" : "datetime",
  );
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const dates = getNextAvailableDates(availability);

  async function loadSlots(date: Date) {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const params = new URLSearchParams({ date: dateStr });
      if (selectedService) params.set("serviceId", selectedService.id);
      const res = await fetch(`/api/public/${barberSlug}/slots?${params}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function pickDate(date: Date) {
    setSelectedDate(date);
    loadSlots(date);
  }

  async function sendOtp() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barberSlug, phone }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send OTP");
      }
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function submitBooking() {
    setLoading(true);
    setError("");
    try {
      const [h, m] = (selectedSlot ?? "").split(":").map(Number);
      const startTime = new Date(selectedDate!);
      startTime.setHours(h, m, 0, 0);

      const body: Record<string, unknown> = {
        barberSlug,
        customerName: name,
        customerPhone: phone,
        startTime: startTime.toISOString(),
      };
      if (selectedService) body.serviceId = selectedService.id;
      if (requireOtp) body.otpCode = otpCode;

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to book");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="pt-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-900/50 border border-green-700 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Randevu Alındı!</h2>
          <p className="text-zinc-400">
            {barberName} randevunuz başarıyla oluşturuldu.
            <br />
            Onay için WhatsApp&apos;tan bilgilendirileceksiniz.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle>Randevu Al</CardTitle>
        <CardDescription>
          {step === "service" && "Hizmet seçin"}
          {step === "datetime" && "Tarih ve saat seçin"}
          {step === "info" && "Bilgilerinizi girin"}
          {step === "otp" && "Telefon doğrulama"}
          {step === "confirm" && "Randevuyu onaylayın"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-lg p-3">
            {error}
          </p>
        )}

        {step === "service" && services.length > 0 && (
          <div className="space-y-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedService(s);
                  setStep("datetime");
                }}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedService?.id === s.id
                    ? "border-white bg-zinc-800"
                    : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{s.name}</p>
                    <p className="text-sm text-zinc-500">{s.duration} dk</p>
                  </div>
                  {s.price !== null && (
                    <p className="text-white font-bold">{s.price.toLocaleString("tr-TR")} TL</p>
                  )}
                </div>
              </button>
            ))}
            {services.length === 0 && (
              <p className="text-zinc-500 text-center py-4">No services available</p>
            )}
          </div>
        )}

        {step === "datetime" && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map((d) => {
                const day = d.getDay();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
                const label = diff === 0 ? "Bugün" : diff === 1 ? "Yarın" : dayName(day);
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => pickDate(d)}
                    className={`shrink-0 w-20 p-3 rounded-lg border text-center transition-colors ${
                      selectedDate?.toDateString() === d.toDateString()
                        ? "border-white bg-zinc-800"
                        : "border-zinc-800 hover:bg-zinc-800"
                    }`}
                  >
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="text-white font-bold text-lg">
                      {d.getDate()}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {String(d.getMonth() + 1).padStart(2, "0")}
                    </p>
                  </button>
                );
              })}
            </div>

            {loadingSlots && (
              <p className="text-zinc-500 text-center py-4">Loading available times...</p>
            )}

            {!loadingSlots && selectedDate && slots.length === 0 && (
              <p className="text-zinc-500 text-center py-4">
                No available times for this date
              </p>
            )}

            {!loadingSlots && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSlot(s)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      selectedSlot === s
                        ? "border-white bg-zinc-800 text-white"
                        : "border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <Button
              disabled={!selectedSlot}
              onClick={() => setStep("info")}
              className="w-full bg-white text-zinc-900 hover:bg-zinc-200"
            >
              Devam
            </Button>
          </div>
        )}

        {step === "info" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Adınız</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
                placeholder="Adınız ve soyadınız"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Telefon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
                placeholder="05XX XXX XX XX"
              />
            </div>
            <Button
              disabled={!name || !phone || loading}
              onClick={async () => {
                if (requireOtp) {
                  setStep("otp");
                  await sendOtp();
                } else {
                  setStep("confirm");
                }
              }}
              className="w-full bg-white text-zinc-900 hover:bg-zinc-200"
            >
              {requireOtp ? "OTP Gönder" : "Devam"}
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              WhatsApp&apos;ınıza bir doğrulama kodu gönderdik. Lütfen kodu girin.
            </p>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Doğrulama Kodu</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={sendOtp}
                disabled={loading}
                className="border-zinc-700 text-zinc-400"
              >
                Tekrar Gönder
              </Button>
              <Button
                disabled={otpCode.length < 6 || loading}
                onClick={() => setStep("confirm")}
                className="flex-1 bg-white text-zinc-900 hover:bg-zinc-200"
              >
                Doğrula
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
              {selectedService && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Hizmet</span>
                  <span className="text-white">{selectedService.name}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Tarih</span>
                <span className="text-white">
                  {selectedDate?.toLocaleDateString("tr-TR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Saat</span>
                <span className="text-white">{selectedSlot}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Ad</span>
                <span className="text-white">{name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Telefon</span>
                <span className="text-white">{phone}</span>
              </div>
            </div>

            <Button
              onClick={submitBooking}
              disabled={loading}
              className="w-full bg-white text-zinc-900 hover:bg-zinc-200"
            >
              {loading ? "Oluşturuluyor..." : "Randevuyu Onayla"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
