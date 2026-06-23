import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppointmentsList } from "./appointments-list";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ date?: string; status?: string }>;
}

export default async function AppointmentsPage({ searchParams }: Props) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return <p className="text-zinc-400">Please log in</p>;

  const params = await searchParams;
  const dateStr = params.date;
  const statusFilter = params.status || undefined;

  const now = new Date();
  const dayStart = dateStr ? startOfDay(parseISO(dateStr)) : startOfDay(now);
  const dayEnd = dateStr ? endOfDay(parseISO(dateStr)) : endOfDay(now);

  const where: Record<string, unknown> = {
    barberId: user.id,
    startTime: { gte: dayStart, lte: dayEnd },
  };
  if (statusFilter) where.status = statusFilter;

  const appointments = await prisma.appointment.findMany({
    where: where as any,
    include: { service: { select: { name: true, duration: true } } },
    orderBy: { startTime: "asc" },
  });

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const weeklyAppointments = await prisma.appointment.findMany({
    where: {
      barberId: user.id,
      startTime: { gte: weekStart, lte: weekEnd },
    },
    orderBy: { startTime: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Appointments</h1>
        <p className="text-zinc-400 mt-1">
          {dateStr
            ? new Date(dateStr).toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : "Today's appointments"}
        </p>
      </div>

      <AppointmentsList
        appointments={appointments.map((a) => ({
          id: a.id,
          customerName: a.customerName,
          customerPhone: a.customerPhone,
          startTime: a.startTime.toISOString(),
          endTime: a.endTime.toISOString(),
          serviceName: a.service?.name ?? null,
          duration: a.service?.duration ?? null,
          status: a.status,
          source: a.source,
          otpVerified: a.otpVerified,
        }))}
        weeklyCount={weeklyAppointments.length}
      />
    </div>
  );
}
