import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function BarberDashboard() {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string; slug?: string };

  const barber = await prisma.barber.findUnique({
    where: { id: user.id },
    include: {
      services: { where: { isActive: true } },
      _count: { select: { appointments: true } },
    },
  });

  if (!barber) return <p className="text-zinc-400">Barber not found</p>;

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      barberId: barber.id,
      status: "ONAYLANDI",
      startTime: { gte: new Date() },
    },
    orderBy: { startTime: "asc" },
    take: 10,
    include: { service: true },
  });

  const todayAppointments = upcomingAppointments.filter(
    (a) =>
      format(a.startTime, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome, {barber.name}
        </h1>
        <p className="text-zinc-400 mt-1">
          Your booking page: <span className="text-zinc-300">/{barber.slug}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {barber.services.length}
            </CardTitle>
            <CardDescription>Services</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {barber._count.appointments}
            </CardTitle>
            <CardDescription>Total Appointments</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {todayAppointments.length}
            </CardTitle>
            <CardDescription>Today</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {barber.whatsappConnected ? (
                <span className="text-green-400">Connected</span>
              ) : (
                <span className="text-zinc-500">Not Connected</span>
              )}
            </CardTitle>
            <CardDescription>WhatsApp</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            {upcomingAppointments.length === 0
              ? "No upcoming appointments"
              : `Next ${upcomingAppointments.length} appointment${upcomingAppointments.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {apt.customerName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {apt.service?.name ?? "No service"} · {apt.customerPhone}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-300">
                    {format(apt.startTime, "MMM d, HH:mm")}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs text-zinc-500 border-zinc-700"
                  >
                    {apt.source}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
