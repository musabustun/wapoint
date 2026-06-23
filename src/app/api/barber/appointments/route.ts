import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = { barberId: user.id };
  if (status) where.status = status;
  if (date) {
    const dayStart = startOfDay(new Date(date));
    const dayEnd = endOfDay(new Date(date));
    where.startTime = { gte: dayStart, lte: dayEnd };
  }

  const appointments = await prisma.appointment.findMany({
    where: where as any,
    include: { service: { select: { name: true, duration: true } } },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ appointments });
}

export async function PATCH(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { appointmentId, status } = await req.json();

  if (!appointmentId || !status) {
    return NextResponse.json(
      { error: "appointmentId and status are required" },
      { status: 400 },
    );
  }

  const validStatuses = ["ONAYLANDI", "IPTAL", "TAMAMLANDI", "BEKLIYOR"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, barberId: user.id },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
  });

  return NextResponse.json({ success: true, appointment: updated });
}
