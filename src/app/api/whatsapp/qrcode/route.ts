import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getQRCode } from "@/lib/whatsapp/client";

export async function GET() {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const barber = await prisma.barber.findUnique({ where: { id: user.id } });
  if (!barber?.evolutionInstance) {
    return NextResponse.json({ error: "No instance" }, { status: 400 });
  }

  try {
    const qr = await getQRCode(barber.evolutionInstance);
    return NextResponse.json({ base64: qr.base64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get QR code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
