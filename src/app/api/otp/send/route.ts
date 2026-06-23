import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendOTP } from "@/lib/whatsapp/otp";

export async function POST(req: Request) {
  const { barberSlug, phone } = await req.json();

  if (!barberSlug || !phone) {
    return NextResponse.json(
      { error: "barberSlug and phone are required" },
      { status: 400 },
    );
  }

  const barber = await prisma.barber.findUnique({
    where: { slug: barberSlug },
  });

  if (!barber) {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  if (!barber.evolutionInstance) {
    return NextResponse.json(
      { error: "WhatsApp not connected" },
      { status: 400 },
    );
  }

  try {
    await sendOTP(barber.evolutionInstance, phone, barber.name);
    return NextResponse.json({ sent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
