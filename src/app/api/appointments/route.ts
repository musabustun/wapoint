import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { addMinutes } from "date-fns";
import { verifyOTP } from "@/lib/whatsapp/otp";

export async function POST(req: Request) {
  const { barberSlug, serviceId, customerName, customerPhone, startTime, otpCode } =
    await req.json();

  if (!barberSlug || !customerName || !customerPhone || !startTime) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const barber = await prisma.barber.findUnique({
    where: { slug: barberSlug, isActive: true },
  });

  if (!barber) {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  if (barber.requireOtp) {
    if (!otpCode) {
      return NextResponse.json(
        { error: "OTP code required", otpRequired: true },
        { status: 400 },
      );
    }

    const otpValid = await verifyOTP(customerPhone, otpCode);
    if (!otpValid) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }
  }

  let service = null;
  let endTime = addMinutes(new Date(startTime), 30);

  if (serviceId) {
    service = await prisma.service.findFirst({
      where: { id: serviceId, barberId: barber.id, isActive: true },
    });
    if (service) {
      endTime = addMinutes(new Date(startTime), service.duration);
    }
  }

  const existing = await prisma.appointment.findFirst({
    where: {
      barberId: barber.id,
      status: "ONAYLANDI",
      startTime: { lt: endTime },
      endTime: { gt: new Date(startTime) },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "This time slot is no longer available" },
      { status: 409 },
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      barberId: barber.id,
      serviceId: service?.id ?? null,
      customerName,
      customerPhone,
      startTime: new Date(startTime),
      endTime,
      source: "WEB",
      status: "ONAYLANDI",
      otpVerified: barber.requireOtp,
    },
  });

  return NextResponse.json({ success: true, appointment });
}
