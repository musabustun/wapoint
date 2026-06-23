import { prisma } from "./prisma";
import { startOfDay, addMinutes, isBefore, isAfter, parseISO } from "date-fns";

export interface TimeSlot {
  time: string;
  display: string;
  available: boolean;
}

export interface DaySlots {
  date: string;
  dayOfWeek: number;
  slots: TimeSlot[];
}

export function minToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeToMin(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function slotsOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  return isBefore(start1, end2) && isBefore(start2, end1);
}

export async function getAvailableSlots(
  barberSlug: string,
  dateStr: string,
  serviceId?: string,
): Promise<{
  barber: { id: string; name: string } | null;
  services: { id: string; name: string; duration: number; price: number }[];
  slots: { serviceId: string; serviceName: string; times: TimeSlot[] }[];
}> {
  const barber = await prisma.barber.findUnique({
    where: { slug: barberSlug, isActive: true },
  });

  if (!barber) {
    return { barber: null, services: [], slots: [] };
  }

  const servicesRaw = await prisma.service.findMany({
    where: { barberId: barber.id, isActive: true },
    select: { id: true, name: true, duration: true, price: true },
    orderBy: { name: "asc" },
  });

  const services = servicesRaw.map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.duration,
    price: Number(s.price),
  }));

  const targetDate = parseISO(dateStr);
  const dayOfWeek = targetDate.getDay();

  const availability = await prisma.availability.findFirst({
    where: { barberId: barber.id, dayOfWeek, isActive: true },
  });

  if (!availability) {
    return {
      barber: { id: barber.id, name: barber.name },
      services,
      slots: [],
    };
  }

  const dayStart = startOfDay(targetDate);
  const workStart = addMinutes(dayStart, availability.startMin);
  const workEnd = addMinutes(dayStart, availability.endMin);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      barberId: barber.id,
      status: "ONAYLANDI",
      startTime: { gte: dayStart, lt: addMinutes(dayStart, 1440) },
    },
    select: { startTime: true, endTime: true },
  });

  const filteredServices = serviceId
    ? services.filter((s) => s.id === serviceId)
    : services;

  const now = new Date();

  const slots = filteredServices.map((service) => {
    const times: TimeSlot[] = [];
    let cursor = workStart;

    while (isBefore(cursor, workEnd)) {
      const slotEnd = addMinutes(cursor, service.duration);

      if (!isBefore(slotEnd, workEnd) && !isAfter(slotEnd, workEnd)) {
        break;
      }
      if (isAfter(slotEnd, workEnd)) break;

      const isInPast = isBefore(cursor, now);
      const isBooked = existingAppointments.some((apt) =>
        slotsOverlap(cursor, slotEnd, apt.startTime, apt.endTime),
      );

      times.push({
        time: minToTime(
          cursor.getHours() * 60 + cursor.getMinutes(),
        ),
        display: minToTime(
          cursor.getHours() * 60 + cursor.getMinutes(),
        ),
        available: !isInPast && !isBooked,
      });

      cursor = addMinutes(cursor, service.duration);
    }

    return {
      serviceId: service.id,
      serviceName: service.name,
      times,
    };
  });

  return {
    barber: { id: barber.id, name: barber.name },
    services,
    slots,
  };
}
